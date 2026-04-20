/*
  # Fix profiles RLS policy for activity display

  The current profiles policies are too restrictive and prevent other tables
  from joining with profiles to display user information (like full_name).
  
  This migration adds a policy that allows all authenticated users to read
  profiles for display purposes while maintaining security.

  ## Changes
  1. Add policy to allow authenticated users to read all profiles
  2. This enables joins from location_comments, location_activity, etc.
*/

-- Allow authenticated users to read all profiles for display purposes
CREATE POLICY "Allow authenticated users to read all profiles for display"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);