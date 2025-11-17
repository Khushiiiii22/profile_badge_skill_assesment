// Test script to manually create assessment records and test the flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjyybqgyzpoipocwtkzv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeXlicWd5enBvaXBvY3d0a3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTYxMjUsImV4cCI6MjA3NzQ5MjEyNX0.Eeju1lAPYDzOds9RV9YWPxn6Hm6XAVvrNNbXaDdeWfg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAssessment() {
  try {
    // First create a test user or get existing one
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }

    let userId = authUser?.user?.id;

    if (!userId) {
      // If user already exists, try to get them
      const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      });

      if (signInError) throw signInError;

      userId = existingUser.user.id;
    }

    // Create assessment record - match the exact column names from migration
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        skill: 'Communication',
        pin_code: '110001',
        school_name: 'Test School',
        status: 'pending',
        instamojo_payment_id: 'TEST_PAYMENT_123',
        instamojo_payment_request_id: 'TEST_REQUEST_123'
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    console.log('✅ Test assessment created:', assessment);
    console.log('Assessment ID:', assessment.id);

    // Also ensure profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: 'test@example.com',
        full_name: 'Test Student',
        assessment_access: true,
      })
      .select()
      .single();

    if (profileError) {
      console.warn('Profile creation/update failed:', profileError);
    } else {
      console.log('✅ Profile updated:', profile);
    }

    return assessment.id;
  } catch (error) {
    console.error('❌ Error creating test assessment:', error);
    throw error;
  }
}

// Run the test
createTestAssessment();