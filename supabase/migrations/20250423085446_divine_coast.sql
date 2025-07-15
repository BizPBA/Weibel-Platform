/*
  # Add location employees support

  1. Changes
    - Add location_id to customer_employees table
    - Update RLS policies
*/

-- Add location_id to customer_employees
ALTER TABLE customer_employees
ADD COLUMN location_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Update RLS policies for customer_employees
DROP POLICY IF EXISTS "Allow authenticated users to manage customer_employees" ON customer_employees;
DROP POLICY IF EXISTS "Allow authenticated users to read customer_employees" ON customer_employees;

CREATE POLICY "Enable read for authenticated users"
ON customer_employees
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users"
ON customer_employees
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
ON customer_employees
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);