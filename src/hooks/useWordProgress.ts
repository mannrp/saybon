import { useState, useEffect, useCallback } from 'react';
import { wordProgressStorage } from '../utils/storage';
import type { WordProgress } from '../types';

interface UseWordProgressReturn {
  progress: Map<string, WordProgress>;
  loading: boolean;
  getProgress: (wordId: string) => WordProgress | undefined;
  updateProgress: (wordId: string, isCorrect: boolean) => Promise<void>;
  getAllProgress: () => WordProgress[];
  getWeakWords: () => WordProgress[];
}

/**
 * Calculates mastery level based on accuracy and attempts
 * Returns a score from 0-5
 */
export function calculateMastery(progress: WordProgress): number {
  const { timesCorrect, attempts, streak } = progress;

  if (attempts === 0) return 0;

  const accuracy = timesCorrect / attempts;
  const attemptBonus = Math.min(attempts / 10, 1); // Max bonus at 10 attempts
  const streakBonus = Math.min(streak / 5, 0.5); // Max 0.5 bonus at 5 streak

  // Base score from accuracy (0-4) + bonuses (up to 1)
  const rawScore = accuracy * 4 + attemptBonus + streakBonus;

  // Clamp to 0-5 range
  return Math.min(Math.max(Math.round(rawScore), 0), 5);
}

/**
 * Creates a new WordProgress record with default values
 */
export function createInitialProgress(wordId: string): WordProgress {
  return {
    wordId,
    timesCorrect: 0,
    timesWrong: 0,
    attempts: 0,
    lastSeen: new Date().toISOString(),
    masteryLevel: 0,
    streak: 0,
  };
}

/**
 * Hook for managing word progress with IndexedDB persistence
 */
export function useWordProgress(): UseWordProgressReturn {
  const [progress, setProgress] = useState<Map<string, WordProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load all progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const allProgress = await wordProgressStorage.getAll();
        const progressMap = new Map<string, WordProgress>();
        allProgress.forEach((p) => progressMap.set(p.wordId, p));
        setProgress(progressMap);
      } catch (error) {
        console.error('Failed to load word progress:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  const getProgress = useCallback(
    (wordId: string): WordProgress | undefined => {
      return progress.get(wordId);
    },
    [progress]
  );

  const updateProgress = useCallback(
    async (wordId: string, isCorrect: boolean): Promise<void> => {
      const existing = progress.get(wordId) || createInitialProgress(wordId);

      const updated: WordProgress = {
        ...existing,
        timesCorrect: existing.timesCorrect + (isCorrect ? 1 : 0),
        timesWrong: existing.timesWrong + (isCorrect ? 0 : 1),
        attempts: existing.attempts + 1,
        lastSeen: new Date().toISOString(),
        streak: isCorrect ? existing.streak + 1 : 0,
        masteryLevel: 0, // Will be recalculated
      };

      // Recalculate mastery
      updated.masteryLevel = calculateMastery(updated);

      // Persist to IndexedDB
      try {
        await wordProgressStorage.update(updated);
      } catch (error) {
        console.error('Failed to persist word progress:', error);
      }

      // Update local state
      setProgress((prev) => {
        const next = new Map(prev);
        next.set(wordId, updated);
        return next;
      });
    },
    [progress]
  );

  const getAllProgress = useCallback((): WordProgress[] => {
    return Array.from(progress.values());
  }, [progress]);

  const getWeakWords = useCallback((): WordProgress[] => {
    return Array.from(progress.values()).filter((p) => p.masteryLevel <= 2);
  }, [progress]);

  return {
    progress,
    loading,
    getProgress,
    updateProgress,
    getAllProgress,
    getWeakWords,
  };
}
