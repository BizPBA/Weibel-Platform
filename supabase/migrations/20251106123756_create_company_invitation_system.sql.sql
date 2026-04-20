/*
  # Create company invitation system

  1. New Tables
    - company_invitations: Email-based invitations
    - company_join_codes: Reusable join codes
    - company_audit_log: Track company changes

  2. Security
    - Enable RLS on all tables
    - Add policies for company-based access

  3. Features
    - Email invitations with expiration
    - Reusable join codes with usage limits
    - Audit logging for compliance
*/

-- Create company_invitations table
CREATE TABLE IF NOT EXISTS company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  invite_code text UNIQUE NOT NULL,
  invite_type text DEFAULT 'email' CHECK (invite_type IN ('email', 'code')),
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for company_invitations
CREATE POLICY "Users can read invitations for their company"
  ON company_invitations
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations for their company"
  ON company_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

CREATE POLICY "Users can update invitations for their company"
  ON company_invitations
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

-- Create company_join_codes table
CREATE TABLE IF NOT EXISTS company_join_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_join_codes ENABLE ROW LEVEL SECURITY;

-- Policies for company_join_codes
CREATE POLICY "Users can read join codes for their company"
  ON company_join_codes
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create join codes for their company"
  ON company_join_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

CREATE POLICY "Users can update join codes for their company"
  ON company_join_codes
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

-- Create company_audit_log table
CREATE TABLE IF NOT EXISTS company_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for company_audit_log
CREATE POLICY "Users can read audit log for their company"
  ON company_audit_log
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_invite_code ON company_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_company_join_codes_company_id ON company_join_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_company_join_codes_code ON company_join_codes(code);
CREATE INDEX IF NOT EXISTS idx_company_audit_log_company_id ON company_audit_log(company_id);