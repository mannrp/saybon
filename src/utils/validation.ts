// Answer validation utilities for French practice exercises
import { levenshteinDistance } from './levenshtein';
import type { Exercise } from '../types';

// Normalize answer by converting to lowercase and trimming whitespace
export function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim();
}

// Check if two answers match exactly after normalization
function exactMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

// Check if answers match with fuzzy matching (Levenshtein distance <= 1)
// Only applies to single-word responses to avoid false positives
function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Only apply fuzzy matching to single words
  if (normalizedUser.includes(' ') || normalizedCorrect.includes(' ')) {
    return false;
  }

  // Allow Levenshtein distance of 1 for typo tolerance
  return levenshteinDistance(normalizedUser, normalizedCorrect) <= 1;
}

// Validate user answer against exercise
export interface ValidationResult {
  isCorrect: boolean;
  matchedAnswer?: string; // Which acceptable answer matched (if any)
  isFuzzyMatch?: boolean; // Whether it was a fuzzy match
}

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

  // No match found
  return {
    isCorrect: false,
  };
}
