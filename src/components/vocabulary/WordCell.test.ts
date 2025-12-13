// Property tests for WordCell heatmap color mapping
// **Feature: vocabulary-heatmap, Property 8: Heatmap Color Consistency**
// **Validates: Requirements 4.2, 4.3**

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getMasteryColor } from './WordCell';
import type { WordProgress } from '../../types';

// Helper to create WordProgress with specific mastery level
function createProgressArb(masteryLevel: number, minAttempts = 1) {
  return fc.record({
    wordId: fc.string({ minLength: 1, maxLength: 20 }),
    timesCorrect: fc.nat({ max: 100 }),
    timesWrong: fc.nat({ max: 100 }),
    attempts: fc.integer({ min: minAttempts, max: 200 }),
    lastSeen: fc.constant(new Date().toISOString()),
    masteryLevel: fc.constant(masteryLevel),
    streak: fc.nat({ max: 20 }),
  });
}

// Arbitrary for generating WordProgress with any mastery level (attempts > 0)
const wordProgressWithAttemptsArb = fc.integer({ min: 0, max: 5 }).chain((mastery) =>
  createProgressArb(mastery, 1)
);

// Arbitrary for generating WordProgress with 0 attempts (unseen)
const unseenProgressArb = fc.record({
  wordId: fc.string({ minLength: 1, maxLength: 20 }),
  timesCorrect: fc.constant(0),
  timesWrong: fc.constant(0),
  attempts: fc.constant(0),
  lastSeen: fc.constant(new Date().toISOString()),
  masteryLevel: fc.constant(0),
  streak: fc.constant(0),
});

describe('WordCell - Property 8: Heatmap Color Consistency', () => {
  it('should return unseen color for undefined progress', () => {
    fc.assert(
      fc.property(fc.constant(undefined), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-unseen)');
      }),
      { numRuns: 1 }
    );
  });

  it('should return unseen color for progress with 0 attempts', () => {
    fc.assert(
      fc.property(unseenProgressArb, (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-unseen)');
      }),
      { numRuns: 100 }
    );
  });

  it('should return weak color (red) for mastery level 0-1', () => {
    // Test mastery level 0
    fc.assert(
      fc.property(createProgressArb(0), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-weak)');
      }),
      { numRuns: 50 }
    );

    // Test mastery level 1
    fc.assert(
      fc.property(createProgressArb(1), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-weak)');
      }),
      { numRuns: 50 }
    );
  });

  it('should return learning color (yellow) for mastery level 2', () => {
    fc.assert(
      fc.property(createProgressArb(2), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-learning)');
      }),
      { numRuns: 100 }
    );
  });

  it('should return moderate color (yellow-green) for mastery level 3', () => {
    fc.assert(
      fc.property(createProgressArb(3), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-moderate)');
      }),
      { numRuns: 100 }
    );
  });

  it('should return good color (light green) for mastery level 4', () => {
    fc.assert(
      fc.property(createProgressArb(4), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-good)');
      }),
      { numRuns: 100 }
    );
  });

  it('should return mastered color (green) for mastery level 5', () => {
    fc.assert(
      fc.property(createProgressArb(5), (progress) => {
        const color = getMasteryColor(progress);
        expect(color).toBe('var(--color-mastered)');
      }),
      { numRuns: 100 }
    );
  });

  it('should map all mastery levels to correct color tiers consistently', () => {
    // Property: For any WordProgress with attempts > 0, the color should match
    // the defined gradient tier for the mastery level
    fc.assert(
      fc.property(wordProgressWithAttemptsArb, (progress: WordProgress) => {
        const color = getMasteryColor(progress);
        const mastery = progress.masteryLevel;

        // Verify color matches the expected tier
        if (mastery <= 1) {
          expect(color).toBe('var(--color-weak)');
        } else if (mastery === 2) {
          expect(color).toBe('var(--color-learning)');
        } else if (mastery === 3) {
          expect(color).toBe('var(--color-moderate)');
        } else if (mastery === 4) {
          expect(color).toBe('var(--color-good)');
        } else {
          expect(color).toBe('var(--color-mastered)');
        }
      }),
      { numRuns: 100 }
    );
  });
});
