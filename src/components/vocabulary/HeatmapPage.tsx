// HeatmapPage - Page component for vocabulary heatmap and star constellation progress
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VocabHeatmap, type HeatmapLevel } from './VocabHeatmap';
import { StarConstellation } from './StarConstellation';
import { WordDetailModal } from './WordDetailModal';
import { useVocabulary } from '../../hooks/useVocabulary';
import { useWordProgress } from '../../hooks/useWordProgress';
import { useTheme } from '../../hooks/useTheme';
import type { VocabWord } from '../../types';

export function HeatmapPage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  
  const [viewMode, setViewMode] = useState<'cosmos' | 'grid'>('cosmos');
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

  const handlePracticeWord = useCallback((word: VocabWord) => {
    handleCloseModal();
    // Redirect to practice remix page prefilled with this word's category
    const pos = word.partOfSpeech || 'other';
    navigate(`/practice?remix=true&pos=${pos}`);
  }, [handleCloseModal, navigate]);

  const isLoading = wordsLoading || progressLoading;

  // Filter words dynamically for StarConstellation to match weak filter
  const filteredWordsForCosmos = useMemo(() => {
    if (!filterWeak) return words;
    return words.filter((w) => {
      const p = progress.get(w.id);
      return !p || p.attempts === 0 || p.masteryLevel <= 2;
    });
  }, [words, progress, filterWeak]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 text-[var(--color-text-primary)] min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="mb-10 mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Reflection Arena
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            A quiet space to reflect on the growth of your French vocabulary. Watch your star dust ignite into glowing crystals as your intuition deepens.
          </p>
        </div>
        <button
          onClick={() => navigate('/practice')}
          className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs uppercase tracking-widest font-bold shadow-sm transition-all"
          style={{ borderRadius: 'var(--radius-button)' }}
        >
          Enter Practice Studio →
        </button>
      </div>

      {/* Control Panel (Filters & Toggle Tabs) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-5">
          {/* Level selection */}
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="level-filter"
              className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]"
            >
              CEFR Level:
            </label>
            <select
              id="level-filter"
              value={level}
              onChange={(e) => setLevel(e.target.value as HeatmapLevel)}
              className="px-3 py-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <option value="all">All Levels</option>
              <option value="A1">A1 (Beginner)</option>
              <option value="A2">A2 (Elementary)</option>
            </select>
          </div>

          {/* Weak filter checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterWeak}
              onChange={(e) => setFilterWeak(e.target.checked)}
              className="w-4 h-4 rounded-[var(--radius-sm)] text-[var(--color-primary)] border-[var(--color-border)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-secondary)]">
              Weak/Unseen only
            </span>
          </label>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-1 rounded-[var(--radius-sm)]">
          <button
            onClick={() => setViewMode('cosmos')}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              viewMode === 'cosmos'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
            }`}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            🌌 Le Cosmos
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              viewMode === 'grid'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
            }`}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            📊 La Grille
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-inner">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
          <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Projecting progress alignment...
          </span>
        </div>
      )}

      {/* Render selected view */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {viewMode === 'cosmos' ? (
            <div className="space-y-4">
              <StarConstellation
                words={filteredWordsForCosmos}
                progress={progress}
                onWordClick={handleWordClick}
                resolvedTheme={resolvedTheme}
              />
              <div className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-center text-xs text-[var(--color-text-secondary)]">
                Projections are grouped morphologically: nouns belong to <strong className="text-[var(--color-primary)]">L'Amas des Noms</strong>, verbs flow through the <strong className="text-[var(--color-primary)]">Fleuve des Verbes</strong>, modifiers shine in the <strong className="text-[var(--color-primary)]">Nébuleuse</strong>, and grammar structures reside in the <strong className="text-[var(--color-primary)]">Nuage</strong>.
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm">
              <VocabHeatmap
                words={words}
                progress={progress}
                level={level}
                onWordClick={handleWordClick}
                filterWeak={filterWeak}
              />
            </div>
          )}
        </motion.div>
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

