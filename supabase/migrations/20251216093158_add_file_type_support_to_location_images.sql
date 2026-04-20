/*
  # Add File Type Support to Location Images

  ## Overview
  Extends the location_images table to support all file types (documents, PDFs, images, etc.)
  by adding metadata columns for file type tracking and display.

  ## Changes
  
  1. New Columns Added to `location_images` table:
    - `file_type` (text) - The file extension (e.g., 'pdf', 'docx', 'jpg')
    - `file_size` (bigint) - File size in bytes for display purposes
    - `mime_type` (text) - The MIME type of the file (e.g., 'application/pdf')
  
  2. Migration Safety:
    - Uses IF NOT EXISTS checks to prevent errors on re-run
    - All new columns are nullable to maintain backward compatibility
    - Existing image records will work without modification

  ## Notes
  - Existing images will have NULL values for these fields initially
  - The application will handle NULL values gracefully
  - These fields enable better file management and display in the UI
*/

-- Add file_type column to track file extensions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_type text;
  END IF;
END $$;

-- Add file_size column to track file sizes in bytes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_size bigint;
  END IF;
END $$;

-- Add mime_type column to track MIME types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE location_images ADD COLUMN mime_type text;
  END IF;
END $$;