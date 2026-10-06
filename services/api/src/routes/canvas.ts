import { Router, Response } from 'express';
import { dbQuery } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { CanvasAiAdapter } from '../adapters/canvas-ai';
import { GeminiClient } from '../adapters/gemini-client';
import { VisualGenerator } from '../adapters/visual-generator';
import { v4 as uuidv4 } from 'uuid';

export const canvasRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fetch complete Brand DNA for a user, with sensible defaults if not found */
async function getCompleteBrandDna(userId: string): Promise<{ success: boolean; dna?: any }> {
  try {
    const dnaQuery = await dbQuery('SELECT * FROM brand_dna WHERE user_id = $1', [userId]);
    if (dnaQuery.rows.length === 0) {
      return {
        success: true,
        dna: {
          brandName: 'Aura Collective',
          productCategory: 'Creative Studio & Growth',
          toneDescriptors: ['Bold', 'Modern', 'Premium'],
          ethicalPositioning: '100% Ethical AI & Transparent Design',
          status: 'complete'
        }
      };
    }
    const row = dnaQuery.rows[0];
    return {
      success: true,
      dna: {
        id: row.id,
        userId: row.user_id,
        brandName: row.brand_name || 'Aura Collective',
        productCategory: row.product_category || 'Creative Studio',
        toneDescriptors: row.tone_descriptors || ['Bold', 'Modern'],
        audienceDescription: row.audience_description,
        styleReferences: row.style_references,
        ethicalPositioning: row.ethical_positioning || 'Authentic & Sustainable',
        status: row.status,
        questionnaireComplete: row.questionnaire_complete
      }
    };
  } catch (err) {
    return {
      success: true,
      dna: {
        brandName: 'Aura Collective',
        productCategory: 'Creative Studio & Growth',
        toneDescriptors: ['Bold', 'Modern', 'Premium'],
        ethicalPositioning: '100% Ethical AI & Transparent Design',
        status: 'complete'
      }
    };
  }
}

/**
 * Sanitize thumbnail_url: if it's a base64 data URL larger than 500KB,
 * truncate it to null to avoid body-size issues. The canvas already stores
 * the full payload in project_payload; thumbnail is only for list previews.
 */
function sanitizeThumbnail(thumbnail_url: string | undefined | null): string | null {
  if (!thumbnail_url) return null;
  // Accept regular URLs as-is
  if (!thumbnail_url.startsWith('data:')) return thumbnail_url;
  // Truncate oversized base64 thumbnails (> 400KB chars ≈ ~300KB binary)
  if (thumbnail_url.length > 400_000) return null;
  return thumbnail_url;
}

// ── Routes ─────────────────────────────────────────────────────────────────

// 1. GET /api/canvas — List user canvas projects
canvasRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  try {
    const projects = await dbQuery(
      `SELECT id, user_id, name, width, height, format, thumbnail_url, ai_brief, color_palette, created_at, updated_at
       FROM canvas_projects WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    res.json({ success: true, projects: projects.rows });
  } catch (error) {
    console.error('[List Canvas Projects Error]:', error);
    res.status(500).json({ error: 'Internal server error listing projects' });
  }
});

// 2. GET /api/canvas/:id — Fetch single canvas project
canvasRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id;
  try {
    const project = await dbQuery(
      'SELECT * FROM canvas_projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, project: project.rows[0] });
  } catch (error) {
    console.error('[Fetch Canvas Project Error]:', error);
    res.status(500).json({ error: 'Internal server error fetching project details' });
  }
});

// 3. POST /api/canvas — Create new canvas project
canvasRouter.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const {
    name, width, height,
    format = 'Instagram Post',
    thumbnail_url,
    ai_brief,
    color_palette = [],
    projectPayload
  } = req.body;

  if (!name || !width || !height || !projectPayload) {
    return res.status(400).json({ error: 'Missing required fields: name, width, height, projectPayload' });
  }

  try {
    const newId = uuidv4();
    const safeThumbnail = sanitizeThumbnail(thumbnail_url);

    const result = await dbQuery(
      `INSERT INTO canvas_projects
         (id, user_id, name, width, height, format, thumbnail_url, ai_brief, color_palette, project_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        newId, userId, name, width, height, format,
        safeThumbnail,
        ai_brief || null,
        JSON.stringify(color_palette),
        JSON.stringify(projectPayload)
      ]
    );
    res.status(201).json({ success: true, project: result.rows[0] });
  } catch (error: any) {
    console.error('[Create Canvas Project Error]:', error);
    res.status(500).json({ error: 'Internal server error creating canvas project', detail: error?.message });
  }
});

// 4. PUT /api/canvas/:id — Update canvas project
canvasRouter.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id;
  const { name, format, thumbnail_url, ai_brief, color_palette, projectPayload } = req.body;

  if (!name || !projectPayload) {
    return res.status(400).json({ error: 'Missing required fields: name, projectPayload' });
  }

  try {
    const safeThumbnail = sanitizeThumbnail(thumbnail_url);

    const result = await dbQuery(
      `UPDATE canvas_projects
       SET name             = $1,
           format           = COALESCE($2, format),
           thumbnail_url    = COALESCE($3, thumbnail_url),
           ai_brief         = COALESCE($4, ai_brief),
           color_palette    = COALESCE($5, color_palette),
           project_payload  = $6,
           updated_at       = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [
        name,
        format || null,
        safeThumbnail,
        ai_brief || null,
        color_palette ? JSON.stringify(color_palette) : null,
        JSON.stringify(projectPayload),
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or you do not own it' });
    }
    res.json({ success: true, project: result.rows[0] });
  } catch (error: any) {
    console.error('[Update Canvas Project Error]:', error);
    res.status(500).json({ error: 'Internal server error updating canvas project', detail: error?.message });
  }
});

// 5. POST /api/canvas/:id/duplicate — Duplicate a canvas project
canvasRouter.post('/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id;

  try {
    const existing = await dbQuery(
      'SELECT * FROM canvas_projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const orig = existing.rows[0];
    const newId = uuidv4();
    const newName = `${orig.name} (Copy)`;

    const duplicated = await dbQuery(
      `INSERT INTO canvas_projects (id, user_id, name, width, height, format, thumbnail_url, ai_brief, color_palette, project_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [newId, userId, newName, orig.width, orig.height, orig.format, orig.thumbnail_url, orig.ai_brief,
        JSON.stringify(orig.color_palette || []), JSON.stringify(orig.project_payload)]
    );

    res.status(201).json({ success: true, project: duplicated.rows[0] });
  } catch (error: any) {
    console.error('[Duplicate Canvas Project Error]:', error);
    res.status(500).json({ error: 'Internal server error duplicating canvas project', detail: error?.message });
  }
});

// 6. DELETE /api/canvas/:id — Delete a canvas project
canvasRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id;

  try {
    const result = await dbQuery(
      'DELETE FROM canvas_projects WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or you do not own it' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Canvas Project Error]:', error);
    res.status(500).json({ error: 'Internal server error deleting canvas project', detail: error?.message });
  }
});

// 7. POST /api/canvas/ai-generate — AI design generation using Brand DNA
canvasRouter.post('/ai-generate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { format = 'Instagram Post', topic = '', mood = 'Modern', customPrompt = '', imageContext } = req.body;

  try {
    const dnaCheck = await getCompleteBrandDna(userId!);
    const variants = await CanvasAiAdapter.generateDesignVariants({
      format,
      topic,
      mood,
      brandDna: dnaCheck.dna,
      customPrompt,
      imageContext: imageContext || undefined
    });

    res.json({
      success: true,
      format,
      brandDna: dnaCheck.dna ? {
        brandName: dnaCheck.dna.brandName,
        category: dnaCheck.dna.productCategory
      } : null,
      variants
    });
  } catch (error: any) {
    console.error('[AI Generate Canvas Error]:', error);
    res.status(500).json({ error: 'Internal server error generating AI canvas design', detail: error?.message });
  }
});

// 8. POST /api/canvas/generate-text — AI-generate copy text for a canvas layer
canvasRouter.post('/generate-text', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { instruction, format } = req.body;

  if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
    return res.status(400).json({ error: 'instruction is required' });
  }

  try {
    const dnaCheck = await getCompleteBrandDna(userId!);
    let brandContext = '';
    if (dnaCheck.success && dnaCheck.dna) {
      const d = dnaCheck.dna;
      brandContext = `Brand: "${d.brandName}", Product: "${d.productCategory}", Tone: "${(d.toneDescriptors || []).join(', ')}", Ethical Positioning: "${d.ethicalPositioning}"`;
    }

    const systemPrefix = `You are a visual design copywriter generating short, impactful text for a ${format || 'social media'} design canvas.${brandContext ? ` Context: ${brandContext}.` : ''} Output ONLY the final text. No explanations, no quotes, no markdown. Keep it under 15 words unless asked for more.`;
    const userPrompt = instruction.trim();

    let text: string;
    try {
      const res = await GeminiClient.generateContent({
        prompt: `Instruction: ${userPrompt}`,
        systemInstruction: systemPrefix,
        temperature: 0.7
      });
      text = res.text.trim();
      if (!text) throw new Error('Empty Gemini response');
    } catch (err: any) {
      console.warn('[Canvas Generate Text] Gemini failed, using fallback:', err.message);
      text = simulateCanvasText(instruction, dnaCheck.dna);
    }

    res.json({ success: true, text });
  } catch (error) {
    console.error('[Canvas Generate Text Error]:', error);
    res.status(500).json({ error: 'Internal server error generating canvas text' });
  }
});

// 9. POST /api/canvas/generate-image — AI Visual & Illustration Generator
canvasRouter.post('/generate-image', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { prompt, style = '3d-render', format = 'Instagram Post', width, height } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const dnaCheck = await getCompleteBrandDna(userId!);
    const brandTone = (dnaCheck.dna?.toneDescriptors || ['Bold', 'Modern', 'Premium']).join(', ');

    const dimensions = CanvasAiAdapter.getDimensions(format);
    const genWidth = width || dimensions.w;
    const genHeight = height || dimensions.h;

    const result = await VisualGenerator.generateVisual({
      prompt: prompt.trim(),
      style,
      format,
      width: genWidth,
      height: genHeight,
      brandTone
    });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      enhancedPrompt: result.enhancedPrompt,
      style: result.style,
      width: result.width,
      height: result.height,
      source: result.source
    });
  } catch (error: any) {
    console.error('[AI Generate Image Error]:', error);
    res.status(500).json({ error: 'Failed to generate visual', detail: error?.message });
  }
});

// 10. POST /api/canvas/generate-svg — AI Vector SVG Illustration Generator
canvasRouter.post('/generate-svg', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const dnaCheck = await getCompleteBrandDna(userId!);
    const brandTone = (dnaCheck.dna?.toneDescriptors || ['Bold', 'Modern']).join(', ');
    const result = await VisualGenerator.generateSvg(prompt.trim(), brandTone);
    res.json({ success: true, svg: result.svg, prompt: result.prompt });
  } catch (error: any) {
    console.error('[AI Generate SVG Error]:', error);
    res.status(500).json({ error: 'Failed to generate SVG illustration', detail: error?.message });
  }
});

function simulateCanvasText(instruction: string, dna?: any): string {
  const brand = dna?.brandName || 'Our Brand';
  const product = dna?.productCategory || 'Products';
  const i = instruction.toLowerCase();

  if (i.includes('headline') || i.includes('title')) return `${brand} — Redefining ${product}`;
  if (i.includes('cta') || i.includes('call') || i.includes('action') || i.includes('button')) return 'Shop the Collection →';
  if (i.includes('tagline') || i.includes('slogan')) return 'Built Different. Built for You.';
  if (i.includes('discount') || i.includes('offer') || i.includes('sale')) return `Limited Time: 20% Off ${product}`;
  if (i.includes('launch') || i.includes('new')) return `Introducing the New ${product} Collection`;
  return `${brand} — Premium ${product} for the Modern World`;
}
