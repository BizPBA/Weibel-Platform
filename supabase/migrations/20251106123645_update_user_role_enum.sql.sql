/*
  # Update user_role enum to support new role system

  ## Changes
  - Add new roles: customer_responsible, location_responsible, employee
  - Keep existing roles: admin, technician (for backward compatibility)

  ## New Roles
  - admin: Full system access
  - customer_responsible: Can manage customers and locations
  - location_responsible: Can manage assigned locations
  - employee: Basic access to assigned locations
  - technician: Legacy role (equivalent to employee)
*/

-- Add new enum values if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'customer_responsible';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'location_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'location_responsible';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'employee';
    END IF;
END $$;