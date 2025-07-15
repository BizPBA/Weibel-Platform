/*
  # Fix customers table RLS policies

  1. Changes
    - Remove duplicate RLS policies for customers table
    - Create clear, non-conflicting policies for CRUD operations

  2. Security
    - Enable RLS (already enabled)
    - Add unified policies for authenticated users to manage customers
*/

-- First, drop the duplicate policies
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;
DROP POLICY IF EXISTS "Users can read all customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;

-- Create new, clean policies
CREATE POLICY "Enable read access for authenticated users" ON customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON customers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON customers
  FOR DELETE TO authenticated
  USING (true);