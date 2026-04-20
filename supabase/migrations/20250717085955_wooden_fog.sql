/*
  # Update location_images table to include description and file metadata

  1. Changes
    - Add `description` column to `location_images` table
    - Add `file_name` column for better file management
    - Add `file_size` column for file size tracking

  2. Security
    - Maintain existing RLS policies
*/

-- Add description column to location_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE location_images ADD COLUMN description text;
  END IF;
END $$;

-- Add file_name column to location_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_name text;
  END IF;
END $$;

-- Add file_size column to location_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_size integer DEFAULT 0;
  END IF;
END $$;