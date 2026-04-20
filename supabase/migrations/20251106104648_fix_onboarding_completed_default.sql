/*
  # Fix onboarding_completed default value

  ## Problem
  The profiles table has `onboarding_completed` defaulting to `true`, 
  which means new users skip onboarding even if they don't have a company.

  ## Solution
  Change the default value to `false` so users without a company are 
  properly routed through the onboarding flow.

  ## Changes
  - Update the default value of `onboarding_completed` column to `false`
*/

-- Update the default value for onboarding_completed
ALTER TABLE profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT false;