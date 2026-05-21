// Saybon v2 — Concept Mastery & Spaced Repetition Engine
import type { ConceptProgress } from '../content/schema';

/**
 * Calculates mastery level (0-5 scale) based on accuracy, attempts, and streaks
 */
export function calculateMastery(
  attempts: number,
  timesCorrect: number,
  streak: number
): number {
  if (attempts === 0) return 0;

  const accuracy = timesCorrect / attempts;
  const attemptBonus = Math.min(attempts / 10, 1.0); // Max 1.0 bonus at 10 attempts
  const streakBonus = Math.min(streak / 5, 0.5); // Max 0.5 bonus at 5 streak

  // Base score from accuracy (0-4) + bonuses (up to 1.5)
  const rawScore = accuracy * 3.5 + attemptBonus + streakBonus;

  // Clamp to 0-5 range
  return Math.min(Math.max(Math.round(rawScore), 0), 5);
}

/**
 * Calculates fine-grained familiarity score (0 to 100)
 */
export function calculateFamiliarityScore(
  attempts: number,
  timesCorrect: number,
  streak: number
): number {
  if (attempts === 0) return 0;
  
  const accuracy = timesCorrect / attempts;
  const streakBonus = Math.min(streak * 4, 20); // up to 20% bonus for streak
  const baseScore = accuracy * 80;
  
  return Math.min(Math.max(Math.round(baseScore + streakBonus), 0), 100);
}

/**
 * Decides review state transition for a concept
 */
export function determineReviewState(
  attempts: number,
  mastery: number
): 'new' | 'learning' | 'review' | 'mastered' {
  if (attempts === 0) return 'new';
  if (mastery <= 2) return 'learning';
  if (mastery <= 4) return 'review';
  return 'mastered';
}

/**
 * Creates a default, unvisited progress record for a concept
 */
export function createInitialProgress(conceptId: string): ConceptProgress {
  return {
    conceptId,
    mastery: 0,
    seenState: false,
    reviewState: 'new',
    familiarityScore: 0,
    streak: 0,
    attempts: 0,
    correctAnswers: 0,
    lastSeen: new Date().toISOString(),
  };
}

/**
 * Updates a concept progress record with a new user answer
 */
export function updateProgressRecord(
  existing: ConceptProgress,
  isCorrect: boolean
): ConceptProgress {
  const attempts = existing.attempts + 1;
  const correctAnswers = existing.correctAnswers + (isCorrect ? 1 : 0);
  const streak = isCorrect ? existing.streak + 1 : 0;
  
  const mastery = calculateMastery(attempts, correctAnswers, streak);
  const familiarityScore = calculateFamiliarityScore(attempts, correctAnswers, streak);
  const reviewState = determineReviewState(attempts, mastery);
  
  return {
    conceptId: existing.conceptId,
    mastery,
    seenState: true,
    reviewState,
    familiarityScore,
    streak,
    attempts,
    correctAnswers,
    lastSeen: new Date().toISOString(),
  };
}
