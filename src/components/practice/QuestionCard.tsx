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
  totalQuestions: _totalQuestions,
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
      className="w-full max-w-2xl mx-auto p-8 bg-[var(--color-bg-card)] shadow-lg border border-[var(--color-border)]"
      style={{ borderRadius: 'var(--radius-sm)' }}
    >
      {/* Question counter */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium text-[var(--color-text-secondary)]">
          Question {questionNumber}
        </div>
        <div
          className="inline-flex items-center px-3 py-1 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          {exercise.type}
        </div>
      </div>

      {/* Question text */}
      <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8 leading-tight">
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
            className="w-full px-5 py-4 text-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ borderRadius: 'var(--radius-sm)' }}
            aria-label="Answer input"
          />
        </div>

        <motion.button
          type="submit"
          disabled={!answer.trim() || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-4 text-lg font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none"
          style={{ borderRadius: 'var(--radius-button)' }}
        >
          {isSubmitting ? 'Checking...' : 'Submit Answer'}
        </motion.button>
      </form>

      {/* Keyboard hint */}
      <p className="mt-6 text-sm text-[var(--color-text-secondary)] text-center">
        Press <kbd className="px-2 py-1 text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-sm" style={{ borderRadius: 'var(--radius-sm)' }}>Enter</kbd> to submit
      </p>
    </motion.div>
  );
}
