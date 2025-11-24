-- Fix RLS policies for assessor dashboard
-- This migration adds policies to allow assessors to read and update assessments

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Assessors can read all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Assessors can update assessments" ON public.assessments;

-- Allow assessors to read all assessments
CREATE POLICY "Assessors can read all assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'assessor'
  )
);

-- Allow assessors to update assessments (for approval/rejection)
CREATE POLICY "Assessors can update assessments"
ON public.assessments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'assessor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'assessor'
  )
);
