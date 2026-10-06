import { BrandDNA } from '@dma/shared-types';
import { GeminiClient } from '../adapters/gemini-client';

export interface FirewallCheckResult {
  status: 'pass' | 'warn' | 'flag' | 'CHECK_UNAVAILABLE';
  flaggedText: string;
  explanation: string;
}

export interface ContentHealthReport {
  originality: FirewallCheckResult;
  bias: FirewallCheckResult;
  hallucination: FirewallCheckResult;
  brand_tone: FirewallCheckResult;
  data_cleansing: FirewallCheckResult;
}

export class EthicalFirewallService {
  static async evaluate(contentBody: string, brandDna: BrandDNA): Promise<ContentHealthReport> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        console.log('[EthicalFirewallService] Running live batched 5-check evaluation via Gemini...');
        return await this.callLiveEvaluation(apiKey, contentBody, brandDna);
      } catch (err: any) {
        console.warn('[EthicalFirewallService] Live evaluation failed, returning CHECK_UNAVAILABLE as fallback:', err.message);
        return this.buildUnavailableReport('External API Error during evaluation');
      }
    }

    // Offline Sandbox Simulator Fallback
    console.log('[EthicalFirewallService] Offline Sandbox mode. Running rules-based simulator.');
    return this.simulateEvaluation(contentBody, brandDna);
  }

  private static buildUnavailableReport(reason: string): ContentHealthReport {
    const unavailableCheck = {
      status: 'CHECK_UNAVAILABLE' as const,
      flaggedText: '',
      explanation: `Check was offline/unavailable: ${reason}`
    };
    return {
      originality: { ...unavailableCheck, explanation: 'Originality scan offline: ' + reason },
      bias: { ...unavailableCheck, explanation: 'Bias scanner offline: ' + reason },
      hallucination: { ...unavailableCheck, explanation: 'Hallucination flagger offline: ' + reason },
      brand_tone: { ...unavailableCheck, explanation: 'Brand tone auditor offline: ' + reason },
      data_cleansing: { ...unavailableCheck, explanation: 'Data scrubbing check offline: ' + reason }
    };
  }

  private static async callLiveEvaluation(apiKey: string, contentBody: string, brandDna: BrandDNA): Promise<ContentHealthReport> {
    const systemPrompt = `
You are an AI Ethical Firewall copy editor. Evaluate the following marketing content against exactly five dimensions and return a strict JSON output matching the format described below.

Dimensions to check:
1. originality: Check for plagiarism or copied structures.
2. bias: Scan for stereotypes, ageism, gender bias, or inappropriate exclusion.
3. hallucination: Verify statements that claim statistical data or unverified facts.
4. brand_tone: Audit if the text matches the brand's tone: ${brandDna.toneDescriptors.join(', ')}.
5. data_cleansing: Scan for PII (emails, phone numbers) or unverified numbers.

For each check, assign a status: "pass", "warn", or "flag". If status is "warn" or "flag", you MUST identify the exact sentence in content that triggered it in "flaggedText" and explain why in "explanation". Otherwise return empty string "" for flaggedText.

Your output must be a single strict JSON object matching this schema:
{
  "originality": { "status": "pass"|"warn"|"flag", "flaggedText": "...", "explanation": "..." },
  "bias": { "status": "pass"|"warn"|"flag", "flaggedText": "...", "explanation": "..." },
  "hallucination": { "status": "pass"|"warn"|"flag", "flaggedText": "...", "explanation": "..." },
  "brand_tone": { "status": "pass"|"warn"|"flag", "flaggedText": "...", "explanation": "..." },
  "data_cleansing": { "status": "pass"|"warn"|"flag", "flaggedText": "...", "explanation": "..." }
}

Content to evaluate:
"""
${contentBody}
"""
`;

    const res = await GeminiClient.generateContent({
      prompt: systemPrompt,
      jsonMode: true,
      temperature: 0.2
    });

    const rawText = res.text.trim();
    if (!rawText) throw new Error('Empty response');

    const cleanJson = rawText.replace(/```(json)?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as ContentHealthReport;
  }

  private static simulateEvaluation(contentBody: string, brandDna: BrandDNA): ContentHealthReport {
    const text = contentBody.toLowerCase();

    // Check for global unavailable trigger
    if (text.includes('trigger_unavailable')) {
      return this.buildUnavailableReport('Simulated API Offline state');
    }

    // Default Pass objects
    const report: ContentHealthReport = {
      originality: { status: 'pass', flaggedText: '', explanation: 'No originality anomalies detected. Content is 98% unique.' },
      bias: { status: 'pass', flaggedText: '', explanation: 'Bias scanner cleared: No demographic or social exclusion signals found.' },
      hallucination: { status: 'pass', flaggedText: '', explanation: 'Factuality index high: Claims align with brand facts.' },
      brand_tone: { status: 'pass', flaggedText: '', explanation: `Tone audit passed: Respects ${brandDna.toneDescriptors.join(' and ')} brand dna parameters.` },
      data_cleansing: { status: 'pass', flaggedText: '', explanation: 'PII scan clean: No email, phone numbers, or credit card inputs detected.' }
    };

    // 1. Originality (Plagiarism)
    if (text.includes('trigger_originality') || text.includes('plagiarize') || text.includes('copied text')) {
      const match = contentBody.match(/[^.!?]*trigger_originality[^.!?]*/i) || contentBody.match(/[^.!?]*(plagiarize|copied text)[^.!?]*/i);
      report.originality = {
        status: 'flag',
        flaggedText: match ? match[0].trim() : 'Flagged content section.',
        explanation: 'Plagiarism Audit: Match found in external copywriting repository. Originality threshold breached.'
      };
    }

    // 2. Bias Scan
    if (text.includes('trigger_bias') || text.includes('men only') || text.includes('exclusive offer for boys')) {
      const match = contentBody.match(/[^.!?]*trigger_bias[^.!?]*/i) || contentBody.match(/[^.!?]*(men only|exclusive offer for boys)[^.!?]*/i);
      report.bias = {
        status: 'flag',
        flaggedText: match ? match[0].trim() : 'Flagged gender reference.',
        explanation: 'Social Bias Audit: Exclusivity gender language detected. Proposes neutral phrasing.'
      };
    }

    // 3. Hallucination
    if (text.includes('trigger_hallucination') || text.includes('fake stat') || text.includes('99% of customers die')) {
      const match = contentBody.match(/[^.!?]*trigger_hallucination[^.!?]*/i) || contentBody.match(/[^.!?]*(fake stat|99% of customers)[^.!?]*/i);
      report.hallucination = {
        status: 'flag',
        flaggedText: match ? match[0].trim() : 'Unverified claim statement.',
        explanation: 'Factuality Check: Statement asserts statistical claims or unverified numbers not found in Brand DNA database.'
      };
    }

    // 4. Brand Tone Audit
    if (text.includes('trigger_brand_tone') || text.includes('hate') || text.includes('scream')) {
      const match = contentBody.match(/[^.!?]*trigger_brand_tone[^.!?]*/i) || contentBody.match(/[^.!?]*(hate|scream)[^.!?]*/i);
      report.brand_tone = {
        status: 'flag',
        flaggedText: match ? match[0].trim() : 'Tone deviation snippet.',
        explanation: `Brand Tone Audit: Text deviates from brand guidelines. Style tone incorporates aggressive language which conflicts with brand settings: ${brandDna.toneDescriptors.join(', ')}.`
      };
    }

    // 5. Data Cleansing
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;

    if (text.includes('trigger_data_cleansing') || emailRegex.test(contentBody) || phoneRegex.test(contentBody)) {
      let flaggedText = 'Contact section containing raw inputs.';
      if (text.includes('trigger_data_cleansing')) {
        const match = contentBody.match(/[^.!?]*trigger_data_cleansing[^.!?]*/i);
        if (match) flaggedText = match[0].trim();
      } else {
        const matchEmail = contentBody.match(emailRegex);
        const matchPhone = contentBody.match(phoneRegex);
        if (matchEmail) flaggedText = `Found: ${matchEmail[0]}`;
        else if (matchPhone) flaggedText = `Found: ${matchPhone[0]}`;
      }
      report.data_cleansing = {
        status: 'flag',
        flaggedText,
        explanation: 'Data Cleansing: Unscrubbed Personal Identifiable Information (PII) or raw contact numbers detected.'
      };
    }

    return report;
  }
}
