// FeedbackDisplay component for showing answer feedback
import { useEffect, useRef } from 'react';
import type { Exercise } from '../../types';

interface FeedbackDisplayProps {
  isCorrect: boolean;
  exercise: Exercise;
  userAnswer: string;
  onNext: () => void;
  showExplanation?: boolean;
}

export function FeedbackDisplay({
  isCorrect,
  exercise,
  userAnswer,
  onNext,
  showExplanation = true,
}: FeedbackDisplayProps) {
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus next button
  useEffect(() => {
    nextButtonRef.current?.focus();
  }, []);

  const correctAnswerText = Array.isArray(exercise.correctAnswer)
    ? exercise.correctAnswer[0]
    : exercise.correctAnswer;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Feedback header */}
      <div className="flex items-center justify-center mb-6">
        {isCorrect ? (
          <div className="flex items-center space-x-3 text-green-600">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-2xl font-bold">Correct!</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3 text-red-600">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-2xl font-bold">Incorrect</span>
          </div>
        )}
      </div>

      {/* Answer comparison */}
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Your answer:</p>
          <p className="text-lg font-semibold text-gray-900">{userAnswer}</p>
        </div>

        {!isCorrect && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Correct answer:</p>
            <p className="text-lg font-semibold text-green-900">
              {correctAnswerText}
            </p>
          </div>
        )}
      </div>

      {/* Explanation */}
      {showExplanation && exercise.explanation && (
        <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Explanation:
          </p>
          <p className="text-sm text-blue-800">{exercise.explanation}</p>
        </div>
      )}

      {/* Next button */}
      <button
        ref={nextButtonRef}
        onClick={onNext}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Next Question
      </button>
    </div>
  );
}
