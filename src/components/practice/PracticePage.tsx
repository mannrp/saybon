// PracticePage - Endless quiz mode with batch AI feedback
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionCard } from './QuestionCard';
import { FeedbackDisplay } from './FeedbackDisplay';
import { BatchFeedback } from './BatchFeedback';
import { useSettings } from '../../hooks/useSettings';
import { useAI } from '../../hooks/useAI';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import { loadQuestionBank, getRandomExercises, hasQuestionBank, clearSessionQuestions } from '../../utils/questionBank';
import type { CEFRLevel, ExerciseType, Exercise, AIFeedback } from '../../types';

type ViewState = 'setup' | 'question' | 'feedback' | 'batch-feedback' | 'loading' | 'error';

export function PracticePage() {
  const { settings } = useSettings();
  const { generateExercises, isReady, provider } = useAI(settings);
  const {
    currentExercise,
    currentQuestionNumber,
    answers,
    loadExercises,
    submitAnswer,
    nextQuestion,
    getStats,
    addExercises,
    startSession,
  } = usePracticeSession();

  const [viewState, setViewState] = useState<ViewState>('setup');
  const [lastAnswer, setLastAnswer] = useState('');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<AIFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Selected practice parameters
  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [type, setType] = useState<ExerciseType>('conjugation');

  // Track all exercises for batch feedback and prevent duplicates
  const exercisesMapRef = useRef<Map<string, Exercise>>(new Map());
  const sessionKeyRef = useRef<string>(crypto.randomUUID());

  // Fetch exercises from bank or AI
  const fetchExercises = useCallback(async (
    level: CEFRLevel,
    type: ExerciseType,
    count: number
  ): Promise<Exercise[]> => {
    // Try question bank first for A1-A2
    if (hasQuestionBank(level, type)) {
      const bank = await loadQuestionBank(level, type);
      if (bank) {
        return getRandomExercises(bank, count, sessionKeyRef.current);
      }
    }

    // For vocabulary and conjugation, request bulk data (more efficient)
    const bulkCount = (type === 'vocabulary' || type === 'conjugation') ? Math.max(count, 50) : count;
    
    // Fallback to AI generation
    return await generateExercises({ level, type, count: bulkCount });
  }, [generateExercises]);

  // Auto-fetch more exercises when running low
  useEffect(() => {
    const fetchMore = async () => {
      if (viewState === 'question' && !isGenerating && currentExercise) {
        // Fetch more when we have less than 3 questions left
        const queueSize = answers.length - currentQuestionNumber;
        if (queueSize < 3) {
          setIsGenerating(true);
          try {
            // Request more for vocab/conjugation since they're bulk generated
            const requestCount = (type === 'vocabulary' || type === 'conjugation') ? 30 : 10;
            const newExercises = await fetchExercises(level, type, requestCount);
            
            // Shuffle new exercises for random order
            const shuffled = [...newExercises].sort(() => Math.random() - 0.5);
            
            // Add to exercises map
            shuffled.forEach(ex => exercisesMapRef.current.set(ex.id, ex));
            
            await addExercises(shuffled);
          } catch (err) {
            console.error('Failed to fetch more exercises');
          } finally {
            setIsGenerating(false);
          }
        }
      }
    };

    fetchMore();
  }, [viewState, currentQuestionNumber, answers.length, isGenerating, currentExercise, addExercises, level, type]);

  // Start endless practice session
  const handleStartPractice = async () => {
    if (!isReady) {
      setError('AI provider not ready. Please check your settings.');
      return;
    }

    try {
      setViewState('loading');
      setError(null);
      exercisesMapRef.current.clear();
      
      // Generate new session key
      sessionKeyRef.current = crypto.randomUUID();

      startSession(true, level, type);

      // Start with more exercises for vocab/conjugation
      const initialCount = (type === 'vocabulary' || type === 'conjugation') ? 50 : 10;
      const exercises = await fetchExercises(level, type, initialCount);

      // Shuffle exercises for random order
      const shuffled = [...exercises].sort(() => Math.random() - 0.5);

      // Store exercises in map
      shuffled.forEach(ex => exercisesMapRef.current.set(ex.id, ex));

      await loadExercises(shuffled);
      setViewState('question');
      setAnswerStartTime(Date.now());
    } catch (err) {
      console.error('Failed to start practice');
      setError(err instanceof Error ? err.message : 'Failed to generate exercises');
      setViewState('error');
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = (answer: string) => {
    const timeSpent = Date.now() - answerStartTime;
    const isCorrect = submitAnswer(answer, timeSpent);

    setLastAnswer(answer);
    setLastCorrect(isCorrect);
    setViewState('feedback');
  };

  // Handle next question
  const handleNext = () => {
    nextQuestion();
    setAnswerStartTime(Date.now());
    setViewState('question');
  };

  // End session and get batch feedback
  const handleEndSession = async () => {
    if (answers.length === 0) {
      setViewState('setup');
      return;
    }

    try {
      setIsAnalyzing(true);
      setViewState('loading');
      
      if (!provider) {
        throw new Error('AI provider not available');
      }

      const feedback = await provider.analyzeBatch(answers, exercisesMapRef.current);
      setBatchFeedback(feedback);
      setViewState('batch-feedback');
    } catch (err) {
      console.error('Failed to get batch feedback');
      setError('Failed to analyze session');
      setViewState('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Continue after batch feedback
  const handleContinueAfterFeedback = () => {
    setViewState('question');
    setBatchFeedback(null);
  };

  // End session completely
  const handleEndCompletely = () => {
    setViewState('setup');
    setBatchFeedback(null);
    exercisesMapRef.current.clear();
    clearSessionQuestions(sessionKeyRef.current);
  };

  // Setup view
  if (viewState === 'setup') {
    const stats = getStats();

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            French Practice
          </h1>

          {stats.totalQuestions > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 p-6 bg-white rounded-lg shadow-md"
            >
              <h2 className="text-xl font-semibold mb-4">Last Session Results</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-2xl font-bold">{stats.accuracy.toFixed(0)}%</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficient</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Exercise Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as ExerciseType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="conjugation">Conjugation</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="fill-blank" disabled>Fill in the Blank (Coming Soon)</option>
                <option value="translation" disabled>Translation (Coming Soon)</option>
                <option value="grammar" disabled>Grammar (Coming Soon)</option>
              </select>
            </div>

            <button
              onClick={handleStartPractice}
              disabled={!isReady}
              className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isReady ? 'Start Endless Practice' : 'Configure AI Provider in Settings'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading view
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">
            {isAnalyzing ? 'Analyzing your performance...' : 'Generating exercises...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Error view
  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-lg shadow-md p-6"
        >
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <button
            onClick={() => setViewState('setup')}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Setup
          </button>
        </motion.div>
      </div>
    );
  }

  // Batch feedback view
  if (viewState === 'batch-feedback' && batchFeedback) {
    const stats = getStats();
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <BatchFeedback
          feedback={batchFeedback}
          totalQuestions={stats.totalQuestions}
          correctAnswers={stats.correctAnswers}
          onContinue={handleContinueAfterFeedback}
          onEndSession={handleEndCompletely}
        />
      </div>
    );
  }

  // Question view
  if (viewState === 'question' && currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Question {currentQuestionNumber}
          </div>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            End Session
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <QuestionCard
              exercise={currentExercise}
              onSubmit={handleSubmitAnswer}
              questionNumber={currentQuestionNumber}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Feedback view
  if (viewState === 'feedback' && currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`feedback-${currentExercise.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <FeedbackDisplay
              isCorrect={lastCorrect}
              exercise={currentExercise}
              userAnswer={lastAnswer}
              onNext={handleNext}
              showExplanation={settings.preferences.showExplanations}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
