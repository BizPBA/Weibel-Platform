# Microsoft Azure AD Integration - Technical Specification

## Executive Summary

This document provides a comprehensive technical specification for implementing a production-ready Microsoft Azure AD multi-tenant integration. The solution enables enterprise customers to:

- Authenticate users via Microsoft Single Sign-On (SSO)
- Automatically synchronize users from Azure AD
- Filter users by Azure group membership
- Deactivate (not delete) users removed from Azure
- Manage configurations through an intuitive admin interface
- Track all operations through comprehensive audit logging

**Technology Stack:**
- **Frontend:** React/Vue 3 + TypeScript
- **Backend:** Supabase Edge Functions + PostgreSQL
- **Authentication:** Microsoft Identity Platform (OAuth 2.0)
- **API:** Microsoft Graph API v1.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security Model](#security-model)
3. [Database Design](#database-design)
4. [API Specifications](#api-specifications)
5. [User Interface Components](#user-interface-components)
6. [Implementation Guide](#implementation-guide)
7. [Error Handling & Logging](#error-handling--logging)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Checklist](#deployment-checklist)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Microsoft Azure AD                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Tenant A   │  │  Tenant B    │  │   Tenant C       │   │
│  │  (Customer) │  │  (Customer)  │  │   (Customer)     │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          │ OAuth 2.0 / Microsoft Graph API     │
          │                 │                   │
┌─────────▼─────────────────▼───────────────────▼─────────────┐
│                   Application Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Supabase Edge Functions                      │   │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │   │
│  │  │ sync-azure-     │  │ OAuth Callback Handler   │  │   │
│  │  │ users-enhanced  │  │                          │  │   │
│  │  └─────────────────┘  └──────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            PostgreSQL Database (Supabase)            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ azure_      │  │ azure_sync_ │  │ azure_group_│  │   │
│  │  │ tenant_     │  │ logs        │  │ mappings    │  │   │
│  │  │ configs     │  │             │  │             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React/Vue Frontend                      │   │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Security        │  │ Enhanced Login Form      │  │   │
│  │  │ Settings Card   │  │                          │  │   │
│  │  └─────────────────┘  └──────────────────────────┘  │   │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Azure Config    │  │ Admin Consent Callback   │  │   │
│  │  │ Modal           │  │                          │  │   │
│  │  └─────────────────┘  └──────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Admin Consent Flow

```
User (Admin) → Security Settings Card
              ↓
         Request Admin Consent
              ↓
    Redirect to Microsoft (admin consent URL)
              ↓
         Admin Grants Consent
              ↓
    Redirect to Admin Consent Callback
              ↓
         Update Database (admin_consent_granted = true)
              ↓
         Show Success Message
```

#### 2. User Synchronization Flow

```
Admin Triggers Sync → Edge Function (sync-azure-users-enhanced)
                            ↓
                   Get Access Token from Azure
                            ↓
         ┌──────────────────┴──────────────────┐
         │                                     │
    Filter by Groups?                    Fetch All Users
         │                                     │
    Fetch Group Members                       │
         │                                     │
         └──────────────────┬──────────────────┘
                            ↓
                  For Each User:
                   - Check if exists
                   - Create or Update
                   - Store group memberships
                            ↓
                  Deactivate Removed Users
                            ↓
                  Log Results in Database
                            ↓
                  Update Config Status
```

#### 3. User Login Flow

```
User → Enhanced Login Form
         ↓
   Select Organization (Customer)
         ↓
   Load Azure Configuration
         ↓
   Click "Sign in with Microsoft"
         ↓
   Redirect to Microsoft Login
         ↓
   User Authenticates
         ↓
   Redirect to OAuth Callback
         ↓
   Exchange Code for Token
         ↓
   Fetch User Info from Graph API
         ↓
   Find/Create User in Database
         ↓
   Check is_active = true
         ↓
   Authenticate in Application
         ↓
   Redirect to Dashboard
```

---

## 2. Security Model

### Authentication & Authorization

#### Role-Based Access Control (RBAC)

| Role | View Configs | Create/Edit Configs | Trigger Sync | Grant Admin Consent |
|------|--------------|---------------------|--------------|---------------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Customer Responsible | ✅ | ❌ | ❌ | ❌ |
| Location Responsible | ❌ | ❌ | ❌ | ❌ |
| Employee | ❌ | ❌ | ❌ | ❌ |

#### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:

1. **azure_tenant_configs**: Only admins from the owning company can view/modify
2. **azure_sync_logs**: Only admins from the owning company can view logs
3. **azure_group_mappings**: Only admins from the owning company can manage mappings
4. **profiles**: Users can view own profile, admins can view company profiles

### Data Protection

#### Encryption

- **At Rest**: Client secrets stored encrypted in database using PostgreSQL's built-in encryption
- **In Transit**: All API calls use HTTPS/TLS 1.2+
- **Tokens**: Access tokens never stored, only used in-memory during sync operations

#### Secret Management

```typescript
// Storing secrets (encrypted)
const encryptedSecret = await encrypt(clientSecret);
await supabase.from('azure_tenant_configs').insert({
  client_secret: encryptedSecret,
  // ...
});

// Retrieving secrets (decrypted)
const config = await getConfig();
const decryptedSecret = await decrypt(config.client_secret);
```

#### CSRF Protection

- State parameter validated in all OAuth flows
- State includes:
  - Customer ID
  - Timestamp
  - Nonce (random value)
  - Action type

```typescript
const state = {
  customerId: 'uuid',
  timestamp: Date.now(),
  nonce: generateRandomString(),
  action: 'admin_consent',
};
```

### Compliance

#### GDPR Considerations

- **Right to Access**: Users can export their Azure profile data
- **Right to Deletion**: Users are deactivated (not deleted) for audit purposes
- **Right to Rectification**: Profile data updated from Azure during sync
- **Data Minimization**: Only necessary fields synced from Azure

#### SOC 2 Compliance

- **Audit Logging**: All operations logged in `azure_sync_logs` and `company_audit_log`
- **Access Control**: Strict RBAC and RLS policies
- **Encryption**: Data encrypted at rest and in transit
- **Monitoring**: Sync operations tracked with success/failure metrics

---

## 3. Database Design

### Entity Relationship Diagram

```
┌─────────────────────┐
│    companies        │
│  ─────────────────  │
│  id (PK)            │
│  name               │
│  created_at         │
└──────────┬──────────┘
           │ 1:N
           │
┌──────────▼──────────┐       ┌──────────────────────┐
│    customers        │       │  azure_tenant_       │
│  ─────────────────  │ 1:1   │  configs             │
│  id (PK)            │◄──────│  ──────────────────  │
│  name               │       │  id (PK)             │
│  company_id (FK)    │       │  customer_id (FK)    │
│  azure_tenant_id    │       │  company_id (FK)     │
│  azure_sync_enabled │       │  tenant_id           │
│  azure_domain       │       │  client_id           │
└─────────────────────┘       │  client_secret       │
                              │  admin_consent_...   │
                              │  sync_enabled        │
                              │  filter_by_groups    │
                              │  sync_groups         │
                              └───────┬──────────────┘
                                      │ 1:N
                                      │
                              ┌───────▼──────────────┐
                              │  azure_group_        │
                              │  mappings            │
                              │  ──────────────────  │
                              │  id (PK)             │
                              │  config_id (FK)      │
                              │  azure_group_id      │
                              │  azure_group_name    │
                              │  mapped_role         │
                              └──────────────────────┘

┌─────────────────────┐       ┌──────────────────────┐
│    profiles         │       │  azure_sync_logs     │
│  ─────────────────  │       │  ──────────────────  │
│  id (PK)            │       │  id (PK)             │
│  email              │       │  config_id (FK)      │
│  full_name          │       │  customer_id (FK)    │
│  company_id (FK)    │       │  company_id (FK)     │
│  role               │       │  sync_status         │
│  azure_user_id      │       │  users_created       │
│  azure_principal... │       │  users_updated       │
│  azure_tenant_id    │       │  users_deactivated   │
│  azure_groups       │       │  users_reactivated   │
│  is_active          │       │  errors              │
│  deactivated_at     │       │  sync_duration_ms    │
│  deactivated_reason │       │  triggered_by (FK)   │
└─────────────────────┘       └──────────────────────┘
```

### Key Design Decisions

#### 1. Soft Deletion (is_active flag)

**Rationale**: Users are deactivated instead of deleted to:
- Maintain audit trail
- Preserve historical data
- Allow reactivation if user returns to Azure group
- Comply with data retention policies

**Implementation**:
```sql
-- Deactivate user
UPDATE profiles
SET is_active = false,
    deactivated_at = now(),
    deactivated_reason = 'Removed from Azure AD'
WHERE id = user_id;

-- Reactivate user
UPDATE profiles
SET is_active = true,
    deactivated_at = NULL,
    deactivated_reason = NULL
WHERE id = user_id;
```

#### 2. JSONB for Group Storage

**Rationale**: Azure groups stored as JSONB array because:
- Flexible schema (groups can change)
- Efficient querying with GIN indexes
- No need for separate join table
- Easy to sync entire list from Azure

**Example**:
```json
{
  "azure_groups": [
    {"id": "group-uuid-1", "name": "Engineering"},
    {"id": "group-uuid-2", "name": "Managers"}
  ]
}
```

#### 3. Separate Sync Logs Table

**Rationale**: Dedicated sync logs table for:
- Detailed audit trail
- Performance analysis
- Troubleshooting failed syncs
- Compliance reporting

**Benefits**:
- Query historical sync data without impacting config table
- Store detailed error information
- Track sync performance trends
- Generate compliance reports

---

## 4. API Specifications

See [AZURE_API_DOCUMENTATION.md](./AZURE_API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints Summary

#### Configuration Management
- `GET /api/customers/:id/azure` - Get config
- `POST /api/customers/:id/azure` - Create/update config
- `DELETE /api/customers/:id/azure` - Delete config

#### User Synchronization
- `POST /api/customers/:id/azure/sync` - Trigger manual sync
- `GET /api/customers/:id/azure/sync-logs` - Get sync history

#### Group Management
- `GET /api/customers/:id/azure/groups` - List group mappings
- `POST /api/customers/:id/azure/groups` - Create mapping
- `PUT /api/customers/:id/azure/groups/:id` - Update mapping
- `DELETE /api/customers/:id/azure/groups/:id` - Delete mapping

#### Authentication
- `GET /auth/microsoft/login` - Initiate OAuth flow
- `GET /auth/microsoft/callback` - Handle OAuth callback
- `GET /auth/microsoft/admin-consent` - Handle admin consent

---

## 5. User Interface Components

### Security Settings Card

**Location**: Customer detail page
**Purpose**: Central hub for Azure AD integration management

**Features**:
- Configuration status overview
- Admin consent tracking
- Sync enable/disable toggle
- Manual sync trigger
- Group filtering status
- Last sync information

**States**:
1. **Not Configured**: Shows setup button
2. **Configured, No Consent**: Shows "Grant Consent" button
3. **Configured, Consent Granted**: Shows full controls
4. **Syncing**: Shows progress indicator

**Code Example**:
```tsx
<SecuritySettingsCard
  customerId="uuid"
  companyId="uuid"
  customerName="Acme Corp"
  onSyncComplete={() => refreshData()}
/>
```

### Azure Config Modal

**Purpose**: Configure Azure AD settings for a customer

**Fields**:
- Tenant ID (required)
- Tenant Name (optional)
- Azure Domain (optional)
- Client ID (required)
- Client Secret (required on create, optional on update)
- Sync Settings:
  - Enable/disable sync
  - Sync interval (hours)
  - Auto-create users
  - Default role
  - Sync user photos
  - Group filtering
  - Group IDs to sync

**Validation**:
- Tenant ID must be valid UUID format
- Client ID must be valid UUID format
- Sync interval: 1-168 hours
- At least one group ID if filtering enabled

### Enhanced Login Form

**Purpose**: Unified login experience with Microsoft SSO option

**Features**:
- Tab interface: "Email Login" and "Microsoft Login"
- Organization selector for Microsoft login
- Automatic Azure config detection
- Graceful fallback to email if no Azure config

**User Flow**:
1. User selects "Microsoft Login" tab
2. Dropdown shows organizations with Azure enabled
3. User selects organization
4. Microsoft login button appears
5. User clicks button → redirected to Microsoft
6. After auth → redirected to application

### Admin Consent Callback Page

**Purpose**: Handle admin consent response from Microsoft

**States**:
1. **Processing**: Shows loading spinner
2. **Success**: Shows success message + next steps
3. **Failed**: Shows error message + troubleshooting tips

**Next Steps (on success)**:
1. Enable automatic synchronization
2. Configure group filtering (optional)
3. Run manual sync to import users

---

## 6. Implementation Guide

### Step 1: Azure App Registration

#### Create App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**

**Settings**:
- **Name**: Your Application Name
- **Account types**: **Accounts in any organizational directory (Multi-tenant)**
- **Redirect URI**:
  - Type: Web
  - URI: `https://yourdomain.com/auth/microsoft/callback`

#### Configure Permissions

**API Permissions** → **Add permission** → **Microsoft Graph**:

Application Permissions (for sync):
- `Group.Read.All`
- `User.Read.All`

Delegated Permissions (for login):
- `User.Read`
- `openid`
- `profile`
- `email`

**Important**: Click "Grant admin consent" for your tenant

#### Create Client Secret

1. **Certificates & secrets** → **New client secret**
2. Description: "Production Secret"
3. Expires: 24 months (recommended)
4. Click **Add**
5. **Copy the value immediately** (you can't see it again)

#### Add Redirect URIs

**Authentication** → **Platform configurations** → **Web**:

Add these URIs:
- `https://yourdomain.com/auth/microsoft/callback`
- `https://yourdomain.com/auth/microsoft/admin-consent`

**ID tokens**: Enable

**Note Your Values**:
- Application (client) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Directory (tenant) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Client secret value: `xxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Configure Environment Variables

Create/update `.env` file:

```bash
# Azure Configuration
MICROSOFT_CLIENTID=your-client-id-from-azure
MICROSOFT_CLIENTSECRET_VALUE=your-client-secret-value
MICROSOFT_CLIENTSECRET_SECRETID=your-secret-id

# Supabase (auto-configured)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
VITE_APP_URL=https://yourdomain.com
```

### Step 3: Run Database Migrations

```bash
# Apply base Azure integration
supabase migration up

# Or manually run SQL files
psql -f supabase/migrations/add_azure_ad_integration.sql
psql -f supabase/migrations/enhance_azure_integration_with_groups.sql
```

### Step 4: Deploy Edge Functions

```bash
# Deploy sync function
supabase functions deploy sync-azure-users-enhanced
```

### Step 5: Integrate Frontend Components

#### Add to Routes

```typescript
import AdminConsentCallback from '@/pages/AdminConsentCallback';
import { EnhancedLoginForm } from '@/components/EnhancedLoginForm';

// In your router
<Route path="/login" element={<EnhancedLoginForm />} />
<Route path="/auth/microsoft/admin-consent" element={<AdminConsentCallback />} />
```

#### Add Security Settings to Customer Page

```tsx
import { SecuritySettingsCard } from '@/components/SecuritySettingsCard';

function CustomerDetailPage({ customerId, companyId }) {
  return (
    <div>
      {/* Other customer info */}

      <SecuritySettingsCard
        customerId={customerId}
        companyId={companyId}
        customerName={customer.name}
      />
    </div>
  );
}
```

### Step 6: Configure Laravel Backend (Optional)

If using Laravel as backend, see [AZURE_AD_INTEGRATION.md](./AZURE_AD_INTEGRATION.md) for complete PHP implementation.

### Step 7: Test the Integration

#### Test Admin Consent

1. Navigate to customer detail page
2. Click "Set Up Integration" in Security Settings Card
3. Fill in Azure details
4. Click "Grant Consent" button
5. Sign in as Global Admin
6. Grant consent
7. Verify redirect back to app
8. Check `admin_consent_granted = true` in database

#### Test User Sync

1. Enable sync in Security Settings
2. Click "Sync Now"
3. Monitor sync log in database
4. Verify users created in `profiles` table
5. Check group memberships in `azure_groups` field

#### Test User Login

1. Go to login page
2. Select "Microsoft Login" tab
3. Choose organization from dropdown
4. Click "Sign in with Microsoft"
5. Authenticate with Microsoft
6. Verify redirect to dashboard
7. Check user authenticated in application

---

## 7. Error Handling & Logging

### Error Handling Strategy

#### Frontend Error Handling

```typescript
// In components
try {
  const result = await triggerAzureUserSync(customerId);
  if (!result.success) {
    setError(result.message);
    logError('SYNC_FAILED', result);
  }
} catch (error: any) {
  setError('Network error. Please try again.');
  logError('SYNC_NETWORK_ERROR', error);
}
```

#### Backend Error Handling

```typescript
// In Edge Function
try {
  // Sync logic
} catch (error: any) {
  // Log to database
  await supabase.from('azure_sync_logs').update({
    sync_status: 'failed',
    error_message: error.message,
    errors: [{ user: 'system', error: error.stack }],
  });

  // Return error response
  return new Response(
    JSON.stringify({ success: false, error: error.message }),
    { status: 500 }
  );
}
```

### Logging Strategy

#### Sync Operation Logging

Every sync operation creates a log entry:

```sql
INSERT INTO azure_sync_logs (
  config_id,
  customer_id,
  company_id,
  sync_status,
  users_found,
  users_created,
  users_updated,
  users_deactivated,
  users_reactivated,
  errors,
  sync_duration_ms,
  triggered_by
) VALUES (...);
```

#### Audit Logging

All admin actions logged:

```sql
INSERT INTO company_audit_log (
  company_id,
  user_id,
  action,
  entity_type,
  entity_id,
  old_values,
  new_values
) VALUES (
  company_id,
  user_id,
  'azure_config_created',
  'azure_tenant_config',
  config_id,
  NULL,
  to_jsonb(config)
);
```

---

## 8. Testing Strategy

### Unit Tests

Test individual functions:

```typescript
describe('Azure AD Service', () => {
  test('buildMicrosoftAuthUrl creates valid URL', () => {
    const url = buildMicrosoftAuthUrl('tenant-id', 'client-id', 'state');
    expect(url).toContain('login.microsoftonline.com');
    expect(url).toContain('tenant-id');
    expect(url).toContain('client-id');
  });

  test('getCustomerAzureConfig returns null for non-existent customer', async () => {
    const config = await getCustomerAzureConfig('non-existent-uuid');
    expect(config).toBeNull();
  });
});
```

### Integration Tests

Test complete flows:

```typescript
describe('User Sync Flow', () => {
  test('sync creates new users from Azure', async () => {
    // Mock Azure API
    mockAzureAPI([
      { id: '1', displayName: 'John Doe', mail: 'john@example.com' },
    ]);

    // Trigger sync
    const result = await triggerAzureUserSync(customerId);

    // Verify
    expect(result.users_created).toBe(1);
    const user = await getUser('john@example.com');
    expect(user).toBeDefined();
    expect(user.azure_user_id).toBe('1');
  });

  test('sync deactivates users removed from Azure', async () => {
    // Create existing user
    await createUser({ azure_user_id: '1', is_active: true });

    // Mock Azure API (user not in results)
    mockAzureAPI([]);

    // Trigger sync
    const result = await triggerAzureUserSync(customerId);

    // Verify
    expect(result.users_deactivated).toBe(1);
    const user = await getUser({ azure_user_id: '1' });
    expect(user.is_active).toBe(false);
  });
});
```

### End-to-End Tests

Test complete user journeys:

```typescript
describe('E2E: Admin Consent Flow', () => {
  test('admin can grant consent and enable sync', async () => {
    // 1. Login as admin
    await loginAsAdmin();

    // 2. Navigate to customer page
    await navigateTo(`/customers/${customerId}`);

    // 3. Open Azure config modal
    await click('Configure Azure Integration');

    // 4. Fill in details
    await fillForm({
      tenant_id: 'test-tenant',
      client_id: 'test-client',
      client_secret: 'test-secret',
    });

    // 5. Save config
    await click('Save Configuration');

    // 6. Click "Grant Consent"
    await click('Grant Consent');

    // 7. Mock Microsoft consent page
    mockMicrosoftConsentPage({ admin_consent: 'True' });

    // 8. Verify consent granted
    await waitFor(() => {
      expect(screen.getByText('Consent Granted')).toBeInTheDocument();
    });

    // 9. Enable sync
    await toggleSwitch('Automatic User Synchronization');

    // 10. Trigger manual sync
    await click('Sync Now');

    // 11. Wait for sync completion
    await waitFor(() => {
      expect(screen.getByText(/Successfully synced/)).toBeInTheDocument();
    });
  });
});
```

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Azure App Registration created and configured
- [ ] All permissions granted and admin consent obtained
- [ ] Client secret created and securely stored
- [ ] Redirect URIs configured in Azure
- [ ] Environment variables configured
- [ ] Database migrations tested and ready
- [ ] Edge Functions tested locally
- [ ] Frontend components tested
- [ ] All tests passing

### Deployment Steps

1. **Database**
   - [ ] Run migrations on production database
   - [ ] Verify all tables created
   - [ ] Verify RLS policies active
   - [ ] Test database functions

2. **Edge Functions**
   - [ ] Deploy `sync-azure-users-enhanced` function
   - [ ] Verify environment variables available
   - [ ] Test function with sample request
   - [ ] Monitor function logs

3. **Frontend**
   - [ ] Build production bundle
   - [ ] Deploy to hosting
   - [ ] Verify all routes accessible
   - [ ] Test components in production

4. **Configuration**
   - [ ] Update callback URLs in Azure to production URLs
   - [ ] Configure production environment variables
   - [ ] Set up monitoring and alerting
   - [ ] Configure backup strategy

### Post-Deployment

- [ ] Test admin consent flow in production
- [ ] Test user sync with real Azure tenant
- [ ] Test user login with Microsoft
- [ ] Monitor sync logs for errors
- [ ] Set up scheduled sync (if using cron)
- [ ] Document production configuration
- [ ] Train admin users
- [ ] Create runbook for common issues

---

## 10. Troubleshooting Guide

### Common Issues

#### Issue 1: Admin Consent Fails

**Symptoms:**
- Error: "AADSTS90014: The required field is missing"
- Redirect fails after clicking "Accept"

**Solutions:**
1. Verify redirect URI in Azure matches exactly (including https://)
2. Check state parameter is properly encoded
3. Ensure user has Global Administrator role
4. Try incognito/private browser window

#### Issue 2: Users Not Syncing

**Symptoms:**
- Sync completes but no users created
- Error: "Failed to fetch users from Azure AD"

**Solutions:**
1. Verify admin consent granted
2. Check `Group.Read.All` and `User.Read.All` permissions
3. Verify client secret hasn't expired
4. Test access token manually with Microsoft Graph Explorer
5. Check group IDs are correct (if filtering by groups)

#### Issue 3: User Login Fails

**Symptoms:**
- Redirect to Microsoft works, but callback fails
- Error: "User not found" after successful Microsoft login

**Solutions:**
1. Verify `auto_create_users` is enabled in config
2. Check user's email matches Azure AD mail or userPrincipalName
3. Verify user is in specified groups (if filtering)
4. Check user's `is_active` flag

#### Issue 4: Token Expired

**Symptoms:**
- Error: "access_token expired"
- Sync fails after working previously

**Solutions:**
1. Access tokens expire after 1 hour (normal behavior)
2. Function automatically requests new token each sync
3. If persisting, check client secret hasn't expired
4. Verify system clock is synchronized (clock skew can cause token validation to fail)

### Debug Checklist

When encountering issues:

1. **Check Logs**
   ```sql
   -- Recent sync logs
   SELECT * FROM azure_sync_logs
   ORDER BY sync_started_at DESC
   LIMIT 10;

   -- Failed syncs
   SELECT * FROM azure_sync_logs
   WHERE sync_status = 'failed'
   ORDER BY sync_started_at DESC;

   -- Audit logs
   SELECT * FROM company_audit_log
   WHERE entity_type = 'azure_tenant_config'
   ORDER BY created_at DESC;
   ```

2. **Verify Configuration**
   ```sql
   -- Check config
   SELECT
     tenant_id,
     admin_consent_granted,
     sync_enabled,
     filter_by_groups,
     sync_groups,
     last_sync_status,
     last_sync_error
   FROM azure_tenant_configs
   WHERE customer_id = 'customer-uuid';
   ```

3. **Test Microsoft Graph API**
   - Go to [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
   - Login with tenant admin
   - Try: `GET https://graph.microsoft.com/v1.0/users`
   - Verify response contains expected users

4. **Check Network**
   - Verify firewall allows outbound HTTPS to:
     - `login.microsoftonline.com`
     - `graph.microsoft.com`
   - Check DNS resolution
   - Verify no proxy issues

5. **Validate Permissions**
   ```typescript
   // Test permissions
   const token = await getAccessToken();
   const response = await fetch(
     'https://graph.microsoft.com/v1.0/users',
     { headers: { 'Authorization': `Bearer ${token}` } }
   );
   console.log(response.status); // Should be 200
   ```

---

## Appendix A: Example Configurations

### Minimal Configuration

```json
{
  "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_secret": "your-secret",
  "sync_enabled": true,
  "auto_create_users": true,
  "default_user_role": "employee"
}
```

### Full Configuration with Group Filtering

```json
{
  "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenant_name": "Acme Corporation",
  "azure_domain": "acme.onmicrosoft.com",
  "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_secret": "your-secret",
  "admin_consent_granted": true,
  "sync_enabled": true,
  "filter_by_groups": true,
  "sync_groups": [
    "engineering-group-id",
    "managers-group-id"
  ],
  "auto_sync_interval_hours": 12,
  "auto_create_users": true,
  "default_user_role": "employee",
  "sync_user_photos": true
}
```

---

## Appendix B: SQL Queries

### Useful Management Queries

```sql
-- List all Azure configurations
SELECT
  c.name as customer_name,
  atc.tenant_name,
  atc.admin_consent_granted,
  atc.sync_enabled,
  atc.last_sync_at,
  atc.last_sync_status,
  atc.sync_users_count
FROM azure_tenant_configs atc
JOIN customers c ON c.id = atc.customer_id
ORDER BY c.name;

-- Find users synced from Azure
SELECT
  email,
  full_name,
  role,
  is_active,
  azure_principal_name,
  last_azure_sync,
  azure_groups
FROM profiles
WHERE azure_user_id IS NOT NULL
ORDER BY last_azure_sync DESC;

-- Sync performance report
SELECT
  DATE(sync_started_at) as sync_date,
  COUNT(*) as total_syncs,
  AVG(sync_duration_ms) as avg_duration_ms,
  SUM(users_created) as total_users_created,
  SUM(users_updated) as total_users_updated,
  SUM(users_deactivated) as total_users_deactivated
FROM azure_sync_logs
WHERE sync_status = 'success'
GROUP BY DATE(sync_started_at)
ORDER BY sync_date DESC;

-- Find recently deactivated users
SELECT
  email,
  full_name,
  deactivated_at,
  deactivated_reason
FROM profiles
WHERE is_active = false
  AND deactivated_at > NOW() - INTERVAL '7 days'
ORDER BY deactivated_at DESC;
```

---

**Document Version:** 2.0.0
**Last Updated:** 2025-01-07
**Authors:** Weibel Platform Team
**Status:** Production Ready
