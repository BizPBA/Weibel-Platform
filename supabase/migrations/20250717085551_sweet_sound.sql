/*
  # Create location comments and comment files tables

  1. New Tables
    - `location_comments`
      - `id` (uuid, primary key)
      - `location_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamp)
    
    - `location_comment_files`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key)
      - `file_path` (text)
      - `file_name` (text)
      - `file_size` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create location_comments table
CREATE TABLE IF NOT EXISTS location_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create location_comment_files table
CREATE TABLE IF NOT EXISTS location_comment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES location_comments(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE location_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_comment_files ENABLE ROW LEVEL SECURITY;

-- Create policies for location_comments
CREATE POLICY "Allow authenticated users to read location_comments"
  ON location_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create location_comments"
  ON location_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own location_comments"
  ON location_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own location_comments"
  ON location_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for location_comment_files
CREATE POLICY "Allow authenticated users to read location_comment_files"
  ON location_comment_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage location_comment_files"
  ON location_comment_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_comments_location_id ON location_comments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_user_id ON location_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_comment_files_comment_id ON location_comment_files(comment_id);