/*
  # Fix handle_new_user function to handle NOT NULL full_name constraint

  ## Problem

  The profiles.full_name column has a NOT NULL constraint, but the handle_new_user
  function was trying to insert NULL when no full_name is provided in user metadata.
  This causes the trigger to fail with "Database error saving new user".

  ## Solution

  Update the handle_new_user function to provide a default value when full_name is
  not provided, ensuring it never tries to insert NULL into a NOT NULL column.

  ## Changes Made

  1. Update handle_new_user function to use COALESCE for full_name with fallback value
  2. Ensure the function provides a non-null value even if metadata is missing
  3. Keep all existing security and logic intact

  ## Security

  - Maintains SECURITY DEFINER for RLS bypass
  - Preserves all existing invitation checking logic
  - No changes to RLS policies
*/

-- Recreate the handle_new_user function with proper NULL handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  -- Extract company_id from metadata if provided
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;

  -- Extract and validate role from metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND
     NEW.raw_user_meta_data->>'role' != '' THEN
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;

  -- Extract full_name from metadata with proper fallback
  -- COALESCE ensures we never get NULL, even if metadata is missing
  user_full_name := COALESCE(
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    'User'
  );

  -- If no company_id in metadata, check for invitation
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;

      -- Mark invitation as accepted
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;

  -- Insert profile (onboarding_completed will be false if no company_id)
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    user_company_id,
    user_company_id IS NOT NULL
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Recreate the trigger (just to ensure it's properly attached)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger function that creates a profile entry when a new user signs up. Handles NULL values properly for NOT NULL columns.';
