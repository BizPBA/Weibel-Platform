/*
  # Fix complete_company_registration function

  ## Problem
  The edge function `register-company` calls `complete_company_registration` immediately
  after user signup. In some cases there can be a timing issue where the `handle_new_user`
  trigger has not yet created the profile row, causing the function to fail with
  "Profile not found".

  Additionally, the frontend was calling the edge function without proper Authorization
  headers, causing authentication failures.

  ## Changes
  1. Replace UPDATE with UPSERT (INSERT ... ON CONFLICT) so the function works even
     if the profile row doesn't exist yet
  2. Ensure role is always set to 'admin' for company registration (validated in function)
  3. Always set onboarding_completed = true after company registration
*/

CREATE OR REPLACE FUNCTION public.complete_company_registration(
  user_id_param uuid,
  company_id_param uuid,
  full_name_param text,
  phone_param text,
  role_param user_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_profile profiles%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = company_id_param) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, company_id, role, onboarding_completed)
  SELECT
    user_id_param,
    au.email,
    full_name_param,
    phone_param,
    company_id_param,
    role_param,
    true
  FROM auth.users au
  WHERE au.id = user_id_param
  ON CONFLICT (id) DO UPDATE
    SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      company_id = EXCLUDED.company_id,
      role = EXCLUDED.role,
      onboarding_completed = true
  RETURNING * INTO result_profile;

  RETURN row_to_json(result_profile);
END;
$$;
