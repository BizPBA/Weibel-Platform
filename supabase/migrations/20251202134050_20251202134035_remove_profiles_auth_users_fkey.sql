/*
  # Remove Foreign Key Constraint from Profiles to Auth.Users

  ## Purpose
  Removes the foreign key constraint between profiles.id and auth.users.id to allow
  manual employee creation without requiring an auth.users entry. This is necessary
  for scenarios where:
  - Employees are created manually by admins
  - Authentication setup is pending (e.g., Microsoft login not yet configured)
  - Bulk employee onboarding is required

  ## Changes Made

  1. Drop Foreign Key Constraint
     - Removes `profiles_id_fkey` constraint
     - Profiles can now exist without corresponding auth.users entry
     - Maintains data integrity through application logic and database function

  ## Impact

  - Manual employees can be created immediately
  - Profiles can exist before authentication is configured
  - When Microsoft login is set up, profiles can be linked to auth.users
  - Existing profiles with auth.users entries remain unchanged

  ## Security

  - RLS policies still protect profile data
  - Only admins can create manual employees
  - Application logic validates all operations
  - Audit log tracks all manual employee creation

  ## Migration Safety

  - Non-destructive: Only removes constraint, no data changes
  - Existing data remains intact
  - Can be reversed if needed
*/

-- Drop the foreign key constraint from profiles.id to auth.users.id
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add a comment to document this design decision
COMMENT ON TABLE profiles IS 
  'User profiles table. The id can be independent of auth.users to support manual employee creation. When authentication is configured, profiles should be linked to auth.users entries.';

-- Verify the constraint is removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey' 
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    RAISE EXCEPTION 'Failed to remove profiles_id_fkey constraint';
  END IF;
  
  RAISE NOTICE 'Foreign key constraint successfully removed. Manual employee creation is now enabled.';
END $$;
