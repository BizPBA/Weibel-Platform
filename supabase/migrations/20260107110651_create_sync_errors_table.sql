/*
  # Create Sync Errors Table

  1. New Tables
    - `azure_sync_errors`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `user_principal_name` (text) - Email of the user that failed to sync
      - `display_name` (text) - Name of the user
      - `error_type` (text) - Type of error (e.g., 'duplicate_email', 'missing_data', 'api_error')
      - `error_message` (text) - Detailed error message
      - `raw_data` (jsonb) - Raw user data from Azure for debugging
      - `sync_attempt_at` (timestamptz) - When the sync was attempted
      - `resolved` (boolean) - Whether the error has been resolved
      - `resolved_at` (timestamptz) - When the error was resolved
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `azure_sync_errors` table
    - Add policy for company admins to view their company's sync errors
    - Add policy for system to insert errors
*/

CREATE TABLE IF NOT EXISTS azure_sync_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_principal_name text,
  display_name text,
  error_type text NOT NULL,
  error_message text NOT NULL,
  raw_data jsonb,
  sync_attempt_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE azure_sync_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view their sync errors"
  ON azure_sync_errors
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert sync errors"
  ON azure_sync_errors
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Company admins can update their sync errors"
  ON azure_sync_errors
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_azure_sync_errors_company_id ON azure_sync_errors(company_id);
CREATE INDEX IF NOT EXISTS idx_azure_sync_errors_resolved ON azure_sync_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_azure_sync_errors_sync_attempt_at ON azure_sync_errors(sync_attempt_at DESC);
