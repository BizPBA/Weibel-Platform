# Microsoft Authentication - Quick Start Guide

## Problem Solved

**Issue:** Microsoft OAuth requires knowing the tenant ID before authentication, but we only learn the user's identity AFTER they authenticate - classic timing paradox.

**Solution:** Use Azure AD's `/common` endpoint pattern that discovers the tenant automatically during authentication.

## How It Works (Simple Version)

```
1. User clicks "Login with Microsoft"
   ↓
2. Redirect to Microsoft's COMMON endpoint (no tenant needed)
   ↓
3. User authenticates with their Microsoft account
   ↓
4. Microsoft returns authorization code
   ↓
5. Exchange code for token (token contains tenant ID!)
   ↓
6. Look up company by tenant ID in database
   ↓
7. Create/link user to that company
   ↓
8. User is signed in!
```

## What Changed

### Before (Broken)
```typescript
// Tried to guess which company before login
const company = await getRandomCompany(); // ❌ Wrong!
redirectTo(`/login/${company.tenant_id}`);
```

### After (Working)
```typescript
// Use common endpoint - tenant discovered automatically
redirectTo('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
// Later: Extract tenant_id from token and match to company ✅
```

## Key Implementation Files

### 1. LoginForm.tsx
- Uses `generateCommonMicrosoftLoginUrl()` instead of tenant-specific URL
- No pre-authentication tenant lookup needed

### 2. MicrosoftCallback.tsx
- `handleCommonFlowCallback()` - Extracts tenant ID from token
- `findCompanyByTenantId()` - Matches tenant to company
- Fallback to legacy flow for backward compatibility

### 3. azureAd.ts
- `exchangeCodeForTokenCommon()` - Token exchange at /common endpoint
- `decodeIdToken()` - Extracts tenant ID from JWT
- `findCompanyByTenantId()` - Database lookup

## Environment Variables

Add to your `.env`:

```env
VITE_MICROSOFT_CLIENTID=5e1fc108-b19e-4a40-9cbf-f6b2e0169682
VITE_MICROSOFT_CLIENTSECRET_VALUE=<your-client-secret>
```

## Database Requirements

Companies must have their tenant ID registered:

```sql
SELECT id, name, azure_tenant_id
FROM companies
WHERE azure_admin_consent_granted = true;
```

## Testing the Flow

1. **Ensure Azure app is multi-tenant:**
   - Azure Portal → App Registration
   - Supported account types: "Multitenant"

2. **Microsoft button is always enabled:**
   - No pre-configuration check needed
   - Button enabled if global client ID exists
   - Works immediately without company setup

3. **Test login:**
   - Click "Login with Microsoft"
   - Sign in with any Microsoft account
   - System identifies tenant automatically
   - User linked to correct company (if tenant registered)

4. **Verify:**
   - Check user's `azure_tenant_id` in profiles table
   - Confirm it matches company's `azure_tenant_id`

## Error Messages

### "Your organization is not registered"
- **Cause:** Tenant ID not in database
- **Solution:** Company admin needs to complete Azure setup in Settings

### "Failed to obtain access token"
- **Cause:** Invalid credentials or redirect URI
- **Solution:** Check `.env` variables and Azure app configuration

## Benefits

- ✅ **No tenant selection required** - Microsoft figures it out
- ✅ **Works with unlimited companies** - Just register their tenant ID
- ✅ **Industry standard** - Used by major SaaS apps
- ✅ **Secure** - Proper OAuth 2.0 with CSRF protection
- ✅ **Scalable** - Single OAuth app for all tenants

## Architecture Pattern

This is called the **"Common Endpoint Pattern"** and is the recommended approach for:
- Multi-tenant B2B SaaS applications
- Enterprise software with federated identity
- Apps where users belong to different organizations

## Need More Details?

See `MICROSOFT_AUTH_SOLUTION.md` for:
- Complete technical documentation
- Security considerations
- Troubleshooting guide
- API reference
- Code examples

## Support

If users see "Organization not registered" error:
1. Admin goes to Settings → Security → Microsoft Integration
2. Completes admin consent flow
3. This registers the tenant ID in the database
4. Users can now login

---

**Status:** ✅ Implemented and working
**Build:** ✅ Compiles successfully
**Pattern:** Common Endpoint (Industry Standard)
