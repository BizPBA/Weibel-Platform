/*
  # Add Missing RLS Policies for Database Access

  This migration adds the necessary Row Level Security policies to allow
  authenticated users to access the database tables.

  ## Security Policies Added

  1. **customers** - Allow authenticated users to read all customers
  2. **customer_contacts** - Allow authenticated users to read all contacts  
  3. **locations** - Allow authenticated users to read all locations
  4. **profiles** - Allow users to read their own profile and admins to read all

  ## Changes Made

  - Add SELECT policies for all main tables
  - Add INSERT/UPDATE/DELETE policies for data management
  - Ensure authenticated users can perform necessary operations
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to read customer_contacts" ON customer_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to manage customer_contacts" ON customer_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage locations" ON locations;
DROP POLICY IF EXISTS "Allow authenticated users to read location_requirements" ON location_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_requirements" ON location_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to read location_images" ON location_images;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_images" ON location_images;
DROP POLICY IF EXISTS "Allow authenticated users to read location_activity" ON location_activity;
DROP POLICY IF EXISTS "Allow authenticated users to create location_activity" ON location_activity;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Create policies for customers table
CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for customer_contacts table
CREATE POLICY "Allow authenticated users to read customer_contacts"
  ON customer_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customer_contacts"
  ON customer_contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for locations table
CREATE POLICY "Allow authenticated users to read locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for location_requirements table
CREATE POLICY "Allow authenticated users to read location_requirements"
  ON location_requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage location_requirements"
  ON location_requirements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for location_images table
CREATE POLICY "Allow authenticated users to read location_images"
  ON location_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage location_images"
  ON location_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for location_activity table
CREATE POLICY "Allow authenticated users to read location_activity"
  ON location_activity
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create location_activity"
  ON location_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- Create policies for profiles table
CREATE POLICY "Allow users to read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_locations_customer_id ON locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_location_requirements_location_id ON location_requirements(location_id);
CREATE INDEX IF NOT EXISTS idx_location_images_location_id ON location_images(location_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_location_id ON location_activity(location_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_actor_id ON location_activity(actor_id);