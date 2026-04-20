/*
  # Fix location_images foreign key constraint
  
  ## Problem
  The location_images.folder_id foreign key constraint is pointing to a non-existent
  table called "file_folders" instead of the correct "location_file_folders" table.
  
  ## Changes
  1. Drop the incorrect foreign key constraint
  2. Add the correct foreign key constraint pointing to location_file_folders
  
  ## Safety
  - Uses IF EXISTS to prevent errors if constraint doesn't exist
  - Preserves existing data
  - Only modifies the constraint, not the data
*/

-- Drop the incorrect foreign key constraint if it exists
ALTER TABLE location_images 
DROP CONSTRAINT IF EXISTS location_images_folder_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE location_images
ADD CONSTRAINT location_images_folder_id_fkey 
FOREIGN KEY (folder_id) 
REFERENCES location_file_folders(id) 
ON DELETE SET NULL;
