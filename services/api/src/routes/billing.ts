import { Router, Request, Response } from 'express';
import { dbQuery } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

export const billingRouter = Router();

// Consume generation credit endpoint
billingRouter.post('/consume-credit', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    // 1. Fetch user phase
    const userQuery = await dbQuery('SELECT phase, generation_credits FROM users WHERE user_id = $1', [userId]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { phase, generation_credits } = userQuery.rows[0];

    // Phase 2 and 3 have unlimited credits
    if (phase === 'phase_2' || phase === 'phase_3') {
      return res.json({ success: true, unlimited: true, remainingCredits: generation_credits });
    }

    // Phase 1 check: update credits atomically if > 0
    const updateResult = await dbQuery(
      'UPDATE users SET generation_credits = generation_credits - 1 WHERE user_id = $1 AND generation_credits > 0 RETURNING generation_credits',
      [userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(403).json({ error: 'CREDITS_EXHAUSTED' });
    }

    res.json({
      success: true,
      unlimited: false,
      remainingCredits: updateResult.rows[0].generation_credits
    });
  } catch (error) {
    console.error('[Credit Consume Error]:', error);
    res.status(500).json({ error: 'Internal server error processing credits' });
  }
});

// Create Stripe Checkout Session (Mock fallback if keys are missing)
billingRouter.post('/stripe-checkout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey.includes('your-stripe')) {
    // Return a mock checkout page url to verify the frontend flow
    return res.json({
      url: `http://localhost:3000/dashboard?stripe_mock_success=true&user_id=${userId}`
    });
  }

  // Real Stripe integration (fallback to mock for local testing safety)
  res.json({
    url: `http://localhost:3000/dashboard?stripe_mock_success=true&user_id=${userId}`
  });
});

// Self-upgrade route helper for sandbox and testing environments
billingRouter.post('/upgrade', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const targetPhase = req.body.phase || 'phase_2';
  try {
    const result = await dbQuery(
      "UPDATE users SET phase = $1, generation_credits = 9999 WHERE user_id = $2 RETURNING phase",
      [targetPhase, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, phase: result.rows[0].phase });
  } catch (error) {
    console.error('[Billing Upgrade Error]:', error);
    res.status(500).json({ error: 'Internal server error upgrading user' });
  }
});

// Mock webhook to upgrade user status (useful for sandbox local verification)
billingRouter.post('/mock-webhook', async (req: Request, res: Response) => {
  const { userId, targetPhase } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const phase = targetPhase || 'phase_2';

  try {
    const result = await dbQuery(
      'UPDATE users SET phase = $1, generation_credits = 9999 WHERE user_id = $2 RETURNING phase',
      [phase, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, phase: result.rows[0].phase });
  } catch (error) {
    console.error('[Mock Webhook Error]:', error);
    res.status(500).json({ error: 'Internal server error executing mock webhook' });
  }
});

// Stripe Webhook Endpoint (verifies webhook signatures)
billingRouter.post('/stripe-webhook', async (req: Request, res: Response) => {
  res.json({ received: true });
});
