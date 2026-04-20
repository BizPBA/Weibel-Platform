/**
 * Enhanced Microsoft Azure AD Integration Types
 *
 * Extended types for enterprise-grade Azure AD integration including
 * group filtering, user deactivation, and admin consent tracking.
 */

import type { Json } from '../lib/database.types';

export interface AzureGroup {
  id: string;
  displayName: string;
  description: string | null;
  mail: string | null;
}

export interface AzureTenantConfigEnhanced {
  id: string;
  customer_id: string;
  company_id: string;

  tenant_id: string;
  tenant_name: string | null;
  azure_domain: string | null;
  client_id: string;
  client_secret: string;

  admin_consent_granted: boolean;
  admin_consent_granted_at: string | null;
  admin_consent_granted_by: string | null;

  sync_enabled: boolean;
  filter_by_groups: boolean;
  sync_groups: Json;
  auto_sync_interval_hours: number;
  last_sync_at: string | null;
  last_sync_status: 'never' | 'success' | 'failed' | 'in_progress';
  last_sync_error: string | null;
  sync_users_count: number;

  auto_create_users: boolean;
  default_user_role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee';
  sync_user_photos: boolean;

  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ProfileEnhanced {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee';
  company_id: string | null;
  onboarding_completed: boolean;
  created_at: string;

  azure_user_id: string | null;
  azure_principal_name: string | null;
  last_azure_sync: string | null;
  azure_tenant_id: string | null;
  azure_groups: Json;

  is_active: boolean;
  deactivated_at: string | null;
  deactivated_reason: string | null;
}

export interface AzureSyncLog {
  id: string;
  config_id: string;
  customer_id: string;
  company_id: string;

  sync_started_at: string;
  sync_completed_at: string | null;
  sync_status: 'in_progress' | 'success' | 'failed' | 'partial';

  users_found: number;
  users_created: number;
  users_updated: number;
  users_deactivated: number;
  users_reactivated: number;
  users_skipped: number;

  groups_synced: Json;
  errors: Json;
  error_message: string | null;

  triggered_by: string | null;
  sync_duration_ms: number | null;

  created_at: string;
}

export interface AzureGroupMapping {
  id: string;
  config_id: string;
  company_id: string;

  azure_group_id: string;
  azure_group_name: string | null;

  mapped_role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee';

  is_active: boolean;
  auto_sync: boolean;

  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface AdminConsentRequest {
  tenant: string;
  state: string;
  customerId: string;
  redirectUri: string;
}

export interface AdminConsentResponse {
  tenant: string;
  admin_consent: 'True' | 'False';
  error?: string;
  error_description?: string;
  state: string;
}

export interface AzureSyncOptions {
  customerId: string;
  filterByGroups?: boolean;
  groupIds?: string[];
  dryRun?: boolean;
}

export interface AzureSyncResult {
  success: boolean;
  log_id: string;
  users_found: number;
  users_created: number;
  users_updated: number;
  users_deactivated: number;
  users_reactivated: number;
  users_skipped: number;
  errors: Array<{
    user: string;
    error: string;
  }>;
  duration_ms: number;
}

export interface MicrosoftGraphUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  mobilePhone: string | null;
  jobTitle: string | null;
  department: string | null;
  memberOf?: Array<{ id: string; displayName: string }>;
}

export interface SecurityIntegrationStatus {
  isConfigured: boolean;
  adminConsentGranted: boolean;
  syncEnabled: boolean;
  lastSync: string | null;
  lastSyncStatus: string;
  userCount: number;
  groupCount: number;
}
