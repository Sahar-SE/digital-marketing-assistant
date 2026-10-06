import { v4 as uuidv4 } from 'uuid';
import { GeminiClient } from './gemini-client';
import { VisualGenerator } from './visual-generator';

export interface CanvasLayer {
  id: string;
  type: 'background' | 'rect' | 'circle' | 'text' | 'badge' | 'image' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  alignment?: 'left' | 'center' | 'right';
  url?: string;
  borderRadius?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  visible: boolean;
  locked?: boolean;
  name?: string;
}

export interface DesignVariant {
  id: string;
  name: string;
  style: string;
  width: number;
  height: number;
  format: string;
  palette: string[];
  layers: CanvasLayer[];
}

// Curated Unsplash texture library — all pre-validated, CORS-friendly
const TEXTURE_LIBRARY = {
  darkGradient:   'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
  neonCyber:      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80',
  abstractFluid:  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&q=80',
  marbleWhite:    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
  auroraNight:    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80',
  cosmicDust:     'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=1200&q=80',
  techGrid:       'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  goldLuxe:       'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=1200&q=80',
  forestGreen:    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80',
  oceanWave:      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=80',
  inkBlot:        'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80',
  neonTriangle:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  warmSunset:     'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=1200&q=80',
  coldFrost:      'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=1200&q=80',
  concreteRaw:    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200&q=80',
  paperTexture:   'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=1200&q=80',
};

export class CanvasAiAdapter {
  static getDimensions(format: string): { w: number; h: number } {
    const map: Record<string, { w: number; h: number }> = {
      'Instagram Post':   { w: 1080, h: 1080 },
      'Instagram Story':  { w: 1080, h: 1920 },
      'Facebook Ad':      { w: 1200, h: 628  },
      'LinkedIn Banner':  { w: 1584, h: 396  },
      'Twitter/X Banner': { w: 1500, h: 500  },
      'YouTube Thumbnail':{ w: 1280, h: 720  },
      'Pinterest Pin':    { w: 1000, h: 1500 },
    };
    return map[format] || { w: 1080, h: 1080 };
  }

  static async generateDesignVariants(params: {
    format: string;
    topic?: string;
    mood?: string;
    brandDna?: any;
    customPrompt?: string;
    imageContext?: string;
  }): Promise<DesignVariant[]> {
    const { format, topic = '', mood = 'Modern', brandDna, customPrompt = '', imageContext } = params;
    const { w, h } = this.getDimensions(format);

    // ── Brand DNA extraction ──────────────────────────────────────────────
    const brandName   = brandDna?.brandName         || 'Aura Collective';
    const category    = brandDna?.productCategory   || 'Premium Lifestyle';
    const tone        = (brandDna?.toneDescriptors  || ['Bold', 'Premium', 'Modern']).join(', ');
    const ethical     = brandDna?.ethicalPositioning|| '100% Ethical AI & Transparent Design';
    const audience    = brandDna?.audienceDescription || 'Discerning modern consumers seeking quality';
    const styleRefs   = (brandDna?.styleReferences  || []).join(', ') || 'Modern minimalism, Apple, Notion';

    const apiKey = GeminiClient.getApiKey();

    if (apiKey) {
      try {
        const variants = await this.callGemini({
          format, w, h,
          brandName, category, tone, ethical, audience, styleRefs,
          topic, mood, customPrompt, imageContext
        });
        if (variants && variants.length > 0) return variants;
      } catch (err: any) {
        console.warn('[CanvasAiAdapter] Gemini generation failed, using fallback:', err.message);
      }
    }

    // Intelligent Synthesis Engine fallback
    return this.synthesizeVariants({ format, w, h, brandName, category, tone, ethical, topic, mood, imageContext });
  }

  private static async callGemini(ctx: {
    format: string;
    w: number;
    h: number;
    brandName: string;
    category: string;
    tone: string;
    ethical: string;
    audience: string;
    styleRefs: string;
    topic: string;
    mood: string;
    customPrompt: string;
    imageContext?: string;
  }): Promise<DesignVariant[]> {
    const { format, w, h, brandName, category, tone, ethical, audience, styleRefs, topic, mood, customPrompt, imageContext } = ctx;

    const imageInstruction = imageContext
      ? `\nIMPORTANT: The user has uploaded a brand image. In at least one variant, include an image layer (type: "image") using url: "${imageContext.startsWith('data:') ? '[USER_IMAGE]' : imageContext}" placed prominently on the canvas.`
      : '';

    // Generate dynamic AI visuals for the variants
    const dynamicAiVisual = await VisualGenerator.generateVisual({
      prompt: `${brandName} ${topic || category} commercial design illustration`,
      style: mood.toLowerCase().includes('neon') ? 'cyberpunk' : (mood.toLowerCase().includes('editorial') ? 'minimalist' : '3d-render'),
      width: w,
      height: h,
      brandTone: tone
    }).catch(() => null);

    // Texture suggestions the AI can pick from
    const textureList = Object.entries(TEXTURE_LIBRARY)
      .map(([k, v]) => `${k}: "${v}"`)
      .join('\n  ');

    const prompt = `You are an elite art director, brand strategist and senior graphic designer at a world-class creative agency. Your job is to generate 3 DISTINCT, stunning, high-conversion design variants for a ${format} canvas (${w} × ${h} px) — each with a completely different visual style, color palette and composition.

═══ BRAND DNA ═══
Brand Name: "${brandName}"
Product / Service Category: "${category}"
Brand Voice & Tone: "${tone}"
Target Audience: "${audience}"
Ethical Positioning: "${ethical}"
Style References: "${styleRefs}"
Campaign Focus / Topic: "${topic || 'Brand Showcase & Product Highlight'}"
Aesthetic Mood Preset: "${mood}"
${customPrompt ? `Custom Art Direction: "${customPrompt}"` : ''}
${imageInstruction}

═══ AVAILABLE TEXTURE & AI VISUAL URLS (use in image layers for rich backgrounds or visuals) ═══
${dynamicAiVisual ? `aiHeroVisual: "${dynamicAiVisual.imageUrl}"\n` : ''}  ${textureList}

═══ OUTPUT RULES ═══
Return ONLY a valid JSON array of exactly 3 design variant objects. No markdown, no explanation, no code fences.

Each variant object must have:
{
  "name": "Descriptive, evocative variant name (e.g. 'Neo Glass Midnight', 'Solar Burst High-Conv', 'Editorial Emerald Luxe')",
  "style": "One-line visual style description",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "layers": [ ...layer objects... ]
}

═══ LAYER SPEC ═══
Each layer object must have:
- id: unique string
- name: human-readable layer name
- type: one of "background" | "rect" | "circle" | "text" | "image"
- x, y: integer pixel coordinates
- visible: true

Type-specific fields:
• background → fill (hex color)
• rect       → width, height, fill (hex or "transparent"), opacity (0–1), borderRadius (0–40), stroke (hex, optional), strokeWidth (optional)
• circle     → radius, fill, opacity (0–1)
• text       → text (string), fontSize (int), fontFamily (one of "Bricolage Grotesque"|"Inter"|"Outfit"|"Playfair Display"), fontWeight ("400"|"600"|"700"|"800"|"900"), color (hex), alignment ("left"|"center"|"right"), width (optional for wrapping)
• image      → url (must be one of the TEXTURE or aiHeroVisual URLs above, or "[USER_IMAGE]"), width, height, opacity (0–1, optional)

═══ DESIGN PRINCIPLES ═══
1. Each variant should use a dramatically different color palette, layout and mood
2. Layer textures or hero visuals using image layers (opacity 0.25–0.9) UNDER glassy rect overlays for depth
3. Use decorative circles for ambient glow/bokeh effects (opacity 0.15–0.4)
4. Always include: 1 background, 1–2 decorative circles, 1 texture/image bg layer, 1 glass card rect, 1 brand tag text, 1 main headline, 1 subheadline, 1 CTA rect, 1 CTA text
5. Brand name must appear in at least one text layer
6. Make text content smart, brand-relevant and specific to the topic
7. Headline font sizes for ${w}px canvas: headings ${Math.round(w*0.044)}–${Math.round(w*0.065)}px, subheads ${Math.round(w*0.016)}–${Math.round(w*0.022)}px
8. Keep all elements within canvas boundaries (0,0 to ${w},${h})
9. Use the brand DNA throughout — tone descriptors in copy, ethical positioning in taglines
10. Make designs WOW-worthy and premium — never generic or boring`;

    const res = await GeminiClient.generateContent({
      prompt,
      jsonMode: true,
      temperature: 0.85
    });

    let jsonText = res.text.trim();
    jsonText = jsonText.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();

    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Gemini returned invalid array');
    }

    return parsed.map((item: any, idx: number) => ({
      id: uuidv4(),
      name: item.name || `Design Variant ${idx + 1}`,
      style: item.style || mood,
      width: ctx.w,
      height: ctx.h,
      format: ctx.format,
      palette: Array.isArray(item.palette) ? item.palette : ['#0F172A', '#6366F1', '#EC4899', '#FFFFFF'],
      layers: (item.layers || []).map((l: any) => ({
        ...l,
        id: l.id || uuidv4(),
        visible: l.visible ?? true,
        // Replace [USER_IMAGE] placeholder with actual data url if provided, or fallback to dynamic AI visual
        url: l.url === '[USER_IMAGE]' ? ctx.imageContext : (l.url || dynamicAiVisual?.imageUrl)
      }))
    }));
  }

  private static synthesizeVariants(ctx: {
    format: string;
    w: number;
    h: number;
    brandName: string;
    category: string;
    tone: string;
    ethical: string;
    topic: string;
    mood: string;
    imageContext?: string;
  }): DesignVariant[] {
    const { format, w, h, brandName, category, tone, ethical, topic, imageContext } = ctx;
    const isBanner = h < 600;
    const headline = topic ? topic : `Introducing The New ${brandName}`;
    const subhead  = `Engineered for excellence in ${category}. ${ethical}.`;

    // ── Variant A: Neo-Glass Dark Studio ─────────────────────────────────
    const variantA: DesignVariant = {
      id: uuidv4(),
      name: `${brandName} — Neo-Glass Dark`,
      style: 'Dark Glassmorphism & Neon Glow',
      width: w, height: h, format,
      palette: ['#090D16', '#6366F1', '#8B5CF6', '#38BDF8', '#F8FAFC'],
      layers: [
        {
          id: uuidv4(), name: 'Canvas Background', type: 'background',
          x: 0, y: 0, width: w, height: h, fill: '#080C14', visible: true
        },
        // Texture image layer
        {
          id: uuidv4(), name: 'Neon Cyber Texture', type: 'image',
          x: 0, y: 0, width: w, height: h,
          url: TEXTURE_LIBRARY.neonCyber, opacity: 0.18, visible: true
        },
        // Ambient orbs
        {
          id: uuidv4(), name: 'Glow Orb Purple', type: 'circle',
          x: Math.round(w * 0.7), y: Math.round(h * 0.06),
          radius: Math.round(Math.min(w, h) * 0.38),
          fill: '#4F46E5', opacity: 0.32, visible: true
        },
        {
          id: uuidv4(), name: 'Glow Orb Cyan', type: 'circle',
          x: Math.round(w * 0.05), y: Math.round(h * 0.65),
          radius: Math.round(Math.min(w, h) * 0.28),
          fill: '#06B6D4', opacity: 0.22, visible: true
        },
        // Glass card
        {
          id: uuidv4(), name: 'Glass Card Frame', type: 'rect',
          x: Math.round(w * 0.07), y: Math.round(h * 0.1),
          width: Math.round(w * 0.86), height: Math.round(h * 0.8),
          fill: '#0F172A', opacity: 0.72, stroke: '#334155', strokeWidth: 1.5,
          borderRadius: isBanner ? 14 : 24, visible: true
        },
        // Top accent bar
        {
          id: uuidv4(), name: 'Neon Accent Bar', type: 'rect',
          x: Math.round(w * 0.12), y: Math.round(h * 0.15),
          width: 4, height: Math.round(h * (isBanner ? 0.65 : 0.58)),
          fill: '#6366F1', borderRadius: 2, visible: true
        },
        // Brand tag
        {
          id: uuidv4(), name: 'Brand Category Tag', type: 'text',
          x: Math.round(w * 0.16), y: Math.round(h * (isBanner ? 0.19 : 0.17)),
          text: `✦ ${brandName.toUpperCase()}  •  ${category.toUpperCase()}`,
          fontSize: isBanner ? 11 : 15, fontFamily: 'Inter', fontWeight: '700',
          color: '#38BDF8', alignment: 'left', visible: true
        },
        // Headline
        {
          id: uuidv4(), name: 'Main Punchy Headline', type: 'text',
          x: Math.round(w * 0.16), y: Math.round(h * (isBanner ? 0.32 : 0.27)),
          width: Math.round(w * (isBanner ? 0.62 : 0.7)),
          text: headline,
          fontSize: isBanner ? 26 : Math.round(w * 0.049),
          fontFamily: 'Bricolage Grotesque', fontWeight: '800',
          color: '#FFFFFF', alignment: 'left', visible: true
        },
        // Subhead
        {
          id: uuidv4(), name: 'Value Prop Subhead', type: 'text',
          x: Math.round(w * 0.16), y: Math.round(h * (isBanner ? 0.56 : 0.48)),
          width: Math.round(w * (isBanner ? 0.58 : 0.68)),
          text: subhead,
          fontSize: isBanner ? 12 : 17, fontFamily: 'Inter', fontWeight: '400',
          color: '#94A3B8', alignment: 'left', visible: true
        },
        // CTA pill
        {
          id: uuidv4(), name: 'CTA Pill Button', type: 'rect',
          x: Math.round(w * 0.16), y: Math.round(h * (isBanner ? 0.74 : 0.69)),
          width: isBanner ? 165 : 215, height: isBanner ? 36 : 52,
          fill: '#6366F1', borderRadius: 26, visible: true
        },
        {
          id: uuidv4(), name: 'CTA Button Text', type: 'text',
          x: Math.round(w * 0.16 + (isBanner ? 24 : 32)), y: Math.round(h * (isBanner ? 0.74 : 0.69) + (isBanner ? 9 : 14)),
          text: 'Explore Collection →',
          fontSize: isBanner ? 12 : 15, fontFamily: 'Inter', fontWeight: '700',
          color: '#FFFFFF', alignment: 'center', visible: true
        },
        // User image if provided
        ...(imageContext ? [{
          id: uuidv4(), name: 'Uploaded Brand Image', type: 'image' as const,
          x: Math.round(w * 0.6), y: Math.round(h * 0.32),
          width: Math.round(w * 0.28), height: Math.round(h * 0.3),
          url: imageContext, opacity: 0.95, visible: true
        }] : [])
      ]
    };

    // ── Variant B: Solar Warm Burst ───────────────────────────────────────
    const variantB: DesignVariant = {
      id: uuidv4(),
      name: `${brandName} — Solar Impact`,
      style: 'Warm Gradient High-Conversion',
      width: w, height: h, format,
      palette: ['#150A21', '#F43F5E', '#FB923C', '#FBBF24', '#FFFFFF'],
      layers: [
        {
          id: uuidv4(), name: 'Dark Velvet BG', type: 'background',
          x: 0, y: 0, width: w, height: h, fill: '#130822', visible: true
        },
        {
          id: uuidv4(), name: 'Sunset Aurora Texture', type: 'image',
          x: 0, y: 0, width: w, height: h,
          url: TEXTURE_LIBRARY.warmSunset, opacity: 0.22, visible: true
        },
        // Glows
        {
          id: uuidv4(), name: 'Solar Glow Core', type: 'circle',
          x: Math.round(w * 0.52), y: Math.round(h * 0.32),
          radius: Math.round(Math.min(w, h) * 0.42),
          fill: '#F43F5E', opacity: 0.26, visible: true
        },
        {
          id: uuidv4(), name: 'Solar Glow Amber', type: 'circle',
          x: Math.round(w * 0.75), y: Math.round(h * 0.7),
          radius: Math.round(Math.min(w, h) * 0.25),
          fill: '#FBBF24', opacity: 0.2, visible: true
        },
        // Semi-transparent card
        {
          id: uuidv4(), name: 'Dark Overlay Card', type: 'rect',
          x: 0, y: 0, width: w, height: h,
          fill: '#150A21', opacity: 0.52, visible: true
        },
        // Horizontal accent line
        {
          id: uuidv4(), name: 'Fire Accent Line', type: 'rect',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.12 : 0.14)),
          width: Math.round(w * 0.18), height: 3,
          fill: '#F43F5E', borderRadius: 2, visible: true
        },
        {
          id: uuidv4(), name: 'Ethical Tag', type: 'text',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.18 : 0.16)),
          text: `⚡ ETHICAL & VERIFIED  •  ${brandName.toUpperCase()}`,
          fontSize: isBanner ? 11 : 14, fontFamily: 'Inter', fontWeight: '800',
          color: '#FB923C', alignment: 'left', visible: true
        },
        {
          id: uuidv4(), name: 'Main Title', type: 'text',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.32 : 0.26)),
          width: Math.round(w * 0.82),
          text: headline.toUpperCase(),
          fontSize: isBanner ? 27 : Math.round(w * 0.053),
          fontFamily: 'Bricolage Grotesque', fontWeight: '900',
          color: '#FFFFFF', alignment: 'left', visible: true
        },
        {
          id: uuidv4(), name: 'Feature Bullets', type: 'text',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.56 : 0.5)),
          width: Math.round(w * 0.82),
          text: `✓ Precision Crafted  ✓ Sustainable  ✓ 100% Verified Quality`,
          fontSize: isBanner ? 11 : 16, fontFamily: 'Inter', fontWeight: '600',
          color: '#E2E8F0', alignment: 'left', visible: true
        },
        {
          id: uuidv4(), name: 'Tone Tag', type: 'text',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.64 : 0.6)),
          text: `${tone}  ·  ${category}`,
          fontSize: isBanner ? 10 : 13, fontFamily: 'Inter', fontWeight: '500',
          color: '#FBBF24', alignment: 'left', visible: true
        },
        {
          id: uuidv4(), name: 'CTA Fire Pill', type: 'rect',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.73 : 0.69)),
          width: isBanner ? 185 : 225, height: isBanner ? 38 : 52,
          fill: '#F43F5E', borderRadius: 26, visible: true
        },
        {
          id: uuidv4(), name: 'CTA Fire Text', type: 'text',
          x: Math.round(w * 0.08 + (isBanner ? 28 : 36)), y: Math.round(h * (isBanner ? 0.73 : 0.69) + (isBanner ? 10 : 14)),
          text: 'Claim Your Access ⚡',
          fontSize: isBanner ? 12 : 15, fontFamily: 'Inter', fontWeight: '800',
          color: '#FFFFFF', alignment: 'center', visible: true
        },
        ...(imageContext ? [{
          id: uuidv4(), name: 'Uploaded Brand Image', type: 'image' as const,
          x: Math.round(w * 0.58), y: Math.round(h * 0.25),
          width: Math.round(w * 0.3), height: Math.round(h * 0.32),
          url: imageContext, opacity: 0.9, visible: true
        }] : [])
      ]
    };

    // ── Variant C: Clean Editorial Luxe ──────────────────────────────────
    const variantC: DesignVariant = {
      id: uuidv4(),
      name: `${brandName} — Editorial Luxe`,
      style: 'Minimal Luxury Editorial',
      width: w, height: h, format,
      palette: ['#0B0F19', '#10B981', '#64748B', '#F1F5F9', '#FFFFFF'],
      layers: [
        {
          id: uuidv4(), name: 'Obsidian Canvas', type: 'background',
          x: 0, y: 0, width: w, height: h, fill: '#070A10', visible: true
        },
        {
          id: uuidv4(), name: 'Gold Luxe Texture', type: 'image',
          x: 0, y: 0, width: w, height: h,
          url: TEXTURE_LIBRARY.goldLuxe, opacity: 0.12, visible: true
        },
        {
          id: uuidv4(), name: 'Emerald Orb Glow', type: 'circle',
          x: Math.round(w * 0.85), y: Math.round(h * 0.15),
          radius: Math.round(Math.min(w, h) * 0.32),
          fill: '#10B981', opacity: 0.18, visible: true
        },
        {
          id: uuidv4(), name: 'Slate Orb Glow', type: 'circle',
          x: Math.round(w * 0.12), y: Math.round(h * 0.78),
          radius: Math.round(Math.min(w, h) * 0.22),
          fill: '#64748B', opacity: 0.2, visible: true
        },
        // Thin vertical accent bar
        {
          id: uuidv4(), name: 'Luxe Emerald Bar', type: 'rect',
          x: Math.round(w * 0.08), y: Math.round(h * 0.15),
          width: 4, height: Math.round(h * (isBanner ? 0.68 : 0.62)),
          fill: '#10B981', borderRadius: 2, visible: true
        },
        // Full-width subtle top rule
        {
          id: uuidv4(), name: 'Top Rule Line', type: 'rect',
          x: Math.round(w * 0.08), y: Math.round(h * 0.1),
          width: Math.round(w * 0.84), height: 1,
          fill: '#1E293B', opacity: 0.8, visible: true
        },
        {
          id: uuidv4(), name: 'Brand Label', type: 'text',
          x: Math.round(w * 0.12), y: Math.round(h * (isBanner ? 0.16 : 0.17)),
          text: `${brandName}  |  ${category}  |  2026`,
          fontSize: isBanner ? 11 : 13, fontFamily: 'Inter', fontWeight: '600',
          color: '#10B981', alignment: 'left', visible: true
        },
        {
          id: uuidv4(), name: 'Headline Luxe', type: 'text',
          x: Math.round(w * 0.12), y: Math.round(h * (isBanner ? 0.3 : 0.27)),
          width: Math.round(w * (isBanner ? 0.72 : 0.76)),
          text: headline,
          fontSize: isBanner ? 25 : Math.round(w * 0.046),
          fontFamily: 'Bricolage Grotesque', fontWeight: '700',
          color: '#F8FAFC', alignment: 'left', visible: true
        },
        {
          id: uuidv4(), name: 'Luxe Subtitle', type: 'text',
          x: Math.round(w * 0.12), y: Math.round(h * (isBanner ? 0.54 : 0.48)),
          width: Math.round(w * (isBanner ? 0.7 : 0.72)),
          text: `Precision-crafted for ${category}. ${ethical}.`,
          fontSize: isBanner ? 12 : 17, fontFamily: 'Inter', fontWeight: '400',
          color: '#94A3B8', alignment: 'left', visible: true
        },
        // Bottom rule
        {
          id: uuidv4(), name: 'Bottom Rule Line', type: 'rect',
          x: Math.round(w * 0.08), y: Math.round(h * (isBanner ? 0.68 : 0.64)),
          width: Math.round(w * 0.84), height: 1,
          fill: '#1E293B', opacity: 0.8, visible: true
        },
        {
          id: uuidv4(), name: 'Luxe CTA Outline', type: 'rect',
          x: Math.round(w * 0.12), y: Math.round(h * (isBanner ? 0.74 : 0.69)),
          width: isBanner ? 168 : 210, height: isBanner ? 36 : 48,
          fill: 'transparent', stroke: '#10B981', strokeWidth: 2,
          borderRadius: 8, visible: true
        },
        {
          id: uuidv4(), name: 'Luxe CTA Text', type: 'text',
          x: Math.round(w * 0.12 + (isBanner ? 24 : 32)), y: Math.round(h * (isBanner ? 0.74 : 0.69) + (isBanner ? 9 : 13)),
          text: 'Discover More →',
          fontSize: isBanner ? 12 : 14, fontFamily: 'Inter', fontWeight: '700',
          color: '#10B981', alignment: 'center', visible: true
        },
        ...(imageContext ? [{
          id: uuidv4(), name: 'Uploaded Brand Image', type: 'image' as const,
          x: Math.round(w * 0.6), y: Math.round(h * 0.28),
          width: Math.round(w * 0.28), height: Math.round(h * 0.32),
          url: imageContext, opacity: 0.92, visible: true
        }] : [])
      ]
    };

    return [variantA, variantB, variantC];
  }
}
