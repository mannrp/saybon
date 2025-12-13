// Hook for loading and managing flashcards
import { useState, useCallback } from 'react';
import type { Flashcard, FlashcardBank, FlashcardType, FlashcardLevel } from '../types/flashcard';

// Track used cards per session to avoid repeats
const sessionUsedCards = new Set<string>();

export function useFlashcards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async (level: FlashcardLevel, type: FlashcardType) => {
    setLoading(true);
    setError(null);
    
    try {
      const levels = level === 'all' ? ['a1', 'a2'] : [level];
      const allCards: Flashcard[] = [];
      
      for (const lvl of levels) {
        const response = await fetch(`/output/${lvl}-${type}.json`);
        if (response.ok) {
          const data: FlashcardBank = await response.json();
          allCards.push(...data.flashcards);
        }
      }
      
      if (allCards.length === 0) {
        setError(`No ${type} flashcards found for ${level.toUpperCase()}`);
      }
      
      setCards(allCards);
    } catch (err) {
      setError('Failed to load flashcards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRandomCard = useCallback((): Flashcard | null => {
    const available = cards.filter(c => !sessionUsedCards.has(c.id));
    
    if (available.length === 0) {
      // Reset session if all cards used
      sessionUsedCards.clear();
      if (cards.length === 0) return null;
      const idx = Math.floor(Math.random() * cards.length);
      sessionUsedCards.add(cards[idx].id);
      return cards[idx];
    }
    
    const idx = Math.floor(Math.random() * available.length);
    sessionUsedCards.add(available[idx].id);
    return available[idx];
  }, [cards]);

  const resetSession = useCallback(() => {
    sessionUsedCards.clear();
  }, []);

  return {
    cards,
    loading,
    error,
    loadCards,
    getRandomCard,
    resetSession,
    totalCards: cards.length,
    remainingCards: cards.length - sessionUsedCards.size,
  };
}
