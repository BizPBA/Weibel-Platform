/*
  # Add RLS policies for customers table

  1. Security
    - Enable RLS on customers table if not already enabled
    - Add policies for authenticated users to:
      - Read all customers
      - Insert new customers
      - Update customers
      - Delete customers
*/

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy for reading customers
CREATE POLICY "Users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for inserting customers
CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for updating customers
CREATE POLICY "Users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for deleting customers
CREATE POLICY "Users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);