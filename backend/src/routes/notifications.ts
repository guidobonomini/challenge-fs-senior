import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   unread_only - Only return unread notifications (default: false)
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/:id/mark-as-read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.put('/:id/mark-as-read', markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all user notifications as read
 * @access  Private
 */
router.put('/mark-all-read', markAllAsRead);

export default router;