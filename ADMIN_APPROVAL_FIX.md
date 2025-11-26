# Admin Approval Fix - Manual Migration Required

## Issue
Admin dashboard was showing errors when trying to approve/reject assessors due to:
1. Missing INSERT policy on `assessor_requests` table (causing 406 errors)
2. References to non-existent columns in `profiles` table

## Fixes Applied

### 1. Database Migration (MANUAL ACTION REQUIRED)
A new migration file was created: `supabase/migrations/20251126000000_add_assessor_request_insert_policy.sql`

**You need to apply this migration manually via Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor**
3. Run the following SQL:

```sql
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
```

### 2. Code Fixes (Already Applied)

#### AdminDashboard.tsx
- ✅ Changed `requested_at` to `created_at` (matching actual database schema)
- ✅ Removed non-existent profile columns: `assessor_assigned_at`, `assessor_assigned_by`, `assessment_count`
- ✅ Updated `fetchAssessorRequests()` to join with profiles table to get user details
- ✅ Simplified UI to remove "Assigned Date" column (no longer tracked)
- ✅ Added type assertions (`as any`) to bypass Supabase TypeScript inference issues

#### auth.ts
- ✅ Fixed `.single()` query causing 406 errors - now uses array-based query
- ✅ Always returns `'assessor'` role for users with assessor role (regardless of approval status)
- ✅ Dashboard handles pending/approved/rejected state display

## How It Works Now

### Assessor Sign-up Flow:
1. User signs up with assessor role
2. Creates profile in `profiles` table
3. Inserts role into `user_roles` table
4. **Creates request in `assessor_requests` table** ← This was failing with 406, now fixed
5. Auto signs in and redirects to `/assessor-dashboard`
6. Dashboard shows "Pending Approval" message

### Admin Approval Flow:
1. Admin logs in and sees Assessor Requests tab
2. Admin can see all pending requests with user details (name, email, experience)
3. Admin clicks "Approve"
   - Updates `assessor_requests.status` to 'approved'
   - Inserts/updates role in `user_roles` table
4. Assessor can now review student assessments

### Admin Dashboard Features:
- **Overview Tab**: Statistics and quick metrics
- **Assessor Requests Tab**: Approve/reject pending assessor applications
- **Approved Assessors Tab**: View all approved assessors and remove if needed

## Testing After Migration

1. **Apply the SQL migration** (see step 1 above)
2. Sign out and sign up as a new assessor
3. Verify no 406 errors in browser console
4. Check assessor sees pending approval message on dashboard
5. Log in as admin
6. Verify admin can see the pending assessor request
7. Approve the assessor
8. Log in as the assessor again
9. Verify they can now see assessment review queue

## Console Logs to Verify

After applying the migration, you should see these logs:
```
✅ Assessor approved, granting assessor role
```
OR
```
⏳ Assessor not approved yet, will redirect to assessor dashboard with pending state
```

**No more 406 errors!**
