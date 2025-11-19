-- Add admin approval fields to assessments table
ALTER TABLE public.assessments
ADD COLUMN approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMPTZ;

-- Update status constraint to include 'awaiting_approval'
ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_status_check;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_status_check
CHECK (status IN ('pending', 'awaiting_approval', 'in_progress', 'completed', 'cancelled'));