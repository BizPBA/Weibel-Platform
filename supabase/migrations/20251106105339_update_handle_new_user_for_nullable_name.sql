/*
  # Update handle_new_user to handle nullable full_name

  ## Changes
  - Allow full_name to be NULL if not provided
  - Simplify the function logic
  - Remove the default 'User' value since it can be NULL

  ## Notes
  This allows users to sign up without providing a name,
  which they can add later in their profile settings.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;