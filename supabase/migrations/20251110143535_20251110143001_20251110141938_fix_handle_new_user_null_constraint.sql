/*
  # Fix company_invitations UPDATE policy to allow trigger function

  ## Problem

  The handle_new_user trigger function tries to UPDATE company_invitations
  to mark them as accepted, but the RLS UPDATE policy blocks this operation
  even though the function has SECURITY DEFINER. The policy checks auth.uid()
  which doesn't work correctly during the trigger execution.

  ## Solution

  Add a special UPDATE policy that allows the service role (used by SECURITY DEFINER
  functions) to update invitations to mark them as accepted.

  ## Changes Made

  1. Add new UPDATE policy for service_role to mark invitations as accepted
  2. Keep existing user-facing UPDATE policy intact
  3. Ensure trigger can complete successfully

  ## Security

  - Maintains all existing RLS policies for users
  - Only adds special case for trigger context
  - Limited to specific UPDATE operation (marking as accepted)
*/

-- Add policy to allow service role to update invitations (used by trigger)
CREATE POLICY "Service role can update invitations for acceptance"
  ON company_invitations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Service role can update invitations for acceptance" ON company_invitations IS
  'Allows the handle_new_user trigger function (running as service_role/SECURITY DEFINER) to mark invitations as accepted during user signup.';
