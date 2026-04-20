/*
  # Create Functions for Assignment Expiration

  1. Functions
    - `expire_location_assignments()` - Expires all assignments past their end_date
    - `check_location_expiry(p_location_id)` - Checks and expires assignments for specific location

  2. Purpose
    - Automatically mark assignments as inactive when end_date passes
    - Log activity when assignments expire
    - Provide immediate feedback when viewing a location

  3. Security
    - Functions run with SECURITY DEFINER to bypass RLS for system operations
    - Only updates assignments, doesn't delete user data
*/

-- Function to expire all location assignments that have passed their end_date
CREATE OR REPLACE FUNCTION expire_location_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
  assignment_record RECORD;
BEGIN
  -- Find and expire assignments where end_date has passed
  FOR assignment_record IN
    SELECT 
      la.id,
      la.location_id,
      la.user_id,
      p.full_name
    FROM location_assignments la
    JOIN profiles p ON p.id = la.user_id
    WHERE la.end_date < CURRENT_DATE
      AND la.is_active = true
  LOOP
    -- Update assignment to inactive
    UPDATE location_assignments
    SET is_active = false,
        expired_at = now()
    WHERE id = assignment_record.id;

    -- Log activity
    INSERT INTO location_activity (location_id, actor_id, action_text)
    VALUES (
      assignment_record.location_id,
      assignment_record.user_id,
      'Tilknytning for ' || assignment_record.full_name || ' udløbet automatisk'
    );

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$$;

-- Function to check and expire assignments for a specific location
CREATE OR REPLACE FUNCTION check_location_expiry(p_location_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
  assignment_record RECORD;
BEGIN
  -- Find and expire assignments for this location where end_date has passed
  FOR assignment_record IN
    SELECT 
      la.id,
      la.location_id,
      la.user_id,
      p.full_name
    FROM location_assignments la
    JOIN profiles p ON p.id = la.user_id
    WHERE la.location_id = p_location_id
      AND la.end_date < CURRENT_DATE
      AND la.is_active = true
  LOOP
    -- Update assignment to inactive
    UPDATE location_assignments
    SET is_active = false,
        expired_at = now()
    WHERE id = assignment_record.id;

    -- Log activity
    INSERT INTO location_activity (location_id, actor_id, action_text)
    VALUES (
      assignment_record.location_id,
      assignment_record.user_id,
      'Tilknytning for ' || assignment_record.full_name || ' udløbet automatisk'
    );

    expired_count := expired_count + 1;
  END LOOP;

  RETURN expired_count;
END;
$$;