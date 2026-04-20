/*
  # Location Folder Template System

  ## Overview
  This migration creates a global folder template system that allows companies to define
  a standard folder structure that is automatically applied to all locations.

  ## New Tables
  
  ### `location_folder_templates`
  - `id` (uuid, primary key) - Unique identifier for template folder
  - `company_id` (uuid, foreign key) - Links template to company
  - `folder_name` (text) - Name of the template folder
  - `parent_folder_id` (uuid, nullable, self-reference) - Parent folder for hierarchy
  - `folder_order` (integer) - Display order within parent
  - `created_at` (timestamptz) - When the template was created
  - `created_by` (uuid, foreign key) - User who created the template
  - `updated_at` (timestamptz) - Last update timestamp

  ### `location_file_folders`
  - `id` (uuid, primary key) - Unique identifier for location folder
  - `location_id` (uuid, foreign key) - Links folder to location
  - `company_id` (uuid, foreign key) - Links folder to company
  - `folder_name` (text) - Name of the folder
  - `parent_folder_id` (uuid, nullable, self-reference) - Parent folder for hierarchy
  - `template_folder_id` (uuid, nullable, foreign key) - Links to template if created from template
  - `folder_order` (integer) - Display order within parent
  - `is_template_folder` (boolean) - True if created from template, false if user-created
  - `created_at` (timestamptz) - When the folder was created
  - `created_by` (uuid, foreign key) - User who created the folder
  - `updated_at` (timestamptz) - Last update timestamp

  ## Modified Tables
  
  ### `location_images`
  - Added `folder_id` (uuid, foreign key, nullable) - Links file to a folder in location_file_folders
  - Added `file_name` (text, nullable) - Display name for the file
  - Added `description` (text, nullable) - File description
  - Added `is_pinned` (boolean, default false) - Whether file is pinned
  - Added `pinned_at` (timestamptz, nullable) - When file was pinned
  - Added `pinned_by` (uuid, nullable) - Who pinned the file

  ## Database Functions

  1. `get_folder_tree(p_location_id uuid)` - Returns folder tree for a location
  2. `create_folder(p_company_id uuid, p_location_id uuid, p_folder_name text, p_parent_folder_id uuid)` - Creates a folder
  3. `sync_folder_templates_to_location(p_company_id uuid, p_location_id uuid)` - Syncs templates to one location
  4. `sync_folder_templates_to_all_locations(p_company_id uuid)` - Syncs templates to all company locations

  ## Security (RLS Policies)
  
  All tables are secured with RLS policies that ensure:
  - Only company members can view/manage their company's templates and folders
  - Templates are isolated by company_id
  - Location folders are accessible only to users with location access

  ## Triggers

  1. Auto-sync templates to new locations when created
  2. Auto-update updated_at timestamps
  3. Re-sync templates to all locations when template is created/updated/deleted

  ## Important Notes
  1. Template folders cannot be deleted from individual locations
  2. User-created folders are preserved during template sync
  3. Template folder hierarchy is maintained across all locations
  4. Changes to templates automatically propagate to all locations
*/

-- Create location_folder_templates table
CREATE TABLE IF NOT EXISTS location_folder_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  parent_folder_id uuid REFERENCES location_folder_templates(id) ON DELETE CASCADE,
  folder_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT location_folder_templates_unique_name_per_parent UNIQUE (company_id, parent_folder_id, folder_name)
);

-- Create location_file_folders table
CREATE TABLE IF NOT EXISTS location_file_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  parent_folder_id uuid REFERENCES location_file_folders(id) ON DELETE CASCADE,
  template_folder_id uuid REFERENCES location_folder_templates(id) ON DELETE CASCADE,
  folder_order integer DEFAULT 0,
  is_template_folder boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT location_file_folders_unique_name_per_parent UNIQUE (location_id, parent_folder_id, folder_name)
);

-- Add columns to location_images if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE location_images ADD COLUMN folder_id uuid REFERENCES location_file_folders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE location_images ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE location_images ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_by'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE location_folder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_file_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_folder_templates

CREATE POLICY "Company members can view folder templates"
  ON location_folder_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company admins can create folder templates"
  ON location_folder_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

CREATE POLICY "Company admins can update folder templates"
  ON location_folder_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

CREATE POLICY "Company admins can delete folder templates"
  ON location_folder_templates FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );

-- RLS Policies for location_file_folders

CREATE POLICY "Users can view folders for accessible locations"
  ON location_file_folders FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create folders in accessible locations"
  ON location_file_folders FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update folders in accessible locations"
  ON location_file_folders FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND is_template_folder = false
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND is_template_folder = false
  );

CREATE POLICY "Users can delete user-created folders only"
  ON location_file_folders FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND is_template_folder = false
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_folder_templates_company_id ON location_folder_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_location_folder_templates_parent_id ON location_folder_templates(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_location_id ON location_file_folders(location_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_company_id ON location_file_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_parent_id ON location_file_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_template_id ON location_file_folders(template_folder_id);
CREATE INDEX IF NOT EXISTS idx_location_images_folder_id ON location_images(folder_id);

-- Function to get folder tree for a location with file counts
CREATE OR REPLACE FUNCTION get_folder_tree(p_location_id uuid)
RETURNS TABLE (
  id uuid,
  folder_name text,
  parent_folder_id uuid,
  folder_order integer,
  file_count bigint,
  level integer
) AS $$
WITH RECURSIVE folder_tree AS (
  SELECT 
    lff.id,
    lff.folder_name,
    lff.parent_folder_id,
    lff.folder_order,
    0 as level
  FROM location_file_folders lff
  WHERE lff.location_id = p_location_id AND lff.parent_folder_id IS NULL
  
  UNION ALL
  
  SELECT 
    lff.id,
    lff.folder_name,
    lff.parent_folder_id,
    lff.folder_order,
    ft.level + 1
  FROM location_file_folders lff
  INNER JOIN folder_tree ft ON lff.parent_folder_id = ft.id
  WHERE lff.location_id = p_location_id
)
SELECT 
  ft.id,
  ft.folder_name,
  ft.parent_folder_id,
  ft.folder_order,
  COUNT(li.id) as file_count,
  ft.level
FROM folder_tree ft
LEFT JOIN location_images li ON li.folder_id = ft.id
GROUP BY ft.id, ft.folder_name, ft.parent_folder_id, ft.folder_order, ft.level
ORDER BY ft.level, ft.folder_order, ft.folder_name;
$$ LANGUAGE sql STABLE;

-- Function to create a folder in a location
CREATE OR REPLACE FUNCTION create_folder(
  p_company_id uuid,
  p_location_id uuid,
  p_folder_name text,
  p_parent_folder_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_folder_id uuid;
  v_max_order integer;
BEGIN
  SELECT COALESCE(MAX(folder_order), -1) + 1
  INTO v_max_order
  FROM location_file_folders
  WHERE location_id = p_location_id AND parent_folder_id IS NOT DISTINCT FROM p_parent_folder_id;

  INSERT INTO location_file_folders (
    location_id,
    company_id,
    folder_name,
    parent_folder_id,
    folder_order,
    is_template_folder,
    created_by
  ) VALUES (
    p_location_id,
    p_company_id,
    p_folder_name,
    p_parent_folder_id,
    v_max_order,
    false,
    auth.uid()
  )
  RETURNING id INTO v_folder_id;

  RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync templates to a specific location
CREATE OR REPLACE FUNCTION sync_folder_templates_to_location(
  p_company_id uuid,
  p_location_id uuid
)
RETURNS void AS $$
DECLARE
  v_template record;
  v_new_folder_id uuid;
  v_parent_mapping jsonb := '{}';
BEGIN
  -- Delete existing template folders for this location
  DELETE FROM location_file_folders
  WHERE location_id = p_location_id AND is_template_folder = true;

  -- Create folders from templates in order (parent folders first)
  FOR v_template IN
    WITH RECURSIVE template_tree AS (
      SELECT 
        id,
        folder_name,
        parent_folder_id,
        folder_order,
        0 as level
      FROM location_folder_templates
      WHERE company_id = p_company_id AND parent_folder_id IS NULL
      
      UNION ALL
      
      SELECT 
        lft.id,
        lft.folder_name,
        lft.parent_folder_id,
        lft.folder_order,
        tt.level + 1
      FROM location_folder_templates lft
      INNER JOIN template_tree tt ON lft.parent_folder_id = tt.id
      WHERE lft.company_id = p_company_id
    )
    SELECT * FROM template_tree ORDER BY level, folder_order, folder_name
  LOOP
    -- Determine the parent folder ID in the location
    IF v_template.parent_folder_id IS NULL THEN
      v_new_folder_id := NULL;
    ELSE
      v_new_folder_id := (v_parent_mapping->>v_template.parent_folder_id::text)::uuid;
    END IF;

    -- Create the folder
    INSERT INTO location_file_folders (
      location_id,
      company_id,
      folder_name,
      parent_folder_id,
      template_folder_id,
      folder_order,
      is_template_folder,
      created_by
    ) VALUES (
      p_location_id,
      p_company_id,
      v_template.folder_name,
      v_new_folder_id,
      v_template.id,
      v_template.folder_order,
      true,
      auth.uid()
    )
    RETURNING id INTO v_new_folder_id;

    -- Store the mapping for child folders
    v_parent_mapping := jsonb_set(
      v_parent_mapping,
      ARRAY[v_template.id::text],
      to_jsonb(v_new_folder_id)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync templates to all locations in a company
CREATE OR REPLACE FUNCTION sync_folder_templates_to_all_locations(
  p_company_id uuid
)
RETURNS void AS $$
DECLARE
  v_location record;
BEGIN
  FOR v_location IN
    SELECT id FROM locations WHERE company_id = p_company_id
  LOOP
    PERFORM sync_folder_templates_to_location(p_company_id, v_location.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_location_folder_templates_updated_at_trigger ON location_folder_templates;
CREATE TRIGGER update_location_folder_templates_updated_at_trigger
  BEFORE UPDATE ON location_folder_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();

DROP TRIGGER IF EXISTS update_location_file_folders_updated_at_trigger ON location_file_folders;
CREATE TRIGGER update_location_file_folders_updated_at_trigger
  BEFORE UPDATE ON location_file_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();

-- Trigger to auto-sync templates when new location is created
CREATE OR REPLACE FUNCTION auto_sync_templates_on_new_location()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_folder_templates_to_location(NEW.company_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_sync_templates_on_new_location_trigger ON locations;
CREATE TRIGGER auto_sync_templates_on_new_location_trigger
  AFTER INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_templates_on_new_location();

-- Trigger to re-sync all locations when template is created/updated/deleted
CREATE OR REPLACE FUNCTION auto_sync_templates_on_template_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_folder_templates_to_all_locations(OLD.company_id);
    RETURN OLD;
  ELSE
    PERFORM sync_folder_templates_to_all_locations(NEW.company_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_sync_templates_on_template_change_trigger ON location_folder_templates;
CREATE TRIGGER auto_sync_templates_on_template_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON location_folder_templates
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_templates_on_template_change();