import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BrandDNA } from '@dma/shared-types';
import { FeatureFlagService, UserPhase } from '@dma/feature-flags';
import { dbQuery, pool } from './db';
import { authRouter } from './routes/auth';
import { billingRouter } from './routes/billing';
import { brandDNARouter } from './routes/brand-dna';
import { contentRouter } from './routes/content';
import { firewallRouter } from './routes/firewall';
import { canvasRouter } from './routes/canvas';
import './jobs/brand-dna-harvest'; // Initialize BullMQ worker

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Digital Marketing Assistant API',
    healthCheck: '/api/health'
  });
});

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);
app.use('/api/brand-dna', brandDNARouter);
app.use('/api/content', contentRouter);
app.use('/api/firewall', firewallRouter);
app.use('/api/canvas', canvasRouter);

// API health and verification endpoint
app.get('/api/health', (req, res) => {
  const dummyBrandDNA: BrandDNA = {
    userId: '123',
    brandName: 'Test Brand',
    productCategory: 'SaaS',
    toneDescriptors: ['friendly', 'bold'],
    audienceDescription: 'developers',
    styleReferences: [],
    ethicalPositioning: 'honest',
    status: 'incomplete',
    questionnaireComplete: false
  };

  res.json({
    status: 'healthy',
    message: 'Digital Marketing Assistant API is running',
    dummyBrandDNA
  });
});

// Verification route to test feature flags integration with DB query
app.get('/api/test-feature', async (req, res) => {
  const { userId, feature } = req.query;

  if (!userId || !feature) {
    return res.status(400).json({ error: 'Missing userId or feature query param' });
  }

  const getUserPhaseFromDB = async (uid: string): Promise<UserPhase> => {
    try {
      const result = await dbQuery('SELECT phase, generation_credits FROM users WHERE user_id = $1', [uid]);
      if (result.rows.length === 0) return 'phase_1';
      return result.rows[0].phase as UserPhase;
    } catch (dbErr) {
      console.error('[Feature Check DB Error]:', dbErr);
      return 'phase_1';
    }
  };

  const allowed = await FeatureFlagService.userCan(
    userId as string,
    feature as any,
    getUserPhaseFromDB
  );

  res.json({ userId, feature, allowed });
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
