/*
  # Fix Folder Template Sync to Preserve File Locations

  ## Overview
  This migration fixes the issue where files are moved out of folders when the
  location folder template is updated. The updated sync function now preserves
  file locations by tracking which template folder each file belongs to and
  restoring them after the template sync.

  ## Changes

  1. **Updated Function**: `sync_folder_templates_to_location`
     - Before deleting template folders, saves a mapping of files to their template_folder_id
     - After recreating template folders, moves files back to the correct folders
     - Handles edge cases where template folders are deleted or restructured

  ## How It Works

  1. Create a temporary mapping table of file_id -> template_folder_id
  2. Delete existing template folders (which sets file folder_id to NULL)
  3. Recreate folders from templates with new IDs
  4. Match old template folders to new folders via template_folder_id
  5. Update files to point to the new corresponding folder IDs

  ## Important Notes
  - Only affects template folders (is_template_folder = true)
  - User-created folders and their files are not affected
  - If a template folder is removed from the template, files move to root
  - Files in deleted template folders will remain at root level
*/

-- Function to sync templates to a specific location (preserves file locations)
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
  -- Step 1: Create a temporary table to store file-to-template mappings
  CREATE TEMP TABLE IF NOT EXISTS temp_file_template_mapping (
    file_id uuid,
    template_folder_id uuid
  ) ON COMMIT DROP;

  -- Step 2: Save current file locations (only for template folders)
  INSERT INTO temp_file_template_mapping (file_id, template_folder_id)
  SELECT
    li.id as file_id,
    lff.template_folder_id
  FROM location_images li
  INNER JOIN location_file_folders lff ON li.folder_id = lff.id
  WHERE li.location_id = p_location_id
    AND lff.is_template_folder = true
    AND lff.template_folder_id IS NOT NULL;

  -- Step 3: Delete existing template folders for this location
  -- This will set folder_id to NULL for all files in these folders
  DELETE FROM location_file_folders
  WHERE location_id = p_location_id AND is_template_folder = true;

  -- Step 4: Create folders from templates in order (parent folders first)
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

  -- Step 5: Restore file locations based on template_folder_id
  -- Match files to their new folder locations
  UPDATE location_images li
  SET folder_id = lff.id
  FROM temp_file_template_mapping tftm
  INNER JOIN location_file_folders lff
    ON lff.template_folder_id = tftm.template_folder_id
    AND lff.location_id = p_location_id
    AND lff.is_template_folder = true
  WHERE li.id = tftm.file_id
    AND li.location_id = p_location_id;

  -- Clean up temp table
  DROP TABLE IF EXISTS temp_file_template_mapping;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
