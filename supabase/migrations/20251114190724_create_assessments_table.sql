-- Check if assessments table exists
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  school_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  instamojo_payment_id TEXT,
  instamojo_payment_request_id TEXT,
  assessor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessment_date TIMESTAMPTZ,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  certificate_url TEXT,
  badge_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own assessments" ON public.assessments;
CREATE POLICY "Users can create own assessments"
  ON public.assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON public.assessments;
CREATE POLICY "Service role full access"
  ON public.assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_instamojo_payment_id ON public.assessments(instamojo_payment_id);
