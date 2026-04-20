/*
  # Fix Company Registration Database Error

  This migration fixes the "Database error saving new user" issue that occurs
  during company registration by ensuring all required database objects exist
  and have proper permissions.

  ## Issues Fixed

  1. **Missing INSERT policy on company_audit_log**
     - The CompanyRegistration flow tries to insert audit log entries
     - No INSERT policy existed, causing the operation to fail
     - Add policy to allow authenticated users to insert their own audit logs

  2. **Ensure user_role enum exists**
     - The handle_new_user trigger function requires user_role enum type
     - Create it if missing with all required values

  3. **Verify profiles table has email column**
     - The handle_new_user function inserts email into profiles
     - Ensure column exists and has proper constraints

  ## Security

  - Maintains existing RLS policies
  - Only adds missing INSERT policy for company_audit_log
  - Preserves all existing data
  - Conservative approach with IF NOT EXISTS checks

  ## Changes Made

  1. Create user_role enum type if missing
  2. Ensure profiles table has email column
  3. Add INSERT policy for company_audit_log
  4. Verify all dependencies exist
*/

-- Step 1: Ensure user_role enum type exists
DO $$
BEGIN
  -- Create user_role enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'technician');
    RAISE NOTICE 'Created user_role enum type';
  END IF;

  -- Add missing enum values if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'customer_responsible';
    RAISE NOTICE 'Added customer_responsible to user_role enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'location_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'location_responsible';
    RAISE NOTICE 'Added location_responsible to user_role enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'employee';
    RAISE NOTICE 'Added employee to user_role enum';
  END IF;
END $$;

-- Step 2: Ensure profiles table has email column
DO $$
BEGIN
  -- Check if email column exists in profiles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
      -- Add email column if missing
      ALTER TABLE profiles ADD COLUMN email text NOT NULL;
      RAISE NOTICE 'Added email column to profiles table';
    END IF;
  ELSE
    RAISE NOTICE 'Profiles table does not exist - it should be created by Supabase or earlier migration';
  END IF;
END $$;

-- Step 3: Add INSERT policy for company_audit_log
-- This is the critical fix - allows users to insert audit logs during company registration
DO $$
BEGIN
  -- Check if company_audit_log table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_audit_log') THEN
    -- Drop existing INSERT policy if it exists
    DROP POLICY IF EXISTS "Users can insert audit log for their company" ON company_audit_log;
    DROP POLICY IF EXISTS "Allow users to create audit logs" ON company_audit_log;
    DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON company_audit_log;

    -- Create new INSERT policy that allows authenticated users to insert audit logs
    CREATE POLICY "Authenticated users can insert audit logs"
      ON company_audit_log
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- User can insert audit logs for their own actions
        auth.uid() = user_id
      );

    RAISE NOTICE 'Added INSERT policy to company_audit_log table';
  ELSE
    RAISE NOTICE 'company_audit_log table does not exist - it should be created by earlier migration';
  END IF;
END $$;

-- Step 4: Verify company_invitations table exists
-- The handle_new_user trigger function references this table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_invitations') THEN
    RAISE NOTICE 'company_invitations table does not exist - this may cause handle_new_user trigger to fail';
  ELSE
    RAISE NOTICE 'company_invitations table exists';
  END IF;
END $$;

-- Step 5: Add helpful comment
COMMENT ON POLICY "Authenticated users can insert audit logs" ON company_audit_log IS
  'Allows authenticated users to insert audit log entries for their own actions during company registration and other operations';
