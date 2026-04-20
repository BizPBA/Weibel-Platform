/*
  # Add locker number field to locations table

  1. Changes
    - Add `locker_number` column to `locations` table for storing cabinet/locker numbers

  2. Security
    - Maintain existing RLS policies
*/

-- Add locker_number column to locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'locker_number'
  ) THEN
    ALTER TABLE locations ADD COLUMN locker_number text;
  END IF;
END $$;