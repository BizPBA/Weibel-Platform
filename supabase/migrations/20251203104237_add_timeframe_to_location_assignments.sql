/*
  # Add Timeframe Management to Location Assignments

  1. New Columns
    - `start_date` (date, nullable) - When the assignment begins
    - `end_date` (date, nullable) - When the assignment expires (null = permanent)
    - `is_active` (boolean, default true) - Whether assignment is currently active
    - `expired_at` (timestamptz, nullable) - Timestamp when auto-expired

  2. Changes
    - Add four new columns to location_assignments table
    - Set all existing assignments as active (is_active = true)
    - Add indexes for performance on end_date and is_active
    - Add check constraint to ensure end_date >= start_date

  3. Notes
    - Existing assignments become permanent (no end_date)
    - Soft-delete approach: expired assignments have is_active = false
    - Employees remain in system, just not assigned to location
*/

-- Add new columns to location_assignments table
ALTER TABLE location_assignments
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS expired_at timestamptz;

-- Set all existing assignments as active
UPDATE location_assignments
SET is_active = true
WHERE is_active IS NULL;

-- Add check constraint to ensure end_date is after start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'location_assignments_date_check'
  ) THEN
    ALTER TABLE location_assignments
    ADD CONSTRAINT location_assignments_date_check
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
  END IF;
END $$;

-- Create index on end_date for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_location_assignments_end_date
ON location_assignments(end_date)
WHERE end_date IS NOT NULL AND is_active = true;

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_location_assignments_is_active
ON location_assignments(is_active);

-- Create composite index for location + active status
CREATE INDEX IF NOT EXISTS idx_location_assignments_location_active
ON location_assignments(location_id, is_active);