/*
  # Customer Folders System

  ## Overview
  This migration creates a folder structure for organizing customers within a company.
  Customers can be organized into folders for better management and navigation.

  ## New Tables
  
  ### `customer_folders`
  - `id` (uuid, primary key) - Unique identifier for each folder
  - `company_id` (uuid, foreign key) - Links folder to a company
  - `name` (text) - Name of the folder
  - `color` (text, nullable) - Optional color for visual distinction
  - `created_at` (timestamptz) - When the folder was created
  - `created_by` (uuid, foreign key) - User who created the folder
  - `updated_at` (timestamptz) - Last update timestamp

  ## Modified Tables
  
  ### `customers`
  - Added `folder_id` (uuid, foreign key, nullable) - Links customer to a folder
  - Customers without a folder_id are considered "Uncategorized"

  ## Security (RLS Policies)
  
  ### customer_folders
  - Authenticated company members can view folders in their company
  - Authenticated company members can create folders in their company
  - Authenticated company members can update folders in their company
  - Authenticated company members can delete folders in their company

  ## Performance
  - Index on `customer_folders.company_id` for fast company lookups
  - Index on `customers.folder_id` for fast folder filtering
  - Index on `customer_folders.name` for search functionality

  ## Important Notes
  1. Deleting a folder sets all associated customers' folder_id to NULL
  2. All folders are company-scoped (isolated by company_id)
  3. Folder names must be unique within a company
*/

-- Create customer_folders table
CREATE TABLE IF NOT EXISTS customer_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customer_folders_company_name_key UNIQUE (company_id, name)
);

-- Add folder_id to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN folder_id uuid REFERENCES customer_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on customer_folders
ALTER TABLE customer_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_folders

-- Allow company members to view folders
CREATE POLICY "Company members can view folders"
  ON customer_folders FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow company members to create folders
CREATE POLICY "Company members can create folders"
  ON customer_folders FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow company members to update folders
CREATE POLICY "Company members can update folders"
  ON customer_folders FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow company members to delete folders
CREATE POLICY "Company members can delete folders"
  ON customer_folders FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_folders_company_id ON customer_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_folders_name ON customer_folders(name);
CREATE INDEX IF NOT EXISTS idx_customers_folder_id ON customers(folder_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_customer_folders_updated_at_trigger ON customer_folders;
CREATE TRIGGER update_customer_folders_updated_at_trigger
  BEFORE UPDATE ON customer_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_folders_updated_at();