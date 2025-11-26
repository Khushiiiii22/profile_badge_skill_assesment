-- Quick fix for current user issues
-- Run this in Supabase Dashboard > SQL Editor
-- User ID: e2bec815-4b81-4ec9-8b03-4a441f939a80

-- 1. Delete the 'employee' role
DELETE FROM public.user_roles 
WHERE user_id = 'e2bec815-4b81-4ec9-8b03-4a441f939a80' 
AND role = 'employee';

-- 2. Ensure assessor role exists
INSERT INTO public.user_roles (user_id, role)
VALUES ('e2bec815-4b81-4ec9-8b03-4a441f939a80', 'assessor')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update assessor_request status to approved
UPDATE public.assessor_requests
SET status = 'approved',
    reviewed_at = NOW()
WHERE user_id = 'e2bec815-4b81-4ec9-8b03-4a441f939a80';

-- 4. If no assessor_request exists, create one
INSERT INTO public.assessor_requests (user_id, status, reviewed_at)
VALUES ('e2bec815-4b81-4ec9-8b03-4a441f939a80', 'approved', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 5. Verify the fix
SELECT 'User Roles:' as info, role FROM public.user_roles WHERE user_id = 'e2bec815-4b81-4ec9-8b03-4a441f939a80'
UNION ALL
SELECT 'Assessor Request:', status FROM public.assessor_requests WHERE user_id = 'e2bec815-4b81-4ec9-8b03-4a441f939a80';
