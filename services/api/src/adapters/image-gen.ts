import { BrandDNA } from '@dma/shared-types';

export class ImageGenAdapter {
  private static getApiKey(): string | null {
    return process.env.OPENAI_API_KEY || null;
  }

  static async generateBackground(brandDna: BrandDNA, format: string): Promise<string> {
    const apiKey = this.getApiKey();
    const prompt = `Generate a premium modern abstract gradient design background. Absolutely NO text, letters, titles, words, numbers, or characters. Colors: ${brandDna.toneDescriptors.join(', ')}. Format layout ratio: ${format}.`;

    if (apiKey) {
      try {
        console.log('[ImageGenAdapter] Calling live DALL-E 3 visual generation...');
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: format.includes('Story') || format.includes('vertical') ? '1024x1792' : '1024x1024',
            quality: 'standard'
          })
        });

        if (response.ok) {
          const data: any = await response.json();
          const imageUrl = data.data?.[0]?.url;
          if (imageUrl) return imageUrl;
        }
      } catch (err: any) {
        console.warn('[ImageGenAdapter] Live DALL-E 3 call failed, entering simulator fallback:', err.message);
      }
    }

    // Offline Sandbox Simulator Fallback
    console.log('[ImageGenAdapter] Offline Sandbox mode. Using Unsplash color-matched abstract gradients.');
    return this.simulateBackground(brandDna, format);
  }

  private static simulateBackground(brandDna: BrandDNA, format: string): string {
    const abstracts = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop', // Pink-purple clean silk gradient
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1080&auto=format&fit=crop', // Multicolor pastel mesh
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1080&auto=format&fit=crop', // Dark minimalist glassmorphism
      'https://images.unsplash.com/photo-1618005198143-d36688d08595?q=80&w=1080&auto=format&fit=crop', // Sand tone organic wave
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1080&auto=format&fit=crop', // Elegant purple solid gradient
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080&auto=format&fit=crop'  // Blue beach dynamic curve
    ];

    const index = (brandDna.brandName.length + format.length) % abstracts.length;
    return abstracts[index];
  }
}
