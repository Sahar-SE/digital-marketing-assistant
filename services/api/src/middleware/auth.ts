import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-secret';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    
    req.user = {
      userId: decoded.sub,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('[Auth Middleware Error] JWT verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token signature or expired session' });
  }
}
