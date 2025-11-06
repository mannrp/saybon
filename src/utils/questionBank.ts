// Question bank loader and manager
import type { Exercise, CEFRLevel, ExerciseType } from '../types';

interface QuestionBankData {
  level: CEFRLevel;
  type: ExerciseType;
  exercises: Array<{
    question: string;
    correctAnswer: string | string[];
    acceptableAnswers?: string[];
    explanation?: string;
    topic: string;
    difficulty: number;
  }>;
}

// Cache for loaded question banks
const bankCache = new Map<string, QuestionBankData>();

// Track which questions have been used in current session
const usedQuestions = new Map<string, Set<string>>();

export async function loadQuestionBank(
  level: CEFRLevel,
  type: ExerciseType
): Promise<QuestionBankData | null> {
  const key = `${level}-${type}`;

  // Return from cache if available
  if (bankCache.has(key)) {
    return bankCache.get(key)!;
  }

  try {
    const response = await fetch(`/questions/${level.toLowerCase()}-${type}.json`);
    if (!response.ok) {
      return null;
    }

    const data: QuestionBankData = await response.json();
    bankCache.set(key, data);
    return data;
  } catch (error) {
    console.error('Failed to load question bank');
    return null;
  }
}

export function getRandomExercises(
  bank: QuestionBankData,
  count: number,
  sessionKey: string
): Exercise[] {
  // Initialize used questions set for this session
  if (!usedQuestions.has(sessionKey)) {
    usedQuestions.set(sessionKey, new Set());
  }

  const used = usedQuestions.get(sessionKey)!;
  const available = bank.exercises.filter(
    (ex) => !used.has(ex.question)
  );

  // If we've used all questions, reset for this session
  if (available.length === 0) {
    used.clear();
    return getRandomExercises(bank, count, sessionKey);
  }

  // Shuffle and take requested count
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, available.length));

  // Mark as used
  selected.forEach((ex) => used.add(ex.question));

  // Convert to Exercise format
  return selected.map((ex) => ({
    id: crypto.randomUUID(),
    type: bank.type,
    level: bank.level,
    question: ex.question,
    correctAnswer: ex.correctAnswer,
    acceptableAnswers: ex.acceptableAnswers,
    explanation: ex.explanation,
    metadata: {
      topic: ex.topic,
      difficulty: ex.difficulty,
      createdAt: new Date().toISOString(),
      source: 'curated',
    },
  }));
}

export function clearSessionQuestions(sessionKey: string): void {
  usedQuestions.delete(sessionKey);
}

export function hasQuestionBank(level: CEFRLevel, type: ExerciseType): boolean {
  // Check if question bank file exists
  // This will be populated as you build banks with the script
  const availableBanks = [
    'a1-conjugation',
    'a1-translation',
    'a1-vocabulary',
    'a1-grammar',
    'a1-fill-blank',
    'a2-conjugation',
    'a2-translation',
    'a2-vocabulary',
    'a2-grammar',
    'a2-fill-blank',
  ];

  return availableBanks.includes(`${level.toLowerCase()}-${type}`);
}
