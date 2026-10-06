import { BrandDNA } from '@dma/shared-types';
import { GeminiClient } from './gemini-client';

export interface LLMGenerateOptions {
  brandDna: BrandDNA;
  templateBody: string;
  persona?: {
    name: string;
    description: string;
    values: string[];
  };
}

export interface LLMRefineOptions {
  brandDna: BrandDNA;
  currentBody: string;
  annotationText: string;
  selectedText?: string;
  persona?: {
    name: string;
    description: string;
    values: string[];
  };
}

/**
 * Direct HTTP adapter for Google Gemini API (gemini-1.5-flash / DRAFT-tier).
 * Falls back to variable-interpolating sandbox generator if GEMINI_API_KEY is not defined.
 */
export class LLMAdapter {
  private static getApiKey(): string | null {
    return process.env.GEMINI_API_KEY || null;
  }

  static async generateDraft(options: LLMGenerateOptions): Promise<string> {
    const apiKey = this.getApiKey();
    const systemPrefix = this.buildSystemPrefix(options.brandDna, options.persona);
    const userPrompt = `Generate a marketing copy draft based on this template structure:\n"${options.templateBody}"`;

    if (apiKey) {
      try {
        console.log('[LLMAdapter] Calling live Gemini 1.5 Flash API...');
        return await this.callGemini(apiKey, systemPrefix, userPrompt);
      } catch (err: any) {
        console.warn('[LLMAdapter] Gemini API call failed, entering simulator fallback:', err.message);
      }
    }

    // Sandbox Interpolator Fallback
    console.log('[LLMAdapter] Offline Sandbox mode. Using Brand DNA Variable Interpolator.');
    return this.simulateDraft(options);
  }

  static async refineDraft(options: LLMRefineOptions): Promise<string> {
    const apiKey = this.getApiKey();
    const systemPrefix = this.buildSystemPrefix(options.brandDna, options.persona);
    const userPrompt = `
You are a content refinement editor. Refine the following content based on the instruction.

Original Content:
"""
${options.currentBody}
"""

Target Section of Text: "${options.selectedText || 'all content'}"
User's Annotation/Instruction: "${options.annotationText}"

Output ONLY the final, complete refined content. Do not include any intro, outro, or markdown code blocks (e.g. no \`\`\`). Maintain same language, tone, and platform limits.
`;

    if (apiKey) {
      try {
        console.log('[LLMAdapter] Calling live Gemini 1.5 Flash API for refinement...');
        return await this.callGemini(apiKey, systemPrefix, userPrompt);
      } catch (err: any) {
        console.warn('[LLMAdapter] Gemini API call failed for refinement, entering simulator fallback:', err.message);
      }
    }

    // Sandbox Interpolator Fallback
    console.log('[LLMAdapter] Offline Sandbox mode. Simulating refinement.');
    return this.simulateRefinement(options);
  }

  private static buildSystemPrefix(brandDna: BrandDNA, persona?: any): string {
    let prefix = `You are a copywriter generating content grounded in this Brand DNA:\n${JSON.stringify(brandDna, null, 2)}\n`;
    if (persona) {
      prefix += `\nTarget Audience Segment Persona Profile:\nName: ${persona.name}\nDescription: ${persona.description}\nMotivations/Values: ${persona.values.join(', ')}\nEnsure content is tailored specifically to resonate with this persona's preferences.`;
    }
    return prefix;
  }

  private static async callGemini(apiKey: string, systemPrefix: string, userPrompt: string): Promise<string> {
    const res = await GeminiClient.generateContent({
      prompt: userPrompt,
      systemInstruction: systemPrefix,
      temperature: 0.7
    });
    if (!res.text) {
      throw new Error('Gemini API returned empty response structure');
    }
    return res.text.trim();
  }

  private static simulateDraft(options: LLMGenerateOptions): string {
    const { brandDna, templateBody, persona } = options;
    
    // Replace standard placeholders
    let draft = templateBody
      .replace(/\{\{brandName\}\}/gi, brandDna.brandName)
      .replace(/\{\{productCategory\}\}/gi, brandDna.productCategory)
      .replace(/\{\{audienceDescription\}\}/gi, brandDna.audienceDescription);

    // Dynamic brand-tone paragraph addition to make it look realistic
    const toneList = brandDna.toneDescriptors.join(' and ');
    const personaFocus = persona ? `Specifically customized for ${persona.name} (${persona.values.join('/')}).` : '';
    
    draft = `[Draft for ${brandDna.brandName}]
${draft}

Our ${brandDna.productCategory} is designed with a focus on ${brandDna.ethicalPositioning}. Expressed in a ${toneList} voice. ${personaFocus}`;

    return draft;
  }

  private static simulateRefinement(options: LLMRefineOptions): string {
    const { currentBody, annotationText, selectedText, brandDna, persona } = options;
    
    let refined = currentBody;
    const toneList = brandDna.toneDescriptors.join(' and ');

    // Replace selected portion of text with refined note, or append to end
    if (selectedText && currentBody.includes(selectedText)) {
      const refinedSection = `${selectedText} (Updated: incorporated "${annotationText}" in a ${toneList} style)`;
      refined = currentBody.replace(selectedText, refinedSection);
    } else {
      refined = `${currentBody}\n\n[Refined: "${annotationText}" - styled for ${brandDna.brandName}]`;
    }

    if (persona) {
      refined += ` (Segment Persona: ${persona.name} applied)`;
    }

    return refined;
  }

  static async generatePersonaName(segmentName: string, values: string[]): Promise<string> {
    const apiKey = this.getApiKey();
    const systemPrefix = `You are a dynamic target audience segment name generator. Create a 2-word, catchy, persona-representative avatar display name (e.g. "Eco Emma" or "Corporate Carl") based on the Segment Name and Motivating Values. Output ONLY the final generated name. Do not include quotes, explanations or extra text.`;
    const userPrompt = `Segment Name: "${segmentName}"\nMotivating Values: "${values.join(', ')}"`;

    if (apiKey) {
      try {
        console.log('[LLMAdapter] Calling live Gemini 1.5 Flash API for persona naming...');
        return await this.callGemini(apiKey, systemPrefix, userPrompt);
      } catch (err: any) {
        console.warn('[LLMAdapter] Gemini API call failed for persona naming, entering simulator fallback:', err.message);
      }
    }

    return this.simulatePersonaName(segmentName, values);
  }

  static async generatePersonaReaction(persona: any, brandDna: BrandDNA, contentBody: string): Promise<string> {
    const apiKey = this.getApiKey();
    const systemPrefix = `You are simulated target persona "${persona.name}" with description: "${persona.description}" and motivating values: "${(persona.values || []).join(', ')}". Demographics: Age ${persona.age_range || 'unknown'}, Platform Preference ${persona.platform_preference || 'any'}.\nEnsure you write in the first-person ("I would...", "This makes me feel...") giving a qualitative reaction to the marketing draft content. Provide at least one specific, actionable critique or suggestion. Do not use quotes or introductory headers.`;
    const userPrompt = `Brand DNA: ${JSON.stringify(brandDna)}\nDraft Content:\n"${contentBody}"`;

    if (apiKey) {
      try {
        console.log('[LLMAdapter] Calling live Gemini 1.5 Flash API for persona reaction...');
        return await this.callGemini(apiKey, systemPrefix, userPrompt);
      } catch (err: any) {
        console.warn('[LLMAdapter] Gemini API call failed for persona reaction, entering simulator fallback:', err.message);
      }
    }

    return this.simulatePersonaReaction(persona, brandDna, contentBody);
  }

  private static simulatePersonaName(segmentName: string, values: string[]): string {
    const cleanSegment = segmentName.trim().toLowerCase();
    if (cleanSegment.includes('eco') || cleanSegment.includes('sustain')) {
      return 'Eco Emma';
    }
    if (cleanSegment.includes('corp') || cleanSegment.includes('enterprise') || cleanSegment.includes('business')) {
      return 'Corporate Carl';
    }
    if (cleanSegment.includes('tech') || cleanSegment.includes('dev') || cleanSegment.includes('software')) {
      return 'Techie Tina';
    }

    const firstWord = segmentName.trim().split(/\s+/)[0];
    const initial = firstWord.charAt(0).toUpperCase();
    const cleanFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();

    const initialNamesMap: { [key: string]: string } = {
      A: 'Alice', B: 'Bob', C: 'Charlie', D: 'Dan', E: 'Emma', F: 'Frank', G: 'Grace',
      H: 'Harry', I: 'Ivy', J: 'Jack', K: 'Kate', L: 'Leo', M: 'Mia', N: 'Noah',
      O: 'Olivia', P: 'Pete', Q: 'Quinn', R: 'Ryan', S: 'Sam', T: 'Tina', U: 'Uma',
      V: 'Victor', W: 'Wendy', X: 'Xavier', Y: 'Yara', Z: 'Zack'
    };

    const companionName = initialNamesMap[initial] || 'Persona';
    return `${cleanFirstWord} ${companionName}`;
  }

  private static simulatePersonaReaction(persona: any, brandDna: BrandDNA, contentBody: string): string {
    const name = persona.name || 'Eco Emma';
    const valuesList = (persona.values || []).join(', ');
    const platform = persona.platform_preference || 'Instagram';

    return `As ${name}, I feel this message resonates slightly but lacks the ROI hook. Since I deeply value ${valuesList}, I want to see a direct link to circular apparel. The draft says "${contentBody.slice(0, 40)}...", which reads a bit too generic. On ${platform}, you should make the sustainability benefits and recycled cotton details stand out more!`;
  }

  static async generateCampaignCalendar(
    name: string,
    description: string,
    duration: number,
    platforms: string[],
    brandDna: any,
    persona: any
  ): Promise<{ day: number; platform: string; category: string; postTitle: string; postBody: string }[]> {
    const apiKey = this.getApiKey();
    const personaDetails = persona 
      ? `Persona Name: "${persona.name}", Description: "${persona.description}", Motivating Values: "${(persona.values || []).join(', ')}"`
      : 'Primary General Audience';
    const brandDetails = `Brand: "${brandDna.brandName}", Category: "${brandDna.productCategory}", Ethical Positioning: "${brandDna.ethicalPositioning}"`;

    const systemPrefix = `You are a coordinated marketing campaign generator. Based on the Campaign, Brand DNA, and Target Segment Persona, create a coordinated schedule of posts.
Each post must be customized to its platform and target persona.
Output ONLY a JSON array. Do not write explanations, greetings, or markdown fences. The JSON array must contain objects with properties: "day" (integer), "platform" (string), "category" (string), "postTitle" (string), and "postBody" (string).`;

    const userPrompt = `Campaign Name: "${name}"
Campaign Description: "${description}"
Duration: ${duration} days
Target Platforms: ${platforms.join(', ')}
Target Persona: ${personaDetails}
Brand DNA: ${brandDetails}`;

    if (apiKey) {
      try {
        console.log('[LLMAdapter] Calling live Gemini 1.5 Flash API for campaign generation...');
        const responseText = await this.callGemini(apiKey, systemPrefix, userPrompt);
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (err: any) {
        console.warn('[LLMAdapter] Gemini API call failed for campaign generator, entering fallback:', err.message);
      }
    }

    return this.simulateCampaignCalendar(name, description, duration, platforms, brandDna, persona);
  }

  private static simulateCampaignCalendar(
    name: string,
    description: string,
    duration: number,
    platforms: string[],
    brandDna: any,
    persona: any
  ) {
    const campaignDuration = parseInt(duration as any, 10) || 7;
    const targetDays: number[] = [];
    if (campaignDuration <= 7) {
      targetDays.push(1, 3, 5, 7);
    } else if (campaignDuration <= 14) {
      targetDays.push(1, 3, 6, 8, 11, 13);
    } else {
      targetDays.push(1, 4, 7, 10, 13, 16, 19, 22, 25, 28);
    }

    const categories = ['Product Launch', 'Engagement', 'Educational', 'Promotional'];
    const personaName = persona ? persona.name : 'Primary Audience';

    return targetDays.map((day, idx) => {
      const platform = platforms[idx % platforms.length];
      const category = categories[idx % categories.length];
      return {
        day,
        platform,
        category,
        postTitle: `${name} - Day ${day} on ${platform}`,
        postBody: `[Draft for ${brandDna.brandName || 'Brand'}] This is our Day ${day} post on ${platform} targeting ${personaName} for our "${name}" campaign. We are talking about ${description}. Grounded in our positioning: ${brandDna.ethicalPositioning || 'circular recycled program'}.`
      };
    });
  }
}
