/*
  # Add company logo support

  1. Schema Changes
    - Add `logo_url` column to companies table for storing logo URLs
    
  2. Notes
    - Storage bucket and policies will be configured via Supabase Dashboard
    - Logo URLs will point to Supabase Storage paths
*/

-- Add logo_url column to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN logo_url text;
  END IF;
END $$;

-- Add index for faster logo_url lookups
CREATE INDEX IF NOT EXISTS idx_companies_logo_url ON companies(logo_url) WHERE logo_url IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN companies.logo_url IS 'URL to company logo stored in Supabase Storage';
