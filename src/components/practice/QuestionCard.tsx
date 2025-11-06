// QuestionCard component for displaying exercises and capturing answers
import { useState, useEffect, useRef } from 'react';
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
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Question counter */}
      <div className="text-sm text-gray-500 mb-4">
        Question {questionNumber}
        {totalQuestions && ` of ${totalQuestions}`}
      </div>

      {/* Exercise type badge */}
      <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
        {exercise.type}
      </div>

      {/* Question text */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Answer input"
          />
        </div>

        <button
          type="submit"
          disabled={!answer.trim() || isSubmitting}
          className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Checking...' : 'Submit Answer'}
        </button>
      </form>

      {/* Keyboard hint */}
      <p className="mt-4 text-sm text-gray-500 text-center">
        Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd> to submit
      </p>
    </div>
  );
}
