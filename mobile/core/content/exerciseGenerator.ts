// Saybon v2 — Offline Exercise Generator
// Generates diverse practice exercises dynamically from a ConceptNode
// strictly offline using database dictionary metadata.

import type { ConceptNode, Exercise } from './schema';
import { conjugationDb } from './conjugationDb';

/**
 * Generate a list of exercises for a given ConceptNode.
 * Typically returns 1-5 exercises testing different aspects:
 * - Translation (English to French)
 * - Vocabulary (French to English)
 * - Gender Recognition (if noun)
 * - Fill-in-the-blank (if examples exist)
 * - Conjugation & Tense practice (if recognized verb)
 */
export function generateOfflineExercises(node: ConceptNode): Exercise[] {
  const exercises: Exercise[] = [];

  // Helper to generate a unique exercise ID
  const makeId = (type: string) => `${node.id}-${type}-${Math.random().toString(36).substr(2, 5)}`;

  const cleanFrench = node.french.toLowerCase().trim();

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

  // 5. Verb Conjugation & Tense Exercises
  // Check if the French word is a recognized verb in our database
  const verbEntry = conjugationDb.find((v) => v.verb === cleanFrench);
  if (verbEntry) {
    Object.entries(verbEntry.tenses).forEach(([tense, forms]) => {
      forms.forEach((formEntry, idx) => {
        // A. Tactile Fill-in-the-blank Conjugation
        const blankedSentence = formEntry.sentence.replace(new RegExp(`\\b${formEntry.form}\\b`, 'i'), '_________');
        exercises.push({
          id: makeId(`conjugation-${tense}-${idx}`),
          conceptId: node.id,
          type: 'conjugation',
          level: node.level,
          question: `Complétez : « ${blankedSentence} »\n(${node.french}, ${tense.toUpperCase()})`,
          correctAnswer: formEntry.form,
          acceptableAnswers: [formEntry.form.toLowerCase().trim()],
          hint: `Sujet : ${formEntry.subject} | Traduction : ${formEntry.english}`,
          explanation: `Forme conjuguée : ${formEntry.subject} ${formEntry.form}\nPhrase complète : ${formEntry.sentence}`,
          metadata: {
            topic: `conjugation-${tense}`,
            difficulty: node.difficulty * 1.1,
            createdAt: new Date().toISOString(),
            source: 'curated',
            isSubjunctive: tense.toLowerCase().includes('subjonctif'),
            tense: tense,
          } as any,
        });

        // B. Tense Translation (Subject + Verb)
        const subjLabel = formEntry.subject.charAt(0).toUpperCase() + formEntry.subject.slice(1);
        exercises.push({
          id: makeId(`tense-translation-${tense}-${idx}`),
          conceptId: node.id,
          type: 'tense-correction',
          level: node.level,
          question: `Traduisez en français : « ${subjLabel} ${verbEntry.english.replace('to ', '')} »\n(Verbe: ${node.french}, Temps: ${tense.toUpperCase()})`,
          correctAnswer: `${formEntry.subject} ${formEntry.form}`,
          acceptableAnswers: [`${formEntry.subject} ${formEntry.form}`.toLowerCase().trim()],
          explanation: `La traduction correcte au ${tense} est : ${formEntry.subject} ${formEntry.form}`,
          metadata: {
            topic: `tense-translation-${tense}`,
            difficulty: node.difficulty * 1.2,
            createdAt: new Date().toISOString(),
            source: 'curated',
            isSubjunctive: tense.toLowerCase().includes('subjonctif'),
            tense: tense,
          } as any,
        });
      });
    });
  }

  // Return list of generated exercises shuffled
  return exercises.sort(() => Math.random() - 0.5);
}
