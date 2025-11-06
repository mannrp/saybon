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
      console.error('Gemini connection test failed:', error);
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
    } catch (error) {
      console.error('Exercise generation failed:', error);
      throw error;
    }
  }

  // Parse JSON response from Gemini (handles markdown code blocks)
  private parseExerciseResponse(text: string): { exercises: Exercise[] } {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to parse Gemini response:', cleanText);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  // Analyze batch of answers (optional for MVP, included for completeness)
  async analyzeBatch(answers: UserAnswer[]): Promise<AIFeedback> {
    try {
      // For MVP, we skip this - but implementation is here for Phase 2
      const answerData = answers.map((a) => ({
        question: 'Question text', // Would need to fetch from exercise
        userAnswer: a.userAnswer,
        isCorrect: a.isCorrect,
      }));

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
      console.error('Batch analysis failed:', error);
      throw error;
    }
  }

  // Parse analysis response
  private parseAnalysisResponse(text: string): AIFeedback {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to parse analysis response:', cleanText);
      throw new Error('Invalid JSON response from Gemini');
    }
  }
}
