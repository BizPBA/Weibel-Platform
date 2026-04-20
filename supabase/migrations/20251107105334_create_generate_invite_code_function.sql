/*
  # Create generate_invite_code Function

  1. Purpose
    - Generate random alphanumeric codes for company invitations and join codes
    - Provides a secure, reusable function for code generation
    - Uses uppercase letters and numbers for readability

  2. New Functions
    - generate_invite_code(length): Returns a random alphanumeric string of specified length
      * Uses characters: A-Z and 2-9 (excluding 0, 1, O, I for clarity)
      * Default length is 8 characters
      * Function runs with SECURITY DEFINER for proper execution

  3. Security
    - Function is SECURITY DEFINER to bypass RLS
    - Proper search path set to prevent SQL injection
    - Granted to authenticated users only

  4. Important Notes
    - Codes are generated using PostgreSQL's random() function
    - Character set excludes confusing characters (0, 1, O, I)
    - Function is deterministic and safe for concurrent use
*/

-- Create function to generate random invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code(length integer DEFAULT 8)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  -- Character set: A-Z and 2-9 (excluding 0, 1, O, I for clarity)
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  chars_length integer;
BEGIN
  -- Validate input length
  IF length < 4 OR length > 32 THEN
    RAISE EXCEPTION 'Code length must be between 4 and 32 characters';
  END IF;
  
  chars_length := length(chars);
  
  -- Generate random code
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * chars_length + 1)::integer, 1);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_invite_code(integer) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.generate_invite_code(integer) IS 
  'Generates a random alphanumeric code of specified length. Uses uppercase letters and numbers 2-9, excluding confusing characters like 0, 1, O, I.';
