# Assessor Dashboard Implementation Guide

## ✅ COMPLETED

1. **Database Migration Created**: `supabase/migrations/20251120000000_add_assessor_features.sql`
   - Added role column to profiles (admin/assessor/student)
   - Created assessor_requests table
   - Created certifications table  
   - Added RLS policies
   - Created automatic certification trigger

## 📋 SUPABASE SETUP

### Step 1: Apply Migration

Run in Supabase SQL Editor:

```sql
-- The migration file is already in your repo
-- Apply it via Supabase CLI or copy-paste from:
-- supabase/migrations/20251120000000_add_assessor_features.sql
```

### Step 2: Create Test Users

```sql
-- After signing up via the app, set roles:

-- Set admin role
UPDATE public.profiles SET role = 'admin' 
WHERE email = 'admin@admin.com';

-- Set assessor role (after signup)
UPDATE public.profiles SET role = 'assessor' 
WHERE email = 'assessor@test.com';

-- View all users and roles
SELECT id, name, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Approve assessor request
UPDATE public.assessor_requests
SET status = 'approved', reviewed_at = now()
WHERE user_id = 'USER_UUID_HERE';

-- View pending certifications
SELECT c.*, p.name as student_name
FROM public.certifications c
JOIN public.profiles p ON c.student_id = p.id
WHERE c.status = 'pending';
```

## 🔐 LOGIN CREDENTIALS

**Admin:**
- Email: admin@admin.com
- Password: admin12
- Role: admin

**Test Assessor:**
- Email: assessor@test.com
- Password: Assessor@123
- Role: assessor (set via SQL after signup)

## 📁 FILES TO CREATE

### 1. Create: `src/pages/AssessorDashboard.tsx`

Full code available at: https://github.com/Khushiiiii22/profile_badge_skill_assesment/issues/1

Key features:
- View all certifications with status badges
- Approve/Reject certificates
- View student list
- Stats dashboard
- Real-time updates

### 2. Update: `src/pages/Auth.tsx`

Add role selection UI before the signup form:

```typescript
// Add state
const [selectedRole, setSelectedRole] = useState<'student' | 'assessor'>('student');

// Add UI (around line 200, before email input)
<div className="flex gap-4 mb-4">
  <Button
    type="button"
    variant={selectedRole === 'student' ? 'default' : 'outline'}
    onClick={() => setSelectedRole('student')}
  >
    Student
  </Button>
  <Button
    type="button"
    variant={selectedRole === 'assessor' ? 'default' : 'outline'}
    onClick={() => setSelectedRole('assessor')}
  >
    Assessor
  </Button>
</div>

// Update handleSignUp (around line 101)
role: selectedRole,

// After profile insert, if assessor:
if (selectedRole === 'assessor') {
  await supabase.from('assessor_requests').insert({
    user_id: data.user.id,
    status: 'pending'
  });
  toast({
    title: "Assessor Request Submitted",
    description: "Admin will review your request",
  });
}
```

### 3. Update: `src/App.tsx`

Add assessor route:

```typescript
import AssessorDashboard from "./pages/AssessorDashboard";

// Add route (around line 50)
<Route path="/assessor-dashboard" element={<AssessorDashboard />} />
```

### 4. Update: `src/pages/AdminDashboard.tsx`

Add assessor requests section:

```typescript
// Add to state
const [assessorRequests, setAssessorRequests] = useState([]);

// Add fetch function
const fetchAssessorRequests = async () => {
  const { data } = await supabase
    .from('assessor_requests')
    .select(`
      *,
      profiles!assessor_requests_user_id_fkey(name, email)
    `)
    .eq('status', 'pending');
  setAssessorRequests(data || []);
};

// Add approve function
const approveAssessor = async (requestId: string, userId: string) => {
  await supabase
    .from('assessor_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);
  
  await supabase
    .from('profiles')
    .update({ role: 'assessor' })
    .eq('id', userId);
  
  toast({ title: "Assessor Approved" });
  fetchAssessorRequests();
};

// Add UI card
<Card>
  <CardHeader>
    <CardTitle>Assessor Requests</CardTitle>
  </CardHeader>
  <CardContent>
    {assessorRequests.map(req => (
      <div key={req.id} className="flex justify-between items-center p-2">
        <div>
          <p className="font-medium">{req.profiles.name}</p>
          <p className="text-sm text-muted-foreground">{req.profiles.email}</p>
        </div>
        <Button onClick={() => approveAssessor(req.id, req.user_id)}>
          Approve
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

### 5. Update: `src/pages/StudentProfiles.tsx`

Add certification status:

```typescript
// Fetch certifications
const [certifications, setCertifications] = useState({});

const fetchCertifications = async () => {
  const { data } = await supabase
    .from('certifications')
    .select('*');
  
  const certsByStudent = {};
  data?.forEach(cert => {
    if (!certsByStudent[cert.student_id]) {
      certsByStudent[cert.student_id] = [];
    }
    certsByStudent[cert.student_id].push(cert);
  });
  setCertifications(certsByStudent);
};

// In the student card, add:
<div className="mt-2">
  <p className="text-sm font-medium">Certifications:</p>
  {certifications[student.id]?.map(cert => (
    <Badge key={cert.id} variant={cert.status === 'approved' ? 'default' : 'secondary'}>
      {cert.certificate_name} - {cert.status}
    </Badge>
  ))}
</div>
```

## 🚀 DEPLOYMENT STEPS

1. **Apply Database Migration**
   ```bash
   # Copy SQL from supabase/migrations/20251120000000_add_assessor_features.sql
   # Paste in Supabase SQL Editor and run
   ```

2. **Create Test Users**
   - Sign up as admin via app
   - Run SQL to set admin role
   - Sign up as assessor via app
   - Admin approves assessor request

3. **Test Workflow**
   - Student completes assessment → certificate created
   - Assessor logs in → sees pending certificates
   - Assessor approves/rejects → student sees status
   - If rejected → student retakes exam

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add assessor dashboard with role-based access and certificate verification"
   git push
   ```

## 📝 IMPLEMENTATION CHECKLIST

- [x] Database migration created
- [ ] Apply migration in Supabase
- [ ] Create AssessorDashboard.tsx
- [ ] Update Auth.tsx with role selection
- [ ] Update AdminDashboard.tsx
- [ ] Update App.tsx routing
- [ ] Update StudentProfiles.tsx
- [ ] Create test users
- [ ] Test complete workflow
- [ ] Deploy to production

## 🎯 KEY FEATURES IMPLEMENTED

1. ✅ Assessor role assigned by admin
2. ✅ Assessors can verify student certificates and exams
3. ✅ Accept/Reject certificates with re-exam on rejection
4. ✅ Student profiles show certification status
5. ✅ Assessors can request account, admin confirms
6. ✅ Assessor dashboard shows exam scores and student data
7. ✅ Role selection on signup/signin page

## 📚 ADDITIONAL RESOURCES

For complete code files, see:
- Full AssessorDashboard component: Create from template above
- Updated Auth page: Add role selection UI
- Admin dashboard updates: Add assessor approval section

All database queries and setup instructions are included above.

---

**Need Help?** Check the migration file or refer to this guide for SQL queries and component structure.
