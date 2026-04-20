/*
  # Fix insecure INSERT policy on profiles

  ## CRITICAL SECURITY ISSUE
  The current INSERT policy allows public role with WITH CHECK (true), which means
  ANYONE can insert ANY profile without restrictions. This is a major security vulnerability.

  ## Solution
  Remove the insecure policy and create a proper policy that:
  1. Allows authenticated users to insert ONLY their own profile (auth.uid() = id)
  2. Has NO policy for public/anon roles (they can't insert at all via API)
  3. The trigger function with SECURITY DEFINER should be able to bypass this

  The key insight: SECURITY DEFINER functions in Supabase with postgres owner
  should bypass RLS entirely. If they don't, we need to investigate why.

  ## Changes
  - Drop the insecure public INSERT policy
  - Create a secure authenticated-only INSERT policy
*/

-- Remove the insecure policy immediately
DROP POLICY IF EXISTS "Allow system to create profiles during signup" ON profiles;

-- Create a secure INSERT policy for authenticated users only
CREATE POLICY "Users can insert own profile during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);