/*
  # Fix customers table RLS policies

  1. Changes
    - Remove existing RLS policies for customers table
    - Create comprehensive policies for CRUD operations
    - Ensure proper authentication checks

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage customers
    - Verify auth.uid() is not null for all operations
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.customers;

-- Create new comprehensive policies
CREATE POLICY "Enable insert for authenticated users"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable select for authenticated users"
ON public.customers
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users"
ON public.customers
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
ON public.customers
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);