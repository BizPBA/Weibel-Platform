/*
  # Add missing columns to locations table

  ## Problem
  The frontend code references columns `title`, `zip`, `city`, and `country` on the
  `locations` table, but the table only has a `name` column and no `zip`, `city`, or
  `country` columns.

  ## Changes
  1. Add `title` column (text, nullable) - used as the display name for a location
  2. Add `zip` column (text, nullable) - postal code
  3. Add `city` column (text, nullable) - city name
  4. Add `country` column (text, nullable, default 'Danmark')
  5. Backfill `title` from existing `name` values so existing data still works

  ## Notes
  - The `name` column is kept intact to avoid data loss
  - New `title` column mirrors `name` for backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.locations ADD COLUMN title text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'zip'
  ) THEN
    ALTER TABLE public.locations ADD COLUMN zip text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'city'
  ) THEN
    ALTER TABLE public.locations ADD COLUMN city text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.locations ADD COLUMN country text DEFAULT 'Danmark';
  END IF;
END $$;

UPDATE public.locations SET title = name WHERE title IS NULL AND name IS NOT NULL;
