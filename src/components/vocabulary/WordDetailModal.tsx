// WordDetailModal - Popup showing word details and progress stats
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabWord, WordProgress } from '../../types';

export interface WordDetailModalProps {
  word: VocabWord | null;
  progress?: WordProgress;
  isOpen: boolean;
  onClose: () => void;
  onPractice?: (word: VocabWord) => void;
}

export function WordDetailModal({
  word,
  progress,
  isOpen,
  onClose,
  onPractice,
}: WordDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate accuracy percentage
  const getAccuracy = (): string => {
    if (!progress || progress.attempts === 0) return 'N/A';
    const accuracy = (progress.timesCorrect / progress.attempts) * 100;
    return `${accuracy.toFixed(0)}%`;
  };

  // Get mastery level label
  const getMasteryLabel = (): string => {
    if (!progress || progress.attempts === 0) return 'Not practiced';
    const level = progress.masteryLevel;
    if (level <= 1) return 'Needs work';
    if (level <= 2) return 'Learning';
    if (level <= 3) return 'Getting there';
    if (level <= 4) return 'Good';
    return 'Mastered';
  };

  // Get mastery color class
  const getMasteryColorClass = (): string => {
    if (!progress || progress.attempts === 0) return 'text-[var(--color-text-secondary)]';
    const level = progress.masteryLevel;
    if (level <= 1) return 'text-[var(--color-weak)]';
    if (level <= 2) return 'text-[var(--color-learning)]';
    if (level <= 3) return 'text-[var(--color-moderate)]';
    return 'text-[var(--color-good)]';
  };

  if (!word) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl"
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[var(--color-border)]">
              <div>
                <h2
                  id="modal-title"
                  className="text-2xl font-bold text-[var(--color-text-primary)]"
                >
                  {word.gender && word.partOfSpeech === 'noun' && (
                    <span className="text-[var(--color-text-secondary)] font-normal mr-1">
                      {word.gender}
                    </span>
                  )}
                  {word.french}
                </h2>
                <p className="text-lg text-[var(--color-text-secondary)] mt-1">
                  {word.english}
                </p>
                {word.alternativeTranslations && word.alternativeTranslations.length > 0 && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Also: {word.alternativeTranslations.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                style={{ borderRadius: 'var(--radius-sm)' }}
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Word info */}
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                  style={{ borderRadius: 'var(--radius-sm)' }}>
                  {word.level}
                </span>
                <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                  style={{ borderRadius: 'var(--radius-sm)' }}>
                  {word.partOfSpeech}
                </span>
              </div>

              {/* Example sentences */}
              <div className="p-4 bg-[var(--color-bg-secondary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Example:
                </p>
                <p className="text-[var(--color-text-primary)] italic">
                  "{word.exampleFr}"
                </p>
                <p className="text-[var(--color-text-secondary)] mt-1">
                  "{word.exampleEn}"
                </p>
              </div>

              {/* Progress stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--color-bg-secondary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                    Attempts
                  </p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">
                    {progress?.attempts ?? 0}
                  </p>
                </div>
                <div className="p-4 bg-[var(--color-bg-secondary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                    Accuracy
                  </p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">
                    {getAccuracy()}
                  </p>
                </div>
                <div className="p-4 bg-[var(--color-bg-secondary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                    Mastery
                  </p>
                  <p className={`text-xl font-bold ${getMasteryColorClass()}`}>
                    {getMasteryLabel()}
                  </p>
                </div>
                <div className="p-4 bg-[var(--color-bg-secondary)]" style={{ borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                    Streak
                  </p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">
                    {progress?.streak ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            {onPractice && (
              <div className="p-6 border-t border-[var(--color-border)]">
                <button
                  onClick={() => onPractice(word)}
                  className="w-full px-4 py-3 text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
                  style={{ borderRadius: 'var(--radius-button)' }}
                >
                  Practice this word
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
