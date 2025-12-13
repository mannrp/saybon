// FlashcardPracticePage - Minimal, polished flashcard practice UI
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlashcards } from '../../hooks/useFlashcards';
import type { Flashcard, FlashcardType, FlashcardLevel } from '../../types/flashcard';

type ViewState = 'setup' | 'card' | 'reveal' | 'loading';

// Keyboard handler hook
function useKeyboardNavigation(
  viewState: ViewState,
  isFlipped: boolean,
  onFlip: () => void,
  onCorrect: () => void,
  onIncorrect: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewState === 'card' && !isFlipped && e.code === 'Space') {
        e.preventDefault();
        onFlip();
      } else if (viewState === 'reveal' && isFlipped) {
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          e.preventDefault();
          onCorrect();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          e.preventDefault();
          onIncorrect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, isFlipped, onFlip, onCorrect, onIncorrect]);
}

export function FlashcardPracticePage() {
  const [viewState, setViewState] = useState<ViewState>('setup');
  const [level, setLevel] = useState<FlashcardLevel>('a1');
  const [type, setType] = useState<FlashcardType>('vocab');
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, total: 0 });

  const { loading, error, loadCards, getRandomCard, resetSession, totalCards } = useFlashcards();

  const handleStart = async () => {
    setViewState('loading');
    resetSession();
    setStats({ correct: 0, incorrect: 0, total: 0 });
    await loadCards(level, type);
  };

  useEffect(() => {
    if (viewState === 'loading' && !loading && totalCards > 0) {
      const card = getRandomCard();
      if (card) {
        setCurrentCard(card);
        setIsFlipped(false);
        setViewState('card');
      }
    }
  }, [loading, totalCards, viewState, getRandomCard]);

  const handleFlip = () => {
    setIsFlipped(true);
    setViewState('reveal');
  };

  const handleResponse = (correct: boolean) => {
    setStats(s => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
      total: s.total + 1,
    }));
    
    const nextCard = getRandomCard();
    if (nextCard) {
      setCurrentCard(nextCard);
      setIsFlipped(false);
      setViewState('card');
    } else {
      setViewState('setup');
    }
  };

  const handleEndSession = () => {
    setViewState('setup');
  };

  // Keyboard navigation
  useKeyboardNavigation(
    viewState,
    isFlipped,
    handleFlip,
    () => handleResponse(true),
    () => handleResponse(false)
  );

  // Setup view
  if (viewState === 'setup') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-primary)] py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 text-center">
            Flashcards
          </h1>
          <p className="text-[var(--color-text-secondary)] text-center mb-8">
            Study French with spaced repetition
          </p>

          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]"
            >
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Last Session</p>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-good)]">{stats.correct}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-weak)]">{stats.incorrect}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Incorrect</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0}%
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Accuracy</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as FlashcardLevel)}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="a1">A1 - Beginner</option>
                <option value="a2">A2 - Elementary</option>
                <option value="all">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Card Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['vocab', 'grammar', 'phrase', 'conjugation'] as FlashcardType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      type === t
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--color-weak)] text-center">{error}</p>
            )}

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full px-6 py-4 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Start Practice'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading view
  if (viewState === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-primary)] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading flashcards...</p>
        </motion.div>
      </div>
    );
  }

  // Card view
  if (!currentCard) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-primary)] py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {stats.total + 1} cards studied
            </span>
            <span className="text-sm font-medium text-[var(--color-good)]">
              {stats.correct} ✓
            </span>
          </div>
          <button
            onClick={handleEndSession}
            className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            End
          </button>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + (isFlipped ? '-flipped' : '')}
            initial={{ opacity: 0, rotateY: isFlipped ? -90 : 0 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="perspective-1000"
          >
            <div
              onClick={!isFlipped ? handleFlip : undefined}
              className={`min-h-[320px] bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] shadow-lg p-6 flex flex-col ${
                !isFlipped ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
              }`}
            >
              {/* Card type badge */}
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-bg-secondary)] rounded">
                  {currentCard.type.toUpperCase()} • {currentCard.level.toUpperCase()}
                </span>
                {currentCard.metadata.part_of_speech && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {currentCard.metadata.part_of_speech}
                  </span>
                )}
              </div>

              {/* Card content */}
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                {!isFlipped ? (
                  <>
                    <p className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
                      {currentCard.front}
                    </p>
                    {currentCard.metadata.example_fr && currentCard.type === 'vocab' && (
                      <p className="text-sm text-[var(--color-text-secondary)] italic">
                        "{currentCard.metadata.example_fr}"
                      </p>
                    )}
                    <p className="mt-6 text-sm text-[var(--color-text-muted)]">
                      Tap to reveal answer
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-[var(--color-primary)] mb-4">
                      {currentCard.back}
                    </p>
                    
                    {/* Additional info based on type */}
                    {currentCard.type === 'vocab' && currentCard.metadata.alternatives && currentCard.metadata.alternatives.length > 0 && (
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                        Also: {currentCard.metadata.alternatives.join(', ')}
                      </p>
                    )}
                    
                    {currentCard.metadata.example_en && (
                      <p className="text-sm text-[var(--color-text-secondary)] italic mt-2">
                        "{currentCard.metadata.example_en}"
                      </p>
                    )}

                    {currentCard.type === 'grammar' && currentCard.metadata.exceptions && currentCard.metadata.exceptions.length > 0 && (
                      <div className="mt-4 text-left w-full">
                        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Exceptions:</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {currentCard.metadata.exceptions.join(', ')}
                        </p>
                      </div>
                    )}

                    {currentCard.type === 'phrase' && currentCard.metadata.context && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-2">
                        Context: {currentCard.metadata.context}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Response buttons */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex gap-4"
          >
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 px-6 py-4 text-lg font-semibold text-[var(--color-weak)] bg-[var(--color-incorrect-bg)] border border-[var(--color-incorrect-border)] rounded-lg hover:opacity-90 transition-opacity"
            >
              Again
            </button>
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 px-6 py-4 text-lg font-semibold text-[var(--color-good)] bg-[var(--color-correct-bg)] border border-[var(--color-correct-border)] rounded-lg hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </motion.div>
        )}

        {/* Keyboard hint */}
        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
          {!isFlipped ? 'Press Space to flip' : 'Press ← for Again, → for Got it'}
        </p>
      </div>
    </div>
  );
}
