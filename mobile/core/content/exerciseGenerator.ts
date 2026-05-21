// Saybon v2 — Offline Exercise Generator
// Generates diverse practice exercises dynamically from a ConceptNode
// strictly offline using database dictionary metadata.

import type { ConceptNode, Exercise, ExerciseType } from './schema';

/**
 * Generate a list of exercises for a given ConceptNode.
 * Typically returns 1-3 exercises testing different aspects:
 * - Translation (English to French)
 * - Vocabulary (French to English)
 * - Gender Recognition (if noun)
 * - Fill-in-the-blank (if examples exist)
 */
export function generateOfflineExercises(node: ConceptNode): Exercise[] {
  const exercises: Exercise[] = [];

  // Helper to generate a unique exercise ID
  const makeId = (type: string) => `${node.id}-${type}-${Math.random().toString(36).substr(2, 5)}`;

  // 1. Vocabulary Exercise (French -> English meaning)
  exercises.push({
    id: makeId('vocabulary'),
    conceptId: node.id,
    type: 'vocabulary',
    level: node.level,
    question: `Que signifie le mot « ${node.french} » ?`,
    correctAnswer: node.english,
    acceptableAnswers: [node.english.toLowerCase().trim()],
    hint: node.gender ? `C'est un nom de genre ${node.gender === 'M' ? 'Masculin' : 'Féminin'}` : undefined,
    metadata: {
      topic: 'vocabulary',
      difficulty: node.difficulty,
      createdAt: new Date().toISOString(),
      source: 'curated',
    },
  });

  // 2. Translation Exercise (English -> French word)
  exercises.push({
    id: makeId('translation'),
    conceptId: node.id,
    type: 'translation',
    level: node.level,
    question: `Traduisez en français : « ${node.english} »`,
    correctAnswer: node.french,
    // Add articles as acceptable fallbacks for noun translations
    acceptableAnswers: node.gender === 'M' 
      ? [`le ${node.french}`, `un ${node.french}`]
      : node.gender === 'F'
      ? [`la ${node.french}`, `une ${node.french}`]
      : [],
    explanation: node.culturalContext ? `Québec context: ${node.culturalContext}` : undefined,
    metadata: {
      topic: 'translation',
      difficulty: node.difficulty,
      createdAt: new Date().toISOString(),
      source: 'curated',
    },
  });

  // 3. Gender Recognition (if node has a specified gender)
  if (node.gender === 'M' || node.gender === 'F') {
    exercises.push({
      id: makeId('gender'),
      conceptId: node.id,
      type: 'gender-recognition',
      level: node.level,
      question: `Quel est le genre grammatical du mot « ${node.french} » ?`,
      correctAnswer: node.gender === 'M' ? 'Masculin' : 'Féminin',
      options: ['Masculin', 'Féminin'],
      explanation: `« ${node.french} » est un nom ${node.gender === 'M' ? 'masculin (le/un)' : 'féminin (la/une)'}.`,
      metadata: {
        topic: 'grammar',
        difficulty: node.difficulty * 0.8, // Slightly easier
        createdAt: new Date().toISOString(),
        source: 'curated',
      },
    });
  }

  // 4. Fill in the Blank (if concept has examples)
  if (node.examples && node.examples.length > 0) {
    node.examples.forEach((example, index) => {
      // Find the position of the word in the example sentence
      // case-insensitive match for word boundaries
      const regex = new RegExp(`\\b${node.french}\\b`, 'i');
      if (regex.test(example.french)) {
        const blankedSentence = example.french.replace(regex, '__________');
        exercises.push({
          id: makeId(`fillblank-${index}`),
          conceptId: node.id,
          type: 'fill-blank',
          level: node.level,
          question: `Complétez la phrase : « ${blankedSentence} »`,
          correctAnswer: node.french,
          hint: `Traduction : ${example.english}`,
          explanation: `Phrase complète : ${example.french}\n(${example.english})`,
          metadata: {
            topic: 'syntax',
            difficulty: node.difficulty * 1.1,
            createdAt: new Date().toISOString(),
            source: 'curated',
          },
        });
      }
    });
  }

  // Return list of generated exercises shuffled
  return exercises.sort(() => Math.random() - 0.5);
}
