/*
  # Remove INSERT policy to allow trigger function to work

  ## Problem
  The SECURITY DEFINER trigger function should bypass RLS, but it's still being
  blocked by the INSERT policy that checks auth.uid() = id.

  ## Solution
  According to Supabase best practices, when a trigger handles profile creation,
  you should NOT have an INSERT policy on the table. The trigger with SECURITY
  DEFINER will bypass RLS entirely.
  
  Users cannot directly INSERT into profiles via the API anyway - they use
  auth.signUp() which triggers the function.

  ## Security
  This is safe because:
  - Users cannot directly call INSERT on profiles (they use auth.signUp)
  - The trigger function validates and controls all profile creation
  - The trigger is owned by postgres with SECURITY DEFINER and BYPASSRLS
  - There are no other ways to insert into profiles except via the trigger

  ## Changes
  - Drop all INSERT policies on profiles
  - Let the SECURITY DEFINER trigger handle all profile creation
*/

-- Remove all INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;

-- No INSERT policy needed - the trigger handles all profile creation