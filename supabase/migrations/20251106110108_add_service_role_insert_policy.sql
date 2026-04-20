/*
  # Add service role INSERT policy for profiles

  ## Problem
  The handle_new_user trigger function runs with SECURITY DEFINER but may still
  be blocked by RLS policies. We need to ensure the service role (used by the
  trigger) can insert profiles during user signup.

  ## Solution
  Add a policy that allows the service_role to insert profiles. The service_role
  is used internally by triggers and should be able to bypass user-level RLS.

  ## Changes
  - Add INSERT policy for service_role
  - This allows the trigger function to create profiles during signup
*/

-- Add policy to allow service role to insert profiles (for triggers)
-- This is needed because the trigger runs in a system context
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);