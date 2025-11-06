// Script to build question bank from Gemini API
import * as fs from 'fs';
import * as path from 'path';

interface Exercise {
  question: string;
  correctAnswer: string | string[];
  acceptableAnswers?: string[];
  explanation?: string;
  topic: string;
  difficulty: number;
}

interface QuestionBank {
  level: string;
  type: string;
  exercises: Exercise[];
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Rate limiting: 15 requests per minute, 1500 per day
const REQUESTS_PER_MINUTE = 15;
const DELAY_BETWEEN_REQUESTS = (60 * 1000) / REQUESTS_PER_MINUTE; // ~4 seconds

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateExercises(
  level: string,
  type: string,
  count: number,
  existingQuestions: Set<string>
): Promise<Exercise[]> {
  const prompt = `You are a French language teacher creating practice exercises for English-speaking students at ${level} CEFR level.

IMPORTANT: All questions, hints, and explanations must be in ENGLISH. Only the French words/phrases being practiced should be in French.

Generate ${count} UNIQUE ${type} exercises. Make sure each question is DIFFERENT from previous ones.

Exercise type guidance:
- conjugation: Provide the French verb in parentheses, ask for a specific conjugation in English. Example: "Conjugate (parler) in present tense, first person singular"
- fill-blank: Give a French sentence with a blank, ask in English what word fits. Example: "Fill in the blank: Je ___ au cinéma (I go to the cinema)"
- translation: Provide an English sentence and ask for French translation. Example: "Translate to French: I am happy"
- vocabulary: Ask for the French word in English. Example: "What is the French word for 'house'?"
- grammar: Ask a grammar question in English about French. Example: "What is the correct article for 'maison' (house)?"

Requirements:
- Questions must be in ENGLISH and appropriate for ${level} CEFR level
- Questions should be clear and unambiguous
- Correct answers should be in FRENCH (the language being learned)
- Provide acceptable variations for answers
- Explanations should be in ENGLISH and explain the French grammar/usage
- Use realistic, practical French vocabulary and grammar
- Cover diverse topics: greetings, family, food, daily activities, numbers, colors, etc.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    {
      "question": "Question in English here",
      "correctAnswer": "french answer",
      "acceptableAnswers": ["french variation1", "french variation2"],
      "explanation": "Explanation in English about why this French answer is correct",
      "topic": "grammar topic",
      "difficulty": 3
    }
  ]
}`;

  const url = `${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.9, // Higher temperature for more variety
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error || !data.candidates) {
    throw new Error('Failed to get response from Gemini');
  }

  const text = data.candidates[0].content.parts[0].text;
  let cleanText = text.trim();
  
  // Remove markdown code blocks if present
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  const parsed = JSON.parse(cleanText);
  
  // Filter out duplicates
  const uniqueExercises = parsed.exercises.filter((ex: Exercise) => {
    const questionKey = ex.question.toLowerCase().trim();
    if (existingQuestions.has(questionKey)) {
      return false;
    }
    existingQuestions.add(questionKey);
    return true;
  });

  return uniqueExercises;
}

async function buildQuestionBank(
  level: string,
  type: string,
  targetCount: number
): Promise<void> {
  console.log(`\n🚀 Building question bank for ${level.toUpperCase()} - ${type}`);
  console.log(`Target: ${targetCount} unique questions`);
  console.log(`Rate limit: ${REQUESTS_PER_MINUTE} requests/min\n`);

  const existingQuestions = new Set<string>();
  const allExercises: Exercise[] = [];
  
  let requestCount = 0;
  const startTime = Date.now();

  while (allExercises.length < targetCount) {
    const remaining = targetCount - allExercises.length;
    const batchSize = Math.min(20, remaining); // Request 20 at a time
    
    try {
      console.log(`📝 Request ${requestCount + 1}: Generating ${batchSize} exercises...`);
      
      const exercises = await generateExercises(level, type, batchSize, existingQuestions);
      allExercises.push(...exercises);
      
      requestCount++;
      
      console.log(`✅ Got ${exercises.length} unique exercises (Total: ${allExercises.length}/${targetCount})`);
      
      // Check if we've hit daily limit
      if (requestCount >= 1400) {
        console.log('\n⚠️  Approaching daily rate limit (1500/day). Stopping.');
        break;
      }
      
      // Rate limiting: wait before next request
      if (allExercises.length < targetCount) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_REQUESTS / 1000}s before next request...`);
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
      
    } catch (error) {
      console.error(`❌ Error generating exercises:`, error);
      console.log('⏳ Waiting 10s before retry...');
      await sleep(10000);
    }
  }

  // Save to file
  const questionBank: QuestionBank = {
    level,
    type,
    exercises: allExercises,
  };

  const outputDir = path.join(process.cwd(), 'public', 'questions');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${level.toLowerCase()}-${type}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(questionBank, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`\n✨ Question bank created successfully!`);
  console.log(`📊 Total questions: ${allExercises.length}`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`⏱️  Time elapsed: ${elapsed} minutes`);
  console.log(`📈 Requests made: ${requestCount}`);
}

// Main execution
const args = process.argv.slice(2);
const level = args[0] || 'a1';
const type = args[1] || 'conjugation';
const count = parseInt(args[2] || '500', 10);

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable not set');
  console.log('\nUsage: GEMINI_API_KEY=your_key npm run build-bank [level] [type] [count]');
  console.log('Example: GEMINI_API_KEY=abc123 npm run build-bank a1 conjugation 500');
  process.exit(1);
}

buildQuestionBank(level, type, count)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
