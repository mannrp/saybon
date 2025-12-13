// VocabHeatmap - Grid visualization of all vocabulary words colored by mastery
import { useMemo } from 'react';
import { WordCell } from './WordCell';
import type { VocabWord, WordProgress } from '../../types';

export type HeatmapLevel = 'A1' | 'A2' | 'all';

export interface VocabHeatmapProps {
  words: VocabWord[];
  progress: Map<string, WordProgress>;
  level: HeatmapLevel;
  onWordClick: (word: VocabWord) => void;
  filterWeak?: boolean;
}

export function VocabHeatmap({
  words,
  progress,
  level,
  onWordClick,
  filterWeak = false,
}: VocabHeatmapProps) {
  // Filter words based on level and weak filter
  const filteredWords = useMemo(() => {
    let result = words;

    // Filter by level
    if (level !== 'all') {
      result = result.filter((w) => w.level === level);
    }

    // Filter weak words only (mastery <= 2 or unseen)
    if (filterWeak) {
      result = result.filter((w) => {
        const p = progress.get(w.id);
        return !p || p.attempts === 0 || p.masteryLevel <= 2;
      });
    }

    return result;
  }, [words, progress, level, filterWeak]);

  // Calculate stats for display
  const stats = useMemo(() => {
    const total = filteredWords.length;
    let mastered = 0;
    let learning = 0;
    let weak = 0;
    let unseen = 0;

    filteredWords.forEach((word) => {
      const p = progress.get(word.id);
      if (!p || p.attempts === 0) {
        unseen++;
      } else if (p.masteryLevel >= 4) {
        mastered++;
      } else if (p.masteryLevel >= 2) {
        learning++;
      } else {
        weak++;
      }
    });

    return { total, mastered, learning, weak, unseen };
  }, [filteredWords, progress]);

  if (filteredWords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-secondary)]">
          {filterWeak
            ? 'No weak words found. Great job!'
            : 'No words available for the selected level.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-[var(--radius-sm)]"
            style={{ backgroundColor: 'var(--color-mastered)' }}
          />
          <span className="text-[var(--color-text-secondary)]">
            Mastered: {stats.mastered}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-[var(--radius-sm)]"
            style={{ backgroundColor: 'var(--color-moderate)' }}
          />
          <span className="text-[var(--color-text-secondary)]">
            Learning: {stats.learning}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-[var(--radius-sm)]"
            style={{ backgroundColor: 'var(--color-weak)' }}
          />
          <span className="text-[var(--color-text-secondary)]">
            Weak: {stats.weak}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
            style={{ backgroundColor: 'var(--color-unseen)' }}
          />
          <span className="text-[var(--color-text-secondary)]">
            Unseen: {stats.unseen}
          </span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
        }}
      >
        {filteredWords.map((word) => (
          <WordCell
            key={word.id}
            word={word}
            progress={progress.get(word.id)}
            onClick={() => onWordClick(word)}
          />
        ))}
      </div>

      {/* Total count */}
      <p className="text-sm text-[var(--color-text-secondary)] text-center">
        Showing {filteredWords.length} words
      </p>
    </div>
  );
}
