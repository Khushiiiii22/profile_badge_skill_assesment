-- Fix assessor approval workflow policies

-- 1. Allow users to insert their own assessor requests
DROP POLICY IF EXISTS "Users can insert their own assessor requests" ON assessor_requests;
CREATE POLICY "Users can insert their own assessor requests" 
ON assessor_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Allow admins to insert roles for assessors
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
CREATE POLICY "Admins can insert roles" 
ON user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR auth.uid() = user_id -- Allow users to insert their own roles during signup
);

-- 3. Allow admins to update roles
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
CREATE POLICY "Admins can update roles" 
ON user_roles 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. Allow admins to delete roles (for removing assessors)
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
CREATE POLICY "Admins can delete roles" 
ON user_roles 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
