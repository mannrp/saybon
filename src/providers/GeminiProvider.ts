// Google Gemini AI Provider implementation
import type { AIProvider } from './AIProvider.interface';
import type { Exercise, GenerationParams, AIFeedback, UserAnswer } from '../types';
import { buildExerciseGenerationPrompt, buildBatchAnalysisPrompt } from '../utils/prompts';

interface GeminiConfig {
  apiKey: string;
  model: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  // Test connection to Gemini API
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Test connection. Reply with "OK".' }],
            },
          ],
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data: GeminiResponse = await response.json();
      return !data.error && !!data.candidates;
    } catch (error) {
      console.error('Gemini connection test failed');
      return false;
    }
  }

  // Generate exercises using Gemini
  async generateExercises(params: GenerationParams): Promise<Exercise[]> {
    try {
      const prompt = buildExerciseGenerationPrompt(params);
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API request failed: ${response.status}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini');
      }

      const text = data.candidates[0].content.parts[0].text;
      
      // Handle different response formats based on exercise type
      if (params.type === 'vocabulary') {
        return this.parseVocabularyResponse(text, params);
      } else if (params.type === 'conjugation') {
        return this.parseConjugationResponse(text, params);
      } else {
        const parsed = this.parseExerciseResponse(text);
        // Add unique IDs and timestamps to exercises
        return parsed.exercises.map((exercise) => ({
          ...exercise,
          id: crypto.randomUUID(),
          metadata: {
            ...exercise.metadata,
            createdAt: new Date().toISOString(),
          },
        }));
      }
    } catch (error) {
      console.error('Exercise generation failed');
      throw error;
    }
  }

  // Parse JSON response from Gemini (handles markdown code blocks)
  private parseExerciseResponse(text: string): { exercises: Exercise[] } {
    const cleanText = this.extractJSON(text);

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to parse Gemini response:', cleanText);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  // Extract JSON from text that may contain markdown or other content
  private extractJSON(text: string): string {
    let cleanText = text.trim();
    
    // Remove markdown code blocks
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    
    // Remove trailing code block markers
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    
    cleanText = cleanText.trim();
    
    // Try to find JSON object or array in the text
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    
    return cleanText;
  }

  // Analyze batch of answers with exercise details
  async analyzeBatch(
    answers: UserAnswer[],
    exercises: Map<string, Exercise>
  ): Promise<AIFeedback> {
    try {
      const answerData = answers.map((a) => {
        const exercise = exercises.get(a.exerciseId);
        return {
          question: exercise?.question || 'Unknown question',
          userAnswer: a.userAnswer,
          correctAnswer: Array.isArray(exercise?.correctAnswer)
            ? exercise.correctAnswer[0]
            : exercise?.correctAnswer || '',
          isCorrect: a.isCorrect,
        };
      });

      const prompt = buildBatchAnalysisPrompt(answerData);
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (data.error || !data.candidates) {
        throw new Error('Failed to get analysis from Gemini');
      }

      const text = data.candidates[0].content.parts[0].text;
      return this.parseAnalysisResponse(text);
    } catch (error) {
      console.error('Batch analysis failed');
      throw error;
    }
  }

  // Parse analysis response
  private parseAnalysisResponse(text: string): AIFeedback {
    const cleanText = this.extractJSON(text);

    try {
      const parsed = JSON.parse(cleanText);
      // Ensure all required fields exist with defaults
      return {
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
        detailedAnalysis: parsed.detailedAnalysis || '',
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', cleanText);
      // Return a fallback response instead of throwing
      return {
        strengths: [],
        weaknesses: [],
        recommendations: ['Unable to parse AI feedback. Please try again.'],
        detailedAnalysis: 'Analysis could not be completed.',
      };
    }
  }

  // Parse vocabulary bulk data and convert to exercises
  private parseVocabularyResponse(text: string, params: GenerationParams): Exercise[] {
    const cleanText = this.extractJSON(text);

    try {
      const data = JSON.parse(cleanText);
      const vocabulary = data.vocabulary || [];

      return vocabulary.map((item: any) => ({
        id: crypto.randomUUID(),
        type: 'vocabulary',
        level: params.level,
        question: `What is the French word for "${item.english}"?`,
        correctAnswer: item.french,
        acceptableAnswers: [],
        hint: `Think about ${item.topic}`,
        explanation: `The French word for "${item.english}" is "${item.french}".`,
        metadata: {
          topic: item.topic || 'vocabulary',
          difficulty: item.difficulty || 3,
          createdAt: new Date().toISOString(),
          source: 'ai-generated',
        },
      }));
    } catch (error) {
      console.error('Failed to parse vocabulary response:', cleanText);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  // Parse conjugation bulk data and convert to exercises
  private parseConjugationResponse(text: string, params: GenerationParams): Exercise[] {
    const cleanText = this.extractJSON(text);

    try {
      const data = JSON.parse(cleanText);
      const conjugations = data.conjugations || [];

      const personMap: Record<string, string> = {
        je: 'I',
        tu: 'you (informal)',
        'il/elle': 'he/she',
        nous: 'we',
        vous: 'you (formal/plural)',
        'ils/elles': 'they',
      };

      return conjugations.map((item: any) => ({
        id: crypto.randomUUID(),
        type: 'conjugation',
        level: params.level,
        question: `Conjugate "${item.verb}" in ${item.tense} tense for "${item.person}" (${personMap[item.person] || item.person})`,
        correctAnswer: item.answer,
        acceptableAnswers: [],
        hint: `Think about ${item.topic}`,
        explanation: `The correct conjugation of "${item.verb}" in ${item.tense} tense for "${item.person}" is "${item.answer}".`,
        metadata: {
          topic: item.topic || 'conjugation',
          difficulty: item.difficulty || 3,
          createdAt: new Date().toISOString(),
          source: 'ai-generated',
        },
      }));
    } catch (error) {
      console.error('Failed to parse conjugation response:', cleanText);
      throw new Error('Invalid JSON response from Gemini');
    }
  }
}
