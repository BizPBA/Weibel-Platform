/*
  # Fix create_manual_employee audit log insert

  1. Problem
    - The create_manual_employee function inserts into company_audit_log using a
      non-existent "details" column, causing the error:
      column "details" of relation "company_audit_log" does not exist
    - Actual company_audit_log schema uses entity_type, entity_id, old_values,
      new_values.

  2. Changes
    - Recreate create_manual_employee with the audit log INSERT aligned to the
      real table schema.
    - Populate entity_type = 'profile', entity_id = new profile id, and store the
      previous payload in new_values.

  3. Security
    - SECURITY DEFINER retained
    - Caller role and company ownership checks unchanged
    - EXECUTE permission re-granted to authenticated
*/

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
  SELECT company_id, role INTO v_company_id, v_caller_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_role NOT IN ('admin', 'customer_responsible') THEN
    RAISE EXCEPTION 'Kun administratorer og kunde ansvarlige kan oprette medarbejdere manuelt';
  END IF;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Bruger har ingen tilknyttet virksomhed';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email er allerede i brug';
  END IF;

  v_new_profile_id := gen_random_uuid();

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

  IF jsonb_array_length(p_location_assignments) > 0 THEN
    FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_location_assignments)
    LOOP
      v_location_id := (v_assignment->>'location_id')::uuid;
      v_start_date := NULLIF(v_assignment->>'start_date', '')::date;
      v_end_date := NULLIF(v_assignment->>'end_date', '')::date;
      v_is_permanent := COALESCE((v_assignment->>'is_permanent')::boolean, true);

      IF v_is_permanent THEN
        v_end_date := NULL;
      END IF;

      IF v_start_date IS NOT NULL AND v_end_date IS NOT NULL AND v_end_date < v_start_date THEN
        RAISE EXCEPTION 'Slutdato skal være efter startdato for lokation %', v_location_id;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = v_location_id AND company_id = v_company_id
      ) THEN
        RAISE EXCEPTION 'Lokation eksisterer ikke eller tilhører ikke virksomheden';
      END IF;

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
    jsonb_build_object(
      'employee_id', v_new_profile_id,
      'employee_email', LOWER(p_email),
      'employee_name', p_full_name,
      'role', p_role,
      'location_count', v_assignment_count
    )
  );

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

GRANT EXECUTE ON FUNCTION create_manual_employee TO authenticated;

COMMENT ON FUNCTION create_manual_employee IS
  'Creates a new employee profile manually with per-location timeframe support. Audit log insert aligned to company_audit_log schema (entity_type/entity_id/new_values).';
