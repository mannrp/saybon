// Saybon v2 — Zustand Practice Session Store
import { create } from 'zustand';
import { useProgressStore } from './useProgressStore';
import type { PracticeSession, UserAnswer, CEFRLevel } from '../content/schema';

// Local Herms-friendly unique ID generator
function generateLocalId(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

interface SessionStore {
  activeSession: PracticeSession | null;
  
  // Actions
  startSession: (level: CEFRLevel) => void;
  recordAnswer: (params: {
    exerciseId: string;
    conceptId?: string;
    userAnswerText: string;
    isCorrect: boolean;
    timeSpentMs: number;
  }) => Promise<void>;
  endSession: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,

  startSession: (level: CEFRLevel) => {
    const newSession: PracticeSession = {
      id: generateLocalId(),
      startTime: new Date().toISOString(),
      level,
      answers: [],
      stats: {
        totalQuestions: 0,
        correctAnswers: 0,
        averageTime: 0,
      },
    };
    
    set({ activeSession: newSession });
  },

  recordAnswer: async ({
    exerciseId,
    conceptId,
    userAnswerText,
    isCorrect,
    timeSpentMs,
  }) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const answer: UserAnswer = {
      exerciseId,
      userAnswer: userAnswerText,
      isCorrect,
      timeSpent: timeSpentMs,
      timestamp: new Date().toISOString(),
    };

    // 1. If conceptId is attached, record it in the mastery database
    if (conceptId) {
      try {
        await useProgressStore.getState().recordAnswer(conceptId, isCorrect);
      } catch (err) {
        console.warn(`Could not update mastery for concept ${conceptId}:`, err);
      }
    }

    // 2. Append answer to active session
    set((state) => {
      if (!state.activeSession) return state;
      const updatedAnswers = [...state.activeSession.answers, answer];
      const correctCount = updatedAnswers.filter((a) => a.isCorrect).length;
      const totalTime = updatedAnswers.reduce((sum, a) => sum + a.timeSpent, 0);

      return {
        activeSession: {
          ...state.activeSession,
          answers: updatedAnswers,
          stats: {
            totalQuestions: updatedAnswers.length,
            correctAnswers: correctCount,
            averageTime: updatedAnswers.length > 0 ? Math.round(totalTime / updatedAnswers.length) : 0,
          },
        },
      };
    });
  },

  endSession: () => {
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          endTime: new Date().toISOString(),
        },
      };
    });
  },

  clearSession: () => {
    set({ activeSession: null });
  },
}));
