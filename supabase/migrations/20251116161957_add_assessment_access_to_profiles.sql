-- Add assessment_access column to profiles table
-- This column controls whether a user has access to assessments
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS assessment_access BOOLEAN DEFAULT FALSE;

-- Update the SELECT policy to include assessment_access in viewable columns
-- Note: Since the policy allows users to view their own profile, this column will be accessible
-- No additional RLS policy changes needed as the existing policies cover profile access