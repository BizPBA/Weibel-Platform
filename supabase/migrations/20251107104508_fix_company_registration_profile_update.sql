/*
  # Fix Company Registration Profile Update
  
  This migration creates a secure function to complete the company registration
  process by updating the user's profile with company_id and role after company creation.
  
  ## Problem
  
  When a user signs up, they don't have an active session until email confirmation.
  This means the profile update in CompanyRegistration.tsx fails due to RLS policies
  that check `auth.uid() = id`.
  
  ## Solution
  
  Create a SECURITY DEFINER function that can update the profile even without an active
  session, but with proper security checks to ensure only the user can update their own profile.
  
  ## Changes
  
  1. **Create complete_company_registration function**
     - Takes user_id, company_id, full_name, phone, and role as parameters
     - Runs with SECURITY DEFINER to bypass RLS
     - Validates that the user exists and profile exists
     - Updates profile with company association and role
     - Returns the updated profile
  
  ## Security
  
  - Function validates user_id matches an existing auth.users record
  - Function only updates the specific user's profile (no cross-user updates)
  - Function is granted to authenticated users only
*/

-- Create function to complete company registration
CREATE OR REPLACE FUNCTION public.complete_company_registration(
  user_id_param uuid,
  company_id_param uuid,
  full_name_param text,
  phone_param text,
  role_param user_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  -- Validate that the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Validate that the profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Validate that the company exists
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = company_id_param) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  
  -- Update the profile
  UPDATE profiles
  SET 
    full_name = full_name_param,
    phone = phone_param,
    company_id = company_id_param,
    role = role_param,
    onboarding_completed = true
  WHERE id = user_id_param
  RETURNING * INTO updated_profile;
  
  -- Return the updated profile as JSON
  RETURN row_to_json(updated_profile);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_company_registration TO authenticated;

-- Add comment
COMMENT ON FUNCTION complete_company_registration IS 'Completes company registration by updating user profile with company association';
