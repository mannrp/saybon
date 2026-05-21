// Saybon v2 — Answer Validation Engine for French Practice Exercises
import { levenshteinDistance } from './levenshtein';
import type { Exercise } from '../content/schema';

// Remove diacritics (accents) from text
export function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Normalize answer by converting to lowercase, trimming whitespace, and removing diacritics
export function normalizeAnswer(answer: string): string {
  return removeDiacritics(answer.toLowerCase().trim());
}

// Check if two answers match exactly after normalization
export function exactMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

// Check if answers match with fuzzy matching
// Allows for minor typos and spelling variations based on Levenshtein distance
export function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // For extremely short words (<= 2 characters), do not allow fuzzy matching
  if (normalizedCorrect.length <= 2 || normalizedUser.length <= 2) {
    return false;
  }

  // For single words, allow distance of 1
  // For phrases, allow distance of 2
  const maxDistance = normalizedUser.includes(' ') || normalizedCorrect.includes(' ') ? 2 : 1;

  return levenshteinDistance(normalizedUser, normalizedCorrect) <= maxDistance;
}

export interface ValidationResult {
  isCorrect: boolean;
  matchedAnswer?: string; // Which acceptable answer matched (if any)
  isFuzzyMatch?: boolean; // Whether it was a fuzzy match
}

// Strip leading French articles (le, la, l', un, une, des) from nouns to tolerate articles
export function stripArticles(word: string): string {
  const normalized = word.toLowerCase().trim();
  return normalized
    .replace(/^(le\s+|la\s+|l'|un\s+|une\s+|des\s+)/i, '')
    .trim();
}

// Validate user answer against exercise (handles array correctness, fuzzy typo thresholds, and offline fallback options)
export function validateAnswer(
  userAnswer: string,
  exercise: Exercise
): ValidationResult {
  const normalizedUser = normalizeAnswer(userAnswer);

  // Handle multiple correct answers
  const correctAnswers = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer
    : [exercise.correctAnswer];

  // Combine with acceptable answers if provided
  const allAcceptableAnswers = [
    ...correctAnswers,
    ...(exercise.acceptableAnswers || []),
  ];

  // Check for exact match first
  for (const answer of allAcceptableAnswers) {
    if (exactMatch(normalizedUser, answer)) {
      return {
        isCorrect: true,
        matchedAnswer: answer,
        isFuzzyMatch: false,
      };
    }
  }

  // If testing noun gender-recognition, skip fuzzy text rules since articles (le vs la) are spelling-critical
  if (exercise.type === 'gender-recognition') {
    return { isCorrect: false };
  }

  // Check for fuzzy match (typo tolerance)
  for (const answer of allAcceptableAnswers) {
    if (fuzzyMatch(normalizedUser, answer)) {
      return {
        isCorrect: true,
        matchedAnswer: answer,
        isFuzzyMatch: true,
      };
    }
  }

  // Specific fallback check: if checking a single noun, tolerate missing or wrong articles by comparing word roots
  if (exercise.type === 'translation' || exercise.type === 'vocabulary') {
    for (const answer of allAcceptableAnswers) {
      const strippedUser = stripArticles(normalizedUser);
      const strippedCorrect = stripArticles(normalizeAnswer(answer));
      if (strippedUser === strippedCorrect && strippedUser.length > 2) {
        return {
          isCorrect: true,
          matchedAnswer: answer,
          isFuzzyMatch: true,
        };
      }
    }
  }

  // No match found
  return {
    isCorrect: false,
  };
}
