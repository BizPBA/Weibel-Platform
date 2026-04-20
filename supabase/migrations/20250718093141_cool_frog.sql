/*
  # Add user lookup helper function by ID

  This migration creates a helper function to get a user by ID,
  which is needed for the passkey authentication Edge Function.

  ## New Function
  - `get_user_by_email_and_id(user_id UUID)` - Returns user id and email by ID lookup

  ## Security
  - Uses SECURITY DEFINER to access auth.users table
  - Restricts search_path for security
*/

-- Create a helper function to get a user by ID
-- This is needed because direct access to auth.users might be restricted
CREATE OR REPLACE FUNCTION public.get_user_by_email_and_id(user_id UUID)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;