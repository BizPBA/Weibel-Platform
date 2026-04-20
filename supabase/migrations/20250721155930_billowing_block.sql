/*
  # Fix get_user_by_email function to return auth.users data

  This migration updates the get_user_by_email function to return data from
  auth.users instead of profiles, which is needed for passkey authentication
  to work with foreign key constraints.

  ## Changes
  - Update get_user_by_email function to query auth.users directly
  - Ensure it returns the correct user ID that matches auth.users(id)
  - Maintain the same function signature for compatibility

  ## Security
  - Uses SECURITY DEFINER to access auth.users table
  - Restricts search_path for security
*/

-- Update the get_user_by_email function to return auth.users data
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Return data directly from auth.users table
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.email = user_email
    AND u.email_confirmed_at IS NOT NULL  -- Only return confirmed users
    AND u.deleted_at IS NULL;             -- Only return non-deleted users
END;
$$ LANGUAGE plpgsql;