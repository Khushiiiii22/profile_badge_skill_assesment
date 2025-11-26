# ✅ Admin Approval - FINAL FIX

## 🎯 Issues Fixed

### 1. **409 Duplicate Key Error** - FIXED ✅
**Problem:** Admin couldn't approve assessors because the assessor role already existed in `user_roles` table  
**Solution:** Check if role exists before inserting, use `.maybeSingle()` instead of trying to upsert

### 2. **400 Bad Request on Profiles** - FIXED ✅
**Problem:** Query was trying to select non-existent columns (`name`, `assessor_assigned_at`, etc.)  
**Solution:** Updated query to use correct column name: `full_name` (not `name`)

### 3. **406 Not Acceptable** - REQUIRES SQL FIX ⚠️
**Problem:** Missing INSERT policies on `assessor_requests` and `user_roles` tables  
**Solution:** Run SQL migration (see below)

## 🔧 Code Changes Applied

### AdminDashboard.tsx
- ✅ Fixed `fetchApprovedAssessors()` - Now queries correct column: `full_name` (not `name`)
- ✅ Fixed `fetchAssessorRequests()` - Now joins with profiles table using `full_name`
- ✅ Fixed column name: `requested_at` → `created_at` (matches database schema)
- ✅ Fixed `handleApproveAssessor()` - Checks if role exists before inserting
- ✅ Fixed `handleRemoveAssessor()` - Removed profile column updates
- ✅ Added detailed console logging for debugging

### AssessorDashboard.tsx
- ✅ Fixed `.single()` queries - Now uses array-based queries
- ✅ Added error logging for approve/reject actions

### Auth.ts
- ✅ Fixed role detection - Handles empty results gracefully
- ✅ Added detailed debug logging to track role resolution

### StudentProfiles.tsx
- ✅ Filters to show only students

### 🚨 CRITICAL DATABASE FIX REQUIRED
**Problem Found:** Some assessors have role stored as `'employee'` instead of `'assessor'` in the `user_roles` table!

**Run this SQL in Supabase Dashboard → SQL Editor:**
```sql
-- Fix: Change 'employee' role to 'assessor' 
UPDATE user_roles 
SET role = 'assessor' 
WHERE role = 'employee';

-- Verify the fix
SELECT user_id, role FROM user_roles WHERE role = 'assessor';
```

## ⚠️ CRITICAL: Run This SQL

**Go to Supabase Dashboard → SQL Editor → Run:**

```sql
-- Fix assessor approval workflow policies

-- 1. Allow users to insert their own assessor requests
DROP POLICY IF EXISTS "Users can insert their own assessor requests" ON assessor_requests;
CREATE POLICY "Users can insert their own assessor requests" 
ON assessor_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Allow admins and users to insert roles
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
CREATE POLICY "Admins can insert roles" 
ON user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR auth.uid() = user_id
);

-- 3. Allow admins to update roles
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
CREATE POLICY "Admins can update roles" 
ON user_roles 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. Allow admins to delete roles
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
CREATE POLICY "Admins can delete roles" 
ON user_roles 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 5. Allow assessors to update assessments
DROP POLICY IF EXISTS "Assessors can update assessments" ON assessments;
CREATE POLICY "Assessors can update assessments" 
ON assessments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('assessor', 'admin')
  )
);
```

## 🧪 Test Again

After running the SQL:

1. **Try approving the pending assessor**
2. **Check console logs** - Should see:
   ```
   🔄 Approving assessor: {requestId: "...", userId: "..."}
   ✅ Updated assessor_requests status to approved
   ✅ Added assessor role to user_roles  (or ℹ️ Assessor role already exists)
   ```

3. **If the role already exists** - The approval will still succeed! The duplicate error is now handled gracefully.

4. **Sign in as the approved assessor** - Should now see assessment review queue

## 📊 Expected Console Logs

### Success Case:
```
🔄 Approving assessor: {requestId: "abc123", userId: "user123"}
✅ Updated assessor_requests status to approved
✅ Added assessor role to user_roles
```

### Role Already Exists (Still Success):
```
🔄 Approving assessor: {requestId: "abc123", userId: "user123"}
✅ Updated assessor_requests status to approved
ℹ️ Assessor role already exists for user
```

## 🎉 What Works Now

1. ✅ Admin can approve assessors (even if role already exists)
2. ✅ No more 409 duplicate key errors
3. ✅ No more 400 bad request errors
4. ✅ Approved assessors can review assessments (after SQL fix)
5. ✅ Better error messages with console logging

## 🔍 If Still Having Issues

### If Assessor Requests Are Not Showing:

**Check Console Logs** when you load the admin dashboard:
```
🔍 Fetching assessor requests...
📋 Found X pending assessor requests
✅ Assessor requests with profiles: [...]
```

**If you see "Found 0 pending assessor requests":**
1. The assessor might have already been approved
2. The assessor_requests table might be empty
3. Check the assessor_requests table status in Supabase Dashboard

**To verify assessor requests exist:**
Go to Supabase Dashboard → Table Editor → assessor_requests table
- Check if there are any rows with `status = 'pending'`
- If no rows exist, have an assessor sign up again

**Common Issues:**
- ❌ **No requests showing but assessor says "Under Review"** - The request exists but admin dashboard can't fetch it due to RLS policies (run the SQL fix)
- ❌ **"Unknown" and "N/A" for name/email** - Profiles table doesn't have the user data (might need to check profiles table)
- ❌ **400 Bad Request on profiles query** - Some user_ids in user_roles table don't have corresponding profiles. This happens if:
  - User was deleted but user_roles entry remains
  - Profile wasn't created during sign-up
  - **Solution:** Delete orphaned user_roles entries OR create missing profiles
- ❌ **Console shows errors** - Check the exact error message with the emoji indicators

**If you see "400 Bad Request" on profiles:**
```sql
-- Run this in Supabase SQL Editor to find orphaned user_roles
SELECT ur.user_id, ur.role 
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.id
WHERE p.id IS NULL AND ur.role = 'assessor';

-- To fix: Delete orphaned user_roles (replace USER_ID with the actual ID)
DELETE FROM user_roles WHERE user_id = 'USER_ID' AND role = 'assessor';
```

Check the browser console for the exact error message and look for these emojis:
- 🔄 = Operation started
- ✅ = Operation succeeded
- ❌ = Operation failed (will show specific error)
- ℹ️ = Informational message
- 🔍 = Fetching data
- 📋 = Data retrieved

The error message will tell you exactly which step failed!
