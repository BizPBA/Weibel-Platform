/*
  # Backfill Weibel Company Data Migration

  1. Purpose
    - Create default "Weibel" company for existing data
    - Assign all existing users and records to Weibel company
    - Mark existing users as having completed onboarding
    - Ensure backward compatibility with pre-multi-tenancy data

  2. Changes
    - Insert "Weibel" company if it doesn't exist
    - Update all profiles with NULL company_id to reference Weibel
    - Update all customers, locations, and related tables to reference Weibel
    - Set onboarding_completed = true for existing users
    - Upgrade first user to admin role

  3. Security
    - This is a data migration only, no RLS changes
    - Existing RLS policies will automatically apply to migrated data

  4. Important Notes
    - Uses IF NOT EXISTS to ensure idempotency
    - Safe to run multiple times
    - Preserves all existing data relationships
    - Only affects records with NULL company_id
*/

-- Create the default Weibel company if it doesn't exist
DO $$
DECLARE
  weibel_company_id uuid;
  first_user_id uuid;
BEGIN
  -- Check if Weibel company already exists
  SELECT id INTO weibel_company_id FROM companies WHERE name = 'Weibel' LIMIT 1;
  
  -- If it doesn't exist, create it
  IF weibel_company_id IS NULL THEN
    INSERT INTO companies (name, created_at)
    VALUES ('Weibel', now())
    RETURNING id INTO weibel_company_id;
    
    RAISE NOTICE 'Created Weibel company with id: %', weibel_company_id;
  ELSE
    RAISE NOTICE 'Weibel company already exists with id: %', weibel_company_id;
  END IF;
  
  -- Update all profiles with NULL company_id to reference Weibel
  UPDATE profiles 
  SET company_id = weibel_company_id,
      onboarding_completed = true
  WHERE company_id IS NULL;
  
  RAISE NOTICE 'Updated % profiles to Weibel company', (SELECT COUNT(*) FROM profiles WHERE company_id = weibel_company_id);
  
  -- Set the first user (earliest created) as admin
  SELECT id INTO first_user_id 
  FROM profiles 
  WHERE company_id = weibel_company_id 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = first_user_id;
    
    RAISE NOTICE 'Set user % as admin', first_user_id;
  END IF;
  
  -- Update all customers with NULL company_id
  UPDATE customers 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  
  RAISE NOTICE 'Updated % customers to Weibel company', (SELECT COUNT(*) FROM customers WHERE company_id = weibel_company_id);
  
  -- Update all locations with NULL company_id
  UPDATE locations 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  
  RAISE NOTICE 'Updated % locations to Weibel company', (SELECT COUNT(*) FROM locations WHERE company_id = weibel_company_id);
  
  -- Update all location_assignments with NULL company_id
  UPDATE location_assignments 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  
  -- Update all location_requirements with NULL company_id
  UPDATE location_requirements 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  
  -- Update all location_images with NULL company_id
  UPDATE location_images 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  
  -- Update all location_activity with NULL company_id
  UPDATE location_activity 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  
  -- Update location_comments if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comments') THEN
    UPDATE location_comments 
    SET company_id = weibel_company_id
    WHERE company_id IS NULL;
  END IF;
  
  -- Update location_comment_files if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comment_files') THEN
    UPDATE location_comment_files 
    SET company_id = weibel_company_id
    WHERE company_id IS NULL;
  END IF;
  
  RAISE NOTICE 'Successfully completed Weibel company data migration';
END $$;
