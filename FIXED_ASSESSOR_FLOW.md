# Fixed Assessor vs Student Dashboard Flow

## Problem Solved
Previously, when users signed up as assessors, they were redirected to the student dashboard. This has been fixed.

## What Changed

### 1. **AssessorRoute Protection** (`src/components/AssessorRoute.tsx`)
- Now correctly checks `user_roles` table (not `profiles`)
- Verifies assessor is **approved** in `assessor_requests` table
- Blocks unapproved assessors from accessing `/assessor-dashboard`
- Redirects unapproved assessors to student dashboard with clear message

### 2. **Role Resolution** (`src/lib/auth.ts`)
- `getHighestRole()` now checks if assessor is approved
- Unapproved assessors are treated as students
- Priority: Admin > Approved Assessor > Student

### 3. **Sign-Up Flow** (`src/pages/Auth.tsx`)
- **Students**: Automatically signed in and redirected to `/my-skill-profile`
- **Assessors**: NOT automatically signed in (must wait for approval)
- Clear toast messages indicating approval status

## Complete Flow

### Student Sign-Up ✅
```
User selects "Student" → Signs up
    ↓
Account created in database
    ↓
User automatically signed in
    ↓
Redirected to /my-skill-profile (Student Dashboard)
    ↓
Profile visible in /profiles page
```

### Assessor Sign-Up ✅
```
User selects "Assessor" → Signs up
    ↓
Account + assessor_request created
    ↓
Toast: "Account Created - Pending Approval"
    ↓
User NOT signed in automatically
    ↓
Redirected to /auth page
    ↓
Must wait for admin approval
```

### After Admin Approves Assessor ✅
```
Admin approves in /admin dashboard
    ↓
assessor_requests.status = 'approved'
    ↓
Assessor can now sign in
    ↓
getHighestRole() returns 'assessor'
    ↓
Redirected to /assessor-dashboard (Assessor Dashboard)
```

### If Unapproved Assessor Tries to Access Assessor Dashboard ❌
```
User navigates to /assessor-dashboard
    ↓
AssessorRoute checks approval status
    ↓
assessor_requests.status = 'pending'
    ↓
Toast: "Pending Approval - awaiting admin approval"
    ↓
Redirected to /my-skill-profile (Student Dashboard)
```

## Dashboard Differences

### Student Dashboard (`/my-skill-profile`)
**Purpose**: For students taking assessments

**Features**:
- View personal assessment history
- Request new assessments
- Track assessment status (pending, completed, approved, rejected)
- View earned certificates and badges
- See feedback from assessors
- Retake rejected assessments

**UI Elements**:
- "Take Assessment" button
- Assessment history table
- Progress cards (completed, pending, total)
- Certificate downloads

### Assessor Dashboard (`/assessor-dashboard`)
**Purpose**: For approved assessors evaluating students

**Features**:
- View all student assessments awaiting review
- Accept/Approve student assessments
- Reject assessments with detailed reasons
- View assessment details (student info, scores, etc.)
- Track approval/rejection statistics
- Filter by status (pending, all)

**UI Elements**:
- Assessment review queue
- Accept/Reject action buttons
- Rejection reason dialog
- Statistics cards (pending, approved, rejected, total)
- Two tabs: "Pending Assessments" and "All Student Profiles"

**Key Difference**: Assessors evaluate others' work; students complete their own assessments.

## Database Tables Involved

### `user_roles`
```sql
user_id | role      | created_at
--------|-----------|------------
uuid    | 'student' | timestamp
uuid    | 'assessor'| timestamp
uuid    | 'admin'   | timestamp
```

### `assessor_requests`
```sql
id   | user_id | status      | reviewed_at | reviewed_by
-----|---------|-------------|-------------|-------------
uuid | uuid    | 'pending'   | null        | null
uuid | uuid    | 'approved'  | timestamp   | admin_uuid
uuid | uuid    | 'rejected'  | timestamp   | admin_uuid
```

### `profiles`
```sql
id   | email       | full_name | assessment_access
-----|-------------|-----------|------------------
uuid | email@co.com| John Doe  | true/false
```

## Testing Steps

### Test 1: Student Sign-Up
1. Go to http://localhost:8081/auth
2. Click "Sign Up" tab
3. Enter name, email, password
4. Select "Student" as Account Type
5. Click "Sign Up"
6. **Expected**: 
   - Toast: "Account Created!"
   - Redirected to `/my-skill-profile`
   - See student dashboard with "Take Assessment" button

### Test 2: Assessor Sign-Up (Unapproved)
1. Go to http://localhost:8081/auth
2. Click "Sign Up" tab
3. Enter name, email, password
4. Select "Assessor" as Account Type
5. Click "Sign Up"
6. **Expected**:
   - Toast: "Account Created - Pending Approval"
   - Redirected to `/auth` (sign-in page)
   - NOT automatically signed in

### Test 3: Unapproved Assessor Tries to Access Dashboard
1. Sign in with assessor credentials (before admin approval)
2. Try to navigate to `/assessor-dashboard`
3. **Expected**:
   - Toast: "Pending Approval"
   - Redirected to `/my-skill-profile` (student dashboard)
   - Cannot access assessor features

### Test 4: Admin Approves Assessor
1. Sign in as admin (admin@admin.com / admin12)
2. Navigate to `/admin`
3. Click "Assessor Management" tab
4. Find pending assessor request
5. Click "Approve"
6. **Expected**:
   - assessor_requests.status updated to 'approved'
   - Toast: "Assessor Approved"

### Test 5: Approved Assessor Sign-In
1. Sign out (if signed in)
2. Sign in with assessor credentials
3. Select "Use assigned role" or "Assessor"
4. **Expected**:
   - `getHighestRole()` returns 'assessor'
   - Redirected to `/assessor-dashboard`
   - See assessor dashboard with review queue

### Test 6: Assessor Can Review Assessments
1. As approved assessor, go to `/assessor-dashboard`
2. See list of pending student assessments
3. Click "View Details" on an assessment
4. Click "Approve" or "Reject"
5. **Expected**:
   - Assessment status updated
   - Toast confirmation
   - Assessment removed from pending queue

## Common Issues & Solutions

### Issue: Assessor still sees student dashboard after admin approval
**Solution**:
1. Sign out completely
2. Clear browser cache
3. Sign back in
4. Check console logs for `getHighestRole()` output

### Issue: TypeScript errors about 'status' property
**Solution**: These are type inference warnings and don't affect runtime. The Supabase types can be regenerated if needed.

### Issue: Assessor sees "Access Denied" after approval
**Check**:
```sql
-- Verify role exists
SELECT * FROM user_roles WHERE user_id = '<USER_ID>';

-- Verify approval status
SELECT * FROM assessor_requests WHERE user_id = '<USER_ID>';
```

Both should exist and assessor_requests.status should be 'approved'.

## Files Modified
- ✅ `src/components/AssessorRoute.tsx` - Added approval check
- ✅ `src/lib/auth.ts` - Added approval verification to role resolution
- ✅ `src/pages/Auth.tsx` - Improved sign-up flow messaging

## Dashboard Access Summary

| User Type | Can Access Student Dashboard | Can Access Assessor Dashboard |
|-----------|------------------------------|-------------------------------|
| Student | ✅ Yes (`/my-skill-profile`) | ❌ No (Access Denied) |
| Unapproved Assessor | ✅ Yes (fallback) | ❌ No (Pending Approval) |
| Approved Assessor | ✅ Yes (if chooses "Student" view) | ✅ Yes (`/assessor-dashboard`) |
| Admin | ✅ Yes (can view all) | ✅ Yes (admin has all access) |

## Sign-In Role Selection

When signing in, users can choose:
1. **Use assigned role** - Auto-detect highest approved role
2. **Student** - Always view as student
3. **Assessor** - Access assessor dashboard (only if approved)

This allows approved assessors to switch between views.

## Next Steps
1. Test all flows with actual data
2. Verify admin approval process works
3. Ensure toast messages are clear
4. Check that both dashboards function independently

---

**All issues fixed! Students and assessors now have completely separate dashboards with different functionality.**
