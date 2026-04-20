/*
  # Add Company-Level Microsoft Azure Integration

  ## Overview
  Adds Microsoft Azure AD integration at the company level instead of customer level.
  This allows companies to manage their own Azure integration from Settings.

  ## Changes

  ### 1. Modified Tables
    - `companies`
      - Add `azure_tenant_id` - Microsoft tenant ID
      - Add `azure_tenant_name` - Tenant display name
      - Add `azure_client_id` - Azure app client ID
      - Add `azure_client_secret` - Encrypted client secret
      - Add `azure_admin_consent_granted` - Consent status
      - Add `azure_admin_consent_at` - When consent was granted
      - Add `azure_sync_enabled` - Auto sync enabled/disabled
      - Add `azure_sync_group_id` - Azure group to sync users from
      - Add `azure_sync_group_name` - Group display name
      - Add `azure_auto_create_users` - Auto-create users toggle
      - Add `azure_last_sync_at` - Last sync timestamp
      - Add `azure_last_sync_status` - Last sync status
      - Add `azure_last_sync_error` - Last sync error message

  ### 2. New Tables
    - `company_azure_sync_logs`
      - Detailed logging of all company sync operations
      - Track success, failures, and changes

  ## Important Notes
  - Each company can only have one Azure integration
  - Admin consent must be granted before sync can work
  - Users are deactivated (not deleted) when removed from group
  - All sync operations are logged for audit purposes
*/

-- Add Azure integration fields to companies table
DO $$
BEGIN
  -- Tenant information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_tenant_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_tenant_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_tenant_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_tenant_name text;
  END IF;

  -- Client credentials
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_client_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_client_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_client_secret'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_client_secret text;
  END IF;

  -- Admin consent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_admin_consent_granted'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_admin_consent_granted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_admin_consent_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_admin_consent_at timestamptz;
  END IF;

  -- Sync configuration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_sync_enabled'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_sync_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_sync_group_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_sync_group_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_sync_group_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_sync_group_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_auto_create_users'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_auto_create_users boolean DEFAULT true;
  END IF;

  -- Sync status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_last_sync_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_last_sync_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_last_sync_status'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_last_sync_status text DEFAULT 'never';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_last_sync_error'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_last_sync_error text;
  END IF;
END $$;

-- Create company_azure_sync_logs table
CREATE TABLE IF NOT EXISTS company_azure_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  
  -- Group information
  sync_group_id text,
  sync_group_name text,
  
  -- Errors
  errors jsonb DEFAULT '[]'::jsonb,
  error_message text,
  
  -- Metadata
  triggered_by uuid REFERENCES profiles(id),
  trigger_type text DEFAULT 'manual',
  sync_duration_ms integer,
  
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_azure_sync_logs_company_id 
  ON company_azure_sync_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_azure_sync_logs_sync_started_at 
  ON company_azure_sync_logs(sync_started_at);
CREATE INDEX IF NOT EXISTS idx_company_azure_sync_logs_sync_status 
  ON company_azure_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_companies_azure_tenant_id 
  ON companies(azure_tenant_id);

-- Enable RLS
ALTER TABLE company_azure_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_azure_sync_logs

-- Admins can view sync logs for their company
CREATE POLICY "Admins can view company sync logs"
  ON company_azure_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = company_azure_sync_logs.company_id
      AND profiles.role = 'admin'
    )
  );

-- System can insert sync logs
CREATE POLICY "System can insert company sync logs"
  ON company_azure_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to get company Azure configuration
CREATE OR REPLACE FUNCTION get_company_azure_config(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', id,
    'azure_tenant_id', azure_tenant_id,
    'azure_tenant_name', azure_tenant_name,
    'azure_client_id', azure_client_id,
    'azure_admin_consent_granted', azure_admin_consent_granted,
    'azure_admin_consent_at', azure_admin_consent_at,
    'azure_sync_enabled', azure_sync_enabled,
    'azure_sync_group_id', azure_sync_group_id,
    'azure_sync_group_name', azure_sync_group_name,
    'azure_auto_create_users', azure_auto_create_users,
    'azure_last_sync_at', azure_last_sync_at,
    'azure_last_sync_status', azure_last_sync_status,
    'azure_last_sync_error', azure_last_sync_error
  ) INTO config
  FROM companies
  WHERE id = p_company_id;
  
  RETURN config;
END;
$$;

-- Function to update company Azure configuration
CREATE OR REPLACE FUNCTION update_company_azure_config(
  p_company_id uuid,
  p_tenant_id text DEFAULT NULL,
  p_tenant_name text DEFAULT NULL,
  p_client_id text DEFAULT NULL,
  p_client_secret text DEFAULT NULL,
  p_sync_enabled boolean DEFAULT NULL,
  p_sync_group_id text DEFAULT NULL,
  p_sync_group_name text DEFAULT NULL,
  p_auto_create_users boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET 
    azure_tenant_id = COALESCE(p_tenant_id, azure_tenant_id),
    azure_tenant_name = COALESCE(p_tenant_name, azure_tenant_name),
    azure_client_id = COALESCE(p_client_id, azure_client_id),
    azure_client_secret = COALESCE(p_client_secret, azure_client_secret),
    azure_sync_enabled = COALESCE(p_sync_enabled, azure_sync_enabled),
    azure_sync_group_id = COALESCE(p_sync_group_id, azure_sync_group_id),
    azure_sync_group_name = COALESCE(p_sync_group_name, azure_sync_group_name),
    azure_auto_create_users = COALESCE(p_auto_create_users, azure_auto_create_users)
  WHERE id = p_company_id;
  
  RETURN true;
END;
$$;

-- Function to record admin consent
CREATE OR REPLACE FUNCTION record_azure_admin_consent(
  p_company_id uuid,
  p_tenant_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET 
    azure_tenant_id = p_tenant_id,
    azure_admin_consent_granted = true,
    azure_admin_consent_at = now()
  WHERE id = p_company_id;
  
  RETURN true;
END;
$$;

-- Function to log company sync
CREATE OR REPLACE FUNCTION log_company_azure_sync(
  p_company_id uuid,
  p_status text,
  p_users_found integer DEFAULT 0,
  p_users_created integer DEFAULT 0,
  p_users_updated integer DEFAULT 0,
  p_users_deactivated integer DEFAULT 0,
  p_users_reactivated integer DEFAULT 0,
  p_users_skipped integer DEFAULT 0,
  p_sync_group_id text DEFAULT NULL,
  p_sync_group_name text DEFAULT NULL,
  p_errors jsonb DEFAULT '[]'::jsonb,
  p_error_message text DEFAULT NULL,
  p_trigger_type text DEFAULT 'manual',
  p_sync_duration_ms integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO company_azure_sync_logs (
    company_id,
    sync_status,
    users_found,
    users_created,
    users_updated,
    users_deactivated,
    users_reactivated,
    users_skipped,
    sync_group_id,
    sync_group_name,
    errors,
    error_message,
    triggered_by,
    trigger_type,
    sync_duration_ms,
    sync_completed_at
  ) VALUES (
    p_company_id,
    p_status,
    p_users_found,
    p_users_created,
    p_users_updated,
    p_users_deactivated,
    p_users_reactivated,
    p_users_skipped,
    p_sync_group_id,
    p_sync_group_name,
    p_errors,
    p_error_message,
    auth.uid(),
    p_trigger_type,
    p_sync_duration_ms,
    now()
  )
  RETURNING id INTO log_id;
  
  -- Update company sync status
  UPDATE companies
  SET 
    azure_last_sync_at = now(),
    azure_last_sync_status = p_status,
    azure_last_sync_error = p_error_message
  WHERE id = p_company_id;
  
  RETURN log_id;
END;
$$;