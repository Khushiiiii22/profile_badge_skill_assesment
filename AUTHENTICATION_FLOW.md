# SkillN Authentication & User Flow Documentation

## Overview
This document outlines the complete authentication and user management flow for the SkillN platform.

## User Roles
The system supports three main roles:
1. **Student** - Users who take assessments
2. **Assessor** - Users who evaluate student assessments (requires admin approval)
3. **Admin** - System administrators who manage assessors and oversee the platform

## Sign Up Flow

### Student Sign Up
1. User selects "Student" role during registration
2. System creates:
   - Auth user account
   - Profile entry in `profiles` table
   - Role entry in `user_roles` table with role='student'
3. User is immediately redirected to `/my-skill-profile` (Student Dashboard)
4. Student profile becomes visible in `/profiles` (Student Profiles view)

### Assessor Sign Up
1. User selects "Assessor" role during registration
2. System creates:
   - Auth user account
   - Profile entry in `profiles` table
   - Role entry in `user_roles` table with role='assessor'
   - Pending request in `assessor_requests` table with status='pending'
3. User is redirected to `/auth` with a message: "Your assessor account is pending admin approval"
4. **Assessor CANNOT access assessment features until admin approval**

## Sign In Flow

### Role Selection at Sign In
Users can choose how to sign in:
- **Use assigned role** (default) - Automatically detects user's highest role
- **Student** - View platform as a student
- **Assessor** - View platform as an assessor (only if approved)

### Automatic Role Detection
The system uses `getHighestRole()` function with this priority:
1. Admin (highest priority)
2. Assessor (if approved)
3. Student (default)

### Redirects After Sign In
- **Admin** → `/admin` (Admin Dashboard)
- **Assessor** (approved) → `/assessor-dashboard` (Assessor Dashboard)
- **Student** → `/my-skill-profile` (Student Dashboard)
- **Assessor** (pending/unapproved) → Denied access with toast notification

## Admin Approval Flow

### Approving Assessors
1. Admin logs in and navigates to Admin Dashboard (`/admin`)
2. Views pending assessor requests in the "Assessor Management" tab
3. Admin can:
   - **Approve**: Updates `assessor_requests.status` to 'approved', adds/confirms role in `user_roles`
   - **Reject**: Updates `assessor_requests.status` to 'rejected'

### After Approval
1. Assessor must **sign out and sign back in** for role to take effect
2. On next sign-in, `getHighestRole()` will detect 'assessor' role
3. Assessor is redirected to `/assessor-dashboard`

## Assessor Capabilities (Post-Approval)

### Assessment Review
Assessors can:
1. View all student assessments awaiting review
2. See assessment details (student name, skill, score, school, etc.)
3. **Accept** assessments:
   - Sets `assessment.status` to 'approved'
   - Sets `assessment.approved` to true
   - Records approval timestamp and assessor ID
4. **Reject** assessments:
   - Sets `assessment.status` to 'rejected'
   - Requires rejection reason
   - Student can request re-examination

### Dashboard Features
- View pending assessments
- View all student assessment profiles
- Track approved/rejected counts
- Filter by status

## Student Profile Visibility

### Public Profile View (`/profiles`)
- All registered student profiles are visible
- Shows:
  - Student name
  - Assessment history
  - Certification status
  - Skills assessed
  - Scores and badges

### Private Student Dashboard (`/my-skill-profile`)
Students can:
- View their own assessment history
- Request new assessments
- Track pending assessments
- View earned certificates and badges
- See rejection reasons (if any)

## Database Schema Summary

### Key Tables
1. **profiles**
   - `id` (user ID)
   - `email`
   - `full_name`
   - `assessment_access` (boolean)

2. **user_roles**
   - `user_id`
   - `role` ('admin' | 'student' | 'assessor')
   - `created_at`

3. **assessor_requests**
   - `user_id`
   - `status` ('pending' | 'approved' | 'rejected')
   - `reviewed_at`
   - `reviewed_by`

4. **assessments**
   - Student assessment data
   - `status`, `score`, `approved`, etc.
   - `assessor_id` (who approved/rejected)

## Security & Access Control

### Route Protection
- `/admin` - Protected by `AdminRoute` component
- `/assessor-dashboard` - Protected by `AssessorRoute` component
- `/my-skill-profile` - Available to all authenticated users

### Role Verification
- All role checks use centralized `getHighestRole()` function
- Checks both `user_roles` table for authoritative role data
- Session-based role selection stored in `sessionStorage` for UX

## Common Issues & Solutions

### Issue: Assessor sees student dashboard after sign-in
**Solution**: 
1. Verify `user_roles` table has entry with role='assessor' for that user
2. Ensure assessor was approved by admin
3. User must sign out and sign back in after approval
4. Check browser console for role resolution logs

### Issue: Student profile not visible in /profiles
**Solution**:
1. Ensure profile was created during sign-up
2. Check `profiles` table has entry for that user
3. Verify `/profiles` route is accessible

## Testing Checklist

- [ ] Student sign-up creates profile and redirects to student dashboard
- [ ] Assessor sign-up creates pending request
- [ ] Unapproved assessor cannot access assessor dashboard
- [ ] Admin can approve/reject assessor requests
- [ ] Approved assessor can sign in and access assessor dashboard
- [ ] Assessor can accept/reject student assessments
- [ ] Student profiles visible in /profiles page
- [ ] Role selection at sign-in works correctly
- [ ] Access denied messages show for unauthorized access attempts

## File Reference

### Authentication Files
- `src/pages/Auth.tsx` - Sign up/sign in forms and logic
- `src/lib/auth.ts` - Role resolution utility (`getHighestRole`)
- `src/components/AssessorRoute.tsx` - Assessor route protection
- `src/components/AdminRoute.tsx` - Admin route protection

### Dashboard Files
- `src/pages/MySkillProfile.tsx` - Student dashboard
- `src/pages/AssessorDashboard.tsx` - Assessor dashboard
- `src/pages/AdminDashboard.tsx` - Admin dashboard
- `src/pages/StudentProfiles.tsx` - Public student profiles view

## Contact & Support
For issues or questions about the authentication flow, check:
1. Browser console logs (role resolution is logged)
2. Supabase dashboard (verify database entries)
3. This documentation for expected behavior
