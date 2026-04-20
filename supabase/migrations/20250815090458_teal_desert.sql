/*
  # Remove status field from locations

  1. Changes
    - Remove `status` column from `locations` table
    - Remove status enum type

  2. Security
    - Maintain existing RLS policies
*/

-- Remove the status column from locations table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'status'
  ) THEN
    ALTER TABLE locations DROP COLUMN status;
  END IF;
END $$;

-- Drop the location_status enum type if it exists and is no longer used
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_status') THEN
    DROP TYPE IF EXISTS location_status;
  END IF;
END $$;