/*
  # Fix handle_new_user to bypass RLS for profile creation

  ## Problem
  The INSERT policy on profiles checks `auth.uid() = id`, but during signup
  the user is not yet authenticated, so auth.uid() returns NULL. This causes
  the trigger function to fail even though it has SECURITY DEFINER.

  ## Solution
  The function already has SECURITY DEFINER which should bypass RLS, but we need
  to ensure it's working properly. We'll also set the search_path for security.

  ## Changes
  - Ensure SECURITY DEFINER is working correctly
  - Set search_path for security best practices
  - The SECURITY DEFINER should allow the function to bypass RLS policies
*/

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
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
  
  -- Extract full_name from metadata (can be NULL)
  user_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();