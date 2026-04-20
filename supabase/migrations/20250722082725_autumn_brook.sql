/*
  # Fix passkey challenges RLS policies

  This migration adds the necessary RLS policies to allow the Edge Function
  (using service role key) to insert, read, and delete passkey challenges.

  ## Changes
  1. Add policy to allow service role to manage passkey_challenges
  2. Ensure Edge Functions can store and verify challenges
*/

-- Allow service role (Edge Functions) to manage passkey_challenges
CREATE POLICY "Allow service role to manage passkey_challenges"
  ON passkey_challenges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow authenticated users to manage their own challenges
-- (This is already covered by existing policy, but ensuring it's explicit)
CREATE POLICY "Allow authenticated users to manage own passkey_challenges"
  ON passkey_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);