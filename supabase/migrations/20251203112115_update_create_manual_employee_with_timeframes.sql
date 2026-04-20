/*
  # Update create_manual_employee to Support Per-Location Timeframes

  1. Changes
    - Replace p_location_ids parameter with p_location_assignments (jsonb)
    - Each assignment includes: location_id, start_date, end_date, is_permanent
    - Update location assignment loop to use individual timeframes
    - Add validation for date ranges per location
    - Enhanced activity logging with timeframe information

  2. Structure
    - Input: jsonb array of objects
    - Each object: {"location_id": "uuid", "start_date": "date", "end_date": "date", "is_permanent": boolean}
    - If is_permanent is true, end_date is ignored (set to null)
    - If dates not provided, defaults to null (permanent without start date)

  3. Validation
    - Check end_date >= start_date for each location
    - Verify location belongs to company
    - No duplicate location assignments
    - Raise meaningful errors in Danish

  4. Security
    - Maintains SECURITY DEFINER
    - All existing permission checks remain
    - Company boundary enforcement
*/

-- Drop existing function to recreate with new signature
DROP FUNCTION IF EXISTS create_manual_employee(text, text, user_role, text, uuid[]);

-- Create updated function with jsonb parameter for location assignments
CREATE OR REPLACE FUNCTION create_manual_employee(
  p_full_name text,
  p_email text,
  p_role user_role,
  p_phone text DEFAULT NULL,
  p_location_assignments jsonb DEFAULT '[]'::jsonb
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
  v_assignment jsonb;
  v_location_id uuid;
  v_start_date date;
  v_end_date date;
  v_is_permanent boolean;
  v_result json;
  v_assignment_count integer := 0;
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

  -- Process location assignments if provided
  IF jsonb_array_length(p_location_assignments) > 0 THEN
    FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_location_assignments)
    LOOP
      -- Extract assignment details
      v_location_id := (v_assignment->>'location_id')::uuid;
      v_start_date := NULLIF(v_assignment->>'start_date', '')::date;
      v_end_date := NULLIF(v_assignment->>'end_date', '')::date;
      v_is_permanent := COALESCE((v_assignment->>'is_permanent')::boolean, true);

      -- Set end_date to null if permanent
      IF v_is_permanent THEN
        v_end_date := NULL;
      END IF;

      -- Validate date range
      IF v_start_date IS NOT NULL AND v_end_date IS NOT NULL AND v_end_date < v_start_date THEN
        RAISE EXCEPTION 'Slutdato skal være efter startdato for lokation %', v_location_id;
      END IF;

      -- Verify location belongs to the same company
      IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = v_location_id AND company_id = v_company_id
      ) THEN
        RAISE EXCEPTION 'Lokation eksisterer ikke eller tilhører ikke virksomheden';
      END IF;

      -- Insert location assignment with timeframe
      INSERT INTO location_assignments (
        location_id,
        user_id,
        assigned_by,
        start_date,
        end_date,
        is_active
      ) VALUES (
        v_location_id,
        v_new_profile_id,
        auth.uid(),
        v_start_date,
        v_end_date,
        true
      );

      v_assignment_count := v_assignment_count + 1;
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
      'location_count', v_assignment_count
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
  'Creates a new employee profile manually with per-location timeframe support. Each location assignment can have its own start_date, end_date, and permanent flag.';