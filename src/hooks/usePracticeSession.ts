// Hook for managing practice session state (simplified for MVP)
import { useState, useCallback } from 'react';
import type { Exercise, UserAnswer, CEFRLevel, ExerciseType } from '../types';
import { validateAnswer } from '../utils/validation';
import { exerciseStorage } from '../utils/storage';

interface PracticeSessionState {
  currentExercise: Exercise | null;
  exerciseQueue: Exercise[];
  answers: UserAnswer[];
  isLoading: boolean;
  error: string | null;
  currentQuestionNumber: number;
}

export function usePracticeSession() {
  const [state, setState] = useState<PracticeSessionState>({
    currentExercise: null,
    exerciseQueue: [],
    answers: [],
    isLoading: false,
    error: null,
    currentQuestionNumber: 0,
  });

  // Start a new practice session
  const startSession = useCallback(() => {
    setState({
      currentExercise: null,
      exerciseQueue: [],
      answers: [],
      isLoading: false,
      error: null,
      currentQuestionNumber: 0,
    });
  }, []);

  // Load exercises into the queue
  const loadExercises = useCallback(
    async (exercises: Exercise[]) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        // Store exercises in IndexedDB for caching
        await exerciseStorage.storeMany(exercises);

        // Set first exercise as current, rest in queue
        const [first, ...rest] = exercises;

        setState((prev) => ({
          ...prev,
          currentExercise: first || null,
          exerciseQueue: rest,
          isLoading: false,
          currentQuestionNumber: first ? 1 : 0,
        }));
      } catch (err) {
        console.error('Failed to load exercises');
        setState((prev) => ({
          ...prev,
          error: 'Failed to load exercises',
          isLoading: false,
        }));
      }
    },
    []
  );

  // Submit an answer for the current exercise
  const submitAnswer = useCallback(
    (userAnswerText: string, timeSpent: number): boolean => {
      if (!state.currentExercise) {
        return false;
      }

      const validation = validateAnswer(userAnswerText, state.currentExercise);

      const userAnswer: UserAnswer = {
        exerciseId: state.currentExercise.id,
        userAnswer: userAnswerText,
        isCorrect: validation.isCorrect,
        timeSpent,
        timestamp: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        answers: [...prev.answers, userAnswer],
      }));

      return validation.isCorrect;
    },
    [state.currentExercise]
  );

  // Move to the next question
  const nextQuestion = useCallback(() => {
    setState((prev) => {
      const [next, ...rest] = prev.exerciseQueue;

      return {
        ...prev,
        currentExercise: next || null,
        exerciseQueue: rest,
        currentQuestionNumber: next ? prev.currentQuestionNumber + 1 : prev.currentQuestionNumber,
      };
    });
  }, []);

  // Load exercises from cache by level and type
  const loadFromCache = useCallback(
    async (level: CEFRLevel, type: ExerciseType) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const cached = await exerciseStorage.getByLevelAndType(level, type);

        if (cached.length === 0) {
          setState((prev) => ({
            ...prev,
            error: 'No cached exercises found',
            isLoading: false,
          }));
          return;
        }

        const [first, ...rest] = cached;

        setState((prev) => ({
          ...prev,
          currentExercise: first,
          exerciseQueue: rest,
          isLoading: false,
          currentQuestionNumber: 1,
        }));
      } catch (err) {
        console.error('Failed to load from cache');
        setState((prev) => ({
          ...prev,
          error: 'Failed to load cached exercises',
          isLoading: false,
        }));
      }
    },
    []
  );

  // Get current session statistics
  const getStats = useCallback(() => {
    const totalQuestions = state.answers.length;
    const correctAnswers = state.answers.filter((a) => a.isCorrect).length;
    const averageTime =
      totalQuestions > 0
        ? state.answers.reduce((sum, a) => sum + a.timeSpent, 0) / totalQuestions
        : 0;

    return {
      totalQuestions,
      correctAnswers,
      averageTime,
      accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    };
  }, [state.answers]);

  return {
    currentExercise: state.currentExercise,
    exerciseQueue: state.exerciseQueue,
    answers: state.answers,
    isLoading: state.isLoading,
    error: state.error,
    currentQuestionNumber: state.currentQuestionNumber,
    totalQuestionsInQueue: state.exerciseQueue.length + (state.currentExercise ? 1 : 0),
    startSession,
    loadExercises,
    submitAnswer,
    nextQuestion,
    loadFromCache,
    getStats,
  };
}
