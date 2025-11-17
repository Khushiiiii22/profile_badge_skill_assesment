-- Create questions table for skill assessments
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of string options
  correct_answer INTEGER NOT NULL, -- Index of correct option (0-based)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow service role full access for seeding questions
DROP POLICY IF EXISTS "Service role full access on questions" ON public.questions;
CREATE POLICY "Service role full access on questions"
  ON public.questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read questions (for taking assessments)
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;
CREATE POLICY "Authenticated users can read questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_skill ON public.questions(skill);