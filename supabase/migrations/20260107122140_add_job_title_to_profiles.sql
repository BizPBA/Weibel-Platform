/*
  # Add Job Title to Profiles

  1. Changes
    - Add `job_title` column to `profiles` table
      - `job_title` (text, nullable) - User's job title/position
    
  2. Notes
    - Nullable to allow for users without job titles
    - Will be synced from Azure AD when available
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;
END $$;
