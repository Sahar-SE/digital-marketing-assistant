import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// In-memory fallback database store interfaces
interface MockUser {
  user_id: string;
  email: string;
  phase: string;
  generation_credits: number;
}
interface MockCredential {
  user_id: string;
  password_hash: string;
}
interface MockBrandDNA {
  id: string;
  user_id: string;
  brand_name: string;
  product_category: string;
  tone_descriptors: string[];
  audience_description: string;
  style_references: string[];
  ethical_positioning: string;
  status: 'incomplete' | 'complete';
  questionnaire_complete: boolean;
  harvest_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}
interface MockBrandDNAVersion {
  id: string;
  brand_dna_id: string;
  user_id: string;
  brand_name: string;
  product_category: string;
  tone_descriptors: string[];
  audience_description: string;
  style_references: string[];
  ethical_positioning: string;
  created_at: Date;
}

const mockUsers: MockUser[] = [];
const mockCredentials: MockCredential[] = [];
const mockBrandDNAs: MockBrandDNA[] = [];
const mockBrandDNAVersions: MockBrandDNAVersion[] = [];

interface MockPromptTemplate {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  template_body: string;
  variables: string[];
  performance_score: number | null;
  platform: string;
  industry: string;
  source: string;
  status: string;
  user_id?: string | null;
  last_scored_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}
interface MockSegmentPersona {
  id: string;
  user_id: string;
  name: string;
  description: string;
  values: string[];
  age_range: string;
  platform_preference: string;
  created_at: Date;
}
interface MockContentPiece {
  id: string;
  user_id: string;
  campaign_id: string | null;
  platform: string;
  content_type: string;
  persona_id: string | null;
  status?: 'draft' | 'published';
  published_at?: Date | null;
  scheduled_date?: Date | null;
  created_at: Date;
  updated_at: Date;
}
interface MockContentVersion {
  id: string;
  content_piece_id: string;
  version_number: number;
  content_body: string;
  template_id: string | null;
  annotation_used: string | null;
  created_at: Date;
}
interface MockCampaign {
  id: string;
  user_id: string;
  name: string;
  description: string;
  launch_date: Date;
  duration: number;
  persona_id: string | null;
  created_at: Date;
}
interface MockContentHealthReport {
  id: string;
  content_piece_id: string;
  version_number: number;
  report_data: any;
  created_at: Date;
}
interface MockFirewallResolutionLog {
  id: string;
  user_id: string;
  content_piece_id: string;
  check_type: string;
  action: string;
  created_at: Date;
}

interface MockCanvasProject {
  id: string;
  user_id: string;
  name: string;
  width: number;
  height: number;
  format: string;
  thumbnail_url: string | null;
  ai_brief: string | null;
  color_palette: any[];
  project_payload: any;
  created_at: Date;
  updated_at: Date;
}

const mockContentHealthReports: MockContentHealthReport[] = [];
const mockFirewallResolutionLogs: MockFirewallResolutionLog[] = [];
const mockCanvasProjects: MockCanvasProject[] = [];

const mockPromptTemplates: MockPromptTemplate[] = [
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000001',
    name: 'Instagram Product Launch Carousel',
    category: 'Product Launch',
    subcategory: 'Carousel',
    template_body: "Write a 3-slide Instagram carousel post about {{brandName}}'s new {{productCategory}} launch. Slide 1: Catchy headline. Slide 2: Core benefits. Slide 3: Call to action to shop now.",
    variables: ['brandName', 'productCategory'],
    performance_score: 85.5,
    platform: 'Instagram',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000002',
    name: 'Instagram Customer Engagement Hook',
    category: 'Engagement',
    subcategory: 'Caption',
    template_body: "Write a conversational Instagram caption for {{brandName}} asking the audience about their main struggle with {{productCategory}}. Keep the tone friendly and end with a question.",
    variables: ['brandName', 'productCategory'],
    performance_score: 91.2,
    platform: 'Instagram',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000003',
    name: 'Instagram Educational Tips',
    category: 'Educational',
    subcategory: 'Tips',
    template_body: "Write a short educational Instagram post giving 3 tips on how to get the most value out of {{productCategory}}. Tone: helpful and inspiring.",
    variables: ['brandName', 'productCategory'],
    performance_score: 79.0,
    platform: 'Instagram',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000004',
    name: 'LinkedIn Industry Insight',
    category: 'Educational',
    subcategory: 'Thought Leadership',
    template_body: "Write a professional LinkedIn post sharing a trend in the {{productCategory}} industry. Explain how {{brandName}} addresses this trend. Tone: authoritative and forward-looking.",
    variables: ['brandName', 'productCategory'],
    performance_score: 88.0,
    platform: 'LinkedIn',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000005',
    name: 'LinkedIn Behind-The-Scenes Story',
    category: 'Engagement',
    subcategory: 'Storytelling',
    template_body: "Write a personal, behind-the-scenes LinkedIn post about how {{brandName}} designed our latest {{productCategory}}. Focus on the biggest challenge we overcame.",
    variables: ['brandName', 'productCategory'],
    performance_score: 94.5,
    platform: 'LinkedIn',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000006',
    name: 'LinkedIn Product Milestone Announcement',
    category: 'Promotional',
    subcategory: 'Announcement',
    template_body: "Write a professional LinkedIn announcement celebrating a new version or milestone of {{brandName}}'s {{productCategory}}. Thank our customers and partners.",
    variables: ['brandName', 'productCategory'],
    performance_score: 76.5,
    platform: 'LinkedIn',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000007',
    name: 'Blog How-To Guide Intro',
    category: 'Educational',
    subcategory: 'Blog Intro',
    template_body: "Write an engaging introduction for a blog post titled \"How to choose the best {{productCategory}} for your business\". Mention {{brandName}} naturally as a leading example.",
    variables: ['brandName', 'productCategory'],
    performance_score: 82.3,
    platform: 'Blog',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000008',
    name: 'Blog Case Study Outline',
    category: 'Promotional',
    subcategory: 'Case Study',
    template_body: "Write a blog post outline summarizing how a customer used {{brandName}}'s {{productCategory}} to solve their biggest business challenge.",
    variables: ['brandName', 'productCategory'],
    performance_score: 86.8,
    platform: 'Blog',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000009',
    name: 'Blog Industry Trends Overview',
    category: 'Educational',
    subcategory: 'Trends',
    template_body: "Write a blog post section overviewing the top 3 trends in {{productCategory}} this year, highlighting {{brandName}}'s vision for sustainable development.",
    variables: ['brandName', 'productCategory'],
    performance_score: 77.2,
    platform: 'Blog',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000010',
    name: 'Email Product Welcome Message',
    category: 'Engagement',
    subcategory: 'Welcome',
    template_body: "Write a friendly welcome email for new users of {{brandName}}'s {{productCategory}}. Include a quick tip on getting started and a link to the dashboard.",
    variables: ['brandName', 'productCategory'],
    performance_score: 93.0,
    platform: 'Email',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000011',
    name: 'Email Weekly Newsletter Highlight',
    category: 'Educational',
    subcategory: 'Newsletter',
    template_body: "Write a newsletter highlight segment introducing {{brandName}}'s latest article on optimizing {{productCategory}} workflows. Keep it punchy.",
    variables: ['brandName', 'productCategory'],
    performance_score: 80.5,
    platform: 'Email',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000012',
    name: 'Email Special Promotional Offer',
    category: 'Promotional',
    subcategory: 'Offer',
    template_body: "Write a limited-time promotional email offering a discount on upgrading {{brandName}}'s {{productCategory}}. Focus on the core value add and create urgency.",
    variables: ['brandName', 'productCategory'],
    performance_score: 89.2,
    platform: 'Email',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000013',
    name: 'Facebook Local Community Story',
    category: 'Engagement',
    subcategory: 'Community',
    template_body: "Write a warm Facebook post highlighting how {{brandName}}'s {{productCategory}} supports local community initiatives and small businesses.",
    variables: ['brandName', 'productCategory'],
    performance_score: 84.1,
    platform: 'Facebook',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000014',
    name: 'Facebook Customer Testimonial Share',
    category: 'Promotional',
    subcategory: 'Testimonial',
    template_body: "Write a Facebook caption sharing a quote from a happy customer who saved hours of work using {{brandName}}'s {{productCategory}}.",
    variables: ['brandName', 'productCategory'],
    performance_score: 90.0,
    platform: 'Facebook',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000015',
    name: 'Facebook Seasonal Offer Post',
    category: 'Promotional',
    subcategory: 'Seasonal',
    template_body: "Write a punchy Facebook post promoting a seasonal sale on {{brandName}}'s {{productCategory}} with relevant emojis and hashtags.",
    variables: ['brandName', 'productCategory'],
    performance_score: 78.4,
    platform: 'Facebook',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000016',
    name: 'TikTok Educational Trend Script',
    category: 'Educational',
    subcategory: 'Video Script',
    template_body: "Write a 15-second TikTok script (hook, body, CTA) showing a life hack involving {{productCategory}}. Tone: fast-paced and witty.",
    variables: ['brandName', 'productCategory'],
    performance_score: 95.8,
    platform: 'TikTok',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000017',
    name: 'TikTok Behind-The-Scenes Hook',
    category: 'Engagement',
    subcategory: 'Behind the Scenes',
    template_body: "Write a TikTok caption and hook for a quick video showing a day in the life of {{brandName}} developers building {{productCategory}}.",
    variables: ['brandName', 'productCategory'],
    performance_score: 88.7,
    platform: 'TikTok',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'a0e0a0a0-0000-0000-0000-000000000018',
    name: 'TikTok Viral Challenge Hook',
    category: 'Engagement',
    subcategory: 'Challenge',
    template_body: "Write a creative TikTok caption and hook prompting our followers to participate in a duets challenge using {{brandName}}'s {{productCategory}}.",
    variables: ['brandName', 'productCategory'],
    performance_score: 79.9,
    platform: 'TikTok',
    industry: 'General',
    source: 'system',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }
];

const mockSegmentPersonas: MockSegmentPersona[] = [
  {
    id: 'e0e0e0e0-0000-0000-0000-000000000001',
    user_id: '', // Will be dynamically matched/updated on fetch
    name: 'Eco Emma',
    description: 'Eco-conscious young professional seeking sustainable streetwear',
    values: ['Sustainability', 'Transparency', 'Durability'],
    age_range: '22-30',
    platform_preference: 'Instagram',
    created_at: new Date()
  }
];

const mockContentPieces: MockContentPiece[] = [];
const mockContentVersions: MockContentVersion[] = [];
const mockCampaigns: MockCampaign[] = [];

let useMock = false;

const storeFile = path.resolve(__dirname, '../../../mock_db_store.json');

export function saveMockDb() {
  try {
    const data = {
      mockUsers,
      mockCredentials,
      mockBrandDNAs,
      mockBrandDNAVersions,
      mockPromptTemplates,
      mockSegmentPersonas,
      mockContentPieces,
      mockContentVersions,
      mockCampaigns,
      mockContentHealthReports,
      mockFirewallResolutionLogs,
      mockCanvasProjects
    };
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Mock DB Storage Error] failed to write database backup:', err);
  }
}

export function loadMockDb() {
  try {
    if (fs.existsSync(storeFile)) {
      const data = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
      if (data.mockUsers) { mockUsers.length = 0; mockUsers.push(...data.mockUsers); }
      if (data.mockCredentials) { mockCredentials.length = 0; mockCredentials.push(...data.mockCredentials); }
      if (data.mockBrandDNAs) {
        mockBrandDNAs.length = 0;
        // Re-hydrate Date objects that JSON serialization converts to strings
        mockBrandDNAs.push(...data.mockBrandDNAs.map((b: any) => ({
          ...b,
          created_at: new Date(b.created_at),
          updated_at: new Date(b.updated_at)
        })));
      }
      if (data.mockBrandDNAVersions) {
        mockBrandDNAVersions.length = 0;
        mockBrandDNAVersions.push(...data.mockBrandDNAVersions.map((v: any) => ({
          ...v,
          created_at: new Date(v.created_at)
        })));
      }
      if (data.mockPromptTemplates && data.mockPromptTemplates.length > 0) {
        mockPromptTemplates.length = 0;
        // Re-hydrate Date objects — JSON.parse returns strings, not Date instances
        mockPromptTemplates.push(...data.mockPromptTemplates.map((t: any) => ({
          ...t,
          created_at: new Date(t.created_at),
          updated_at: new Date(t.updated_at),
          last_scored_at: t.last_scored_at ? new Date(t.last_scored_at) : null
        })));
      }
      if (data.mockSegmentPersonas && data.mockSegmentPersonas.length > 0) {
        mockSegmentPersonas.length = 0;
        mockSegmentPersonas.push(...data.mockSegmentPersonas.map((p: any) => ({
          ...p,
          created_at: new Date(p.created_at)
        })));
      }
      // Ensure the default seed persona always exists so campaign persona dropdown is never empty
      const seedPersonaId = 'e0e0e0e0-0000-0000-0000-000000000001';
      if (!mockSegmentPersonas.find(p => p.id === seedPersonaId)) {
        mockSegmentPersonas.push({
          id: seedPersonaId,
          user_id: '', // dynamically assigned on each fetch
          name: 'Eco Emma',
          description: 'Eco-conscious young professional seeking sustainable streetwear',
          values: ['Sustainability', 'Transparency', 'Durability'],
          age_range: '22-30',
          platform_preference: 'Instagram',
          created_at: new Date()
        });
      }
      if (data.mockContentPieces) { mockContentPieces.length = 0; mockContentPieces.push(...data.mockContentPieces); }
      if (data.mockContentVersions) { mockContentVersions.length = 0; mockContentVersions.push(...data.mockContentVersions); }
      if (data.mockCampaigns) { mockCampaigns.length = 0; mockCampaigns.push(...data.mockCampaigns); }
      if (data.mockContentHealthReports) { mockContentHealthReports.length = 0; mockContentHealthReports.push(...data.mockContentHealthReports); }
      if (data.mockFirewallResolutionLogs) { mockFirewallResolutionLogs.length = 0; mockFirewallResolutionLogs.push(...data.mockFirewallResolutionLogs); }
      if (data.mockCanvasProjects) { mockCanvasProjects.length = 0; mockCanvasProjects.push(...data.mockCanvasProjects); }
      console.log('[Mock DB] Loaded mock databases from local storage.');
    }
  } catch (err) {
    console.error('[Mock DB Storage Error] failed to read database backup:', err);
  }
}

// Load persisted mock DB state immediately
loadMockDb();

export async function dbQuery(text: string, params: any[] = []): Promise<{ rows: any[] }> {
  if (!useMock) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err: any) {
      console.warn(`\n[DB Fallback] Database query/connection failed (${err.message}). Falling back to IN-MEMORY DATABASE store for local testing.\n`);
      useMock = true;
    }
  }

  // Simple in-memory mock query parser matching exact signatures used in auth and billing routes
  const cleanText = text.replace(/\s+/g, ' ').trim().toLowerCase();
  
  fs.appendFileSync(
    path.resolve(__dirname, '../../../query_log.txt'),
    `QUERY: ${cleanText} | PARAMS: ${JSON.stringify(params)}\n`
  );

  const mockResult = executeMockQuery(cleanText, params, text);

  // If query mutates the database, save mock state to disk
  if (
    cleanText.startsWith('insert') ||
    cleanText.startsWith('update') ||
    cleanText.startsWith('delete')
  ) {
    saveMockDb();
  }

  return mockResult;
}

function executeMockQuery(cleanText: string, params: any[], text: string): { rows: any[] } {
  // 1. Check duplicate email: SELECT user_id FROM users WHERE email = $1
  if (cleanText.startsWith('select user_id from users where email =')) {
    const email = params[0];
    const user = mockUsers.find(u => u.email === email);
    return { rows: user ? [{ user_id: user.user_id }] : [] };
  }

  // 2. Fetch profile: SELECT user_id as "userId", email, phase, generation_credits as "generationCredits" FROM users WHERE user_id = $1
  if (cleanText.includes('select user_id as "userid"') && cleanText.includes('from users where user_id =')) {
    const userId = params[0];
    const user = mockUsers.find(u => u.user_id === userId);
    return { rows: user ? [{ userId: user.user_id, email: user.email, phase: user.phase, generationCredits: user.generation_credits }] : [] };
  }

  // 3. Join for login check: SELECT u.user_id, u.email, u.phase, u.generation_credits, c.password_hash FROM users u JOIN user_credentials c ON u.user_id = c.user_id WHERE u.email = $1
  if (cleanText.includes('join user_credentials')) {
    const email = params[0];
    const user = mockUsers.find(u => u.email === email);
    if (!user) return { rows: [] };
    const cred = mockCredentials.find(c => c.user_id === user.user_id);
    return {
      rows: [{
        user_id: user.user_id,
        email: user.email,
        phase: user.phase,
        generation_credits: user.generation_credits,
        password_hash: cred ? cred.password_hash : ''
      }]
    };
  }

  // 4. Fetch phase for credit check: SELECT phase, generation_credits FROM users WHERE user_id = $1
  if (cleanText.startsWith('select phase, generation_credits from users where user_id =')) {
    const userId = params[0];
    const user = mockUsers.find(u => u.user_id === userId);
    return { rows: user ? [{ phase: user.phase, generation_credits: user.generation_credits }] : [] };
  }

  // 5. Insert user: INSERT INTO users (user_id, email, phase, generation_credits)
  if (cleanText.startsWith('insert into users')) {
    const [userId, email, phase, generation_credits] = params;
    mockUsers.push({ user_id: userId, email, phase, generation_credits });
    return { rows: [] };
  }

  // 6. Insert credentials: INSERT INTO user_credentials
  if (cleanText.startsWith('insert into user_credentials')) {
    const [userId, passwordHash] = params;
    mockCredentials.push({ user_id: userId, password_hash: passwordHash });
    return { rows: [] };
  }

  // 7. Update credits: UPDATE users SET generation_credits = generation_credits - 1 WHERE user_id = $1 AND generation_credits > 0
  if (cleanText.startsWith('update users set generation_credits = generation_credits - 1')) {
    const userId = params[0];
    const user = mockUsers.find(u => u.user_id === userId);
    if (user && user.generation_credits > 0) {
      user.generation_credits -= 1;
      return { rows: [{ generation_credits: user.generation_credits }] };
    }
    return { rows: [] };
  }

  // 8. Update phase/billing: UPDATE users SET phase = $1, generation_credits = 9999 WHERE user_id = $2
  if (cleanText.startsWith('update users set phase = $1')) {
    const [phase, userId] = params;
    const user = mockUsers.find(u => u.user_id === userId);
    if (user) {
      user.phase = phase;
      user.generation_credits = 9999;
      return { rows: [{ phase: user.phase }] };
    }
    return { rows: [] };
  }

  // 9. Fetch Brand DNA: SELECT * FROM brand_dna WHERE user_id = $1
  if (cleanText.includes('from brand_dna where user_id =')) {
    const userId = params[0];
    const dna = mockBrandDNAs.find(b => b.user_id === userId);
    return { rows: dna ? [dna] : [] };
  }

  // 10. Insert Brand DNA
  if (cleanText.startsWith('insert into brand_dna') && !cleanText.startsWith('insert into brand_dna_version')) {
    const [id, userId, brandName, productCategory, toneDescriptors, audienceDescription, styleReferences, ethicalPositioning, status, questionnaireComplete, harvestStatus] = params;
    const newDna: MockBrandDNA = {
      id: id,
      user_id: userId,
      brand_name: brandName,
      product_category: productCategory,
      tone_descriptors: toneDescriptors || [],
      audience_description: audienceDescription,
      style_references: styleReferences || [],
      ethical_positioning: ethicalPositioning,
      status: status || 'incomplete',
      questionnaire_complete: questionnaireComplete ?? true,
      harvest_status: harvestStatus || 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    const existingIdx = mockBrandDNAs.findIndex(b => b.user_id === userId);
    if (existingIdx > -1) {
      mockBrandDNAs.splice(existingIdx, 1);
    }
    mockBrandDNAs.push(newDna);
    return { rows: [newDna] };
  }

  // 11. Update Brand DNA
  if (cleanText.startsWith('update brand_dna set')) {
    const userId = params[params.length - 1];
    const dna = mockBrandDNAs.find(b => b.user_id === userId);
    if (dna) {
      if (params.length === 10) {
        const [brandName, productCategory, toneDescriptors, audienceDescription, styleReferences, ethicalPositioning, status, questionnaireComplete, harvestStatus] = params;
        dna.brand_name = brandName;
        dna.product_category = productCategory;
        dna.tone_descriptors = toneDescriptors || [];
        dna.audience_description = audienceDescription;
        dna.style_references = styleReferences || [];
        dna.ethical_positioning = ethicalPositioning;
        dna.status = status;
        dna.questionnaire_complete = questionnaireComplete;
        dna.harvest_status = harvestStatus;
      } else if (params.length === 3) {
        // e.g. update status/harvest_status
        const [harvestStatus, status] = params;
        dna.harvest_status = harvestStatus;
        dna.status = status;
      }
      dna.updated_at = new Date();
      return { rows: [dna] };
    }
    return { rows: [] };
  }

  // 12. Insert Brand DNA Version
  if (cleanText.startsWith('insert into brand_dna_version')) {
    const [id, brandDnaId, userId, brandName, productCategory, toneDescriptors, audienceDescription, styleReferences, ethicalPositioning] = params;
    const newVersion: MockBrandDNAVersion = {
      id: id,
      brand_dna_id: brandDnaId,
      user_id: userId,
      brand_name: brandName,
      product_category: productCategory,
      tone_descriptors: toneDescriptors || [],
      audience_description: audienceDescription,
      style_references: styleReferences || [],
      ethical_positioning: ethicalPositioning,
      created_at: new Date()
    };
    mockBrandDNAVersions.push(newVersion);
    return { rows: [newVersion] };
  }

  // 13. Fetch Brand DNA Version History
  if (cleanText.includes('from brand_dna_version where user_id =')) {
    const userId = params[0];
    const versions = mockBrandDNAVersions
      .filter(v => v.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return { rows: versions };
  }

  // 14. Fetch prompt templates (supports matching, search, ownership, archiving)
  if (cleanText.includes('from prompt_templates')) {
    let userId: string | null = null;
    let platform: string | null = null;
    let showArchived = cleanText.includes("status = 'archived'");
    
    // Inspect params to locate user_id and platform
    for (const p of params) {
      if (typeof p === 'string') {
        const isPlatform = ['instagram', 'linkedin', 'blog', 'email', 'facebook', 'tiktok'].includes(p.toLowerCase());
        if (isPlatform) {
          platform = p;
        } else if (p.length === 36) {
          userId = p;
        }
      }
    }
    
    // Fallback: If id is queried directly
    if (cleanText.includes('where id =')) {
      const id = params[0];
      const t = mockPromptTemplates.find(x => x.id === id);
      return { rows: t ? [t] : [] };
    }
    
    const list = mockPromptTemplates.filter(t => {
      // Filter status
      if (showArchived) {
        if (t.status !== 'archived') return false;
      } else {
        if (t.status !== 'active') return false;
      }
      
      // Filter platform
      if (platform && t.platform.toLowerCase() !== platform.toLowerCase()) {
        return false;
      }
      
      // Filter user ownership
      if (t.user_id && userId && t.user_id !== userId) {
        return false;
      }
      
      return true;
    });
    
    return { rows: list };
  }

  // 16. Fetch Personas for user
  if (cleanText.includes('from segment_personas where user_id =') && !cleanText.includes('count(*)')) {
    const userId = params[0];
    // Dynamic update seeded persona's user_id so it always matches
    mockSegmentPersonas.forEach(p => {
      p.user_id = userId;
    });
    const matched = mockSegmentPersonas.filter(p => p.user_id === userId);
    return { rows: matched };
  }

  // 17. Fetch single Persona
  if (cleanText.includes('from segment_personas where id =')) {
    const id = params[0];
    const p = mockSegmentPersonas.find(x => x.id === id);
    return { rows: p ? [p] : [] };
  }

  // 17a. Count user segment personas
  if (cleanText.includes('select count(*)') && cleanText.includes('from segment_personas')) {
    const userId = params[0];
    const count = mockSegmentPersonas.filter(p => p.user_id === userId).length;
    return { rows: [{ count: count.toString() }] };
  }

  // 17b. Insert custom Segment Persona
  if (cleanText.startsWith('insert into segment_personas')) {
    const [id, userId, name, description, values, ageRange, platformPreference] = params;
    const item: MockSegmentPersona = {
      id: id || uuidv4(),
      user_id: userId,
      name: name,
      description: description,
      values: Array.isArray(values) ? values : [],
      age_range: ageRange || null,
      platform_preference: platformPreference || null,
      created_at: new Date()
    };
    mockSegmentPersonas.push(item);
    return { rows: [item] };
  }

  // 17c. Update custom Segment Persona
  if (cleanText.startsWith('update segment_personas')) {
    const [name, description, values, ageRange, platformPreference, id, userId] = params;
    const item = mockSegmentPersonas.find(x => x.id === id && x.user_id === userId);
    if (item) {
      item.name = name;
      item.description = description;
      item.values = Array.isArray(values) ? values : [];
      item.age_range = ageRange || null;
      item.platform_preference = platformPreference || null;
      return { rows: [item] };
    }
    return { rows: [] };
  }

  // 17d. Delete custom Segment Persona
  if (cleanText.startsWith('delete from segment_personas')) {
    const [id, userId] = params;
    const idx = mockSegmentPersonas.findIndex(x => x.id === id && x.user_id === userId);
    if (idx > -1) {
      const deleted = mockSegmentPersonas[idx];
      mockSegmentPersonas.splice(idx, 1);
      return { rows: [deleted] };
    }
    return { rows: [] };
  }

  // 18. Insert Content Piece
  if (cleanText.startsWith('insert into content_pieces')) {
    if (cleanText.includes('campaign_id')) {
      const [id, userId, campaignId, platform, contentType, personaId, scheduledDate] = params;
      const item: MockContentPiece = {
        id: id || uuidv4(),
        user_id: userId,
        campaign_id: campaignId || null,
        platform,
        content_type: contentType,
        persona_id: personaId || null,
        scheduled_date: scheduledDate ? new Date(scheduledDate) : null,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockContentPieces.push(item);
      return { rows: [item] };
    } else {
      const [id, userId, platform, contentType, personaId] = params;
      const item: MockContentPiece = {
        id: id || uuidv4(),
        user_id: userId,
        campaign_id: null,
        platform,
        content_type: contentType,
        persona_id: personaId || null,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockContentPieces.push(item);
      return { rows: [item] };
    }
  }

  // 19. Insert Content Version
  if (cleanText.startsWith('insert into content_versions')) {
    const [id, contentPieceId, versionNumber, contentBody, templateId, annotationUsed] = params;
    const item: MockContentVersion = {
      id: id,
      content_piece_id: contentPieceId,
      version_number: versionNumber,
      content_body: contentBody,
      template_id: templateId || null,
      annotation_used: annotationUsed || null,
      created_at: new Date()
    };
    mockContentVersions.push(item);
    return { rows: [item] };
  }

  // 20. Fetch single Content Piece
  if (cleanText.includes('from content_pieces where id =')) {
    const id = params[0];
    const userId = params[1];
    const item = mockContentPieces.find(p => p.id === id);
    if (item && userId && item.user_id !== userId) {
      return { rows: [] };
    }
    return { rows: item ? [item] : [] };
  }

  // 20a. Fetch published content pieces (for scoring sync)
  if (cleanText.includes('from content_pieces where status =')) {
    const matched = mockContentPieces.filter(p => p.status === 'published');
    return { rows: matched };
  }

  // 21. Fetch Content Versions for Content Piece
  if (cleanText.includes('from content_versions where content_piece_id =') && !cleanText.includes('content_pieces')) {
    const contentPieceId = params[0];
    const matched = mockContentVersions
      .filter(v => v.content_piece_id === contentPieceId)
      .sort((a, b) => b.version_number - a.version_number);
    return { rows: matched };
  }

  // 21b. Update Content Piece Scheduled Date
  if (cleanText.startsWith('update content_pieces') && cleanText.includes('scheduled_date =')) {
    const [scheduledDate, id, userId] = params;
    const piece = mockContentPieces.find(p => p.id === id && p.user_id === userId);
    if (piece) {
      piece.scheduled_date = scheduledDate ? new Date(scheduledDate) : null;
      piece.updated_at = new Date();
      return { rows: [piece] };
    }
    return { rows: [] };
  }

  // 22. Update Content Piece properties
  if (cleanText.startsWith('update content_pieces')) {
    const id = params[params.length - 1];
    const item = mockContentPieces.find(p => p.id === id);
    if (item) {
      if (cleanText.includes('persona_id =')) {
        item.persona_id = params[0] || null;
      }
      if (cleanText.includes('status =')) {
        item.status = params[0];
        item.published_at = params[1] || null;
      }
      item.updated_at = new Date();
      return { rows: [item] };
    }
    return { rows: [] };
  }

  // 22a. Insert custom prompt template
  if (cleanText.startsWith('insert into prompt_templates')) {
    const [id, name, category, subcategory, templateBody, variables, performanceScore, platform, industry, source, status, userId] = params;
    const item: MockPromptTemplate = {
      id: id || uuidv4(),
      name,
      category,
      subcategory: subcategory || null,
      template_body: templateBody,
      variables: Array.isArray(variables) ? variables : [],
      performance_score: performanceScore !== undefined ? performanceScore : null,
      platform,
      industry: industry || 'General',
      source: source || 'user-created',
      status: status || 'active',
      user_id: userId || null,
      last_scored_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    mockPromptTemplates.push(item);
    return { rows: [item] };
  }

  // 22b. Update custom prompt template (checks read-only system locks)
  if (cleanText.startsWith('update prompt_templates')) {
    const t = mockPromptTemplates.find(x => x.id === params[params.length - 1] || x.id === params[0] || params.includes(x.id));
    if (t) {
      const isScoringUpdate = cleanText.includes('set performance_score =');
      if (!t.user_id && !isScoringUpdate) {
        throw new Error('TEMPLATE_SYSTEM_READONLY');
      }
      if (cleanText.includes('set name =')) {
        const [name, category, subcategory, templateBody, variables, platform, industry] = params;
        t.name = name;
        t.category = category;
        t.subcategory = subcategory;
        t.template_body = templateBody;
        t.variables = variables;
        t.platform = platform;
        t.industry = industry;
      } else if (cleanText.includes('set status =')) {
        t.status = params[0];
      } else if (cleanText.includes('set performance_score =')) {
        t.performance_score = params[0];
        t.last_scored_at = new Date();
      }
      t.updated_at = new Date();
      return { rows: [t] };
    }
    return { rows: [] };
  }

  // 22c. Delete custom prompt template
  if (cleanText.startsWith('delete from prompt_templates')) {
    const t = mockPromptTemplates.find(x => params.includes(x.id));
    if (t) {
      if (!t.user_id) {
        throw new Error('TEMPLATE_SYSTEM_READONLY');
      }
      const idx = mockPromptTemplates.indexOf(t);
      mockPromptTemplates.splice(idx, 1);
      return { rows: [t] };
    }
    return { rows: [] };
  }

  // 23. Insert Content Health Report
  if (cleanText.startsWith('insert into content_health_reports')) {
    const [contentPieceId, versionNumber, reportData] = params;
    const item: MockContentHealthReport = {
      id: uuidv4(),
      content_piece_id: contentPieceId,
      version_number: versionNumber,
      report_data: typeof reportData === 'string' ? JSON.parse(reportData) : reportData,
      created_at: new Date()
    };
    mockContentHealthReports.push(item);
    return { rows: [item] };
  }

  // 24. Fetch active Content Health Report for content piece
  if (cleanText.includes('from content_health_reports') && cleanText.includes('content_piece_id =')) {
    const contentPieceId = params[0];
    const matched = mockContentHealthReports
      .filter(r => r.content_piece_id === contentPieceId)
      .sort((a, b) => b.version_number - a.version_number);
    return { rows: matched.slice(0, 1) };
  }

  // 24a. COUNT segment_personas for limit check
  if (cleanText.startsWith('select count(*)') && cleanText.includes('from segment_personas')) {
    const userId = params[0];
    const count = mockSegmentPersonas.filter(p => p.user_id === userId).length;
    return { rows: [{ count: String(count) }] };
  }

  // 24b. SELECT segment_personas by user_id
  if (cleanText.includes('from segment_personas') && cleanText.includes('user_id =') && !cleanText.includes('where id =')) {
    const userId = params[0];
    const matched = mockSegmentPersonas.filter(p => p.user_id === userId || p.user_id === '');
    // Ensure seed persona is bound to requesting user if user_id is blank
    return {
      rows: matched.map(p => ({
        ...p,
        user_id: p.user_id || userId
      }))
    };
  }

  // 24c. SELECT segment_persona by id (single lookup)
  if (cleanText.includes('from segment_personas') && cleanText.includes('where id =')) {
    const id = params[0];
    const userId = params[1];
    const p = mockSegmentPersonas.find(x => x.id === id && (userId == null || x.user_id === userId || x.user_id === ''));
    return { rows: p ? [{ ...p, user_id: p.user_id || userId }] : [] };
  }

  // 24d. INSERT into segment_personas
  if (cleanText.startsWith('insert into segment_personas')) {
    const [id, userId, name, description, values, ageRange, platformPreference] = params;
    const item: MockSegmentPersona = {
      id: id || uuidv4(),
      user_id: userId,
      name,
      description,
      values: Array.isArray(values) ? values : (values as string).split(',').map((s: string) => s.trim()).filter(Boolean),
      age_range: ageRange || null,
      platform_preference: platformPreference || null,
      created_at: new Date()
    };
    mockSegmentPersonas.push(item);
    return { rows: [item] };
  }

  // 24e. UPDATE segment_persona
  if (cleanText.startsWith('update segment_personas')) {
    const personaId = params[params.length - 2];
    const userId = params[params.length - 1];
    const item = mockSegmentPersonas.find(x => x.id === personaId && (x.user_id === userId || x.user_id === ''));
    if (item) {
      const [name, description, values, ageRange, platformPreference] = params;
      item.name = name;
      item.description = description;
      item.values = Array.isArray(values) ? values : (values as string).split(',').map((s: string) => s.trim()).filter(Boolean);
      item.age_range = ageRange || null;
      item.platform_preference = platformPreference || null;
      item.user_id = userId;
      return { rows: [item] };
    }
    return { rows: [] };
  }

  // 24f. DELETE segment_persona
  if (cleanText.startsWith('delete from segment_personas')) {
    const [personaId, userId] = params;
    const idx = mockSegmentPersonas.findIndex(x => x.id === personaId && (x.user_id === userId || x.user_id === ''));
    if (idx !== -1) {
      const removed = mockSegmentPersonas.splice(idx, 1);
      return { rows: removed };
    }
    return { rows: [] };
  }

  // 25. Immutable firewall logs check block (Strict security constraint check)
  if (cleanText.startsWith('update firewall_resolution_logs') || cleanText.startsWith('delete from firewall_resolution_logs')) {
    throw new Error('firewall_resolution_logs table is read-only and immutable');
  }

  // 26. Insert Firewall Resolution Log
  if (cleanText.startsWith('insert into firewall_resolution_logs')) {
    const [userId, contentPieceId, checkType, action] = params;
    const item: MockFirewallResolutionLog = {
      id: uuidv4(),
      user_id: userId,
      content_piece_id: contentPieceId,
      check_type: checkType,
      action: action || 'HUMAN_VERIFIED',
      created_at: new Date()
    };
    mockFirewallResolutionLogs.push(item);
    return { rows: [item] };
  }

  // 27. Fetch Firewall Resolution Logs for content piece
  if (cleanText.includes('from firewall_resolution_logs') && cleanText.includes('content_piece_id =')) {
    const contentPieceId = params[0];
    const matched = mockFirewallResolutionLogs.filter(l => l.content_piece_id === contentPieceId);
    return { rows: matched };
  }

  // 28. Insert Campaign
  if (cleanText.startsWith('insert into campaigns')) {
    const [id, userId, name, description, launchDate, duration, personaId] = params;
    const item: MockCampaign = {
      id: id || uuidv4(),
      user_id: userId,
      name,
      description,
      launch_date: new Date(launchDate),
      duration: parseInt(duration, 10),
      persona_id: personaId || null,
      created_at: new Date()
    };
    mockCampaigns.push(item);
    return { rows: [item] };
  }

  // 29. Fetch User Campaigns
  if (cleanText.startsWith('select * from campaigns') && cleanText.includes('user_id =') && !cleanText.includes('id =')) {
    const userId = params[0];
    const matched = mockCampaigns.filter(c => c.user_id === userId);
    return { rows: matched };
  }

  // 30. Fetch Single Campaign
  if (cleanText.startsWith('select * from campaigns') && cleanText.includes('id =') && cleanText.includes('user_id =')) {
    const [id, userId] = params;
    const matched = mockCampaigns.filter(c => c.id === id && c.user_id === userId);
    return { rows: matched };
  }

  // 31. Fetch Content Pieces for Campaign
  if (cleanText.includes('from content_pieces') && cleanText.includes('campaign_id')) {
    const [campaignId, userId] = params;
    fs.writeFileSync(
      path.resolve(__dirname, '../../../debug_db_pieces.json'),
      JSON.stringify({ campaignId, userId, mockContentPieces, mockCampaigns }, null, 2)
    );
    const pieces = mockContentPieces.filter(p => p.campaign_id === campaignId && p.user_id === userId);
    const result = pieces.map(p => {
      const versions = mockContentVersions
        .filter(v => v.content_piece_id === p.id)
        .sort((a, b) => b.version_number - a.version_number);
      const latest = versions[0];
      return {
        ...p,
        content_body: latest ? latest.content_body : '',
        template_id: latest ? latest.template_id : null,
        version_number: latest ? latest.version_number : 1
      };
    });
    return { rows: result };
  }


  // 33. Insert Canvas Project (10 params: id, userId, name, width, height, format, thumbnail_url, ai_brief, color_palette, projectPayload)
  if (cleanText.startsWith('insert into canvas_projects')) {
    const [id, userId, name, width, height, format, thumbnail_url, ai_brief, color_palette, projectPayload] = params;
    const safePayload = (() => {
      try { return typeof projectPayload === 'string' ? JSON.parse(projectPayload) : (projectPayload ?? {}); }
      catch { return {}; }
    })();
    const safePalette = (() => {
      try { return typeof color_palette === 'string' ? JSON.parse(color_palette) : (color_palette ?? []); }
      catch { return []; }
    })();
    const item: MockCanvasProject = {
      id: id || uuidv4(),
      user_id: userId,
      name,
      width:  typeof width  === 'number' ? width  : parseInt(width,  10),
      height: typeof height === 'number' ? height : parseInt(height, 10),
      format: format || 'Instagram Post',
      thumbnail_url: thumbnail_url || null,
      ai_brief: ai_brief || null,
      color_palette: safePalette,
      project_payload: safePayload,
      created_at: new Date(),
      updated_at: new Date()
    };
    mockCanvasProjects.push(item);
    return { rows: [item] };
  }

  // 34. Fetch User Canvas Projects — column-list SELECT
  if (cleanText.includes('from canvas_projects') && cleanText.includes('user_id =') && !cleanText.includes('where id =') && !cleanText.includes('where id=')) {
    const userId = params[0];
    const matched = mockCanvasProjects
      .filter(p => p.user_id === userId)
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    return { rows: matched };
  }

  // 35. Fetch Single Canvas Project
  if (cleanText.includes('from canvas_projects') && (cleanText.includes('where id =') || cleanText.includes('where id='))) {
    const [id, userId] = params;
    const matched = mockCanvasProjects.filter(p => p.id === id && p.user_id === userId);
    return { rows: matched };
  }

  // 36. Update Canvas Project (8 params: name, format, thumbnail_url, ai_brief, color_palette, projectPayload, id, userId)
  if (cleanText.startsWith('update canvas_projects')) {
    const [name, format, thumbnail_url, ai_brief, color_palette, projectPayload, id, userId] = params;
    const item = mockCanvasProjects.find(p => p.id === id && p.user_id === userId);
    if (item) {
      item.name = name;
      if (format) item.format = format;
      if (thumbnail_url) item.thumbnail_url = thumbnail_url;
      if (ai_brief) item.ai_brief = ai_brief;
      if (color_palette) {
        try { item.color_palette = typeof color_palette === 'string' ? JSON.parse(color_palette) : color_palette; } catch {}
      }
      try { item.project_payload = typeof projectPayload === 'string' ? JSON.parse(projectPayload) : projectPayload; } catch {}
      item.updated_at = new Date();
      return { rows: [item] };
    }
    return { rows: [] };
  }

  // 37. Duplicate Canvas Project (also an INSERT with same structure)
  // Already handled by the insert handler above.

  // 38. Delete Canvas Project
  if (cleanText.startsWith('delete from canvas_projects')) {
    const [id, userId] = params;
    const idx = mockCanvasProjects.findIndex(p => p.id === id && p.user_id === userId);
    if (idx !== -1) {
      const removed = mockCanvasProjects.splice(idx, 1);
      return { rows: removed };
    }
    return { rows: [] };
  }

  console.warn('[DB Fallback Warning] Unhandled mock query:', text);
  return { rows: [] };
}


