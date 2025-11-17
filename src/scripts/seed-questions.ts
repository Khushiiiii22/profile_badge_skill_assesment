import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables check:');
console.log('VITE_SUPABASE_URL:', !!SUPABASE_URL);
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', !!SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL) {
  console.error('Missing required environment variable: VITE_SUPABASE_URL');
  process.exit(1);
}

// If service role key is not available, fall back to anon key for seeding (may fail due to RLS)
const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
if (!keyToUse) {
  console.error('Neither SUPABASE_SERVICE_ROLE_KEY nor VITE_SUPABASE_PUBLISHABLE_KEY found');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key. This may fail due to RLS policies.');
}

// Use service role key for seeding to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample questions data
const sampleQuestions = [
  // Communication questions
  {
    skill: 'Communication',
    question_text: 'What is the most important element in effective communication?',
    options: ['Speaking clearly', 'Active listening', 'Using complex vocabulary', 'Speaking loudly'],
    correct_answer: 1
  },
  {
    skill: 'Communication',
    question_text: 'Which of these is NOT a barrier to effective communication?',
    options: ['Noise', 'Clear message', 'Cultural differences', 'Language barriers'],
    correct_answer: 1
  },
  {
    skill: 'Communication',
    question_text: 'What does "non-verbal communication" include?',
    options: ['Only written messages', 'Body language, facial expressions, and tone of voice', 'Only verbal words', 'Only email communication'],
    correct_answer: 1
  },

  // Problem Solving questions
  {
    skill: 'Problem Solving',
    question_text: 'What is the first step in the problem-solving process?',
    options: ['Implement solution', 'Define the problem', 'Evaluate results', 'Gather information'],
    correct_answer: 1
  },
  {
    skill: 'Problem Solving',
    question_text: 'Which thinking technique involves generating many ideas without judgment?',
    options: ['Critical thinking', 'Brainstorming', 'Analytical thinking', 'Logical reasoning'],
    correct_answer: 1
  },
  {
    skill: 'Problem Solving',
    question_text: 'What does SWOT analysis stand for?',
    options: ['Strengths, Weaknesses, Opportunities, Threats', 'Solutions, Work, Objectives, Targets', 'Systems, Workflow, Operations, Tasks', 'Strategy, Work, Organization, Team'],
    correct_answer: 0
  },

  // Leadership questions
  {
    skill: 'Leadership',
    question_text: 'Which leadership style focuses on team participation in decision-making?',
    options: ['Autocratic', 'Democratic', 'Laissez-faire', 'Transactional'],
    correct_answer: 1
  },
  {
    skill: 'Leadership',
    question_text: 'What is emotional intelligence in leadership?',
    options: ['IQ level of the leader', 'Ability to understand and manage emotions', 'Technical expertise', 'Years of experience'],
    correct_answer: 1
  },
  {
    skill: 'Leadership',
    question_text: 'What is a key characteristic of transformational leadership?',
    options: ['Maintaining status quo', 'Inspiring and motivating followers', 'Focusing only on tasks', 'Avoiding change'],
    correct_answer: 1
  }
];

async function seedQuestions() {
  console.log('Starting to seed questions...');
  console.log(`Found ${sampleQuestions.length} questions to insert`);

  try {
    // Insert questions in batches to avoid potential issues
    const { data, error } = await supabase
      .from('questions')
      .insert(sampleQuestions)
      .select();

    if (error) {
      console.error('Error inserting questions:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log(`Successfully inserted ${data?.length || 0} questions`);

    // Verify insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('questions')
      .select('*');

    if (verifyError) {
      console.error('Error verifying insertion:', verifyError);
    } else {
      console.log(`Total questions in database: ${verifyData?.length || 0}`);
      // Group by skill manually
      const skillCounts: Record<string, number> = {};
      verifyData?.forEach(q => {
        skillCounts[q.skill] = (skillCounts[q.skill] || 0) + 1;
      });
      console.log('Questions by skill:');
      Object.entries(skillCounts).forEach(([skill, count]) => {
        console.log(`  ${skill}: ${count} questions`);
      });
    }

  } catch (err) {
    console.error('Unexpected error during seeding:', err);
  }
}

// Run the seeding function
seedQuestions().then(() => {
  console.log('Seeding completed');
  process.exit(0);
}).catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});