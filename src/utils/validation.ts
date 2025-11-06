// Answer validation utilities for French practice exercises
import { levenshteinDistance } from './levenshtein';
import type { Exercise } from '../types';

// Remove diacritics (accents) from text
function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Normalize answer by converting to lowercase, trimming whitespace, and removing diacritics
export function normalizeAnswer(answer: string): string {
  return removeDiacritics(answer.toLowerCase().trim());
}

// Check if two answers match exactly after normalization
function exactMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

// Check if answers match with fuzzy matching (Levenshtein distance <= 2)
// Allows for minor typos and spelling variations
function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // For single words, allow distance of 1
  // For phrases, allow distance of 2
  const maxDistance = normalizedUser.includes(' ') || normalizedCorrect.includes(' ') ? 2 : 1;

  return levenshteinDistance(normalizedUser, normalizedCorrect) <= maxDistance;
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
