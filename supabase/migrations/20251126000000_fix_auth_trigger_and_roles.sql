-- Fix authentication trigger and clean up roles
-- Date: 2025-11-26

-- 1. Delete all 'employee' roles (incorrect role type)
DELETE FROM public.user_roles WHERE role = 'employee';

-- 2. Update the handle_new_user trigger to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if profile doesn't already exist (prevent 409 conflicts)
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Add student role to all users who don't have any role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'student'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Fix any profiles missing full_name (use email as fallback)
UPDATE public.profiles
SET full_name = email
WHERE full_name IS NULL OR full_name = '';
