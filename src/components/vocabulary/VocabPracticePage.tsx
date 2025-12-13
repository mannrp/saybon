// VocabPracticePage - Vocabulary practice with mini heatmap sidebar
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVocabulary, validateAnswer } from '../../hooks/useVocabulary';
import { useWordProgress } from '../../hooks/useWordProgress';
import { useSettings } from '../../hooks/useSettings';
import { useAI } from '../../hooks/useAI';
import { MiniHeatmap } from './MiniHeatmap';
import type { VocabWord, AIFeedback } from '../../types';
import type { VocabLevel, PracticeDirection } from '../../hooks/useVocabulary';

type ViewState = 'setup' | 'question' | 'feedback' | 'batch-feedback' | 'loading' | 'error' | 'no-words';

interface SessionAnswer {
  wordId: string;
  french: string;
  english: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  direction: PracticeDirection;
}

export function VocabPracticePage() {
  // Practice settings
  const [level, setLevel] = useState<VocabLevel>('A1');
  const [direction, setDirection] = useState<PracticeDirection>('fr-en');
  const [weakOnly, setWeakOnly] = useState(false);
  const [showGender, setShowGender] = useState(true);

  // Practice state
  const [viewState, setViewState] = useState<ViewState>('setup');
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [lastAnswer, setLastAnswer] = useState('');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchFeedback, setBatchFeedback] = useState<AIFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Session answers for batch feedback
  const sessionAnswersRef = useRef<SessionAnswer[]>([]);

  // Hooks
  const { settings } = useSettings();
  const { provider, isReady } = useAI(settings);
  const { progress, updateProgress, loading: progressLoading } = useWordProgress();
  const {
    words,
    loading: wordsLoading,
    error: wordsError,
    loadWords,
    selectWordsForPractice,
    resetSession,
  } = useVocabulary({ level, weakOnly, progress });

  // All words for heatmap (unfiltered)
  const { words: allWords, loadWords: loadAllWords } = useVocabulary({ 
    level, 
    weakOnly: false, 
    progress 
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Load words on mount and when level changes
  useEffect(() => {
    if (viewState === 'setup') {
      loadWords();
      loadAllWords();
    }
  }, [level, loadWords, loadAllWords, viewState]);

  // Auto-focus input when showing question
  useEffect(() => {
    if (viewState === 'question') {
      inputRef.current?.focus();
    }
  }, [viewState, currentWord]);

  // Start practice session
  const handleStartPractice = useCallback(() => {
    resetSession();
    sessionAnswersRef.current = [];
    setQuestionNumber(0);
    setViewState('loading');

    setTimeout(() => {
      const selected = selectWordsForPractice(1);
      if (selected.length === 0) {
        if (weakOnly) {
          setViewState('no-words');
        } else {
          setError('No words available. Please try a different level.');
          setViewState('error');
        }
        return;
      }

      setCurrentWord(selected[0]);
      setQuestionNumber(1);
      setUserAnswer('');
      setViewState('question');
    }, 300);
  }, [selectWordsForPractice, resetSession, weakOnly]);

  // Submit answer
  const handleSubmitAnswer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentWord || !userAnswer.trim()) return;

      const isCorrect = validateAnswer(currentWord, userAnswer.trim(), direction);

      // Store answer for batch feedback
      const correctAnswer = direction === 'fr-en' 
        ? currentWord.english 
        : currentWord.french;
      
      sessionAnswersRef.current.push({
        wordId: currentWord.id,
        french: currentWord.french,
        english: currentWord.english,
        userAnswer: userAnswer.trim(),
        correctAnswer,
        isCorrect,
        direction,
      });

      // Update progress
      await updateProgress(currentWord.id, isCorrect);

      setLastAnswer(userAnswer.trim());
      setLastCorrect(isCorrect);
      setViewState('feedback');
    },
    [currentWord, userAnswer, direction, updateProgress]
  );

  // Move to next question
  const handleNext = useCallback(() => {
    const selected = selectWordsForPractice(1);
    if (selected.length === 0) {
      resetSession();
      const newSelected = selectWordsForPractice(1);
      if (newSelected.length === 0) {
        setViewState('setup');
        return;
      }
      setCurrentWord(newSelected[0]);
    } else {
      setCurrentWord(selected[0]);
    }
    setQuestionNumber((n) => n + 1);
    setUserAnswer('');
    setViewState('question');
  }, [selectWordsForPractice, resetSession]);

  // End session and get batch feedback from Gemini
  const handleEndSession = useCallback(async () => {
    const answers = sessionAnswersRef.current;
    if (answers.length === 0) {
      setViewState('setup');
      return;
    }

    if (!provider || !isReady) {
      // No AI provider, just show stats
      setBatchFeedback({
        strengths: ['Practice completed!'],
        weaknesses: [],
        recommendations: ['Configure AI in settings for detailed feedback.'],
        detailedAnalysis: `You completed ${answers.length} questions with ${answers.filter(a => a.isCorrect).length} correct answers.`,
      });
      setViewState('batch-feedback');
      return;
    }

    try {
      setIsAnalyzing(true);
      setViewState('loading');

      // Build exercise map for batch analysis
      const exerciseMap = new Map();
      answers.forEach(a => {
        exerciseMap.set(a.wordId, {
          id: a.wordId,
          question: a.direction === 'fr-en' 
            ? `Translate "${a.french}" to English`
            : `Translate "${a.english}" to French`,
          correctAnswer: a.correctAnswer,
        });
      });

      const userAnswers = answers.map(a => ({
        exerciseId: a.wordId,
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
        timeSpent: 0,
        timestamp: new Date().toISOString(),
      }));

      const feedback = await provider.analyzeBatch(userAnswers, exerciseMap);
      setBatchFeedback(feedback);
      setViewState('batch-feedback');
    } catch (err) {
      console.error('Failed to get batch feedback:', err);
      // Fallback to basic feedback
      const correct = answers.filter(a => a.isCorrect).length;
      setBatchFeedback({
        strengths: correct > answers.length / 2 ? ['Good accuracy!'] : [],
        weaknesses: correct <= answers.length / 2 ? ['Keep practicing!'] : [],
        recommendations: ['Review incorrect answers and try again.'],
        detailedAnalysis: `You answered ${correct} out of ${answers.length} correctly (${Math.round(correct/answers.length*100)}%).`,
      });
      setViewState('batch-feedback');
    } finally {
      setIsAnalyzing(false);
    }
  }, [provider, isReady]);

  // Continue after batch feedback
  const handleContinueAfterFeedback = useCallback(() => {
    sessionAnswersRef.current = [];
    setViewState('question');
    setBatchFeedback(null);
  }, []);

  // End session completely
  const handleEndCompletely = useCallback(() => {
    setViewState('setup');
    setBatchFeedback(null);
    sessionAnswersRef.current = [];
  }, []);

  // Get question text based on direction
  const getQuestionText = (word: VocabWord): string => {
    if (direction === 'fr-en') {
      if (showGender && word.gender && word.partOfSpeech === 'noun') {
        return `${word.gender} ${word.french}`;
      }
      return word.french;
    } else {
      return word.english;
    }
  };

  // Get correct answer text for feedback
  const getCorrectAnswerText = (word: VocabWord): string => {
    if (direction === 'fr-en') {
      const answers = [word.english, ...(word.alternativeTranslations || [])];
      return answers.join(' / ');
    } else {
      return word.french;
    }
  };

  // Session stats
  const sessionStats = useMemo(() => {
    const answers = sessionAnswersRef.current;
    const total = answers.length;
    const correct = answers.filter(a => a.isCorrect).length;
    return { total, correct, accuracy: total > 0 ? Math.round(correct / total * 100) : 0 };
  }, [questionNumber]); // Re-compute when question changes

  // Loading state
  if (progressLoading || wordsLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-lg text-[var(--color-text-secondary)]">Loading vocabulary...</p>
        </motion.div>
      </div>
    );
  }

  // Setup view
  if (viewState === 'setup') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex gap-6">
          {/* Main setup panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 max-w-2xl"
          >
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-8">
              Vocabulary Practice
            </h1>

            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] shadow-md p-6 space-y-6 border border-[var(--color-border)]">
              {/* Level selector */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Level
                </label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as VocabLevel)}
                  className="w-full px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="A1">A1 - Beginner (500 words)</option>
                  <option value="A2">A2 - Elementary (500 words)</option>
                  <option value="all">All Levels (1000 words)</option>
                </select>
              </div>

              {/* Direction selector */}
              <div>
                <label htmlFor="direction" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Practice Direction
                </label>
                <select
                  id="direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as PracticeDirection)}
                  className="w-full px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="fr-en">French → English</option>
                  <option value="en-fr">English → French</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Practice Weak Words Only</label>
                    <p className="text-xs text-[var(--color-text-secondary)]">Focus on words with mastery ≤ 2</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={weakOnly}
                    onClick={() => setWeakOnly(!weakOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${weakOnly ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${weakOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Show Gender for Nouns</label>
                    <p className="text-xs text-[var(--color-text-secondary)]">Display le/la/l' before French nouns</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showGender}
                    onClick={() => setShowGender(!showGender)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showGender ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showGender ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Word count info */}
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {weakOnly ? `${words.length} weak words available` : `${words.length} words available`}
                </p>
              </div>

              {/* Start button */}
              <button
                onClick={handleStartPractice}
                disabled={words.length === 0}
                className="w-full px-6 py-3 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:bg-[var(--color-border)] disabled:cursor-not-allowed transition-colors"
              >
                Start Endless Practice
              </button>
            </div>
          </motion.div>

          {/* Mini heatmap sidebar */}
          <div className="hidden lg:block w-80">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Your Progress</h2>
            <MiniHeatmap words={allWords} progress={progress} />
          </div>
        </div>
      </div>
    );
  }

  // Loading view
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-lg text-[var(--color-text-secondary)]">
            {isAnalyzing ? 'Analyzing your performance...' : 'Preparing questions...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // No words available (weak mode)
  if (viewState === 'no-words') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] shadow-md p-6 border border-[var(--color-border)]"
        >
          <div className="text-[var(--color-good)] mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 text-center">No Weak Words!</h2>
          <p className="text-[var(--color-text-secondary)] mb-6 text-center">
            Great job! You don't have any weak words to practice.
          </p>
          <button
            onClick={() => { setWeakOnly(false); setViewState('setup'); }}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)]"
          >
            Practice All Words
          </button>
        </motion.div>
      </div>
    );
  }

  // Error view
  if (viewState === 'error' || wordsError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] shadow-md p-6 border border-[var(--color-border)]"
        >
          <div className="text-[var(--color-weak)] mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 text-center">Error</h2>
          <p className="text-[var(--color-text-secondary)] mb-6 text-center">{error || wordsError}</p>
          <button
            onClick={() => setViewState('setup')}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)]"
          >
            Back to Setup
          </button>
        </motion.div>
      </div>
    );
  }

  // Batch feedback view
  if (viewState === 'batch-feedback' && batchFeedback) {
    const stats = sessionStats;
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mx-auto p-6 bg-[var(--color-bg-card)] rounded-lg shadow-md border border-[var(--color-border)]"
        >
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3 text-center">Session Complete!</h2>
          <p className="text-lg text-[var(--color-text-secondary)] text-center mb-6">
            {stats.total} questions • {stats.accuracy}% accuracy
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)]">Questions</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
            </div>
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center border border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)]">Correct</p>
              <p className="text-3xl font-bold text-[var(--color-good)]">{stats.correct}</p>
            </div>
          </div>

          {/* Feedback sections */}
          {batchFeedback.strengths.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-good)] mb-2">Strengths</h3>
              <ul className="space-y-1">
                {batchFeedback.strengths.map((s, i) => (
                  <li key={i} className="text-[var(--color-text-primary)]">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {batchFeedback.weaknesses.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-learning)] mb-2">Areas to Improve</h3>
              <ul className="space-y-1">
                {batchFeedback.weaknesses.map((w, i) => (
                  <li key={i} className="text-[var(--color-text-primary)]">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {batchFeedback.recommendations.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {batchFeedback.recommendations.map((r, i) => (
                  <li key={i} className="text-[var(--color-text-primary)]">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {batchFeedback.detailedAnalysis && (
            <div className="mb-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
              <p className="text-[var(--color-text-secondary)]">{batchFeedback.detailedAnalysis}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleContinueAfterFeedback}
              className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)]"
            >
              Continue Practice
            </button>
            <button
              onClick={handleEndCompletely}
              className="flex-1 px-6 py-3 text-lg font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] rounded-[var(--radius-button)] border border-[var(--color-border)] hover:bg-[var(--color-border)]"
            >
              End Session
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Question view with mini heatmap
  if (viewState === 'question' && currentWord) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex gap-6">
          {/* Main question area */}
          <div className="flex-1 max-w-2xl">
            {/* Header */}
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-[var(--color-text-secondary)]">
                Question {questionNumber} • {sessionStats.correct}/{sessionStats.total} correct
              </div>
              <button
                onClick={handleEndSession}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-button)] hover:bg-[var(--color-bg-secondary)]"
              >
                End Session
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentWord.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full p-8 bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] shadow-lg border border-[var(--color-border)]"
              >
                {/* Question type badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-[var(--color-text-secondary)]">Question {questionNumber}</span>
                  <span className="px-3 py-1 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-bg-secondary)] rounded-full border border-[var(--color-border)]">
                    {direction === 'fr-en' ? 'FR → EN' : 'EN → FR'}
                  </span>
                </div>

                {/* Question text */}
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">
                  {getQuestionText(currentWord)}
                </h2>

                {/* Example hint */}
                {direction === 'fr-en' && (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6 italic">
                    "{currentWord.exampleFr}"
                  </p>
                )}

                {/* Answer form */}
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={direction === 'fr-en' ? 'Type the English translation...' : 'Type the French word...'}
                    className="w-full px-5 py-4 text-xl border-2 border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!userAnswer.trim()}
                    className="w-full px-6 py-4 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-border)] disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Answer
                  </button>
                </form>

                <p className="mt-4 text-sm text-[var(--color-text-secondary)] text-center">
                  Press <kbd className="px-2 py-1 text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded">Enter</kbd> to submit
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mini heatmap sidebar */}
          <div className="hidden lg:block w-80">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Your Progress</h2>
            <MiniHeatmap 
              words={allWords} 
              progress={progress} 
              currentWordId={currentWord.id}
            />
          </div>
        </div>
      </div>
    );
  }

  // Feedback view
  if (viewState === 'feedback' && currentWord) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex gap-6">
          {/* Main feedback area */}
          <div className="flex-1 max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`feedback-${currentWord.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full p-8 bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] shadow-lg border border-[var(--color-border)]"
              >
                {/* Feedback header */}
                <div className="flex items-center justify-center mb-8">
                  {lastCorrect ? (
                    <div className="flex items-center space-x-4 text-[var(--color-good)]">
                      <div className="w-16 h-16 bg-[var(--color-correct-bg)] rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-3xl font-bold">Correct!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 text-[var(--color-weak)]">
                      <div className="w-16 h-16 bg-[var(--color-incorrect-bg)] rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-3xl font-bold">Not quite</span>
                    </div>
                  )}
                </div>

                {/* Answer comparison */}
                <div className="space-y-4 mb-6">
                  <div className={`p-5 rounded-[var(--radius-sm)] border-2 ${
                    lastCorrect 
                      ? 'bg-[var(--color-correct-bg)] border-[var(--color-correct-border)]' 
                      : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
                  }`}>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Your answer:</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)]">{lastAnswer}</p>
                  </div>

                  {!lastCorrect && (
                    <div className="p-5 bg-[var(--color-correct-bg)] rounded-[var(--radius-sm)] border-2 border-[var(--color-correct-border)]">
                      <p className="text-sm font-medium text-[var(--color-correct-text)] mb-2">Correct answer:</p>
                      <p className="text-xl font-bold text-[var(--color-correct-text)]">
                        {getCorrectAnswerText(currentWord)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Example sentence */}
                <div className="p-5 mb-6 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Example:</p>
                  <p className="text-base text-[var(--color-text-secondary)] italic">"{currentWord.exampleFr}"</p>
                  <p className="text-base text-[var(--color-text-secondary)] mt-1">"{currentWord.exampleEn}"</p>
                </div>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-4 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  Next Question →
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mini heatmap sidebar */}
          <div className="hidden lg:block w-80">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Your Progress</h2>
            <MiniHeatmap 
              words={allWords} 
              progress={progress} 
              currentWordId={currentWord.id}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
