-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'parent', 'assessor', 'school_admin', 'sba_admin');

-- Create enum for assessment status
CREATE TYPE assessment_status AS ENUM ('pending', 'scheduled', 'completed', 'cancelled');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for badge types
CREATE TYPE badge_type AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  age INTEGER,
  photo_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  school_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  is_accredited BOOLEAN DEFAULT FALSE,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rubric JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  remarks TEXT,
  status assessment_status DEFAULT 'pending',
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_set TEXT[] NOT NULL,
  qr_hash TEXT UNIQUE NOT NULL,
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessment_requests table
CREATE TABLE assessment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  status assessment_status DEFAULT 'pending',
  pin_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  assessment_request_id UUID REFERENCES assessment_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for school_id in profiles
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_school 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for schools (public read)
CREATE POLICY "Anyone can view schools" ON schools
  FOR SELECT USING (true);

-- RLS Policies for skills (public read)
CREATE POLICY "Anyone can view skills" ON skills
  FOR SELECT USING (true);

-- RLS Policies for assessments
CREATE POLICY "Students can view own assessments" ON assessments
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() = assessor_id
  );

-- RLS Policies for badges
CREATE POLICY "Students can view own badges" ON badges
  FOR SELECT USING (auth.uid() = student_id);

-- RLS Policies for certificates
CREATE POLICY "Students can view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = student_id);

-- RLS Policies for assessment_requests
CREATE POLICY "Students can view own assessment requests" ON assessment_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create assessment requests" ON assessment_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_requests_updated_at BEFORE UPDATE ON assessment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial skills
INSERT INTO skills (name, description, rubric) VALUES
  ('Communication', 'Effective verbal and written communication skills', '{"criteria": ["Clarity", "Confidence", "Listening", "Expression"]}'),
  ('Leadership', 'Ability to lead and inspire teams', '{"criteria": ["Vision", "Delegation", "Motivation", "Decision Making"]}'),
  ('Problem Solving', 'Critical thinking and solution-oriented approach', '{"criteria": ["Analysis", "Creativity", "Logic", "Implementation"]}'),
  ('Teamwork', 'Collaboration and working effectively with others', '{"criteria": ["Cooperation", "Flexibility", "Support", "Contribution"]}'),
  ('Time Management', 'Efficient planning and prioritization', '{"criteria": ["Planning", "Prioritization", "Execution", "Punctuality"]}'),
  ('Creativity', 'Innovative thinking and artistic expression', '{"criteria": ["Originality", "Imagination", "Innovation", "Expression"]}');