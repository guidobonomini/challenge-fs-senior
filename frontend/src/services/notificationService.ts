import apiService from './api';
import { Notification } from '../types';

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class NotificationService {
  /**
   * Get user notifications with pagination
   */
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unread_only: 'true' }),
    });

    return apiService.get<NotificationResponse>(`/notifications?${params}`);
  }

  /**
   * Get count of unread notifications only
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiService.get<{ unreadCount: number }>('/notifications/unread-count');
  }

  /**
   * Mark specific notification as read
   */
  async markAsRead(notificationId: string): Promise<{ message: string }> {
    return apiService.put<{ message: string }>(`/notifications/${notificationId}/mark-as-read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; updatedCount: number }> {
    return apiService.put<{ message: string; updatedCount: number }>('/notifications/mark-all-read');
  }
}

export const notificationService = new NotificationService();
export default notificationService;