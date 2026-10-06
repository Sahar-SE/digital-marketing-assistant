import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, dbQuery } from '../db';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

export const authRouter = Router();

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-secret';

// Signup endpoint
authRouter.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    // 1. Check if user already exists
    const checkUser = await dbQuery('SELECT user_id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Insert into users and user_credentials within a transaction
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO users (user_id, email, phase, generation_credits) VALUES ($1, $2, $3, $4)',
        [userId, email, 'phase_3', 9999]
      );
      await client.query(
        'INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)',
        [userId, passwordHash]
      );
      await client.query('COMMIT');
    } catch (txErr: any) {
      if (client) await client.query('ROLLBACK');

      if (
        txErr.code === 'ECONNREFUSED' || 
        txErr.message?.includes('connect') || 
        txErr.message?.includes('refused') || 
        txErr.message?.includes('AggregateError')
      ) {
        // Fallback to mock in-memory store
        await dbQuery('INSERT INTO users (user_id, email, phase, generation_credits) VALUES ($1, $2, $3, $4)', [userId, email, 'phase_3', 9999]);
        await dbQuery('INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)', [userId, passwordHash]);
      } else {
        throw txErr;
      }
    } finally {
      if (client) client.release();
    }

    // 3. Generate JWT
    const token = jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        userId,
        email,
        phase: 'phase_3',
        generationCredits: 9999
      }
    });
  } catch (error) {
    console.error('[Signup Error] Registration failed:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login endpoint
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Fetch user from database
    const userQuery = await dbQuery(
      'SELECT u.user_id, u.email, u.phase, u.generation_credits, c.password_hash FROM users u JOIN user_credentials c ON u.user_id = c.user_id WHERE u.email = $1',
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const dbUser = userQuery.rows[0];

    // 2. Compare password hash
    const match = await bcrypt.compare(password, dbUser.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Generate JWT
    const token = jwt.sign({ sub: dbUser.user_id, email: dbUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        userId: dbUser.user_id,
        email: dbUser.email,
        phase: dbUser.phase,
        generationCredits: dbUser.generation_credits
      }
    });
  } catch (error) {
    console.error('[Login Error] Authentication failed:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Me/Profile endpoint
authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const userQuery = await dbQuery(
      'SELECT user_id as "userId", email, phase, generation_credits as "generationCredits" FROM users WHERE user_id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(userQuery.rows[0]);
  } catch (error) {
    console.error('[Profile Query Error]:', error);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
});
