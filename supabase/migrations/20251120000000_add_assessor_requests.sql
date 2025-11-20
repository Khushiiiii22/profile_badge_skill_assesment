-- Create assessor_requests table
CREATE TABLE IF NOT EXISTS assessor_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE assessor_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own assessor requests" ON assessor_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all assessor requests" ON assessor_requests FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update assessor requests" ON assessor_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));