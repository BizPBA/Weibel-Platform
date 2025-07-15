/*
  # Initial schema setup for Weibel Platform

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `contact_person` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `customer_employees`
      - `customer_id` (uuid, foreign key)
      - `employee_id` (uuid, foreign key)
    
    - `projects`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `location` (text)
      - `status` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text NOT NULL,
  email text,
  phone text,
  address text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_employees table
CREATE TABLE customer_employees (
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (customer_id, employee_id)
);

-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location text,
  status text DEFAULT 'planned',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read customer_employees"
  ON customer_employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customer_employees"
  ON customer_employees
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true);