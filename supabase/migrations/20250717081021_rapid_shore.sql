/*
  # Fix infinite recursion in profiles RLS policies

  The current profiles policies are causing infinite recursion because they're
  trying to check the profiles table from within a profiles table query.

  ## Problem
  - Current policy tries to check user role by querying profiles table
  - This creates infinite recursion when accessing profiles

  ## Solution
  - Simplify policies to use auth.uid() directly
  - Remove recursive policy checks
  - Allow users to read/update their own profile
  - Remove admin-specific policies that cause recursion

  ## Changes
  1. Drop existing problematic policies
  2. Create simple, non-recursive policies
  3. Use auth.uid() for user identification
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Enable read access for users based on user_id"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for users based on user_id"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;