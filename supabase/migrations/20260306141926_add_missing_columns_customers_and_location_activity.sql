/*
  # Add missing columns to customers and location_activity tables

  ## Problem
  The frontend code references columns that do not exist in the database:
  - `customers.notes` - used in CustomerList for customer notes
  - `location_activity.action_text` - used throughout the app for activity log messages
    (the table has an `action` column, but all frontend code uses `action_text`)

  ## Changes
  1. `customers` table:
     - Add `notes` column (text, nullable)

  2. `location_activity` table:
     - Add `action_text` column (text, nullable)
     - Backfill `action_text` from existing `action` values so history is preserved

  ## Notes
  - No data is deleted or overwritten
  - Existing `action` column is kept intact
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_activity' AND column_name = 'action_text'
  ) THEN
    ALTER TABLE public.location_activity ADD COLUMN action_text text;
  END IF;
END $$;

UPDATE public.location_activity SET action_text = action WHERE action_text IS NULL AND action IS NOT NULL;
