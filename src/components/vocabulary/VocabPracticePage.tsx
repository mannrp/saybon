// VocabPracticePage - Dynamic practice arena with modular Remix Studio
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVocabulary, validateAnswer, selectWords } from '../../hooks/useVocabulary';
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
  const location = useLocation();

  // Setup options
  const [level, setLevel] = useState<VocabLevel>('A1');
  const [direction, setDirection] = useState<PracticeDirection>('fr-en');
  const [weakOnly, setWeakOnly] = useState(false);
  const [showGender, setShowGender] = useState(true);
  const [sessionSize, setSessionSize] = useState<number>(10);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());

  // Setup UI tabs
  const [setupTab, setSetupTab] = useState<'preset' | 'remix'>('preset');

  // Active Practice State
  const [viewState, setViewState] = useState<ViewState>('setup');
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0); // 1-indexed for the user
  const [userAnswer, setUserAnswer] = useState('');
  const [lastAnswer, setLastAnswer] = useState('');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchFeedback, setBatchFeedback] = useState<AIFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // References
  const sessionAnswersRef = useRef<SessionAnswer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { settings } = useSettings();
  const { provider, isReady } = useAI(settings);
  const { progress, updateProgress, loading: progressLoading } = useWordProgress();
  const {
    words,
    loading: wordsLoading,
    error: wordsError,
    loadWords,
    resetSession,
  } = useVocabulary({ level, weakOnly, progress });

  // Load all words for side heatmap
  const { words: allWords, loadWords: loadAllWords } = useVocabulary({
    level: 'all',
    weakOnly: false,
    progress,
  });

  // Handle URL parameters for preset triggers
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    
    if (mode === 'weak') {
      setWeakOnly(true);
      setSetupTab('preset');
    } else if (mode === 'all') {
      setWeakOnly(false);
      setSetupTab('preset');
    }
  }, [location.search]);

  // Load words when levels or options change
  useEffect(() => {
    if (viewState === 'setup') {
      loadWords();
      loadAllWords();
    }
  }, [level, loadWords, loadAllWords, viewState]);

  // Focus input automatically during active cards
  useEffect(() => {
    if (viewState === 'question') {
      inputRef.current?.focus();
    }
  }, [viewState, questionNumber]);

  // Toggle parts of speech filter
  const togglePartOfSpeech = (pos: string) => {
    const next = new Set(selectedParts);
    if (next.has(pos)) {
      next.delete(pos);
    } else {
      next.add(pos);
    }
    setSelectedParts(next);
  };

  // Compile words to practice
  const handleStartPractice = useCallback(() => {
    resetSession();
    sessionAnswersRef.current = [];
    setQuestionNumber(0);
    setViewState('loading');

    setTimeout(() => {
      // 1. Apply Part of Speech filters
      let candidates = words;
      if (selectedParts.size > 0) {
        candidates = words.filter((w) => selectedParts.has(w.partOfSpeech));
      }

      if (candidates.length === 0) {
        setError('No words matching these filters were found in our database.');
        setViewState('error');
        return;
      }

      // 2. Select dynamic words based on size
      const selected = selectWords(candidates, progress, new Set(), sessionSize);

      if (selected.length === 0) {
        if (weakOnly) {
          setViewState('no-words');
        } else {
          setError('Could not compile practice session. Try selecting a broader category.');
          setViewState('error');
        }
        return;
      }

      setSessionWords(selected);
      setQuestionNumber(1);
      setUserAnswer('');
      setViewState('question');
    }, 300);
  }, [words, selectedParts, progress, sessionSize, weakOnly, resetSession]);

  // Submit Answer
  const handleSubmitAnswer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const currentWord = sessionWords[questionNumber - 1];
      if (!currentWord || !userAnswer.trim()) return;

      const isCorrect = validateAnswer(currentWord, userAnswer.trim(), direction);
      const correctAnswer = direction === 'fr-en' ? currentWord.english : currentWord.french;

      // Log answer
      sessionAnswersRef.current.push({
        wordId: currentWord.id,
        french: currentWord.french,
        english: currentWord.english,
        userAnswer: userAnswer.trim(),
        correctAnswer,
        isCorrect,
        direction,
      });

      // Update Database Progress
      await updateProgress(currentWord.id, isCorrect);

      setLastAnswer(userAnswer.trim());
      setLastCorrect(isCorrect);
      setViewState('feedback');
    },
    [sessionWords, questionNumber, userAnswer, direction, updateProgress]
  );

  // End dynamic session and fetch report
  const handleEndSession = useCallback(async () => {
    const answers = sessionAnswersRef.current;
    if (answers.length === 0) {
      setViewState('setup');
      return;
    }

    if (!provider || !isReady) {
      // Offline / No Key fallback
      setBatchFeedback({
        strengths: ['Practice run complete!'],
        weaknesses: [],
        recommendations: ['Configure a Gemini API Key in settings to enable personalized batch feedback analysis.'],
        detailedAnalysis: `You completed ${answers.length} cards, answering ${answers.filter(a => a.isCorrect).length} correctly.`,
      });
      setViewState('batch-feedback');
      return;
    }

    try {
      setIsAnalyzing(true);
      setViewState('loading');

      const exerciseMap = new Map();
      answers.forEach((a) => {
        exerciseMap.set(a.wordId, {
          id: a.wordId,
          question: a.direction === 'fr-en' ? `Translate "${a.french}" to English` : `Translate "${a.english}" to French`,
          correctAnswer: a.correctAnswer,
        });
      });

      const userAnswers = answers.map((a) => ({
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
      console.error(err);
      const correct = answers.filter((a) => a.isCorrect).length;
      setBatchFeedback({
        strengths: correct > answers.length / 2 ? ['Solid effort!'] : [],
        weaknesses: correct <= answers.length / 2 ? ['Keep practicing!'] : [],
        recommendations: ['Practice this exact deck again.'],
        detailedAnalysis: `You answered ${correct} out of ${answers.length} correctly (${Math.round((correct / answers.length) * 100)}%).`,
      });
      setViewState('batch-feedback');
    } finally {
      setIsAnalyzing(false);
    }
  }, [provider, isReady]);

  // Next Question or end session
  const handleNext = useCallback(() => {
    if (questionNumber < sessionWords.length) {
      setQuestionNumber((n) => n + 1);
      setUserAnswer('');
      setViewState('question');
    } else {
      // Auto-trigger end session report
      handleEndSession();
    }
  }, [questionNumber, sessionWords, handleEndSession]);

  // Stats summary for active run
  const activeStats = useMemo(() => {
    const answers = sessionAnswersRef.current;
    const total = answers.length;
    const correct = answers.filter((a) => a.isCorrect).length;
    return {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [questionNumber, viewState]);

  // Get question prompt
  const getQuestionText = (word: VocabWord): string => {
    if (direction === 'fr-en') {
      if (showGender && word.gender && word.partOfSpeech === 'noun') {
        return `${word.gender} ${word.french}`;
      }
      return word.french;
    }
    return word.english;
  };

  const getCorrectAnswerText = (word: VocabWord): string => {
    if (direction === 'fr-en') {
      const answers = [word.english, ...(word.alternativeTranslations || [])];
      return answers.join(' / ');
    }
    return word.french;
  };

  // Render Loader
  if (progressLoading || wordsLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-lg text-[var(--color-text-secondary)]">Preparing studio cards...</p>
        </div>
      </div>
    );
  }

  // View: Setup Configuration
  if (viewState === 'setup') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main setup column */}
          <div className="flex-1 max-w-xl">
            <header className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                Practice Arena
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Configure standard presets or remix word components to generate a custom session.
              </p>
            </header>

            {/* Config Tabs */}
            <div className="flex border-b border-[var(--color-border)] mb-6 bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] p-1">
              <button
                onClick={() => setSetupTab('preset')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                  setupTab === 'preset'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Preset Focus
              </button>
              <button
                onClick={() => setSetupTab('remix')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                  setupTab === 'remix'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Remix Studio
              </button>
            </div>

            <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-sm)] border border-[var(--color-border)] p-6 space-y-6">
              {wordsError && (
                <div className="p-3 bg-[var(--color-incorrect-bg)] border border-[var(--color-incorrect-border)] text-xs text-[var(--color-incorrect-text)] rounded-[var(--radius-sm)]">
                  {wordsError}
                </div>
              )}
              {/* Level selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as VocabLevel)}
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] text-sm"
                >
                  <option value="A1">A1 - Beginner (500 words)</option>
                  <option value="A2">A2 - Elementary (500 words)</option>
                  <option value="all">All Levels (1000 words)</option>
                </select>
              </div>

              {/* Direction selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as PracticeDirection)}
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] text-sm"
                >
                  <option value="fr-en">French → English</option>
                  <option value="en-fr">English → French</option>
                </select>
              </div>

              {/* Custom Remix Toggles */}
              {setupTab === 'remix' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6 border-t border-[var(--color-border)] pt-6"
                >
                  {/* Category select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {['noun', 'verb', 'adjective', 'adverb', 'other'].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => togglePartOfSpeech(pos)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                            selectedParts.has(pos)
                              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]'
                          }`}
                        >
                          {pos}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">Session size</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSessionSize(size)}
                          className={`py-2 text-xs font-bold border rounded-[var(--radius-sm)] transition-all ${
                            sessionSize === size
                              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {size} Cards
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Global preferences */}
              <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Weak Words Only</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Prioritize words with low familiarity (mastery ≤ 2)</p>
                  </div>
                  <button
                    onClick={() => setWeakOnly(!weakOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${weakOnly ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${weakOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Show Noun Genders</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Include le/la/l' before nouns</p>
                  </div>
                  <button
                    onClick={() => setShowGender(!showGender)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showGender ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showGender ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={handleStartPractice}
                className="w-full py-4 text-sm uppercase tracking-widest font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-button)] transition-all cursor-pointer shadow-sm"
              >
                Generate Practice Session
              </button>
            </div>
          </div>

          {/* Heatmap column */}
          <div className="hidden lg:block w-80">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Daily Progress</h3>
            <MiniHeatmap words={allWords} progress={progress} />
          </div>
        </div>
      </div>
    );
  }

  // View: Loading/Analyzing transition
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-lg text-[var(--color-text-secondary)]">
            {isAnalyzing ? 'Analyzing performance reports...' : 'Compiling curated cards...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // View: Active Question Card
  if (viewState === 'question' && sessionWords[questionNumber - 1]) {
    const currentWord = sessionWords[questionNumber - 1];
    const totalCount = sessionWords.length;
    const progressPercent = (questionNumber / totalCount) * 100;

    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4 max-w-xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">
            <span>Card {questionNumber} of {totalCount}</span>
            <span>{activeStats.correct} Correct</span>
          </div>
          {/* Finite Progress Line */}
          <div className="w-full bg-[var(--color-border)] h-1 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="bg-[var(--color-primary)] h-full"
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-md"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-text-muted)]">
                {currentWord.partOfSpeech} • {currentWord.level}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full uppercase">
                {direction === 'fr-en' ? 'FR → EN' : 'EN → FR'}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[var(--color-text-primary)]" style={{ fontFamily: 'Georgia, serif' }}>
              {getQuestionText(currentWord)}
            </h2>

            {direction === 'fr-en' && currentWord.exampleFr && (
              <p className="text-sm text-[var(--color-text-secondary)] italic mb-6">
                "{currentWord.exampleFr}"
              </p>
            )}

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={direction === 'fr-en' ? 'Type English translation...' : 'Type French word...'}
                className="w-full px-4 py-3 text-lg border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-center font-medium"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="w-full py-4 text-sm font-bold uppercase tracking-wider text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-button)] disabled:bg-[var(--color-border)] cursor-pointer transition-colors"
              >
                Submit Answer
              </button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // View: Answer Correct/Incorrect Feedback
  if (viewState === 'feedback' && sessionWords[questionNumber - 1]) {
    const currentWord = sessionWords[questionNumber - 1];
    const totalCount = sessionWords.length;

    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-md space-y-6"
        >
          {/* Result Icon */}
          <div className="flex items-center space-x-3 justify-center mb-4">
            {lastCorrect ? (
              <div className="flex items-center space-x-2 text-[var(--color-good)] font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="w-8 h-8 rounded-full bg-[var(--color-correct-bg)] flex items-center justify-center text-sm">✓</span>
                <span>Correct!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-[var(--color-weak)] font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="w-8 h-8 rounded-full bg-[var(--color-incorrect-bg)] flex items-center justify-center text-sm">✕</span>
                <span>Not quite</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className={`p-4 border rounded-[var(--radius-sm)] ${lastCorrect ? 'bg-[var(--color-correct-bg)] border-[var(--color-correct-border)] text-[var(--color-correct-text)]' : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'}`}>
              <span className="text-[10px] uppercase tracking-widest font-bold block mb-1">Your answer:</span>
              <p className="text-lg font-bold">{lastAnswer}</p>
            </div>

            {!lastCorrect && (
              <div className="p-4 bg-[var(--color-correct-bg)] border border-[var(--color-correct-border)] text-[var(--color-correct-text)] rounded-[var(--radius-sm)]">
                <span className="text-[10px] uppercase tracking-widest font-bold block mb-1">Correct answer:</span>
                <p className="text-lg font-bold">{getCorrectAnswerText(currentWord)}</p>
              </div>
            )}
          </div>

          {currentWord.exampleFr && (
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs">
              <span className="font-bold block mb-1">Context Example:</span>
              <p className="italic font-semibold text-[var(--color-text-primary)]">"{currentWord.exampleFr}"</p>
              <p className="text-[var(--color-text-secondary)] mt-0.5">"{currentWord.exampleEn}"</p>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-button)] cursor-pointer"
          >
            {questionNumber < totalCount ? 'Next Card →' : 'View Performance Summary →'}
          </button>
        </motion.div>
      </div>
    );
  }

  // View: Batch AI Feedback & Dynamic Stats Report
  if (viewState === 'batch-feedback' && batchFeedback) {
    const stats = activeStats;
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4 max-w-2xl mx-auto pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-md space-y-6"
        >
          <header className="text-center">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Session Complete!</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Practice summary & linguistic diagnostics</p>
          </header>

          {/* Stats Boxes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-center">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">Cards Run</span>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-center">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">Accuracy</span>
              <p className="text-2xl font-bold mt-1 text-[var(--color-primary)]">{stats.accuracy}%</p>
            </div>
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-center">
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">Correct</span>
              <p className="text-2xl font-bold mt-1 text-[var(--color-good)]">{stats.correct}</p>
            </div>
          </div>

          {/* Diagnostic reports */}
          <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
            {batchFeedback.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-good)] mb-2">Strengths</h4>
                <ul className="text-sm space-y-1">
                  {batchFeedback.strengths.map((s, i) => (
                    <li key={i} className="text-[var(--color-text-primary)]">• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {batchFeedback.weaknesses.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-learning)] mb-2">Refinements</h4>
                <ul className="text-sm space-y-1">
                  {batchFeedback.weaknesses.map((w, i) => (
                    <li key={i} className="text-[var(--color-text-primary)]">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {batchFeedback.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Linguistic Recommendations</h4>
                <ul className="text-sm space-y-1">
                  {batchFeedback.recommendations.map((r, i) => (
                    <li key={i} className="text-[var(--color-text-primary)]">• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {batchFeedback.detailedAnalysis && (
              <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <span className="font-bold text-[var(--color-text-primary)] block mb-1">Oracle Deep Diagnostic:</span>
                {batchFeedback.detailedAnalysis}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() => { setViewState('setup'); }}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-button)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
            >
              Configure New Remix
            </button>
            <button
              onClick={() => {
                sessionAnswersRef.current = [];
                handleStartPractice();
              }}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              Practice Same Deck
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallbacks
  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-6 text-center"
        >
          <div className="text-[var(--color-weak)] mb-3 text-3xl font-bold">✕</div>
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Practice Error</h3>
          <p className="text-sm text-[var(--color-text-secondary)] my-4">
            {error || 'Could not compile practice session.'}
          </p>
          <button
            onClick={() => {
              setViewState('setup');
              setError(null);
            }}
            className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] cursor-pointer"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (viewState === 'no-words') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-6 text-center"
        >
          <div className="text-[var(--color-good)] mb-3 text-3xl font-bold">✓</div>
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>All Caught Up!</h3>
          <p className="text-sm text-[var(--color-text-secondary)] my-4">
            Fantastic effort! You don't have any weak concepts matching this active category.
          </p>
          <button
            onClick={() => {
              setWeakOnly(false);
              setViewState('setup');
            }}
            className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] cursor-pointer"
          >
            Practice Full Collection
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
}
