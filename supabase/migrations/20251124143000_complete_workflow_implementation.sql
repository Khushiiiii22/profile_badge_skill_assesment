-- Complete Workflow Implementation Migration
-- This migration implements the full student/assessor/admin approval workflow

-- Add status column to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add assessor_approved column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assessor_approved BOOLEAN DEFAULT false;

-- Add attempt tracking to assessment_access
ALTER TABLE assessment_access
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS can_retake BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Create assessor_requests table if not exists
CREATE TABLE IF NOT EXISTS assessor_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(user_id)
);

-- Enable RLS on assessor_requests
ALTER TABLE assessor_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_assessor_requests_status ON assessor_requests(status);
CREATE INDEX IF NOT EXISTS idx_assessment_access_status ON assessment_access(status);
CREATE INDEX IF NOT EXISTS idx_assessment_access_profile ON assessment_access(profile_id);

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Assessors can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Approved assessors can view student profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles assessor_profile
      WHERE assessor_profile.id = auth.uid()
      AND assessor_profile.role = 'assessor'
      AND assessor_profile.assessor_approved = true
    )
    AND role = 'student'
  );

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assessor requests policies
CREATE POLICY "Users can view their own assessor request" ON assessor_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create assessor request" ON assessor_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessor requests" ON assessor_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update assessor requests" ON assessor_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing assessment_access policies
DROP POLICY IF EXISTS "Users can view their own assessments" ON assessment_access;
DROP POLICY IF EXISTS "Assessors can view all assessments" ON assessment_access;
DROP POLICY IF EXISTS "Assessors can update assessments" ON assessment_access;
DROP POLICY IF EXISTS "Admins can view all assessments" ON assessment_access;

-- Assessment access policies
CREATE POLICY "Users can view their own assessments" ON assessment_access
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own assessments" ON assessment_access
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own assessments" ON assessment_access
  FOR UPDATE USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Approved assessors can view student assessments" ON assessment_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'assessor'
      AND assessor_approved = true
    )
  );

CREATE POLICY "Approved assessors can update student assessments" ON assessment_access
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'assessor'
      AND assessor_approved = true
    )
  );

CREATE POLICY "Admins can view all assessments" ON assessment_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle assessment rejection and retake
CREATE OR REPLACE FUNCTION handle_assessment_rejection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.can_retake := true;
    NEW.rejected_at := NOW();
    NEW.rejected_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assessment rejection
DROP TRIGGER IF EXISTS on_assessment_rejected ON assessment_access;
CREATE TRIGGER on_assessment_rejected
  BEFORE UPDATE ON assessment_access
  FOR EACH ROW
  EXECUTE FUNCTION handle_assessment_rejection();

-- Function to handle assessor approval
CREATE OR REPLACE FUNCTION handle_assessor_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE profiles
    SET assessor_approved = true
    WHERE id = NEW.user_id AND role = 'assessor';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assessor approval
DROP TRIGGER IF EXISTS on_assessor_approved ON assessor_requests;
CREATE TRIGGER on_assessor_approved
  AFTER UPDATE ON assessor_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_assessor_approval();

-- Update existing assessors to be approved (for testing)
UPDATE profiles
SET assessor_approved = true
WHERE role = 'assessor';

-- Update existing students to be approved
UPDATE profiles
SET status = 'approved'
WHERE role = 'student';
