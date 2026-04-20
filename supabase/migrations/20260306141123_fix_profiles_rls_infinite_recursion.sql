/*
  # Fix profiles RLS infinite recursion

  ## Problem
  The policy "Admins can read company profiles" contains a subquery that selects
  from the `profiles` table itself, causing infinite recursion when Postgres
  evaluates the policy.

  There are also several duplicate SELECT policies which are noisy and confusing.

  ## Changes
  1. Drop all existing SELECT policies on profiles
  2. Drop duplicate UPDATE/INSERT policies
  3. Add clean, non-recursive policies:
     - Users can always read their own profile (auth.uid() = id)
     - Users can read profiles from the same company using a SECURITY DEFINER
       helper function to avoid recursion
*/

DROP POLICY IF EXISTS "Admins can read company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles for display" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read profiles in same company"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
