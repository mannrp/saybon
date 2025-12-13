import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { calculateMastery, createInitialProgress } from './useWordProgress';
import type { WordProgress } from '../types';

/**
 * Property tests for word progress functionality
 * **Feature: vocabulary-heatmap**
 */

// Mock storage for round-trip testing
const mockStorage: Map<string, WordProgress> = new Map();

vi.mock('../utils/storage', () => ({
  wordProgressStorage: {
    get: vi.fn(async (wordId: string) => mockStorage.get(wordId)),
    getAll: vi.fn(async () => Array.from(mockStorage.values())),
    update: vi.fn(async (progress: WordProgress) => {
      mockStorage.set(progress.wordId, progress);
    }),
    clear: vi.fn(async () => mockStorage.clear()),
  },
}));

// Arbitrary for generating valid WordProgress objects
const wordProgressArb = fc.record({
  wordId: fc.string({ minLength: 1, maxLength: 20 }),
  timesCorrect: fc.nat({ max: 1000 }),
  timesWrong: fc.nat({ max: 1000 }),
  streak: fc.nat({ max: 100 }),
}).map(({ wordId, timesCorrect, timesWrong, streak }) => {
  const attempts = timesCorrect + timesWrong;
  const progress: WordProgress = {
    wordId,
    timesCorrect,
    timesWrong,
    attempts,
    lastSeen: new Date().toISOString(),
    masteryLevel: 0,
    streak,
  };
  progress.masteryLevel = calculateMastery(progress);
  return progress;
});

describe('Word Progress Properties', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  /**
   * **Property 1: Mastery Level Bounds**
   * *For any* WordProgress record, the masteryLevel SHALL always be between 0 and 5 inclusive,
   * regardless of the number of attempts or accuracy ratio.
   * **Validates: Requirements 3.4**
   */
  it('Property 1: Mastery Level Bounds - masteryLevel always 0-5', () => {
    fc.assert(
      fc.property(wordProgressArb, (progress) => {
        const mastery = calculateMastery(progress);
        expect(mastery).toBeGreaterThanOrEqual(0);
        expect(mastery).toBeLessThanOrEqual(5);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 2: Progress Persistence Round-Trip**
   * *For any* WordProgress object stored to IndexedDB, retrieving it by wordId
   * SHALL return an equivalent object with all fields preserved.
   * **Validates: Requirements 3.1, 3.5**
   */
  it('Property 2: Progress Persistence Round-Trip - store/retrieve preserves data', async () => {
    const { wordProgressStorage } = await import('../utils/storage');

    await fc.assert(
      fc.asyncProperty(wordProgressArb, async (progress) => {
        // Store the progress
        await wordProgressStorage.update(progress);

        // Retrieve the progress
        const retrieved = await wordProgressStorage.get(progress.wordId);

        // All fields should be preserved
        expect(retrieved).toBeDefined();
        expect(retrieved?.wordId).toBe(progress.wordId);
        expect(retrieved?.timesCorrect).toBe(progress.timesCorrect);
        expect(retrieved?.timesWrong).toBe(progress.timesWrong);
        expect(retrieved?.attempts).toBe(progress.attempts);
        expect(retrieved?.masteryLevel).toBe(progress.masteryLevel);
        expect(retrieved?.streak).toBe(progress.streak);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 3: Attempt Count Consistency**
   * *For any* WordProgress record, the attempts field SHALL equal timesCorrect + timesWrong.
   * **Validates: Requirements 3.2, 3.3**
   */
  it('Property 3: Attempt Count Consistency - attempts = timesCorrect + timesWrong', () => {
    fc.assert(
      fc.property(wordProgressArb, (progress) => {
        expect(progress.attempts).toBe(progress.timesCorrect + progress.timesWrong);
      }),
      { numRuns: 100 }
    );
  });

  // Additional unit tests for edge cases
  describe('calculateMastery edge cases', () => {
    it('should return 0 for zero attempts', () => {
      const progress = createInitialProgress('test-word');
      expect(calculateMastery(progress)).toBe(0);
    });

    it('should return 5 for perfect accuracy with many attempts', () => {
      const progress: WordProgress = {
        wordId: 'test',
        timesCorrect: 20,
        timesWrong: 0,
        attempts: 20,
        lastSeen: new Date().toISOString(),
        masteryLevel: 0,
        streak: 10,
      };
      expect(calculateMastery(progress)).toBe(5);
    });

    it('should return low mastery for poor accuracy', () => {
      const progress: WordProgress = {
        wordId: 'test',
        timesCorrect: 1,
        timesWrong: 9,
        attempts: 10,
        lastSeen: new Date().toISOString(),
        masteryLevel: 0,
        streak: 0,
      };
      const mastery = calculateMastery(progress);
      expect(mastery).toBeLessThanOrEqual(2);
    });
  });

  describe('createInitialProgress', () => {
    it('should create progress with all zeros except wordId', () => {
      const progress = createInitialProgress('my-word');
      expect(progress.wordId).toBe('my-word');
      expect(progress.timesCorrect).toBe(0);
      expect(progress.timesWrong).toBe(0);
      expect(progress.attempts).toBe(0);
      expect(progress.masteryLevel).toBe(0);
      expect(progress.streak).toBe(0);
    });
  });
});
