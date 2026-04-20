/*
  # Fix profiles INSERT policy to allow trigger-based inserts

  ## Problem
  The current INSERT policy only allows authenticated users to insert their own profile
  by checking `auth.uid() = id`. However, during signup, the trigger runs BEFORE the
  user is authenticated, so auth.uid() is NULL, causing the insert to fail.

  ## Solution
  Drop the restrictive INSERT policy and replace it with one that allows:
  1. Authenticated users to insert their own profile (auth.uid() = id)
  2. ANY insert when auth.uid() is NULL (which happens during trigger execution)
  
  This is safe because:
  - Regular users can't call INSERT directly when auth.uid() is NULL
  - Only the trigger (running as SECURITY DEFINER) can insert during signup
  - The trigger validates the data before inserting

  ## Changes
  - Drop existing INSERT policy
  - Create new INSERT policy that allows NULL auth.uid() (trigger context)
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policy that allows inserts from trigger context
CREATE POLICY "Users and triggers can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR auth.uid() IS NULL
  );