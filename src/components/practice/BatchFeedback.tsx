// BatchFeedback component for displaying AI analysis
import { motion } from 'framer-motion';
import type { AIFeedback } from '../../types';

interface BatchFeedbackProps {
  feedback: AIFeedback;
  totalQuestions: number;
  correctAnswers: number;
  onContinue: () => void;
  onEndSession: () => void;
}

export function BatchFeedback({
  feedback,
  totalQuestions,
  correctAnswers,
  onContinue,
  onEndSession,
}: BatchFeedbackProps) {
  const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto p-6 bg-[var(--color-bg-card)] rounded-lg shadow-md border border-[var(--color-border)]"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-3">
          Session Complete!
        </h2>
        <p className="text-lg text-[var(--color-text-secondary)]">
          You answered {totalQuestions} questions with {accuracy}% accuracy
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl text-center border-2 border-blue-200"
        >
          <p className="text-sm text-blue-700 font-semibold mb-2">Questions</p>
          <p className="text-4xl font-bold text-blue-900">{totalQuestions}</p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl text-center border-2 border-green-200"
        >
          <p className="text-sm text-green-700 font-semibold mb-2">Correct</p>
          <p className="text-4xl font-bold text-green-900">{correctAnswers}</p>
        </motion.div>
      </div>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-good)] mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Strengths
          </h3>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, i) => (
              <li key={i} className="flex items-start">
                <span className="text-[var(--color-good)] mr-2">•</span>
                <span className="text-[var(--color-text-primary)]">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {feedback.weaknesses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-learning)] mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {feedback.weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start">
                <span className="text-[var(--color-learning)] mr-2">•</span>
                <span className="text-[var(--color-text-primary)]">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {feedback.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recommendations
          </h3>
          <ul className="space-y-2">
            {feedback.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start">
                <span className="text-[var(--color-primary)] mr-2">•</span>
                <span className="text-[var(--color-text-primary)]">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Analysis */}
      {feedback.detailedAnalysis && (
        <div className="mb-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Overall Analysis
          </h3>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {feedback.detailedAnalysis}
          </p>
        </div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4"
      >
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-6 py-4 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-all shadow-md"
        >
          Continue Practice
        </motion.button>
        <motion.button
          onClick={onEndSession}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-6 py-4 text-lg font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] rounded-xl hover:bg-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border)] focus:ring-offset-2 transition-all border-2 border-[var(--color-border)]"
        >
          End Session
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
