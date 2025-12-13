// WordCell - Individual cell in the vocabulary heatmap grid
import { memo } from 'react';
import type { VocabWord, WordProgress } from '../../types';

export interface WordCellProps {
  word: VocabWord;
  progress?: WordProgress;
  onClick: () => void;
}

/**
 * Get the mastery color based on word progress
 * Implements Property 8: Heatmap Color Consistency
 * - unseen (no progress or 0 attempts) = neutral/white
 * - mastery 0-1 = red (weak)
 * - mastery 2 = orange/yellow (learning)
 * - mastery 3 = yellow-green (moderate)
 * - mastery 4-5 = green (good/mastered)
 */
export function getMasteryColor(progress?: WordProgress): string {
  if (!progress || progress.attempts === 0) {
    return 'var(--color-unseen)';
  }

  const mastery = progress.masteryLevel;
  if (mastery <= 1) return 'var(--color-weak)';
  if (mastery <= 2) return 'var(--color-learning)';
  if (mastery <= 3) return 'var(--color-moderate)';
  if (mastery <= 4) return 'var(--color-good)';
  return 'var(--color-mastered)';
}

/**
 * Get text color that contrasts with the background
 */
function getTextColor(progress?: WordProgress): string {
  if (!progress || progress.attempts === 0) {
    return 'var(--color-text-primary)';
  }
  // For colored backgrounds, use white text for better contrast
  return '#ffffff';
}

export const WordCell = memo(function WordCell({ word, progress, onClick }: WordCellProps) {
  const bgColor = getMasteryColor(progress);
  const textColor = getTextColor(progress);

  return (
    <button
      onClick={onClick}
      className="aspect-square flex items-center justify-center p-1 border border-[var(--color-border)] transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: 'var(--radius-sm)',
      }}
      title={`${word.french} - ${word.english}`}
      aria-label={`${word.french}: ${progress ? `Mastery level ${progress.masteryLevel}` : 'Not practiced yet'}`}
    >
      <span className="text-xs font-medium truncate max-w-full px-0.5">
        {word.french}
      </span>
    </button>
  );
});
