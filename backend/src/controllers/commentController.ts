import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { task_id } = req.params;
  const { content, parent_comment_id } = req.body;

  const hasAccess = await db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .where('t.id', task_id)
    .where('tm.user_id', userId)
    .where('t.is_archived', false)
    .first();

  if (!hasAccess) {
    throw createError('Task not found or access denied', 404);
  }

  if (parent_comment_id) {
    const parentComment = await db('comments')
      .where({ id: parent_comment_id, task_id })
      .first();

    if (!parentComment) {
      throw createError('Parent comment not found', 404);
    }
  }

  const [comment] = await db('comments')
    .insert({
      id: uuidv4(),
      task_id,
      user_id: userId,
      content,
      parent_comment_id: parent_comment_id || null,
      is_edited: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'content', 'parent_comment_id', 'created_at']);

  const user = await db('users')
    .where('id', userId)
    .select('id', 'first_name', 'last_name', 'avatar_url')
    .first();

  logger.info('Comment created:', { commentId: comment.id, taskId: task_id, userId });

  res.status(201).json({
    message: 'Comment created successfully',
    comment: {
      ...comment,
      user,
      is_edited: false,
    },
  });
});

export const getTaskComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { task_id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const hasAccess = await db('tasks as t')
    .join('projects as p', 't.project_id', 'p.id')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .where('t.id', task_id)
    .where('tm.user_id', userId)
    .first();

  if (!hasAccess) {
    throw createError('Task not found or access denied', 404);
  }

  const offset = (Number(page) - 1) * Number(limit);

  const comments = await db('comments as c')
    .join('users as u', 'c.user_id', 'u.id')
    .where('c.task_id', task_id)
    .whereNull('c.parent_comment_id')
    .select(
      'c.id',
      'c.content',
      'c.is_edited',
      'c.created_at',
      'c.updated_at',
      'u.id as user_id',
      'u.first_name',
      'u.last_name',
      'u.avatar_url'
    )
    .orderBy('c.created_at', 'desc')
    .limit(Number(limit))
    .offset(offset);

  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await db('comments as c')
        .join('users as u', 'c.user_id', 'u.id')
        .where('c.parent_comment_id', comment.id)
        .select(
          'c.id',
          'c.content',
          'c.is_edited',
          'c.created_at',
          'c.updated_at',
          'u.id as user_id',
          'u.first_name',
          'u.last_name',
          'u.avatar_url'
        )
        .orderBy('c.created_at', 'asc');

      return {
        ...comment,
        user: {
          id: comment.user_id,
          first_name: comment.first_name,
          last_name: comment.last_name,
          avatar_url: comment.avatar_url,
        },
        replies: replies.map(reply => ({
          ...reply,
          user: {
            id: reply.user_id,
            first_name: reply.first_name,
            last_name: reply.last_name,
            avatar_url: reply.avatar_url,
          },
        })),
      };
    })
  );

  const [{ count }] = await db('comments')
    .where('task_id', task_id)
    .whereNull('parent_comment_id')
    .count('* as count');

  res.json({
    comments: commentsWithReplies,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(count),
      pages: Math.ceil(Number(count) / Number(limit)),
    },
  });
});

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { content } = req.body;

  const comment = await db('comments')
    .where({ id, user_id: userId })
    .first();

  if (!comment) {
    throw createError('Comment not found or access denied', 404);
  }

  const [updatedComment] = await db('comments')
    .where({ id })
    .update({
      content,
      is_edited: true,
      updated_at: new Date(),
    })
    .returning(['id', 'content', 'is_edited', 'updated_at']);

  logger.info('Comment updated:', { commentId: id, userId });

  res.json({
    message: 'Comment updated successfully',
    comment: updatedComment,
  });
});

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const comment = await db('comments as c')
    .join('tasks as t', 'c.task_id', 't.id')
    .join('projects as p', 't.project_id', 'p.id')
    .join('team_members as tm', 'p.team_id', 'tm.team_id')
    .where('c.id', id)
    .where(function() {
      this.where('c.user_id', userId)
        .orWhere(function() {
          this.where('tm.user_id', userId)
            .whereIn('tm.role', ['admin', 'manager']);
        });
    })
    .select('c.id')
    .first();

  if (!comment) {
    throw createError('Comment not found or access denied', 404);
  }

  await db('comments').where({ id }).del();

  logger.info('Comment deleted:', { commentId: id, userId });

  res.json({ message: 'Comment deleted successfully' });
});