/*
  # Fix handle_new_user trigger to properly bypass RLS

  ## Problem

  The handle_new_user trigger function has SECURITY DEFINER but RLS policies on the
  profiles table are still blocking the INSERT during user signup. The INSERT policy
  checks `auth.uid() = id`, but during the trigger execution, auth.uid() doesn't
  return the correct value for the newly created user.

  ## Solution

  Grant the function owner (postgres) the ability to bypass RLS, and ensure the
  function properly sets the security context.

  ## Changes Made

  1. Add explicit GRANT to allow function to bypass RLS
  2. Update function to use proper security context
  3. Ensure INSERT can succeed during trigger execution

  ## Security

  - Maintains RLS for all normal operations
  - Only bypasses RLS within the trigger context
  - Function is SECURITY DEFINER so it runs with elevated privileges
*/

-- Ensure the handle_new_user function can bypass RLS
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- Grant necessary permissions to the function
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- Recreate the function with explicit security context
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

  -- Disable RLS for this operation by using SECURITY DEFINER context
  -- Insert profile with explicit column values
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
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger function with SECURITY DEFINER that bypasses RLS to create profile entries for new users during signup.';
