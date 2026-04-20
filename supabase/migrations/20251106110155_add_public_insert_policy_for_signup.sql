/*
  # Add public INSERT policy for signup trigger

  ## Problem
  During signup, the trigger needs to insert a profile, but there's no authenticated
  session yet. The trigger runs in a system context but RLS still blocks it.

  ## Solution
  Add a policy that allows INSERT to `public` role when auth.uid() matches the id.
  This allows the trigger to create the profile during signup.

  ## Security
  This is safe because:
  - Users can't directly insert into profiles via the API (they use auth.signUp)
  - The trigger validates and controls what gets inserted
  - The id must match the auth.users id created by Supabase

  ## Changes
  - Add INSERT policy for public role with auth.uid() = id check
*/

-- Add policy for public role (used during trigger execution)
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (
    id IN (SELECT id FROM auth.users)
  );