/*
  # Enhance Azure AD Integration with Group Filtering and User Deactivation

  ## Overview
  This migration enhances the Azure AD integration to support:
  - Azure group-based user filtering
  - User deactivation (instead of deletion)
  - Admin consent tracking
  - Sync group configuration

  ## Changes

  ### 1. Modified Tables
    - `azure_tenant_configs`
      - Add `admin_consent_granted` - Track if admin consent is obtained
      - Add `admin_consent_granted_at` - When consent was granted
      - Add `admin_consent_granted_by` - Who granted consent
      - Add `filter_by_groups` - Enable group-based filtering
      - Add `sync_groups` - JSON array of group IDs to sync from

    - `profiles`
      - Add `is_active` - User activation status (for soft deletion)
      - Add `deactivated_at` - When user was deactivated
      - Add `deactivated_reason` - Why user was deactivated
      - Add `azure_groups` - JSON array of Azure group memberships

  ### 2. New Tables
    - `azure_sync_logs`
      - Detailed logging of all sync operations
      - Track success, failures, and changes

    - `azure_group_mappings`
      - Map Azure groups to application roles
      - Define which groups should sync which roles

  ### 3. Functions
    - `deactivate_user` - Soft delete user function
    - `reactivate_user` - Reactivate deactivated user
    - `log_azure_sync` - Log sync operations

  ## Important Notes
  - Users are never deleted, only deactivated
  - Group filtering is optional (can sync all users)
  - Admin consent must be granted before sync can work
  - All sync operations are logged for audit purposes
*/

-- Add fields to azure_tenant_configs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'admin_consent_granted'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN admin_consent_granted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'admin_consent_granted_at'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN admin_consent_granted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'admin_consent_granted_by'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN admin_consent_granted_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'filter_by_groups'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN filter_by_groups boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'sync_groups'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN sync_groups jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add user deactivation fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deactivated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deactivated_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deactivated_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'azure_groups'
  ) THEN
    ALTER TABLE profiles ADD COLUMN azure_groups jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create azure_sync_logs table
CREATE TABLE IF NOT EXISTS azure_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES azure_tenant_configs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  sync_status text DEFAULT 'in_progress',
  
  -- Results
  users_found integer DEFAULT 0,
  users_created integer DEFAULT 0,
  users_updated integer DEFAULT 0,
  users_deactivated integer DEFAULT 0,
  users_reactivated integer DEFAULT 0,
  users_skipped integer DEFAULT 0,
  
  -- Groups
  groups_synced jsonb DEFAULT '[]'::jsonb,
  
  -- Errors
  errors jsonb DEFAULT '[]'::jsonb,
  error_message text,
  
  -- Metadata
  triggered_by uuid REFERENCES profiles(id),
  sync_duration_ms integer,
  
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_azure_sync_logs_config_id ON azure_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_azure_sync_logs_customer_id ON azure_sync_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_azure_sync_logs_sync_started_at ON azure_sync_logs(sync_started_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_azure_groups ON profiles USING gin(azure_groups);

-- Enable RLS
ALTER TABLE azure_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for azure_sync_logs

-- Admins can view sync logs for their company
CREATE POLICY "Admins can view sync logs"
  ON azure_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_sync_logs.company_id
      AND profiles.role = 'admin'
    )
  );

-- System can insert sync logs
CREATE POLICY "System can insert sync logs"
  ON azure_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create azure_group_mappings table
CREATE TABLE IF NOT EXISTS azure_group_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES azure_tenant_configs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Azure Group Info
  azure_group_id text NOT NULL,
  azure_group_name text,
  
  -- Application Role Mapping
  mapped_role user_role DEFAULT 'employee',
  
  -- Settings
  is_active boolean DEFAULT true,
  auto_sync boolean DEFAULT true,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_group_mapping UNIQUE(config_id, azure_group_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_azure_group_mappings_config_id ON azure_group_mappings(config_id);

-- Enable RLS
ALTER TABLE azure_group_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for azure_group_mappings

-- Admins can manage group mappings
CREATE POLICY "Admins can view group mappings"
  ON azure_group_mappings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert group mappings"
  ON azure_group_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update group mappings"
  ON azure_group_mappings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete group mappings"
  ON azure_group_mappings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );

-- Function to deactivate user
CREATE OR REPLACE FUNCTION deactivate_user(
  user_id uuid,
  reason text DEFAULT 'Removed from Azure AD'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_active = false,
    deactivated_at = now(),
    deactivated_reason = reason
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

-- Function to reactivate user
CREATE OR REPLACE FUNCTION reactivate_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivated_reason = NULL
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

-- Function to log sync operation
CREATE OR REPLACE FUNCTION log_azure_sync(
  p_config_id uuid,
  p_customer_id uuid,
  p_company_id uuid,
  p_status text,
  p_users_found integer DEFAULT 0,
  p_users_created integer DEFAULT 0,
  p_users_updated integer DEFAULT 0,
  p_users_deactivated integer DEFAULT 0,
  p_users_reactivated integer DEFAULT 0,
  p_errors jsonb DEFAULT '[]'::jsonb,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
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
    error_message,
    triggered_by,
    sync_completed_at
  ) VALUES (
    p_config_id,
    p_customer_id,
    p_company_id,
    p_status,
    p_users_found,
    p_users_created,
    p_users_updated,
    p_users_deactivated,
    p_users_reactivated,
    p_errors,
    p_error_message,
    auth.uid(),
    now()
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to get user's Azure groups
CREATE OR REPLACE FUNCTION get_user_azure_groups(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  groups jsonb;
BEGIN
  SELECT azure_groups INTO groups
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(groups, '[]'::jsonb);
END;
$$;