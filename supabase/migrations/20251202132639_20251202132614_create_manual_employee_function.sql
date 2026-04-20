/*
  # Create Manual Employee Function

  ## Purpose
  Creates a database function to handle manual employee creation by administrators.
  This allows creating employees directly without going through the auth.signUp flow,
  which is useful for bulk onboarding or when authentication setup is pending.

  ## Changes Made

  1. New Function: create_manual_employee
     - Takes employee details (full_name, email, role, phone, location_ids)
     - Creates profile entry directly (without auth.users record)
     - Assigns locations in a single transaction
     - Returns the created profile
     - Validates admin permissions
     - Checks for duplicate emails

  2. Adds temp_password field to profiles
     - Stores a temporary flag indicating manual creation
     - Will be used later when Microsoft auth is configured

  ## Security

  - Function has SECURITY DEFINER to bypass RLS during creation
  - Validates caller is admin or customer_responsible
  - Ensures email uniqueness
  - All operations in single transaction (rollback on error)
  - Respects company boundaries

  ## Notes

  - Created profiles will NOT have auth.users entries initially
  - When Microsoft login is configured, these profiles will be linked
  - Location assignments are optional (can be empty array)
*/

-- Add column to track manually created employees (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_manual_creation'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_manual_creation boolean DEFAULT false;
  END IF;
END $$;

-- Create function for manual employee creation
CREATE OR REPLACE FUNCTION create_manual_employee(
  p_full_name text,
  p_email text,
  p_role user_role,
  p_phone text DEFAULT NULL,
  p_location_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_caller_role user_role;
  v_new_profile_id uuid;
  v_location_id uuid;
  v_result json;
BEGIN
  -- Get caller's company and role
  SELECT company_id, role INTO v_company_id, v_caller_role
  FROM profiles
  WHERE id = auth.uid();

  -- Verify caller has permission (admin or customer_responsible)
  IF v_caller_role NOT IN ('admin', 'customer_responsible') THEN
    RAISE EXCEPTION 'Kun administratorer og kunde ansvarlige kan oprette medarbejdere manuelt';
  END IF;

  -- Verify company_id exists
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Bruger har ingen tilknyttet virksomhed';
  END IF;

  -- Check if email already exists in profiles
  IF EXISTS (SELECT 1 FROM profiles WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email er allerede i brug';
  END IF;

  -- Generate a new UUID for the profile
  v_new_profile_id := gen_random_uuid();

  -- Insert new profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    phone,
    role,
    company_id,
    onboarding_completed,
    is_manual_creation
  ) VALUES (
    v_new_profile_id,
    LOWER(p_email),
    p_full_name,
    p_phone,
    p_role,
    v_company_id,
    true,  -- Already onboarded since manually created
    true   -- Mark as manual creation
  );

  -- Assign locations if provided
  IF array_length(p_location_ids, 1) > 0 THEN
    FOREACH v_location_id IN ARRAY p_location_ids
    LOOP
      -- Verify location belongs to the same company
      IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = v_location_id AND company_id = v_company_id
      ) THEN
        RAISE EXCEPTION 'Lokation eksisterer ikke eller tilhører ikke virksomheden';
      END IF;

      -- Insert location assignment
      INSERT INTO location_assignments (
        location_id,
        user_id,
        assigned_by
      ) VALUES (
        v_location_id,
        v_new_profile_id,
        auth.uid()
      );
    END LOOP;
  END IF;

  -- Log the action in company_audit_log
  INSERT INTO company_audit_log (
    company_id,
    user_id,
    action,
    details
  ) VALUES (
    v_company_id,
    auth.uid(),
    'create_manual_employee',
    json_build_object(
      'employee_id', v_new_profile_id,
      'employee_email', p_email,
      'employee_name', p_full_name,
      'role', p_role,
      'location_count', COALESCE(array_length(p_location_ids, 1), 0)
    )
  );

  -- Return the created profile with location assignments
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'phone', p.phone,
    'role', p.role,
    'company_id', p.company_id,
    'created_at', p.created_at,
    'location_count', (
      SELECT COUNT(*)
      FROM location_assignments
      WHERE user_id = p.id
    )
  )
  INTO v_result
  FROM profiles p
  WHERE p.id = v_new_profile_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_manual_employee TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_manual_employee IS
  'Creates a new employee profile manually without requiring auth.signUp. Used by admins for bulk onboarding or when authentication setup is pending.';
