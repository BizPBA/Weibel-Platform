/*
  # Fix profiles RLS policy for authentication

  ## Problem
  Current profiles SELECT policy only allows reading profiles from the same company.
  This prevents users from reading their own profile during login if they don't have
  a company_id yet (new users going through onboarding).

  ## Solution
  Add a policy that allows users to always read their own profile, regardless of company.
  Keep the existing policy for reading other profiles in the same company.

  ## Changes
  - Add "Users can read own profile" policy
  - This ensures authentication works for all users
*/

-- Add policy for users to read their own profile
-- This is critical for the authentication flow to work
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);