# Authentication & Sign-Up Fixes

## Issues Found

### 1. **409 Conflict Error on Sign-Up**
- **Problem**: Manual profile insert conflicted with automatic trigger
- **Root Cause**: `handle_new_user()` trigger automatically creates profile when user signs up
- **Fix**: Removed manual profile insert from `Auth.tsx`, now only updates `full_name` after trigger runs

### 2. **'employee' Role in Database**
- **Problem**: User has 'employee' role instead of proper role (student/assessor/admin)
- **Impact**: `getHighestRole()` doesn't recognize 'employee', defaults to 'student'
- **Fix**: SQL migration to delete all 'employee' roles

### 3. **Outdated Database Trigger**
- **Problem**: `handle_new_user()` trigger tries to insert columns that don't exist (`name`, `mobile`, `age`)
- **Current Schema**: Profiles table only has: `id`, `full_name`, `email`, `contact`, `avatar_url`
- **Fix**: Updated trigger to use correct columns with `ON CONFLICT DO NOTHING`

## Files Changed

### 1. `src/pages/Auth.tsx`
**Changed**: `handleSignUp()` function
- ❌ **Before**: Manually inserted into `profiles` table → 409 conflict
- ✅ **After**: Waits for trigger, then updates `full_name`
- Still inserts into `user_roles` (correct)
- Still creates `assessor_requests` if role is assessor (correct)

### 2. SQL Migrations Created

#### `FIX_CURRENT_USER.sql` (Run this FIRST)
Quick fix for the current user experiencing issues:
- Deletes 'employee' role
- Ensures 'assessor' role exists
- Updates/creates assessor_request with 'approved' status

#### `supabase/migrations/20251126000000_fix_auth_trigger_and_roles.sql`
Comprehensive fix for all users:
- Deletes all 'employee' roles
- Updates `handle_new_user()` trigger with correct columns
- Adds `ON CONFLICT DO NOTHING` to prevent 409 errors
- Adds default 'student' role to users without roles
- Fixes profiles missing `full_name`

## How to Apply Fixes

### Immediate Fix (For Current User)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `FIX_CURRENT_USER.sql`
4. Refresh browser
5. Sign in again

### Permanent Fix (For All Users)
1. Open Supabase Dashboard
2. Go to Database > Migrations
3. Upload `20251126000000_fix_auth_trigger_and_roles.sql`
4. Or run it in SQL Editor

## Expected Behavior After Fix

### Sign-Up Flow
1. User submits sign-up form
2. Supabase Auth creates user account
3. **Trigger** automatically creates profile with basic info
4. **Frontend** updates profile with full_name
5. **Frontend** creates user_role entry
6. **Frontend** creates assessor_request (if assessor)
7. User redirected based on role

### No More Conflicts
- ✅ No 409 errors on profile creation
- ✅ Correct role assignment
- ✅ Assessor approval workflow works
- ✅ getHighestRole() returns correct role

## Testing Checklist

- [ ] Sign up as student → redirects to `/my-skill-profile`
- [ ] Sign up as assessor → redirects to `/assessor-dashboard` with pending state
- [ ] Admin approves assessor → assessor sees approved state
- [ ] No 409 errors in console
- [ ] No 'employee' roles in database
- [ ] All users have at least one role in `user_roles`

## Database Schema Reference

### `profiles` table
- `id` (uuid, primary key)
- `full_name` (text)
- `email` (text)
- `contact` (text, nullable)
- `avatar_url` (text, nullable)

### `user_roles` table
- `id` (uuid, primary key)
- `user_id` (uuid, **UNIQUE** - prevents duplicates)
- `role` (text: 'student' | 'assessor' | 'admin')

### `assessor_requests` table
- `id` (uuid, primary key)
- `user_id` (uuid)
- `status` (text: 'pending' | 'approved' | 'rejected')
- `created_at` (timestamptz)
- `reviewed_at` (timestamptz, nullable)
- `reviewed_by` (uuid, nullable)
