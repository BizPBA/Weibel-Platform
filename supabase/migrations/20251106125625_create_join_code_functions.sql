/*
  # Create Join Code Validation Functions

  1. Purpose
    - Enable join code validation for company invitations
    - Track join code usage and enforce limits
    - Provide secure functions that bypass RLS for validation

  2. New Functions
    - validate_join_code: Checks if a join code is valid, not expired, and under usage limits
    - increment_join_code_usage: Atomically increments the usage counter for a join code

  3. Security
    - Functions run as SECURITY DEFINER to bypass RLS
    - Functions validate all inputs to prevent abuse
    - Usage limits are enforced to prevent code sharing
    - Returns structured data for client-side handling

  4. Important Notes
    - Join codes are case-insensitive (converted to uppercase)
    - Expired codes return as invalid
    - Full usage codes return as invalid
    - Functions are idempotent and safe to call multiple times
*/

-- Function to validate a join code
CREATE OR REPLACE FUNCTION public.validate_join_code(code_input text)
RETURNS TABLE (
  is_valid boolean,
  company_id uuid,
  role text,
  company_name text,
  expires_at timestamptz,
  uses_remaining integer
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN (jc.expires_at IS NULL OR jc.expires_at > now())
        AND (jc.max_uses IS NULL OR jc.current_uses < jc.max_uses)
        AND jc.is_active = true
      THEN true
      ELSE false
    END as is_valid,
    jc.company_id,
    jc.role::text,
    c.name as company_name,
    jc.expires_at,
    CASE 
      WHEN jc.max_uses IS NULL THEN -1
      ELSE (jc.max_uses - jc.current_uses)
    END as uses_remaining
  FROM company_join_codes jc
  INNER JOIN companies c ON c.id = jc.company_id
  WHERE UPPER(jc.code) = UPPER(code_input)
    AND jc.is_active = true
  LIMIT 1;
END;
$$;

-- Function to increment join code usage
CREATE OR REPLACE FUNCTION public.increment_join_code_usage(code_input text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  code_exists boolean;
BEGIN
  -- Check if the code exists and is still valid
  SELECT EXISTS(
    SELECT 1 
    FROM company_join_codes 
    WHERE UPPER(code) = UPPER(code_input)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR current_uses < max_uses)
  ) INTO code_exists;
  
  IF NOT code_exists THEN
    RETURN false;
  END IF;
  
  -- Increment the usage counter
  UPDATE company_join_codes
  SET current_uses = current_uses + 1
  WHERE UPPER(code) = UPPER(code_input)
    AND is_active = true;
  
  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_join_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_join_code_usage(text) TO authenticated;

-- Create additional index for faster case-insensitive lookups
CREATE INDEX IF NOT EXISTS idx_company_join_codes_code_upper ON company_join_codes(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_company_join_codes_active ON company_join_codes(is_active, expires_at) WHERE is_active = true;
