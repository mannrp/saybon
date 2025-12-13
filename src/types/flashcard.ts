// Flashcard types for the knowledge base
export interface FlashcardMetadata {
  french?: string;
  english?: string;
  alternatives?: string[];
  gender?: string | null;
  part_of_speech?: string;
  example_fr?: string;
  example_en?: string;
  rule?: string;
  pattern?: string;
  examples?: string[];
  exceptions?: string[];
  topic?: string;
  context?: string;
  formality?: string;
  category?: string;
  formal_variant?: string | null;
  informal_variant?: string | null;
  infinitive?: string;
  tense?: string;
  subject?: string;
  conjugated?: string;
  verb_group?: string;
  auxiliary?: string | null;
}

export interface Flashcard {
  id: string;
  type: 'vocab' | 'grammar' | 'phrase' | 'conjugation';
  level: 'a1' | 'a2';
  front: string;
  back: string;
  difficulty: number;
  tags: string[];
  created_at: string;
  metadata: FlashcardMetadata;
}

export interface FlashcardBank {
  version: string;
  level: string;
  type: string;
  generated_at: string;
  total_count: number;
  flashcards: Flashcard[];
}

export type FlashcardType = 'vocab' | 'grammar' | 'phrase' | 'conjugation';
export type FlashcardLevel = 'a1' | 'a2' | 'all';
