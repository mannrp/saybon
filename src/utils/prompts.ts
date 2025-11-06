// AI prompt templates for exercise generation
import type { GenerationParams } from '../types';

export function buildExerciseGenerationPrompt(params: GenerationParams): string {
  const { level, type, count, topic } = params;

  const topicContext = topic ? `focusing on the topic: ${topic}` : '';

  const typeInstructions = {
    conjugation: 'Provide the French verb in parentheses, ask for a specific conjugation in English. Example: "Conjugate (parler) in present tense, first person singular"',
    'fill-blank': 'Give a French sentence with a blank, ask in English what word fits. Example: "Fill in the blank: Je ___ au cinéma (I go to the cinema)"',
    translation: 'Provide an English sentence and ask for French translation. Example: "Translate to French: I am happy"',
    vocabulary: 'Ask for the French word in English. Example: "What is the French word for \'house\'?"',
    grammar: 'Ask a grammar question in English about French. Example: "What is the correct article for \'maison\' (house)?"',
  };

  return `You are a French language teacher creating practice exercises for English-speaking students at ${level} CEFR level.

IMPORTANT: All questions, hints, and explanations must be in ENGLISH. Only the French words/phrases being practiced should be in French.

Generate ${count} ${type} exercises ${topicContext}.

Exercise type guidance: ${typeInstructions[type] || 'Create appropriate exercises for this type'}

Requirements:
- Questions must be in ENGLISH and appropriate for ${level} CEFR level
- Questions should be clear and unambiguous
- Correct answers should be in FRENCH (the language being learned)
- Provide acceptable variations for answers
- Hints should be in ENGLISH
- Explanations should be in ENGLISH and explain the French grammar/usage
- Use realistic, practical French vocabulary and grammar

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    {
      "type": "${type}",
      "level": "${level}",
      "question": "Question in English here",
      "correctAnswer": "french answer" or ["french answer1", "french answer2"],
      "acceptableAnswers": ["french variation1", "french variation2"],
      "hint": "Optional hint in English",
      "explanation": "Explanation in English about why this French answer is correct",
      "metadata": {
        "topic": "grammar topic",
        "difficulty": 3,
        "source": "ai-generated"
      }
    }
  ]
}`;
}

export function buildBatchAnalysisPrompt(
  answers: Array<{ question: string; userAnswer: string; isCorrect: boolean }>
): string {
  const answerSummary = answers
    .map(
      (a, i) =>
        `${i + 1}. Q: "${a.question}" | User: "${a.userAnswer}" | ${a.isCorrect ? '✓' : '✗'}`
    )
    .join('\n');

  return `You are a French language teacher analyzing an English-speaking student's practice session.

Student answers:
${answerSummary}

Provide constructive feedback in ENGLISH. Focus on patterns in their French learning.

Return JSON format (no markdown, no code blocks):
{
  "strengths": ["strength 1 in English", "strength 2 in English"],
  "weaknesses": ["weakness 1 in English", "weakness 2 in English"],
  "recommendations": ["recommendation 1 in English", "recommendation 2 in English"],
  "detailedAnalysis": "Overall analysis paragraph in English"
}`;
}
