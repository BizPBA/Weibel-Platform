/*
  # Fix Company Insert RLS Policy

  This migration fixes the RLS policy for inserting companies to allow authenticated users
  to create companies during the registration process.

  ## Changes

  1. Drop and recreate the company insert policy with proper checks
  2. Ensure authenticated users can create companies

  ## Security

  - Only authenticated users can create companies
  - Policy validates that the user is authenticated via auth.uid()
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;

-- Create a new insert policy that properly checks authentication
CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
