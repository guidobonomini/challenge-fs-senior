import { Response } from 'express';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { q, limit = 10 } = req.query;

  if (!q || typeof q !== 'string') {
    throw createError('Search query is required', 400);
  }

  const searchQuery = `%${q.toLowerCase()}%`;

  try {
    const users = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'avatar_url')
      .where('is_active', true)
      .where('id', '!=', userId) // Exclude the current user
      .where(function() {
        this.whereRaw('LOWER(first_name) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(last_name) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(email) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(CONCAT(first_name, \' \', last_name)) LIKE ?', [searchQuery]);
      })
      .limit(Number(limit))
      .orderBy('first_name')
      .orderBy('last_name');

    logger.info('User search completed:', { 
      query: q, 
      resultsCount: users.length, 
      searchedBy: userId 
    });

    res.json({
      users,
      query: q,
      count: users.length,
    });
  } catch (error) {
    logger.error('User search error:', error);
    throw createError('Failed to search users', 500);
  }
});

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const [users, totalResult] = await Promise.all([
      db('users')
        .select('id', 'first_name', 'last_name', 'email', 'avatar_url', 'role', 'created_at')
        .where('is_active', true)
        .where('id', '!=', userId)
        .orderBy('first_name')
        .orderBy('last_name')
        .limit(Number(limit))
        .offset(offset),
      
      db('users')
        .where('is_active', true)
        .where('id', '!=', userId)
        .count('id as total')
        .first()
    ]);

    const total = Number(totalResult?.total || 0);
    const pages = Math.ceil(total / Number(limit));

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    throw createError('Failed to fetch users', 500);
  }
});