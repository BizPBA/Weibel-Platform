/*
  # Fix profiles full_name constraint

  ## Problem
  The full_name column is NOT NULL, which causes signup to fail when
  users don't provide their name during registration. The handle_new_user
  function tries to insert an empty string, which violates this constraint.

  ## Solution
  Make the full_name column nullable so users can sign up without providing
  their name. They can add it later in their profile settings.

  ## Changes
  - Change full_name column from NOT NULL to nullable
*/

-- Make full_name nullable to allow signup without a name
ALTER TABLE profiles 
  ALTER COLUMN full_name DROP NOT NULL;