/*
  # Add users table and fix relationships

  1. New Tables
    - `users` table for storing user information
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users to read user data
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow authenticated users to read users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the foreign key relationship is properly set up
DO $$ 
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'customer_employees_employee_id_fkey'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE customer_employees
    ADD CONSTRAINT customer_employees_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;