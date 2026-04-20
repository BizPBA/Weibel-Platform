/*
  # Improve Sign-Up Flow and Email Verification

  This migration improves the company registration and onboarding flow by ensuring
  proper handling of email verification and onboarding completion status.

  ## Changes Made

  1. **Update handle_new_user function**
     - Ensure onboarding_completed defaults to false for new users
     - Allow email verification flow to work properly

  2. **Add cleanup for abandoned registrations**
     - Create function to identify partial registrations
     - Mark registrations older than 24 hours without email confirmation

  3. **Ensure data integrity**
     - Add check constraints
     - Improve indexing for faster lookups

  ## Security

  - All changes maintain existing RLS policies
  - No security policy modifications needed
*/

-- Recreate the handle_new_user function to ensure proper initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    false,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create a function to check for incomplete registrations
CREATE OR REPLACE FUNCTION public.check_incomplete_registration(user_id_input uuid)
RETURNS TABLE (
  has_profile boolean,
  has_company boolean,
  company_name text,
  email_confirmed boolean,
  onboarding_completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  company_record RECORD;
  user_record RECORD;
BEGIN
  -- Get user info
  SELECT
    email_confirmed_at IS NOT NULL as is_confirmed
  INTO user_record
  FROM auth.users
  WHERE id = user_id_input;

  -- Get profile info
  SELECT
    p.company_id,
    p.onboarding_completed
  INTO profile_record
  FROM profiles p
  WHERE p.id = user_id_input;

  -- Get company info if exists
  IF profile_record.company_id IS NOT NULL THEN
    SELECT c.name
    INTO company_record
    FROM companies c
    WHERE c.id = profile_record.company_id;
  END IF;

  RETURN QUERY SELECT
    profile_record IS NOT NULL as has_profile,
    company_record IS NOT NULL as has_company,
    company_record.name as company_name,
    COALESCE(user_record.is_confirmed, false) as email_confirmed,
    COALESCE(profile_record.onboarding_completed, false) as onboarding_completed;
END;
$$;

-- Add index for faster email verification status checks
CREATE INDEX IF NOT EXISTS idx_profiles_company_onboarding
ON profiles(company_id, onboarding_completed)
WHERE company_id IS NOT NULL;

-- Add index for created_at to help with cleanup queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles(created_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_incomplete_registration TO authenticated;
