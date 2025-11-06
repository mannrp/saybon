// FeedbackDisplay component for showing answer feedback
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
    >
      {/* Feedback header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex items-center justify-center mb-8"
      >
        {isCorrect ? (
          <div className="flex items-center space-x-4 text-green-600">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
            <span className="text-3xl font-bold">Correct!</span>
          </div>
        ) : (
          <div className="flex items-center space-x-4 text-red-600">
            <motion.div
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.div>
            <span className="text-3xl font-bold">Not quite</span>
          </div>
        )}
      </motion.div>

      {/* Answer comparison */}
      <div className="space-y-4 mb-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-5 rounded-xl border-2 ${
            isCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <p className="text-sm font-medium text-gray-600 mb-2">Your answer:</p>
          <p className="text-xl font-bold text-gray-900">{userAnswer}</p>
        </motion.div>

        {!isCorrect && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-5 bg-green-50 rounded-xl border-2 border-green-200"
          >
            <p className="text-sm font-medium text-green-700 mb-2">Correct answer:</p>
            <p className="text-xl font-bold text-green-900">
              {correctAnswerText}
            </p>
          </motion.div>
        )}
      </div>

      {/* Explanation */}
      {showExplanation && exercise.explanation && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-5 mb-6 bg-blue-50 rounded-xl border-2 border-blue-200"
        >
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Explanation:
          </p>
          <p className="text-base text-blue-800 leading-relaxed">{exercise.explanation}</p>
        </motion.div>
      )}

      {/* Next button */}
      <motion.button
        ref={nextButtonRef}
        onClick={onNext}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
      >
        Next Question →
      </motion.button>
    </motion.div>
  );
}
