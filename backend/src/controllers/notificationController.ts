import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

/**
 * Get user notifications with pagination
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const unreadOnly = req.query.unread_only === 'true';

  const notificationService: NotificationService = req.app.locals.notificationService;
  const result = await notificationService.getUserNotifications(userId, page, limit, unreadOnly);

  logger.info('User notifications fetched:', {
    userId,
    page,
    limit,
    unreadOnly,
    count: result.notifications.length,
    unreadCount: result.unreadCount,
  });

  res.json(result);
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const notificationService: NotificationService = req.app.locals.notificationService;
  const success = await notificationService.markAsRead(id, userId);

  if (!success) {
    throw createError('Notification not found or not authorized', 404);
  }

  logger.info('Notification marked as read:', { notificationId: id, userId });

  res.json({ message: 'Notification marked as read' });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const notificationService: NotificationService = req.app.locals.notificationService;
  const updatedCount = await notificationService.markAllAsRead(userId);

  logger.info('All notifications marked as read:', { userId, updatedCount });

  res.json({ 
    message: `${updatedCount} notifications marked as read`,
    updatedCount 
  });
});

/**
 * Get unread count
 */
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const notificationService: NotificationService = req.app.locals.notificationService;
  const result = await notificationService.getUserNotifications(userId, 1, 1, true);

  res.json({ unreadCount: result.unreadCount });
});