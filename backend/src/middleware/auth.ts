import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { AuthRequest, User } from '../types';
import db from '../config/database';
import { logger } from '../utils/logger';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

    const user = await db('users')
      .where({ id: decoded.id, is_active: true })
      .select('id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 'created_at')
      .first() as User;

    if (!user) {
      res.status(401).json({ error: 'User not found or inactive.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await db('users')
          .where({ id: decoded.id, is_active: true })
          .select('id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 'created_at')
          .first() as User;
        
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};