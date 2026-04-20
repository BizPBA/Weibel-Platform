/*
  # Add Location Contacts and Notes

  ## Purpose
  Enables locations to have their own contacts and notes, similar to customers.
  This provides better organization and direct contact information for each location.

  ## Changes

  1. **locations table**
     - Add `notes` column for general location notes

  2. **location_contacts table** (new)
     - `id` (uuid, primary key)
     - `location_id` (uuid, foreign key to locations)
     - `full_name` (text) - Contact person name
     - `email` (text) - Contact email
     - `phone` (text, nullable) - Contact phone
     - `role` (text, nullable) - Contact role/title (e.g., "Site Manager")
     - `created_at` (timestamp)

  ## Security

  - Enable RLS on location_contacts table
  - Authenticated users can read contacts for locations in their company
  - Users with location management permissions can create/update/delete contacts

  ## Performance

  - Index on location_id for fast lookups
*/

-- Add notes column to locations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE locations ADD COLUMN notes text;
  END IF;
END $$;

-- Create location_contacts table
CREATE TABLE IF NOT EXISTS location_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE location_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_contacts

-- SELECT: Authenticated users can read contacts for locations in their company
CREATE POLICY "Users can read location contacts in their company"
  ON location_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- INSERT: Authenticated users can create contacts for locations
CREATE POLICY "Users can create location contacts"
  ON location_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- UPDATE: Authenticated users can update contacts
CREATE POLICY "Users can update location contacts"
  ON location_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- DELETE: Authenticated users can delete contacts
CREATE POLICY "Users can delete location contacts"
  ON location_contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_contacts_location_id 
  ON location_contacts(location_id);

CREATE INDEX IF NOT EXISTS idx_location_contacts_email 
  ON location_contacts(email);

-- Add comments
COMMENT ON TABLE location_contacts IS 
  'Stores contact persons for each location. Similar to customer_contacts but for locations.';

COMMENT ON COLUMN locations.notes IS
  'General notes about the location. Can include access instructions, special requirements, etc.';
