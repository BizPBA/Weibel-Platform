/*
  # Add Pinned/Important Images Feature

  ## Purpose
  Allows admins, customer_responsible, and location_responsible to mark images as important.
  Pinned images appear first in the gallery with visual distinction (orange/yellow background).

  ## Modified Tables

  1. **location_images**
     - Add `is_pinned` (boolean, default false) - Whether image is marked as important
     - Add `pinned_at` (timestamp, nullable) - When image was pinned
     - Add `pinned_by` (uuid, nullable) - User who pinned the image

  ## Functions

  - `toggle_image_pin(p_image_id)` - Toggles pin status for an image
    Returns boolean indicating new pinned status (true = pinned, false = unpinned)

  ## Notes

  - Only users with appropriate permissions should be able to pin/unpin
  - Permission check happens in frontend, but function is available to all authenticated users
*/

-- Add pinned columns to location_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE location_images ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_by'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_location_images_pinned_order 
  ON location_images(location_id, is_pinned DESC, created_at DESC);

-- Create toggle_image_pin function
CREATE OR REPLACE FUNCTION toggle_image_pin(
  p_image_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_pinned boolean;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get current pinned status
  SELECT is_pinned INTO v_is_pinned
  FROM location_images
  WHERE id = p_image_id;

  IF v_is_pinned IS NULL THEN
    RAISE EXCEPTION 'Image not found';
  END IF;

  IF v_is_pinned THEN
    -- Unpin the image
    UPDATE location_images
    SET is_pinned = false,
        pinned_at = NULL,
        pinned_by = NULL
    WHERE id = p_image_id;
    
    RETURN false; -- Image unpinned
  ELSE
    -- Pin the image
    UPDATE location_images
    SET is_pinned = true,
        pinned_at = now(),
        pinned_by = v_user_id
    WHERE id = p_image_id;
    
    RETURN true; -- Image pinned
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_image_pin TO authenticated;

-- Add comments
COMMENT ON COLUMN location_images.is_pinned IS
  'Whether this image is marked as important and should appear first in the gallery.';

COMMENT ON COLUMN location_images.pinned_at IS
  'Timestamp when the image was pinned. NULL if not pinned.';

COMMENT ON COLUMN location_images.pinned_by IS
  'User who pinned this image. NULL if not pinned.';

COMMENT ON FUNCTION toggle_image_pin IS
  'Toggles pin status for an image. Returns true if pinned, false if unpinned.';
