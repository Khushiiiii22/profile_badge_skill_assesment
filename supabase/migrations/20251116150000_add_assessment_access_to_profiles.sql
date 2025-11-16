-- Add assessment_access column to profiles table
-- This enables tracking of users who have paid and can access assessments

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assessment_access BOOLEAN DEFAULT FALSE;

-- Update existing users who have completed transactions to have assessment access
UPDATE public.profiles
SET assessment_access = TRUE
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.transactions 
  WHERE payment_status = 'completed'
);

-- Create index for faster queries on assessment_access
CREATE INDEX IF NOT EXISTS idx_profiles_assessment_access 
ON public.profiles(assessment_access);

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.assessment_access IS 
  'Indicates whether the user has paid and can access skill assessments';
