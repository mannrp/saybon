// MiniHeatmap - Responsive grid for sidebar display
import { memo, useMemo } from 'react';
import type { VocabWord, WordProgress } from '../../types';
import { getMasteryColor } from './WordCell';

interface MiniHeatmapProps {
  words: VocabWord[];
  progress: Map<string, WordProgress>;
  currentWordId?: string;
  onWordClick?: (word: VocabWord) => void;
}

export const MiniHeatmap = memo(function MiniHeatmap({
  words,
  progress,
  currentWordId,
  onWordClick,
}: MiniHeatmapProps) {
  // Take first 500 words
  const displayWords = useMemo(() => words.slice(0, 500), [words]);

  return (
    <div className="p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(10px, 1fr))',
          maxWidth: '100%',
        }}
      >
        {displayWords.map((word) => {
          const isActive = word.id === currentWordId;
          const bgColor = getMasteryColor(progress.get(word.id));
          
          return (
            <button
              key={word.id}
              onClick={() => onWordClick?.(word)}
              className={`aspect-square min-w-[10px] max-w-[14px] transition-all ${
                isActive ? 'ring-2 ring-[var(--color-primary)] ring-offset-1 scale-125 z-10' : ''
              } hover:scale-110 hover:brightness-110 focus:outline-none`}
              style={{
                backgroundColor: bgColor,
                borderRadius: '2px',
              }}
              title={`${word.french} - ${word.english}`}
              aria-label={word.french}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-unseen)' }} />
          New
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-weak)' }} />
          Weak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-mastered)' }} />
          Mastered
        </span>
      </div>
    </div>
  );
});
