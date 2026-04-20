# Microsoft Authentication: Common Endpoint Solution

## Problem Statement

**The Timing Paradox:** Microsoft OAuth requires knowing which tenant to authenticate against at login initiation, but the user's identity and company affiliation are only revealed AFTER successful authentication.

### Root Cause

The original implementation faced this challenge:
1. User clicks "Login with Microsoft"
2. System needs to construct: `https://login.microsoftonline.com/{tenant-id}/...`
3. But we don't know the user's `{tenant-id}` until AFTER they authenticate
4. This creates a chicken-and-egg problem in multi-tenant scenarios

## Solution: Azure AD Common Endpoint Pattern

### Architecture Overview

The solution uses Azure AD's **`/common` endpoint**, which is specifically designed for multi-tenant applications where tenant discovery happens post-authentication.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. User clicks "Log ind med Microsoft"
   ↓
2. Redirect to: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
   - Uses GLOBAL client ID (same for all tenants)
   - No tenant-specific information needed
   ↓
3. Microsoft handles tenant discovery
   - User enters their email
   - Microsoft identifies their tenant automatically
   - User authenticates with their organization
   ↓
4. Callback with authorization code
   ↓
5. Exchange code for tokens at /common/token endpoint
   ↓
6. Extract tenant ID from ID token (JWT payload)
   - Token contains: { tid: "tenant-id", ... }
   ↓
7. Look up company by tenant ID in database
   - Query: WHERE azure_tenant_id = extracted_tenant_id
   ↓
8. Create or link user to that company
   ↓
9. Sign user into application
```

## Technical Implementation

### 1. Environment Configuration

Global Microsoft credentials are configured once and used for all organizations:

```env
# .env
VITE_MICROSOFT_CLIENTID=5e1fc108-b19e-4a40-9cbf-f6b2e0169682
VITE_MICROSOFT_CLIENTSECRET_VALUE=<your-client-secret>
```

### 2. Login Initiation (LoginForm.tsx)

**Before (Broken):**
```typescript
// Tried to determine tenant BEFORE authentication
const { data: company } = await supabase
  .from('companies')
  .select('azure_tenant_id')
  .maybeSingle(); // Problem: Which company?

const loginUrl = `https://login.microsoftonline.com/${company.azure_tenant_id}/...`;
```

**After (Working):**
```typescript
// Use common endpoint - no tenant needed upfront
const globalClientId = import.meta.env.VITE_MICROSOFT_CLIENTID;
const loginUrl = generateCommonMicrosoftLoginUrl(
  globalClientId,
  redirectUri,
  state
);
// Result: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
```

### 3. Token Exchange with Tenant Discovery

**Key Function: `exchangeCodeForTokenCommon()`**

```typescript
export async function exchangeCodeForTokenCommon(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string; tenant_id: string } | null> {
  // Exchange at common endpoint
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: clientId,
      code: code,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();

  // Decode ID token to extract tenant ID
  const idTokenPayload = decodeIdToken(data.id_token);

  // The magic: tenant_id is NOW available!
  return {
    access_token: data.access_token,
    id_token: data.id_token,
    tenant_id: idTokenPayload.tid, // ← Solved the timing problem
  };
}
```

### 4. Company Lookup by Tenant ID

**Function: `findCompanyByTenantId()`**

```typescript
export async function findCompanyByTenantId(tenantId: string): Promise<Company | null> {
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, azure_client_id, azure_client_secret')
    .eq('azure_tenant_id', tenantId) // ← Match by tenant
    .eq('azure_admin_consent_granted', true)
    .maybeSingle();

  return company;
}
```

### 5. Callback Handler (MicrosoftCallback.tsx)

The callback page now handles two flows:

**Common Flow (New - Default):**
```typescript
const handleCommonFlowCallback = async (code: string, redirectUri: string) => {
  // 1. Exchange code for tokens + tenant ID
  const tokens = await exchangeCodeForTokenCommon(code, clientId, clientSecret, redirectUri);

  // 2. Identify company by tenant ID
  const company = await findCompanyByTenantId(tokens.tenant_id);

  if (!company) {
    // User's organization not registered
    setError('Your organization is not registered in this system');
    return;
  }

  // 3. Get user info from Microsoft
  const userInfo = await getMicrosoftUserInfo(tokens.access_token);

  // 4. Create/link user to identified company
  const userId = await findOrCreateUserFromAzure(
    userInfo,
    company.id,
    tokens.tenant_id
  );

  // 5. Sign in
  await signInUser(userInfo.mail, userId);
};
```

**Tenant-Specific Flow (Legacy - For EnhancedLoginForm):**
```typescript
// Still supported for organization selection UI
// where tenant is known before login
```

## Database Schema Requirements

### Companies Table

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS azure_tenant_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS azure_admin_consent_granted boolean DEFAULT false;

-- Critical: Index for tenant lookup performance
CREATE INDEX IF NOT EXISTS idx_companies_azure_tenant_id
  ON companies(azure_tenant_id);
```

### Profiles Table

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS azure_user_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS azure_tenant_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS azure_principal_name text;
```

## Security Considerations

### 1. State Parameter (CSRF Protection)

```typescript
// Generate cryptographically random state
export function generateState(customerId?: string): string {
  const randomString = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return btoa(JSON.stringify({
    customerId: customerId || null,
    rand: randomString,
    ts: timestamp
  }));
}

// Validate state in callback
if (state !== storedState) {
  throw new Error('Invalid state - possible CSRF attack');
}
```

### 2. Token Security

- **Client Secret Protection:** Never expose in frontend code (fallback values in code are for demo only)
- **ID Token Validation:** Always decode and validate tenant ID from JWT
- **HTTPS Only:** All redirect URIs must use HTTPS in production

### 3. Tenant Isolation

```typescript
// Always verify tenant matches company
const company = await findCompanyByTenantId(extractedTenantId);
if (!company) {
  // Reject - tenant not registered
  return null;
}
```

## Azure App Registration Configuration

### Required Settings

**Application Type:** Multi-tenant
```
- Accounts in any organizational directory (Any Azure AD directory - Multitenant)
```

**Redirect URIs:**
```
https://yourdomain.com/auth/microsoft/callback
```

**API Permissions:**
- `User.Read` (Delegated) - Read user profile
- `openid` (Delegated) - OpenID Connect sign-in
- `profile` (Delegated) - View user's basic profile
- `email` (Delegated) - View user's email address

**Authentication:**
- Supported account types: Multitenant
- Enable ID tokens for implicit flow: Yes

## Benefits of This Approach

### 1. Solves Timing Problem
- No need to know tenant ID before authentication
- Tenant discovery happens automatically

### 2. Better User Experience
- Single "Login with Microsoft" button
- No organization selection required
- Microsoft handles account picker

### 3. Scalability
- Works with unlimited number of companies
- Each company just registers their tenant ID
- No per-company OAuth apps needed

### 4. Security
- Industry-standard OAuth 2.0 flow
- CSRF protection via state parameter
- Proper token validation

### 5. Maintainability
- Single OAuth app for all tenants
- Centralized credential management
- Easier to update and maintain

## Migration Guide

### For Existing Tenant-Specific Implementations

The solution maintains backward compatibility:

```typescript
// Old flow still works (EnhancedLoginForm)
if (authFlow === 'common') {
  await handleCommonFlowCallback(code, redirectUri);
} else {
  await handleTenantSpecificCallback(code, state, redirectUri);
}
```

### Switching to Common Endpoint

1. **Update Login Button:**
   ```typescript
   // From:
   generateMicrosoftLoginUrl(tenantId, clientId, redirectUri, state)

   // To:
   generateCommonMicrosoftLoginUrl(clientId, redirectUri, state)
   ```

2. **Update Callback Handler:**
   - Use `exchangeCodeForTokenCommon()` instead of `exchangeCodeForToken()`
   - Add company lookup by tenant ID

3. **Test:**
   - Ensure tenant ID is properly extracted from token
   - Verify company matching works correctly
   - Test with multiple tenants

## Best Practices

### 1. Error Handling

```typescript
const company = await findCompanyByTenantId(tenantId);

if (!company) {
  // Clear, actionable error message
  setError(
    'Your organization is not registered in this system. ' +
    'Please contact your administrator to set up the integration.'
  );
  return;
}
```

### 2. Logging

```typescript
console.log('Microsoft Auth Flow:', {
  flow: 'common',
  tenantId: tokens.tenant_id,
  companyFound: !!company,
  userId: userInfo.id,
});
```

### 3. User Feedback

Provide step-by-step status updates:
- "Exchanging authentication code..."
- "Identifying your organization..."
- "Fetching your Microsoft profile..."
- "Creating or updating your account..."
- "Signing you in..."

## Troubleshooting

### Issue: "Your organization is not registered"

**Cause:** Tenant ID in token doesn't match any company in database

**Solution:**
```sql
-- Verify tenant ID is registered
SELECT id, name, azure_tenant_id
FROM companies
WHERE azure_tenant_id = '<tenant-id-from-error>';

-- If not found, company needs to:
1. Go to Settings → Security → Microsoft Integration
2. Complete admin consent flow
3. This registers their tenant ID
```

### Issue: Token exchange fails

**Cause:** Invalid client credentials or redirect URI mismatch

**Solution:**
- Verify client ID and secret in `.env`
- Ensure redirect URI matches Azure app registration exactly
- Check Azure app is configured for multi-tenant

### Issue: User created but can't sign in

**Cause:** Temporary password doesn't work for existing users

**Solution:** Already handled - shows clear message directing user to standard login

## API Documentation

### Core Functions

#### `generateCommonMicrosoftLoginUrl()`
Generates OAuth authorization URL using common endpoint

#### `exchangeCodeForTokenCommon()`
Exchanges authorization code for tokens and extracts tenant ID

#### `decodeIdToken()`
Decodes JWT ID token to extract claims (especially `tid`)

#### `findCompanyByTenantId()`
Looks up company by Azure tenant ID

#### `findOrCreateUserFromAzure()`
Creates new user or links existing user to Azure identity

## Conclusion

The **Common Endpoint Pattern** elegantly solves the authentication timing problem by:
1. Deferring tenant identification until after authentication
2. Extracting tenant ID from the ID token
3. Dynamically matching users to companies based on tenant

This is the **industry-standard approach** for multi-tenant B2B SaaS applications using Microsoft authentication.
