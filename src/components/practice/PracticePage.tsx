// PracticePage - Main practice orchestrator (simplified for MVP)
import { useState } from 'react';
import { QuestionCard } from './QuestionCard';
import { FeedbackDisplay } from './FeedbackDisplay';
import { useSettings } from '../../hooks/useSettings';
import { useAI } from '../../hooks/useAI';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import type { CEFRLevel, ExerciseType } from '../../types';

type ViewState = 'setup' | 'question' | 'feedback' | 'loading' | 'error';

export function PracticePage() {
  const { settings } = useSettings();
  const { generateExercises, isReady } = useAI(settings);
  const {
    currentExercise,
    currentQuestionNumber,
    totalQuestionsInQueue,
    loadExercises,
    submitAnswer,
    nextQuestion,
    getStats,
  } = usePracticeSession();

  const [viewState, setViewState] = useState<ViewState>('setup');
  const [lastAnswer, setLastAnswer] = useState('');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  // Selected practice parameters
  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [type, setType] = useState<ExerciseType>('conjugation');

  // Start practice session
  const handleStartPractice = async () => {
    if (!isReady) {
      setError('AI provider not ready. Please check your settings.');
      return;
    }

    try {
      setViewState('loading');
      setError(null);

      const exercises = await generateExercises({
        level,
        type,
        count: 10,
      });

      await loadExercises(exercises);
      setViewState('question');
      setAnswerStartTime(Date.now());
    } catch (err) {
      console.error('Failed to start practice:', err);
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

    // Check if there are more questions
    if (totalQuestionsInQueue > 1) {
      setViewState('question');
    } else {
      // Session complete
      setViewState('setup');
    }
  };

  // Setup view
  if (viewState === 'setup') {
    const stats = getStats();

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            French Practice
          </h1>

          {stats.totalQuestions > 0 && (
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
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
            </div>
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
                <option value="fill-blank">Fill in the Blank</option>
                <option value="translation">Translation</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
              </select>
            </div>

            <button
              onClick={handleStartPractice}
              disabled={!isReady}
              className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isReady ? 'Start Practice' : 'Configure AI Provider in Settings'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading view
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Generating exercises...</p>
        </div>
      </div>
    );
  }

  // Error view
  if (viewState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
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
        </div>
      </div>
    );
  }

  // Question view
  if (viewState === 'question' && currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <QuestionCard
          exercise={currentExercise}
          onSubmit={handleSubmitAnswer}
          questionNumber={currentQuestionNumber}
          totalQuestions={totalQuestionsInQueue}
        />
      </div>
    );
  }

  // Feedback view
  if (viewState === 'feedback' && currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <FeedbackDisplay
          isCorrect={lastCorrect}
          exercise={currentExercise}
          userAnswer={lastAnswer}
          onNext={handleNext}
          showExplanation={settings.preferences.showExplanations}
        />
      </div>
    );
  }

  return null;
}
