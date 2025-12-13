// HeatmapPage - Page component for vocabulary heatmap visualization
import { useState, useEffect, useCallback } from 'react';
import { VocabHeatmap, type HeatmapLevel } from './VocabHeatmap';
import { WordDetailModal } from './WordDetailModal';
import { useVocabulary } from '../../hooks/useVocabulary';
import { useWordProgress } from '../../hooks/useWordProgress';
import type { VocabWord } from '../../types';

export function HeatmapPage() {
  const [level, setLevel] = useState<HeatmapLevel>('all');
  const [filterWeak, setFilterWeak] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { progress, loading: progressLoading } = useWordProgress();
  const { words, loading: wordsLoading, loadWords } = useVocabulary({
    level,
    progress,
  });

  // Load words on mount and when level changes
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const handleWordClick = useCallback((word: VocabWord) => {
    setSelectedWord(word);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedWord(null);
  }, []);

  const handlePracticeWord = useCallback((_word: VocabWord) => {
    // Navigate to practice page
    handleCloseModal();
    window.location.href = `/`;
  }, [handleCloseModal]);

  const isLoading = wordsLoading || progressLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
            Vocabulary Heatmap
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Visual overview of your vocabulary mastery. Click any word to see details.
          </p>
        </div>
        <a
          href="/"
          className="px-4 py-2 text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
          style={{ borderRadius: 'var(--radius-button)' }}
        >
          Start Practice
        </a>
      </div>

      {/* Filters */}
      <div
        className="mb-6 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]"
        style={{ borderRadius: 'var(--radius-sm)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Level filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="level-filter"
              className="text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Level:
            </label>
            <select
              id="level-filter"
              value={level}
              onChange={(e) => setLevel(e.target.value as HeatmapLevel)}
              className="px-3 py-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <option value="all">All Levels</option>
              <option value="A1">A1 (Beginner)</option>
              <option value="A2">A2 (Elementary)</option>
            </select>
          </div>

          {/* Weak words toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterWeak}
              onChange={(e) => setFilterWeak(e.target.checked)}
              className="w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] focus:ring-[var(--color-primary)]"
              style={{ borderRadius: 'var(--radius-sm)' }}
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Show weak words only
            </span>
          </label>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
          <span className="ml-3 text-[var(--color-text-secondary)]">
            Loading vocabulary...
          </span>
        </div>
      )}

      {/* Heatmap */}
      {!isLoading && (
        <VocabHeatmap
          words={words}
          progress={progress}
          level={level}
          onWordClick={handleWordClick}
          filterWeak={filterWeak}
        />
      )}

      {/* Word detail modal */}
      <WordDetailModal
        word={selectedWord}
        progress={selectedWord ? progress.get(selectedWord.id) : undefined}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPractice={handlePracticeWord}
      />
    </div>
  );
}
