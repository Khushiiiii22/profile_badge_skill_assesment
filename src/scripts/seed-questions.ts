import { supabase } from '../integrations/supabase/client';

interface Question {
  skill: string;
  question_text: string;
  options: string[];
  correct_answer: number;
}

const questions: Question[] = [
  // Communication
  {
    skill: 'Communication',
    question_text: 'When presenting a complex idea to a team, what is the most effective way to ensure everyone understands?',
    options: ['Use technical jargon to sound professional', 'Speak quickly to cover all points', 'Break it down into simple steps and ask for questions', 'Assume everyone already knows'],
    correct_answer: 2,
  },
  {
    skill: 'Communication',
    question_text: 'How should you respond when receiving critical feedback?',
    options: ['Get defensive and explain your side immediately', 'Ignore it and continue as usual', 'Listen actively, thank them, and ask for specific examples', 'Complain to others about the person giving feedback'],
    correct_answer: 2,
  },
  {
    skill: 'Communication',
    question_text: 'What is a key element of non-verbal communication?',
    options: ['Using complex vocabulary', 'Maintaining eye contact and open body language', 'Speaking loudly', 'Avoiding pauses in speech'],
    correct_answer: 1,
  },
  {
    skill: 'Communication',
    question_text: 'When writing an email to a colleague, what should you prioritize?',
    options: ['Keeping it short and to the point', 'Including every detail possible', 'Using informal language', 'Avoiding greetings'],
    correct_answer: 0,
  },
  {
    skill: 'Communication',
    question_text: 'How can you improve active listening skills?',
    options: ['Interrupt when you have a thought', 'Paraphrase what the speaker said to confirm understanding', 'Think about your response while they talk', 'Look away to avoid distractions'],
    correct_answer: 1,
  },
  {
    skill: 'Communication',
    question_text: 'What is the best approach when communicating with a diverse team?',
    options: ['Use the same communication style for everyone', 'Adapt your style to different cultural backgrounds and preferences', 'Avoid discussing personal topics', 'Stick to written communication only'],
    correct_answer: 1,
  },

  // Leadership
  {
    skill: 'Leadership',
    question_text: 'What is a primary role of a leader in a team project?',
    options: ['Do all the work themselves', 'Set clear goals and delegate tasks appropriately', 'Micromanage every detail', 'Avoid making decisions'],
    correct_answer: 1,
  },
  {
    skill: 'Leadership',
    question_text: 'How should a leader handle team conflicts?',
    options: ['Ignore them and hope they resolve', 'Take sides immediately', 'Facilitate open discussion and find common ground', 'Punish those involved'],
    correct_answer: 2,
  },
  {
    skill: 'Leadership',
    question_text: 'What trait is essential for inspirational leadership?',
    options: ['Being overly critical', 'Empathy and understanding team members\' perspectives', 'Strict adherence to rules without exceptions', 'Avoiding personal connections'],
    correct_answer: 1,
  },
  {
    skill: 'Leadership',
    question_text: 'When leading a change initiative, what should a leader do first?',
    options: ['Implement changes without explanation', 'Communicate the vision and rationale clearly', 'Wait for team buy-in', 'Focus on technical details only'],
    correct_answer: 1,
  },
  {
    skill: 'Leadership',
    question_text: 'How can a leader motivate team members?',
    options: ['Offer only monetary rewards', 'Recognize achievements and provide growth opportunities', 'Assign the same tasks repeatedly', 'Criticize mistakes publicly'],
    correct_answer: 1,
  },
  {
    skill: 'Leadership',
    question_text: 'What is important for a leader to demonstrate integrity?',
    options: ['Bend rules when convenient', 'Follow through on commitments and be transparent', 'Prioritize personal gain', 'Keep information secret unnecessarily'],
    correct_answer: 1,
  },

  // Problem Solving
  {
    skill: 'Problem Solving',
    question_text: 'When faced with a complex problem, what is the first step?',
    options: ['Jump to solutions immediately', 'Define the problem clearly and gather information', 'Blame others for the issue', 'Avoid discussing it'],
    correct_answer: 1,
  },
  {
    skill: 'Problem Solving',
    question_text: 'How can you generate creative solutions?',
    options: ['Stick to conventional methods only', 'Brainstorm multiple ideas without judgment', 'Dismiss unconventional ideas', 'Focus on what has always worked'],
    correct_answer: 1,
  },
  {
    skill: 'Problem Solving',
    question_text: 'What is crucial when analyzing data for a problem?',
    options: ['Rely on assumptions', 'Verify sources and look for patterns objectively', 'Ignore contradictory information', 'Make decisions based on feelings'],
    correct_answer: 1,
  },
  {
    skill: 'Problem Solving',
    question_text: 'How should you evaluate potential solutions?',
    options: ['Choose the first one that comes to mind', 'Assess pros, cons, feasibility, and impact', 'Pick the most popular option', 'Delay evaluation indefinitely'],
    correct_answer: 1,
  },
  {
    skill: 'Problem Solving',
    question_text: 'What role does collaboration play in problem solving?',
    options: ['It slows down the process', 'Brings diverse perspectives and improves outcomes', 'Is unnecessary for technical problems', 'Leads to confusion'],
    correct_answer: 1,
  },
  {
    skill: 'Problem Solving',
    question_text: 'When implementing a solution, what should you do?',
    options: ['Apply it without testing', 'Monitor results and be ready to adjust', 'Stick to it no matter what', 'Avoid involving others'],
    correct_answer: 1,
  },

  // Teamwork
  {
    skill: 'Teamwork',
    question_text: 'What is essential for effective teamwork?',
    options: ['Competing with team members', 'Open communication and mutual support', 'Working in isolation', 'Prioritizing individual goals'],
    correct_answer: 1,
  },
  {
    skill: 'Teamwork',
    question_text: 'How can you contribute to team synergy?',
    options: ['Focus only on your tasks', 'Share ideas and help others when needed', 'Avoid meetings', 'Withhold information'],
    correct_answer: 1,
  },
  {
    skill: 'Teamwork',
    question_text: 'What should you do if a team member is struggling?',
    options: ['Ignore it to avoid conflict', 'Offer help and collaborate on solutions', 'Take over their work', 'Complain to management'],
    correct_answer: 1,
  },
  {
    skill: 'Teamwork',
    question_text: 'How do you handle differing opinions in a team?',
    options: ['Argue until you win', 'Listen, discuss, and find compromise', 'Avoid confrontation', 'Dismiss others\' views'],
    correct_answer: 1,
  },
  {
    skill: 'Teamwork',
    question_text: 'What builds trust in a team?',
    options: ['Keeping promises and being reliable', 'Changing plans frequently', 'Hiding mistakes', 'Prioritizing self-interest'],
    correct_answer: 0,
  },
  {
    skill: 'Teamwork',
    question_text: 'Why is diversity important in teams?',
    options: ['It causes conflicts', 'Brings varied perspectives and innovation', 'Makes decisions slower', 'Is irrelevant'],
    correct_answer: 1,
  },

  // Time Management
  {
    skill: 'Time Management',
    question_text: 'What is the best way to prioritize tasks?',
    options: ['Do everything at once', 'Use a system like Eisenhower matrix for urgency and importance', 'Focus on easy tasks first', 'Procrastinate on important ones'],
    correct_answer: 1,
  },
  {
    skill: 'Time Management',
    question_text: 'How can you avoid procrastination?',
    options: ['Set vague deadlines', 'Break tasks into smaller steps and set specific goals', 'Wait for motivation', 'Multitask constantly'],
    correct_answer: 1,
  },
  {
    skill: 'Time Management',
    question_text: 'What tool helps with time management?',
    options: ['Ignoring schedules', 'Using calendars and to-do lists', 'Working without breaks', 'Overcommitting'],
    correct_answer: 1,
  },
  {
    skill: 'Time Management',
    question_text: 'How should you handle interruptions?',
    options: ['Stop everything immediately', 'Schedule specific times for them or politely defer', 'Encourage more interruptions', 'Ignore them completely'],
    correct_answer: 1,
  },
  {
    skill: 'Time Management',
    question_text: 'What is important for long-term time management?',
    options: ['Short-term focus only', 'Regular review and adjustment of plans', 'Rigid adherence to initial plans', 'Avoiding planning'],
    correct_answer: 1,
  },
  {
    skill: 'Time Management',
    question_text: 'How do you manage workload during busy periods?',
    options: ['Work overtime constantly', 'Delegate and set boundaries', 'Take on more tasks', 'Skip breaks'],
    correct_answer: 1,
  },

  // Creativity
  {
    skill: 'Creativity',
    question_text: 'How can you foster creativity in problem-solving?',
    options: ['Stick to proven methods', 'Encourage brainstorming and unconventional ideas', 'Limit idea generation', 'Focus on criticism'],
    correct_answer: 1,
  },
  {
    skill: 'Creativity',
    question_text: 'What stimulates creative thinking?',
    options: ['Routine and predictability', 'Exposure to new experiences and perspectives', 'Avoiding challenges', 'Following rules strictly'],
    correct_answer: 1,
  },
  {
    skill: 'Creativity',
    question_text: 'How should you respond to initial failures in creative projects?',
    options: ['Give up immediately', 'Learn from them and iterate', 'Blame others', 'Avoid risk'],
    correct_answer: 1,
  },
  {
    skill: 'Creativity',
    question_text: 'What role does collaboration play in creativity?',
    options: ['It hinders individual creativity', 'Combines diverse ideas for better outcomes', 'Is unnecessary', 'Leads to compromise'],
    correct_answer: 1,
  },
  {
    skill: 'Creativity',
    question_text: 'How can you maintain creative momentum?',
    options: ['Work in isolation', 'Take breaks and seek inspiration regularly', 'Rush through ideas', 'Stick to one approach'],
    correct_answer: 1,
  },
  {
    skill: 'Creativity',
    question_text: 'What is a barrier to creativity?',
    options: ['Fear of failure and self-doubt', 'Too many ideas', 'Supportive environment', 'Encouragement'],
    correct_answer: 0,
  },
];

async function seedQuestions() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .insert(questions);

    if (error) {
      console.error('Error seeding questions:', error);
    } else {
      console.log('Questions seeded successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

seedQuestions();