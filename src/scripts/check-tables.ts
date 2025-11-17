import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  try {
    console.log('=== CHECKING ASSESSMENTS TABLE ===');

    // Check assessments table
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*');

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
    } else {
      console.log(`Found ${assessments.length} assessment records:`);
      assessments.forEach((assessment, index) => {
        console.log(`${index + 1}. ID: ${assessment.id}, Skill: ${assessment.skill || 'N/A'}, Status: ${assessment.status}, User: ${assessment.user_id}`);
        console.log(`    Skill Name: ${assessment.skill_name}, Payment ID: ${assessment.payment_id}`);
        console.log(`    School: ${assessment.school_name}, Pin: ${assessment.pin_code}`);
      });
    }

    console.log('\n=== CHECKING QUESTIONS TABLE ===');

    // Check questions table
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*');

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
    } else {
      console.log(`Found ${questions.length} question records:`);

      // Group by skill
      const questionsBySkill = questions.reduce((acc, q) => {
        if (!acc[q.skill]) acc[q.skill] = [];
        acc[q.skill].push(q);
        return acc;
      }, {} as Record<string, any[]>);

      Object.keys(questionsBySkill).forEach(skill => {
        console.log(`\n${skill}: ${questionsBySkill[skill].length} questions`);
        questionsBySkill[skill].forEach((q, index) => {
          console.log(`  ${index + 1}. ${q.question_text.substring(0, 60)}...`);
        });
      });
    }

    console.log('\n=== ANALYSIS FOR TAKEASSESSMENT.TSX ===');

    // Check if questions exist for the skills in assessments
    const skillsInAssessments = [...new Set(assessments?.map(a => a.skill).filter(Boolean) || [])];
    console.log(`Skills found in assessments: ${skillsInAssessments.join(', ')}`);

    if (questions && questions.length > 0) {
      const skillsInQuestions = [...new Set(questions.map(q => q.skill))];
      console.log(`Skills found in questions: ${skillsInQuestions.join(', ')}`);

      const missingSkills = skillsInAssessments.filter(skill => !skillsInQuestions.includes(skill));
      if (missingSkills.length > 0) {
        console.log(`❌ MISMATCH: Assessments exist for skills with no questions: ${missingSkills.join(', ')}`);
        console.log('   TakeAssessment.tsx will fail to load questions for these skills.');
      } else {
        console.log('✅ All assessment skills have corresponding questions.');
      }
    } else {
      console.log('❌ CRITICAL: No questions found in database!');
      console.log('   TakeAssessment.tsx will show "Assessment Not Found" for all assessments.');
    }

    console.log('\n=== SAMPLE STRUCTURES ===');
    if (questions && questions.length > 0) {
      console.log('Sample question:', JSON.stringify(questions[0], null, 2));
    } else {
      console.log('No questions to show sample structure');
    }

    if (assessments && assessments.length > 0) {
      console.log('Sample assessment:', JSON.stringify(assessments[0], null, 2));
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTables();