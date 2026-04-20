/*
  # Create User Favorites System

  ## Purpose
  Enables users to mark customers and locations as favorites for quick access.
  Favorites appear at the top of lists with a yellow star icon.

  ## Tables Created

  1. **user_favorites**
     - `id` (uuid, primary key) - Unique identifier
     - `user_id` (uuid, foreign key) - References profiles.id
     - `entity_type` (text) - Type of favorited entity ('customer' or 'location')
     - `entity_id` (uuid) - ID of the favorited customer or location
     - `created_at` (timestamptz) - When favorite was added
     - **Unique constraint**: (user_id, entity_type, entity_id) - Prevents duplicate favorites

  ## Security

  - Enable RLS on user_favorites table
  - Users can only read their own favorites
  - Users can only create/delete their own favorites
  - No update policy needed (favorites are binary: exists or doesn't exist)

  ## Performance

  - Index on (user_id, entity_type) for fast favorites lookup
  - Index on (user_id, entity_id) for checking favorite status
  - Index on (entity_id) for reverse lookups

  ## Functions

  - `toggle_favorite(p_entity_type, p_entity_id)` - Adds or removes a favorite
    Returns boolean indicating new favorite status (true = added, false = removed)
*/

-- Create enum type for entity types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'favorite_entity_type') THEN
    CREATE TYPE favorite_entity_type AS ENUM ('customer', 'location');
  END IF;
END $$;

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type favorite_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate favorites
  CONSTRAINT unique_user_favorite UNIQUE (user_id, entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own favorites

-- SELECT: Users can read their own favorites
CREATE POLICY "Users can read own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own favorites
CREATE POLICY "Users can create own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_entity_type 
  ON user_favorites(user_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_entity_id 
  ON user_favorites(user_id, entity_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_entity_id 
  ON user_favorites(entity_id);

-- Create toggle_favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(
  p_entity_type favorite_entity_type,
  p_entity_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if favorite already exists
  SELECT EXISTS (
    SELECT 1 
    FROM user_favorites 
    WHERE user_id = v_user_id 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove favorite
    DELETE FROM user_favorites
    WHERE user_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
    
    RETURN false; -- Favorite removed
  ELSE
    -- Add favorite
    INSERT INTO user_favorites (user_id, entity_type, entity_id)
    VALUES (v_user_id, p_entity_type, p_entity_id);
    
    RETURN true; -- Favorite added
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_favorite TO authenticated;

-- Add comment
COMMENT ON TABLE user_favorites IS 
  'Stores user favorites for customers and locations. Each user can mark entities as favorites for quick access.';

COMMENT ON FUNCTION toggle_favorite IS
  'Toggles favorite status for a customer or location. Returns true if added, false if removed.';
