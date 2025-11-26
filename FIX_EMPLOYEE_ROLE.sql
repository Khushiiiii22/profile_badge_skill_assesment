-- Fix: Change 'employee' role to 'assessor' for users who should be assessors
-- This fixes the issue where assessors were incorrectly stored as 'employee'

-- Step 1: Check what roles exist for the user
SELECT user_id, role 
FROM user_roles 
WHERE user_id = '125d9c2d-be07-4346-be54-30cfc58d7f40';

-- Step 2: DELETE the 'employee' role (since 'assessor' already exists)
DELETE FROM user_roles 
WHERE user_id = '125d9c2d-be07-4346-be54-30cfc58d7f40' 
AND role = 'employee';

-- Step 3: Verify the change (should only show 'assessor' and 'student' now)
SELECT user_id, role 
FROM user_roles 
WHERE user_id = '125d9c2d-be07-4346-be54-30cfc58d7f40';

-- Step 4: Create an approved assessor request for this user
INSERT INTO assessor_requests (user_id, status, created_at)
VALUES (
  '125d9c2d-be07-4346-be54-30cfc58d7f40', 
  'approved',
  NOW()
);

-- Step 5: Verify the assessor request was created
SELECT * FROM assessor_requests WHERE user_id = '125d9c2d-be07-4346-be54-30cfc58d7f40';

-- Optional: Delete ALL 'employee' roles (if employee role shouldn't exist at all)
-- DELETE FROM user_roles WHERE role = 'employee';
