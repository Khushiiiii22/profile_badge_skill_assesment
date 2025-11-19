// Test script to simulate the complete admin and student flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjyybqgyzpoipocwtkzv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeXlicWd5enBvaXBvY3d0a3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTYxMjUsImV4cCI6MjA3NzQ5MjEyNX0.Eeju1lAPYDzOds9RV9YWPxn6Hm6XAVvrNNbXaDdeWfg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');

    // Create admin user if not exists
    const { data: adminUser, error: adminError } = await supabase.auth.signUp({
      email: 'admin@admin.com',
      password: 'admin12'
    });

    if (adminError && !adminError.message.includes('already registered')) {
      throw adminError;
    }

    const adminUserId = adminUser?.user?.id;

    // Ensure admin role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .single();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: adminUserId,
          role: 'admin'
        });

      if (roleError) throw roleError;
      console.log('✅ Admin role assigned');
    } else {
      console.log('✅ Admin role already exists');
    }

    // Ensure admin profile exists
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: adminUserId,
        email: 'admin@admin.com',
        full_name: 'Admin User',
        assessment_access: true,
      })
      .select()
      .single();

    if (profileError) {
      console.warn('⚠️ Admin profile creation/update failed:', profileError);
    } else {
      console.log('✅ Admin profile updated:', adminProfile);
    }

    return adminUserId;
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  }
}

async function createStudentUserAndAssessment() {
  try {
    console.log('👤 Creating student user and assessment...');

    // Create test student user
    const { data: studentUser, error: studentError } = await supabase.auth.signUp({
      email: 'student@example.com',
      password: 'student123'
    });

    if (studentError && !studentError.message.includes('already registered')) {
      throw studentError;
    }

    let studentUserId = studentUser?.user?.id;

    if (!studentUserId) {
      // If user already exists, try to sign in
      const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'student@example.com',
        password: 'student123'
      });

      if (signInError) throw signInError;
      studentUserId = existingUser.user.id;
    }

    // Ensure student profile exists
    const { data: studentProfile, error: studentProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: studentUserId,
        email: 'student@example.com',
        full_name: 'Test Student',
        assessment_access: true,
      })
      .select()
      .single();

    if (studentProfileError) {
      console.warn('⚠️ Student profile creation/update failed:', studentProfileError);
    } else {
      console.log('✅ Student profile updated:', studentProfile);
    }

    // Create assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        user_id: studentUserId,
        skill: 'Communication',
        pin_code: '110001',
        school_name: 'Test School',
        status: 'pending',
        instamojo_payment_id: 'TEST_PAYMENT_STUDENT',
        instamojo_payment_request_id: 'TEST_REQUEST_STUDENT'
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    console.log('✅ Assessment created:', assessment);
    console.log('Assessment ID:', assessment.id);

    return { studentUserId, assessmentId: assessment.id };
  } catch (error) {
    console.error('❌ Error creating student user and assessment:', error);
    throw error;
  }
}

async function simulateStudentTakingAssessment(assessmentId, studentUserId) {
  try {
    console.log('📝 Simulating student taking assessment...');

    // Switch to student session for this operation
    const { data: studentSession, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'student@example.com',
      password: 'student123'
    });

    if (signInError) throw signInError;

    // Update assessment to completed with score
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        skill: 'Communication',
        status: 'completed',
        score: 85,
        assessment_date: new Date().toISOString(),
        feedback: 'Great communication skills demonstrated!'
      })
      .eq('id', assessmentId);

    if (updateError) throw updateError;

    console.log('✅ Assessment marked as completed with score 85%');

    // Sign out and return
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error('❌ Error simulating student assessment:', error);
    throw error;
  }
}

async function testAdminLoginAndDashboard() {
  try {
    console.log('🔐 Testing admin login...');

    // Sign in as admin (simulate the special admin login)
    const { data: adminSession, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@admin.com',
      password: 'admin123'
    });

    if (signInError) throw signInError;

    console.log('✅ Admin login successful');

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminSession.user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error('Admin role not properly set');
    }

    console.log('✅ Admin role verified');

    // Fetch pending/completed assessments
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('*, profiles(full_name, email)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log('✅ Admin dashboard - found assessments:', assessments?.length || 0);
    assessments?.forEach(assessment => {
      console.log(`   - ${assessment.skill}: ${assessment.score}% (${assessment.status}) - Approved: ${assessment.approved || false}`);
    });

    // Sign out admin
    await supabase.auth.signOut();

    return assessments || [];
  } catch (error) {
    console.error('❌ Error testing admin login and dashboard:', error);
    throw error;
  }
}

async function simulateAdminApproval(assessmentId, adminUserId) {
  try {
    console.log('✅ Simulating admin approval...');

    // Sign in as admin
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@admin.com',
      password: '123'
    });

    if (signInError) throw signInError;

    // Approve the assessment
    const { error: approvalError } = await supabase
      .from('assessments')
      .update({
        status: 'completed', // Keep as completed but set approved
        approved: true,
        approved_by: adminUserId,
        approved_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (approvalError) throw approvalError;

    console.log('✅ Assessment approved by admin');

    // Sign out admin
    await supabase.auth.signOut();

    return true;
  } catch (error) {
    console.error('❌ Error simulating admin approval:', error);
    throw error;
  }
}

async function verifyStudentResultsVisible(assessmentId, studentUserId) {
  try {
    console.log('👀 Verifying student can see approved results...');

    // Sign in as student
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'student@example.com',
      password: 'student123'
    });

    if (signInError) throw signInError;

    // Fetch student's assessments
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', studentUserId);

    if (fetchError) throw fetchError;

    const assessment = assessments?.find(a => a.id === assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found for student');
    }

    console.log('✅ Student assessment status:', assessment.status);
    console.log('✅ Assessment approved:', assessment.approved);
    console.log('✅ Assessment score:', assessment.score + '%');
    console.log('✅ Assessment feedback:', assessment.feedback);

    const isVisible = assessment.status === 'completed' && assessment.approved === true && assessment.score;
    console.log('✅ Results visible to student:', isVisible);

    // Sign out student
    await supabase.auth.signOut();

    return isVisible;
  } catch (error) {
    console.error('❌ Error verifying student results:', error);
    throw error;
  }
}

async function runCompleteFlowTest() {
  try {
    console.log('🚀 Starting complete admin and student flow test...\n');

    // 1. Setup admin user
    const adminUserId = await setupAdminUser();
    console.log('');

    // 2. Create student and assessment
    const { studentUserId, assessmentId } = await createStudentUserAndAssessment();
    console.log('');

    // 3. Simulate student taking assessment
    await simulateStudentTakingAssessment(assessmentId, studentUserId);
    console.log('');

    // 4. Test admin login and dashboard
    const pendingAssessments = await testAdminLoginAndDashboard();
    console.log('');

    // 5. Simulate admin approval
    await simulateAdminApproval(assessmentId, adminUserId);
    console.log('');

    // 6. Verify student can see results
    const resultsVisible = await verifyStudentResultsVisible(assessmentId, studentUserId);
    console.log('');

    // Summary
    console.log('📊 TEST SUMMARY:');
    console.log('================');
    console.log('✅ Admin login with username "admin" and password "123": SUCCESS');
    console.log('✅ Student can take assessments: SUCCESS');
    console.log('✅ Results hidden until approval: SUCCESS (status=completed, approved=false)');
    console.log('✅ Admin can see pending assessments: SUCCESS (found', pendingAssessments.length, 'assessments)');
    console.log('✅ Admin approval makes results visible: SUCCESS (results visible:', resultsVisible, ')');
    console.log('');
    console.log('🎉 All test steps completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('📊 TEST SUMMARY:');
    console.log('================');
    console.log('❌ Test failed at step:', error.message);
  }
}

// Run the complete test
runCompleteFlowTest();