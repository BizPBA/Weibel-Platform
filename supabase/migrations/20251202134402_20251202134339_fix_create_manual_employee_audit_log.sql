/*
  # Fix create_manual_employee Function - Audit Log Column

  ## Purpose
  Updates the create_manual_employee function to use the correct column structure
  for the company_audit_log table. The table uses 'entity_type', 'entity_id', 
  'old_values', and 'new_values' columns instead of 'details'.

  ## Changes Made

  1. Update create_manual_employee function
     - Fix audit log insert to use correct columns
     - Use entity_type = 'profile'
     - Use entity_id for the employee profile id
     - Store creation info in new_values column

  ## Impact

  - Manual employee creation will now work correctly
  - Audit log will properly track employee creation
  - Error "column details does not exist" is resolved
*/

-- Drop and recreate the function with correct audit log structure
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
    true,
    true
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

  -- Log the action in company_audit_log with correct columns
  INSERT INTO company_audit_log (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    v_company_id,
    auth.uid(),
    'create_manual_employee',
    'profile',
    v_new_profile_id,
    json_build_object(
      'employee_email', p_email,
      'employee_name', p_full_name,
      'role', p_role,
      'phone', p_phone,
      'location_count', COALESCE(array_length(p_location_ids, 1), 0),
      'is_manual_creation', true
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

-- Ensure execute permission
GRANT EXECUTE ON FUNCTION create_manual_employee TO authenticated;

-- Update comment
COMMENT ON FUNCTION create_manual_employee IS
  'Creates a new employee profile manually without requiring auth.signUp. Used by admins for bulk onboarding or when authentication setup is pending. Logs to audit table using correct column structure.';
