import { GeminiClient } from './gemini-client';

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  format?: string;
  width?: number;
  height?: number;
  brandTone?: string;
}

export interface GeneratedImageResult {
  imageUrl: string;
  enhancedPrompt: string;
  style: string;
  width: number;
  height: number;
  source: 'gemini-flux' | 'gemini-imagen' | 'gemini-svg';
}

export class VisualGenerator {
  /**
   * Generates a high-quality AI visual or illustration for marketing canvases.
   */
  public static async generateVisual(params: GenerateImageParams): Promise<GeneratedImageResult> {
    const {
      prompt,
      style = '3d-render',
      width = 1080,
      height = 1080,
      brandTone = 'Bold, Modern, Premium'
    } = params;

    // Style prompt modifiers
    const styleModifiers: Record<string, string> = {
      '3d-render': 'Modern 3D isometric illustration, blender style, soft global illumination, octane render, smooth gradients, clean studio background, 8k resolution',
      'vector-illustration': 'Clean modern flat vector illustration, minimalist shapes, vibrant harmonious color palette, Behance trending graphic design, SVG style',
      'photorealistic': 'Award-winning commercial product photography, dramatic studio lighting, depth of field, sharp focus, Hasselblad 50mm, 8k uhd',
      'cyberpunk': 'Futuristic cyberpunk tech aesthetic, glowing neon accents, dark sleek metallic glass textures, synthwave luminescence, high contrast',
      'minimalist': 'Ultra minimalist aesthetic, soft muted pastel tones, plenty of negative space, elegant editorial composition, high-end lookbook',
      'watercolor': 'Delicate artistic watercolor and ink illustration, organic textured splashes, subtle pigment bleed, paper grain texture, graceful lines',
      'product-showcase': 'Premium luxury product presentation podium, floating geometric pedestals, diffused soft box lighting, elegant commercial render'
    };

    const stylePrefix = styleModifiers[style] || styleModifiers['3d-render'];

    // 1. Let Gemini enhance and art-direct the prompt
    let enhancedPrompt = prompt;
    try {
      const enhanced = await GeminiClient.enhancePromptForImage(prompt, `${style}: ${stylePrefix}`, brandTone);
      if (enhanced && enhanced.length > 5) {
        enhancedPrompt = `${enhanced}, ${stylePrefix}`;
      } else {
        enhancedPrompt = `${prompt}, ${stylePrefix}`;
      }
    } catch {
      enhancedPrompt = `${prompt}, ${stylePrefix}`;
    }

    // 2. High-speed, high-resolution FLUX AI Image Engine
    // Pollinations AI uses state-of-the-art FLUX.1 models with zero quota barriers and real-time synthesis
    const seed = Math.floor(Math.random() * 1000000);
    // Limit dimensions to standard crisp bounds
    const genW = Math.min(width, 1200);
    const genH = Math.min(height, 1200);

    const safePrompt = encodeURIComponent(enhancedPrompt.slice(0, 350));
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=${genW}&height=${genH}&seed=${seed}&nologo=true&model=flux`;

    return {
      imageUrl,
      enhancedPrompt,
      style,
      width: genW,
      height: genH,
      source: 'gemini-flux'
    };
  }

  /**
   * Generates a clean, editable SVG illustration using Gemini.
   */
  public static async generateSvg(prompt: string, brandTone?: string): Promise<{ svg: string; prompt: string }> {
    const systemInstruction = `You are an elite vector graphic designer and SVG artist.
Create a stunning, clean, self-contained SVG illustration based on the user's prompt.
Requirements:
1. Return ONLY the raw valid <svg> code starting with <svg> and ending with </svg>.
2. Do NOT wrap in markdown code blocks (\`\`\`), do NOT include explanations.
3. Include viewBox="0 0 500 500" and xmlns="http://www.w3.org/2000/svg".
4. Use modern gradients (<linearGradient>), layered paths, shapes (<rect>, <circle>, <path>) with vibrant colors.
5. Suitable for a modern digital marketing banner or icon.
${brandTone ? `Brand Tone: ${brandTone}.` : ''}`;

    const res = await GeminiClient.generateContent({
      prompt: `Create a modern vector SVG graphic for: "${prompt}"`,
      systemInstruction,
      temperature: 0.7
    });

    let cleanSvg = res.text.trim();
    // Strip markdown fences if present
    cleanSvg = cleanSvg.replace(/^```(svg|xml)?/i, '').replace(/```$/i, '').trim();

    const svgMatch = cleanSvg.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      cleanSvg = svgMatch[0];
    }

    return {
      svg: cleanSvg,
      prompt
    };
  }
}
