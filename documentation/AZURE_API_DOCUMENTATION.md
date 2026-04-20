# Microsoft Azure AD Integration - Complete API Documentation

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [API Endpoints](#api-endpoints)
3. [Callback URLs](#callback-urls)
4. [Database Schema](#database-schema)
5. [Error Codes](#error-codes)
6. [Webhook Events](#webhook-events)

---

## Environment Configuration

### Required Environment Variables

These environment variables must be configured in your `.env` file:

```bash
# Azure Application Credentials
MICROSOFT_CLIENTID=your-azure-client-id
MICROSOFT_CLIENTSECRET_VALUE=your-azure-client-secret-value
MICROSOFT_CLIENTSECRET_SECRETID=your-azure-secret-id

# Supabase Configuration (automatically provided)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application URLs
VITE_APP_URL=https://yourdomain.com
```

### Azure App Registration Configuration

**Required Permissions:**
- `Group.Read.All` (Application)
- `User.Read` (Delegated)
- `User.Read.All` (Application)

**Redirect URIs:**
- `https://yourdomain.com/auth/microsoft/callback` - OAuth callback
- `https://yourdomain.com/auth/microsoft/admin-consent` - Admin consent callback

**Application Type:** Multi-tenant

---

## API Endpoints

### 1. Customer Azure Configuration

#### Get Azure Configuration

```http
GET /api/customers/:customerId/azure
Authorization: Bearer {token}
```

**Response:**
```json
{
  "config": {
    "id": "uuid",
    "customer_id": "uuid",
    "company_id": "uuid",
    "tenant_id": "azure-tenant-id",
    "tenant_name": "Company Tenant",
    "azure_domain": "company.onmicrosoft.com",
    "client_id": "azure-client-id",
    "admin_consent_granted": true,
    "admin_consent_granted_at": "2025-01-07T10:00:00Z",
    "sync_enabled": true,
    "filter_by_groups": true,
    "sync_groups": ["group-id-1", "group-id-2"],
    "auto_sync_interval_hours": 24,
    "last_sync_at": "2025-01-07T09:00:00Z",
    "last_sync_status": "success",
    "sync_users_count": 45,
    "auto_create_users": true,
    "default_user_role": "employee",
    "sync_user_photos": false
  }
}
```

#### Create/Update Azure Configuration

```http
POST /api/customers/:customerId/azure
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenant_id": "azure-tenant-id",
  "tenant_name": "Company Tenant",
  "azure_domain": "company.onmicrosoft.com",
  "client_id": "azure-client-id",
  "client_secret": "azure-client-secret",
  "sync_enabled": true,
  "filter_by_groups": true,
  "sync_groups": ["group-id-1", "group-id-2"],
  "auto_sync_interval_hours": 24,
  "auto_create_users": true,
  "default_user_role": "employee",
  "sync_user_photos": false
}
```

**Response:**
```json
{
  "success": true,
  "config_id": "uuid",
  "message": "Configuration saved successfully"
}
```

#### Delete Azure Configuration

```http
DELETE /api/customers/:customerId/azure
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration deleted successfully"
}
```

---

### 2. User Synchronization

#### Trigger Manual Sync

```http
POST /api/customers/:customerId/azure/sync
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "filter_by_groups": true,
  "group_ids": ["group-id-1", "group-id-2"],
  "dry_run": false
}
```

**Response:**
```json
{
  "success": true,
  "log_id": "uuid",
  "users_synced": 45,
  "users_created": 5,
  "users_updated": 35,
  "users_deactivated": 3,
  "users_reactivated": 2,
  "users_skipped": 0,
  "errors": [],
  "duration_ms": 2456
}
```

#### Get Sync Logs

```http
GET /api/customers/:customerId/azure/sync-logs
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` - Number of logs to return (default: 10, max: 100)
- `offset` - Pagination offset
- `status` - Filter by status: `success`, `failed`, `partial`, `in_progress`

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "sync_started_at": "2025-01-07T09:00:00Z",
      "sync_completed_at": "2025-01-07T09:02:15Z",
      "sync_status": "success",
      "users_found": 48,
      "users_created": 5,
      "users_updated": 40,
      "users_deactivated": 3,
      "users_reactivated": 0,
      "users_skipped": 0,
      "errors": [],
      "sync_duration_ms": 135000,
      "triggered_by": "admin@example.com"
    }
  ],
  "total": 25,
  "has_more": true
}
```

---

### 3. Group Mappings

#### List Group Mappings

```http
GET /api/customers/:customerId/azure/groups
Authorization: Bearer {token}
```

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "azure_group_id": "azure-group-uuid",
      "azure_group_name": "Engineering",
      "mapped_role": "employee",
      "is_active": true,
      "auto_sync": true,
      "member_count": 25
    }
  ]
}
```

#### Create Group Mapping

```http
POST /api/customers/:customerId/azure/groups
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "azure_group_id": "azure-group-uuid",
  "azure_group_name": "Engineering",
  "mapped_role": "employee",
  "auto_sync": true
}
```

**Response:**
```json
{
  "success": true,
  "mapping_id": "uuid",
  "message": "Group mapping created"
}
```

#### Update Group Mapping

```http
PUT /api/customers/:customerId/azure/groups/:mappingId
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "mapped_role": "location_responsible",
  "is_active": true,
  "auto_sync": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group mapping updated"
}
```

#### Delete Group Mapping

```http
DELETE /api/customers/:customerId/azure/groups/:mappingId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Group mapping deleted"
}
```

---

### 4. User Management

#### List Azure Users

```http
GET /api/users/azure
Authorization: Bearer {token}
```

**Query Parameters:**
- `customer_id` - Filter by customer
- `is_active` - Filter by active status
- `azure_tenant_id` - Filter by tenant
- `has_azure_groups` - Filter users with group memberships

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "employee",
      "is_active": true,
      "azure_user_id": "azure-user-uuid",
      "azure_principal_name": "john@company.onmicrosoft.com",
      "azure_tenant_id": "tenant-id",
      "azure_groups": [
        {"id": "group-id", "name": "Engineering"}
      ],
      "last_azure_sync": "2025-01-07T09:00:00Z"
    }
  ]
}
```

#### Deactivate User

```http
POST /api/users/:userId/deactivate
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "User removed from Azure AD"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

#### Reactivate User

```http
POST /api/users/:userId/reactivate
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "User reactivated successfully"
}
```

---

### 5. Admin Consent

#### Request Admin Consent URL

```http
GET /api/customers/:customerId/azure/admin-consent-url
Authorization: Bearer {token}
```

**Response:**
```json
{
  "consent_url": "https://login.microsoftonline.com/{tenant}/adminconsent?client_id={clientId}&redirect_uri={redirectUri}&state={state}"
}
```

#### Process Admin Consent Callback

This is handled automatically by the callback page, but the endpoint is:

```http
GET /auth/microsoft/admin-consent
```

**Query Parameters:**
- `tenant` - Azure tenant ID
- `admin_consent` - "True" or "False"
- `error` - Error code if failed
- `error_description` - Error description
- `state` - State parameter for CSRF protection

---

### 6. Authentication

#### Microsoft OAuth Login

```http
GET /auth/microsoft/login
```

**Query Parameters:**
- `customer_id` - Customer UUID

**Redirects to:**
```
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
  ?client_id={clientId}
  &response_type=code
  &redirect_uri={redirectUri}
  &scope=openid profile email User.Read
  &state={state}
```

#### OAuth Callback

```http
GET /auth/microsoft/callback
```

**Query Parameters:**
- `code` - Authorization code
- `state` - State parameter
- `error` - Error code if failed
- `error_description` - Error description

**Process:**
1. Exchange code for access token
2. Fetch user info from Microsoft Graph
3. Find or create user in database
4. Authenticate user in application
5. Redirect to dashboard

---

## Callback URLs

### URLs to Configure in Azure App Registration

#### 1. OAuth Login Callback

```
https://yourdomain.com/auth/microsoft/callback
```

**Purpose:** Handle OAuth authorization code flow
**Type:** Web - Redirect URI
**Required:** Yes

#### 2. Admin Consent Callback

```
https://yourdomain.com/auth/microsoft/admin-consent
```

**Purpose:** Handle admin consent flow
**Type:** Web - Redirect URI
**Required:** Yes

#### 3. Logout Callback (Optional)

```
https://yourdomain.com/auth/microsoft/logout
```

**Purpose:** Handle post-logout redirect
**Type:** Web - Redirect URI
**Required:** No

---

## Database Schema

### Tables

#### `azure_tenant_configs`

Stores Azure AD configuration per customer.

```sql
CREATE TABLE azure_tenant_configs (
  id uuid PRIMARY KEY,
  customer_id uuid REFERENCES customers(id),
  company_id uuid REFERENCES companies(id),
  tenant_id text NOT NULL,
  tenant_name text,
  azure_domain text,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  admin_consent_granted boolean DEFAULT false,
  admin_consent_granted_at timestamptz,
  admin_consent_granted_by text,
  sync_enabled boolean DEFAULT false,
  filter_by_groups boolean DEFAULT false,
  sync_groups jsonb DEFAULT '[]',
  auto_sync_interval_hours integer DEFAULT 24,
  last_sync_at timestamptz,
  last_sync_status text DEFAULT 'never',
  last_sync_error text,
  sync_users_count integer DEFAULT 0,
  auto_create_users boolean DEFAULT true,
  default_user_role user_role DEFAULT 'employee',
  sync_user_photos boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);
```

#### `azure_sync_logs`

Logs all sync operations for audit purposes.

```sql
CREATE TABLE azure_sync_logs (
  id uuid PRIMARY KEY,
  config_id uuid REFERENCES azure_tenant_configs(id),
  customer_id uuid REFERENCES customers(id),
  company_id uuid REFERENCES companies(id),
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  sync_status text DEFAULT 'in_progress',
  users_found integer DEFAULT 0,
  users_created integer DEFAULT 0,
  users_updated integer DEFAULT 0,
  users_deactivated integer DEFAULT 0,
  users_reactivated integer DEFAULT 0,
  users_skipped integer DEFAULT 0,
  groups_synced jsonb DEFAULT '[]',
  errors jsonb DEFAULT '[]',
  error_message text,
  triggered_by uuid REFERENCES profiles(id),
  sync_duration_ms integer,
  created_at timestamptz DEFAULT now()
);
```

#### `azure_group_mappings`

Maps Azure groups to application roles.

```sql
CREATE TABLE azure_group_mappings (
  id uuid PRIMARY KEY,
  config_id uuid REFERENCES azure_tenant_configs(id),
  company_id uuid REFERENCES companies(id),
  azure_group_id text NOT NULL,
  azure_group_name text,
  mapped_role user_role DEFAULT 'employee',
  is_active boolean DEFAULT true,
  auto_sync boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);
```

#### `profiles` (Enhanced)

User profiles with Azure AD fields.

**New Fields:**
- `azure_user_id` - Microsoft user object ID
- `azure_principal_name` - User principal name (UPN)
- `azure_tenant_id` - Associated tenant
- `azure_groups` - JSONB array of group memberships
- `last_azure_sync` - Last sync timestamp
- `is_active` - User activation status
- `deactivated_at` - Deactivation timestamp
- `deactivated_reason` - Reason for deactivation

---

## Error Codes

### Authentication Errors

| Code | Message | Description |
|------|---------|-------------|
| `AUTH001` | Missing authorization header | No Bearer token provided |
| `AUTH002` | Invalid token | Token is expired or malformed |
| `AUTH003` | Insufficient permissions | User doesn't have required role |
| `AUTH004` | User not found | User doesn't exist in database |
| `AUTH005` | Account deactivated | User account is deactivated |

### Configuration Errors

| Code | Message | Description |
|------|---------|-------------|
| `CFG001` | Configuration not found | No Azure config for customer |
| `CFG002` | Invalid tenant ID | Tenant ID format is invalid |
| `CFG003` | Invalid client credentials | Client ID/secret is incorrect |
| `CFG004` | Admin consent required | Admin consent not granted |
| `CFG005` | Configuration exists | Config already exists for customer |

### Sync Errors

| Code | Message | Description |
|------|---------|-------------|
| `SYNC001` | Sync already in progress | Another sync is currently running |
| `SYNC002` | Failed to get access token | Azure token request failed |
| `SYNC003` | Failed to fetch users | Microsoft Graph API error |
| `SYNC004` | Failed to fetch groups | Group API request failed |
| `SYNC005` | User creation failed | Database insert error |
| `SYNC006` | Group not found | Azure group doesn't exist |

### Group Mapping Errors

| Code | Message | Description |
|------|---------|-------------|
| `GRP001` | Group mapping not found | Mapping doesn't exist |
| `GRP002` | Invalid group ID | Group ID format is invalid |
| `GRP003` | Duplicate mapping | Mapping already exists |
| `GRP004` | Invalid role | Role is not valid |

---

## Webhook Events

### Sync Completed

Triggered when a user synchronization completes.

**Event:** `azure.sync.completed`

**Payload:**
```json
{
  "event": "azure.sync.completed",
  "timestamp": "2025-01-07T09:02:15Z",
  "data": {
    "log_id": "uuid",
    "customer_id": "uuid",
    "company_id": "uuid",
    "status": "success",
    "users_synced": 45,
    "users_created": 5,
    "users_updated": 35,
    "users_deactivated": 3,
    "users_reactivated": 2,
    "duration_ms": 135000
  }
}
```

### Admin Consent Granted

Triggered when admin consent is successfully granted.

**Event:** `azure.consent.granted`

**Payload:**
```json
{
  "event": "azure.consent.granted",
  "timestamp": "2025-01-07T10:00:00Z",
  "data": {
    "customer_id": "uuid",
    "company_id": "uuid",
    "tenant_id": "azure-tenant-id",
    "granted_by": "admin@example.com"
  }
}
```

### User Deactivated

Triggered when a user is deactivated.

**Event:** `azure.user.deactivated`

**Payload:**
```json
{
  "event": "azure.user.deactivated",
  "timestamp": "2025-01-07T09:05:00Z",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "reason": "Removed from Azure AD",
    "deactivated_by": "system"
  }
}
```

---

## Rate Limits

### API Rate Limits

- **Standard endpoints:** 100 requests per minute per user
- **Sync endpoint:** 5 requests per minute per customer
- **Group endpoints:** 50 requests per minute per user

### Microsoft Graph API Limits

- **User queries:** 10,000 requests per hour per tenant
- **Group queries:** 5,000 requests per hour per tenant
- **Batch requests:** 20 requests per batch

---

## Best Practices

### 1. Error Handling

Always implement proper error handling:

```typescript
try {
  const result = await triggerAzureUserSync(customerId);
  if (!result.success) {
    handleSyncError(result.message, result.errors);
  }
} catch (error) {
  handleNetworkError(error);
}
```

### 2. Retry Logic

Implement exponential backoff for failed requests:

```typescript
async function syncWithRetry(customerId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await triggerAzureUserSync(customerId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
}
```

### 3. Logging

Log all sync operations for audit purposes:

```typescript
console.log('[Azure Sync]', {
  customerId,
  timestamp: new Date().toISOString(),
  result: {
    success: result.success,
    usersSynced: result.users_synced,
    errors: result.errors.length,
  },
});
```

### 4. Security

- Always validate admin consent before enabling sync
- Store client secrets encrypted in database
- Use HTTPS for all callback URLs
- Validate state parameter in OAuth flow
- Implement CSRF protection

---

## Support

For technical support or questions:
- Review the Technical Specification document
- Check sync logs in the database
- Review Azure App Registration configuration
- Verify callback URLs are correctly configured

---

**Version:** 1.0.0
**Last Updated:** 2025-01-07
**API Version:** v1
