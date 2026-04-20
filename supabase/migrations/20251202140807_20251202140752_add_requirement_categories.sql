/*
  # Add Requirement Categories System

  ## Purpose
  Enables organizing location requirements into categories for better structure.
  Users can create categories like "Sikkerhedsudstyr", "Værnemidler", "Adgangskrav"
  and organize requirements within them.

  ## New Tables

  1. **requirement_categories**
     - `id` (uuid, primary key)
     - `location_id` (uuid, foreign key to locations)
     - `name` (text) - Category name
     - `description` (text, nullable) - Category description
     - `display_order` (integer) - For custom ordering of categories
     - `created_at` (timestamp)

  ## Modified Tables

  1. **location_requirements**
     - Add `category_id` (uuid, nullable, foreign key to requirement_categories)
     - Add `display_order` (integer) - For ordering requirements within category

  ## Security

  - Enable RLS on requirement_categories
  - Same access patterns as location_requirements

  ## Performance

  - Index on location_id and display_order
  - Index on category_id in location_requirements
*/

-- Create requirement_categories table
CREATE TABLE IF NOT EXISTS requirement_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add category_id and display_order to location_requirements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_requirements' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE location_requirements ADD COLUMN category_id uuid REFERENCES requirement_categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_requirements' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE location_requirements ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE requirement_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requirement_categories

-- SELECT: Authenticated users can read categories for locations in their company
CREATE POLICY "Users can read requirement categories in their company"
  ON requirement_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- INSERT: Authenticated users can create categories
CREATE POLICY "Users can create requirement categories"
  ON requirement_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- UPDATE: Authenticated users can update categories
CREATE POLICY "Users can update requirement categories"
  ON requirement_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- DELETE: Authenticated users can delete categories
CREATE POLICY "Users can delete requirement categories"
  ON requirement_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requirement_categories_location_id 
  ON requirement_categories(location_id, display_order);

CREATE INDEX IF NOT EXISTS idx_location_requirements_category_id 
  ON location_requirements(category_id);

CREATE INDEX IF NOT EXISTS idx_location_requirements_display_order 
  ON location_requirements(location_id, display_order);

-- Add comments
COMMENT ON TABLE requirement_categories IS 
  'Categories for organizing location requirements. Examples: Safety Equipment, Access Requirements, etc.';

COMMENT ON COLUMN location_requirements.category_id IS
  'Optional category this requirement belongs to. NULL means uncategorized.';

COMMENT ON COLUMN location_requirements.display_order IS
  'Order of this requirement within its category or in the uncategorized list.';
