/*
  # Add user lookup helper function

  This migration creates a helper function to get a user by email,
  which is needed for the passkey authentication Edge Function.

  ## New Function
  - `get_user_by_email(user_email TEXT)` - Returns user id and email by email lookup

  ## Security
  - Uses SECURITY DEFINER to access auth.users table
  - Restricts search_path for security
*/

-- Create a helper function to get a user by email
-- This is needed because direct access to auth.users might be restricted
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;