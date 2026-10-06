/**
 * Centralized Google Gemini Client with automatic model fallback and resilience.
 * Supported active models in 2026:
 * - gemini-3-flash-preview
 * - gemini-3.8-flash
 * - gemini-3.5-flash
 * - gemini-flash-latest
 */

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

export interface GeminiContentResponse {
  text: string;
  modelUsed: string;
}

export class GeminiClient {
  public static getApiKey(): string | null {
    return process.env.GEMINI_API_KEY || null;
  }

  /**
   * Generates text content using Gemini with automatic model failover.
   */
  public static async generateContent(params: {
    prompt: string;
    systemInstruction?: string;
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<GeminiContentResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { prompt, systemInstruction, temperature = 0.7, jsonMode = false } = params;

    let lastError: Error | null = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const contents: any[] = [];
        if (systemInstruction) {
          contents.push({
            role: 'user',
            parts: [{ text: `[SYSTEM INSTRUCTION]: ${systemInstruction}\n\n[USER INSTRUCTION]:\n${prompt}` }]
          });
        } else {
          contents.push({
            role: 'user',
            parts: [{ text: prompt }]
          });
        }

        const bodyPayload: any = {
          contents,
          generationConfig: {
            temperature,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {})
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (res.status === 200) {
          const data: any = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return { text, modelUsed: model };
        }

        const errText = await res.text();
        console.warn(`[GeminiClient] Model ${model} returned HTTP ${res.status}: ${errText.slice(0, 160)}`);
        lastError = new Error(`Gemini ${model} HTTP ${res.status}: ${errText.slice(0, 160)}`);
      } catch (err: any) {
        console.warn(`[GeminiClient] Error calling ${model}:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini fallback models failed');
  }

  /**
   * Enhances a basic user prompt into an art-directed prompt for illustrations and image generation.
   */
  public static async enhancePromptForImage(userPrompt: string, style: string, brandTone?: string): Promise<string> {
    try {
      const systemInstruction = `You are a world-class prompt engineer and art director for commercial digital design and illustrations.
Convert the user's concept into a vivid, descriptive prompt (under 40 words) optimized for AI visual synthesis.
Include details about lighting, textures, composition, visual mood, and quality.
Style requested: ${style}.
${brandTone ? `Brand Tone: ${brandTone}.` : ''}
Output ONLY the enhanced prompt string. No quotes, no intro, no punctuation except commas.`;

      const res = await this.generateContent({
        prompt: userPrompt,
        systemInstruction,
        temperature: 0.8
      });

      const enhanced = res.text.trim().replace(/^["']|["']$/g, '');
      return enhanced || userPrompt;
    } catch (err) {
      console.warn('[GeminiClient] Prompt enhancement failed, using original prompt:', err);
      return userPrompt;
    }
  }
}
