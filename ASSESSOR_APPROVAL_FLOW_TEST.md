# Assessor Approval Flow - Complete Test Guide

## ✅ Expected Behavior

### **When an assessor signs up:**
1. They see a **"Pending Approval"** message on the Assessor Dashboard
2. They **cannot** review student assessments
3. A notification explains they need admin approval

### **When admin approves:**
1. Admin sees the assessor request in the Admin Dashboard
2. Admin clicks "Approve" button
3. Assessor's status changes to "approved"

### **After approval:**
1. Assessor refreshes their dashboard
2. They now see the **full Assessor Dashboard** with:
   - Statistics cards (Pending Reviews, Approved, Rejected, Total)
   - List of student assessments to review
   - Approve/Reject buttons for each assessment

---

## 🧪 Complete Test Workflow

### **Step 1: Run Database Fixes**

Before testing, run these SQL commands in Supabase Dashboard → SQL Editor:

```sql
-- Fix current user (replace USER_ID with actual assessor user ID)
DELETE FROM public.user_roles 
WHERE user_id = 'e2bec815-4b81-4ec9-8b03-4a441f939a80' 
AND role = 'employee';

INSERT INTO public.user_roles (user_id, role)
VALUES ('e2bec815-4b81-4ec9-8b03-4a441f939a80', 'assessor')
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.assessor_requests
SET status = 'pending'
WHERE user_id = 'e2bec815-4b81-4ec9-8b03-4a441f939a80';
```

### **Step 2: Test Assessor Sign-Up Flow**

1. **Sign Out** (if logged in)
2. Go to **Sign Up** page
3. Fill in:
   - Name: "Test Assessor"
   - Email: "assessor@test.com"
   - Password: "Test123!"
   - Role: Select **"Assessor"**
4. Click **"Sign Up"**

**Expected Result:**
- ✅ User account created
- ✅ Redirects to `/assessor-dashboard`
- ✅ Shows **"Assessor Application Pending"** card with:
  - Yellow clock icon
  - "Your assessor application is currently under review"
  - "What happens next?" section
  - Cannot see assessment list

**Check Console Logs:**
```
✅ User created: [user-id]
✅ Inserted user role: assessor
✅ Created assessor request
🔍 Checking assessor approval status for user: [user-id]
📊 Assessor requests data: [{status: 'pending'}]
✅ Found assessor request with status: pending
⏸️ Status is not approved, stopping here
```

### **Step 3: Test Admin Approval**

1. **Sign Out** from assessor account
2. **Sign In** as **admin**
3. Go to **Admin Dashboard**
4. Look for **"Assessor Applications"** section
5. Find "Test Assessor" in the pending requests list

**Expected Display:**
- Name: Test Assessor
- Email: assessor@test.com
- Status: Pending
- Actions: [Approve] [Reject] buttons

6. Click **"Approve"** button

**Expected Result:**
- ✅ Success toast: "Assessor Approved"
- ✅ Assessor disappears from pending list
- ✅ Appears in "Active Assessors" section

**Check Console Logs:**
```
🔄 Approving assessor: {requestId: '...', userId: '...'}
✅ Updated assessor_requests status to approved
✅ Added assessor role to user_roles (or "already exists")
```

### **Step 4: Test Assessor After Approval**

1. **Sign Out** from admin account
2. **Sign In** as the assessor ("assessor@test.com")

**Expected Result:**
- ✅ Redirects to `/assessor-dashboard`
- ✅ Shows **FULL Assessor Dashboard** with:
  - **Header**: "Assessor Dashboard" + Sign Out button
  - **Stats Cards**:
    - Pending Reviews: [count]
    - Approved: [count]
    - Rejected: [count]
    - Total Assessments: [count]
  - **Tabs**: "Pending Assessments" | "All Assessments"
  - **Assessment Table**: List of student assessments with Approve/Reject buttons

**Check Console Logs:**
```
🔍 Checking assessor approval status for user: [user-id]
📊 Assessor requests data: [{status: 'approved'}]
✅ Found assessor request with status: approved
🎉 Status is approved! Continuing to fetch assessments...
```

### **Step 5: Test Assessment Approval**

1. In the **Pending Assessments** tab, find a student assessment
2. Click **"Approve"** button

**Expected Result:**
- ✅ Success toast: "Assessment Approved"
- ✅ Assessment status changes to "Completed"
- ✅ Assessment moves out of pending list

3. Click **"Reject"** button on another assessment
4. Enter rejection reason
5. Click **"Reject Assessment"**

**Expected Result:**
- ✅ Success toast: "Assessment Rejected"
- ✅ Assessment status changes to "Rejected"

---

## 🎯 UI Screenshots Reference

### Pending State (Before Approval)
```
┌─────────────────────────────────────────┐
│  Assessor Dashboard       [Sign Out]   │
├─────────────────────────────────────────┤
│                                         │
│    ┌───────────────────────────────┐   │
│    │         🕐 (yellow)           │   │
│    │                               │   │
│    │  Assessor Application Pending │   │
│    │                               │   │
│    │  Your assessor application is │   │
│    │  currently under review by    │   │
│    │  the admin team.              │   │
│    │                               │   │
│    │  What happens next?           │   │
│    │  ✓ An admin will review...   │   │
│    │  ✓ You'll receive notification│   │
│    │  ✓ After approval, you can... │   │
│    │                               │   │
│    │  This usually takes 24-48 hrs │   │
│    └───────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Approved State (After Approval)
```
┌─────────────────────────────────────────┐
│  Assessor Dashboard       [Sign Out]   │
│  Review and verify student assessments  │
├─────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │  5  │ │  3  │ │  1  │ │  9  │      │
│  │Pend.│ │Appr.│ │Rej. │ │Total│      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
├─────────────────────────────────────────┤
│  [Pending] [All Assessments]           │
├─────────────────────────────────────────┤
│  Student    │ Skill         │ Status   │
│  John Doe   │ Leadership    │ Pending  │
│  jane@...   │               │ [Approve]│
│             │               │ [Reject] │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Assessor sees blank dashboard
**Solution:** Run `FIX_CURRENT_USER.sql` to fix role

### Issue: Still shows "Pending" after admin approval
**Solution:** 
1. Check `assessor_requests` table - status should be 'approved'
2. Refresh the page (hard refresh: Cmd+Shift+R)
3. Sign out and sign in again

### Issue: 409 Conflict on sign-up
**Solution:** 
1. Run the trigger migration: `20251126000000_fix_auth_trigger_and_roles.sql`
2. This adds `ON CONFLICT DO NOTHING` to prevent duplicates

### Issue: getHighestRole returns 'student' instead of 'assessor'
**Solution:** 
1. Check `user_roles` table
2. Delete any 'employee' roles
3. Ensure 'assessor' role exists

---

## ✅ Success Checklist

- [ ] Assessor sign-up creates `assessor_requests` with status='pending'
- [ ] Assessor redirects to `/assessor-dashboard` after sign-up
- [ ] Assessor sees "Pending Approval" message (NOT full dashboard)
- [ ] Admin can see pending assessor request
- [ ] Admin can approve assessor request
- [ ] After approval, `assessor_requests.status` = 'approved'
- [ ] Assessor can refresh and see full dashboard
- [ ] Assessor can approve/reject student assessments
- [ ] No 409 errors in console
- [ ] No 'employee' roles in database

---

## 📝 Database State Reference

### After Sign-Up (Pending State)
```sql
-- user_roles table
user_id: e2bec815-4b81-4ec9-8b03-4a441f939a80
role: assessor

-- assessor_requests table
user_id: e2bec815-4b81-4ec9-8b03-4a441f939a80
status: pending
reviewed_at: NULL
reviewed_by: NULL
```

### After Admin Approval (Approved State)
```sql
-- user_roles table (no change)
user_id: e2bec815-4b81-4ec9-8b03-4a441f939a80
role: assessor

-- assessor_requests table (updated)
user_id: e2bec815-4b81-4ec9-8b03-4a441f939a80
status: approved
reviewed_at: 2025-11-26 14:30:00
reviewed_by: [admin-user-id]
```

---

## 🎉 Final Notes

The complete flow is now implemented:
1. ✅ Assessor sign-up → Pending state
2. ✅ Admin approval → Updates status
3. ✅ Assessor sees approved dashboard → Can review assessments

All fixes are in place and ready to test! 🚀
