// QuestionCard component for displaying exercises and capturing answers
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { FormEvent } from 'react';
import type { Exercise } from '../../types';

interface QuestionCardProps {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  isSubmitting?: boolean;
  questionNumber: number;
  totalQuestions?: number;
}

export function QuestionCard({
  exercise,
  onSubmit,
  isSubmitting = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and when exercise changes
  useEffect(() => {
    inputRef.current?.focus();
    setAnswer(''); // Clear answer when new question loads
  }, [exercise.id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !isSubmitting) {
      onSubmit(answer.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
    >
      {/* Question counter */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium text-gray-500">
          Question {questionNumber}
        </div>
        <div className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
          {exercise.type}
        </div>
      </div>

      {/* Question text */}
      <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">
        {exercise.question}
      </h2>

      {/* Answer form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="answer-input" className="sr-only">
            Your answer
          </label>
          <input
            ref={inputRef}
            id="answer-input"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your answer..."
            className="w-full px-5 py-4 text-xl border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
            aria-label="Answer input"
          />
        </div>

        <motion.button
          type="submit"
          disabled={!answer.trim() || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none"
        >
          {isSubmitting ? 'Checking...' : 'Submit Answer'}
        </motion.button>
      </form>

      {/* Keyboard hint */}
      <p className="mt-6 text-sm text-gray-400 text-center">
        Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded shadow-sm">Enter</kbd> to submit
      </p>
    </motion.div>
  );
}
