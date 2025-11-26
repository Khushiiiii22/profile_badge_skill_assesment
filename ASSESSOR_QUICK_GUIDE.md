# Quick Setup Guide for Assessors

## For New Assessors

### Step 1: Sign Up
1. Go to the SkillN auth page
2. Click "Sign Up" tab
3. Enter your details
4. **Important**: Select "Assessor" as Account Type
5. Click "Sign Up"

### Step 2: Wait for Approval
- You'll see: "Your assessor account is pending admin approval"
- You'll be redirected to the sign-in page
- **You cannot access assessor features yet**
- Wait for admin to approve your request

### Step 3: After Admin Approval
1. Admin will approve your request in the Admin Dashboard
2. **Sign out** (if signed in)
3. **Sign back in** with your credentials
4. Select "Use assigned role" or "Assessor" when signing in
5. You'll be redirected to the Assessor Dashboard

## For Admins Approving Assessors

### Approval Process
1. Sign in to admin account
2. Go to Admin Dashboard (`/admin`)
3. Click "Assessor Management" tab
4. View pending assessor requests
5. Click "Approve" for the assessor
6. System automatically:
   - Updates assessor_requests status to 'approved'
   - Confirms role in user_roles table
   - Sets approval timestamp

### Important Notes
- Assessor must sign out and sign back in after approval
- Approved assessors can immediately access `/assessor-dashboard`
- You can also reject requests or remove assessor privileges

## For Students

### Simple Process
1. Sign up with "Student" account type
2. Immediately access your profile at `/my-skill-profile`
3. Take assessments
4. View your profile in the public `/profiles` page

## Troubleshooting

### "Access Denied" when trying to access Assessor Dashboard
**Check:**
1. Was your assessor request approved by admin?
2. Did you sign out and sign back in after approval?
3. Did you select "Assessor" or "Use assigned role" when signing in?

**Solution:**
- Ask admin to check approval status
- Sign out completely
- Sign back in
- Check browser console for role resolution logs

### Still seeing Student Dashboard as an Assessor
**Database Check (for admins):**
```sql
-- Check if user has assessor role
SELECT * FROM user_roles WHERE user_id = '<USER_ID>';

-- If missing, add it:
INSERT INTO user_roles (user_id, role) 
VALUES ('<USER_ID>', 'assessor');
```

**User Action:**
- Clear browser cache
- Sign out completely  
- Sign back in
- Check sessionStorage: `sessionStorage.getItem('auth:desiredRole')`

## Database Quick Reference

### Check User Role
```sql
SELECT ur.role, ar.status as assessor_status
FROM user_roles ur
LEFT JOIN assessor_requests ar ON ur.user_id = ar.user_id
WHERE ur.user_id = '<USER_ID>';
```

### Manually Approve Assessor
```sql
-- Update assessor request
UPDATE assessor_requests 
SET status = 'approved', reviewed_at = now()
WHERE user_id = '<USER_ID>';

-- Ensure role exists
INSERT INTO user_roles (user_id, role)
VALUES ('<USER_ID>', 'assessor')
ON CONFLICT (user_id, role) DO NOTHING;
```

### View All Pending Assessor Requests
```sql
SELECT ar.*, p.full_name, p.email
FROM assessor_requests ar
JOIN profiles p ON ar.user_id = p.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at DESC;
```

## Sign-In Role Selection

### Three Options:
1. **Use assigned role** (Recommended)
   - Automatically detects highest role
   - Priority: Admin > Assessor > Student

2. **Student**
   - Always view as student
   - Useful for assessors who want to see student experience

3. **Assessor**
   - Only works if you have assessor privileges
   - Shows "Access Denied" if not approved

## Contact
For technical issues, check:
- Browser console (F12) for detailed logs
- `AUTHENTICATION_FLOW.md` for complete documentation
- Supabase dashboard for database state
