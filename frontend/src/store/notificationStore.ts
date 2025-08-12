import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Notification } from '../types';
import { toast } from 'react-hot-toast';
import notificationService from '../services/notificationService';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => void;
  fetchNotifications: (page?: number, limit?: number, unreadOnly?: boolean) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      // Actions
      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Show toast notification for certain types
        if (['task_assigned', 'task_commented', 'task_completed'].includes(notification.type)) {
          toast(notification.message, {
            icon: getNotificationIcon(notification.type),
            duration: 4000,
          });
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          // Optimistic update
          set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (!notification || notification.is_read) {
              return state;
            }

            return {
              notifications: state.notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          });

          // Call API
          await notificationService.markAsRead(notificationId);
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
          // Revert optimistic update on error
          set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification && notification.is_read) {
              return {
                notifications: state.notifications.map(n =>
                  n.id === notificationId ? { ...n, is_read: false } : n
                ),
                unreadCount: state.unreadCount + 1,
              };
            }
            return state;
          });
          toast.error('Failed to mark notification as read');
        }
      },

      markAllAsRead: async () => {
        const previousState = get();
        try {
          // Optimistic update
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0,
          }));

          // Call API
          await notificationService.markAllAsRead();
          toast.success('All notifications marked as read');
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
          // Revert optimistic update on error
          set({
            notifications: previousState.notifications,
            unreadCount: previousState.unreadCount,
          });
          toast.error('Failed to mark all notifications as read');
        }
      },

      removeNotification: (notificationId: string) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          const wasUnread = notification && !notification.is_read;

          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      fetchNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await notificationService.getNotifications(page, limit, unreadOnly);
          
          set({
            notifications: page === 1 ? response.notifications : 
              [...get().notifications, ...response.notifications],
            unreadCount: response.unreadCount,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({
            error: 'Failed to load notifications',
            isLoading: false,
          });
        }
      },

      refreshUnreadCount: async () => {
        try {
          const response = await notificationService.getUnreadCount();
          set({ unreadCount: response.unreadCount });
        } catch (error) {
          console.error('Failed to refresh unread count:', error);
        }
      },

      setNotifications: (notifications: Notification[], unreadCount: number) => {
        set({
          notifications,
          unreadCount,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep only recent 50 notifications
        unreadCount: state.unreadCount,
      }),
    }
  )
);

function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'task_assigned':
      return '👤';
    case 'task_updated':
      return '📝';
    case 'task_commented':
      return '💬';
    case 'task_completed':
      return '✅';
    case 'project_updated':
      return '📊';
    case 'team_invitation':
      return '👥';
    case 'deadline_reminder':
      return '⏰';
    default:
      return '🔔';
  }
}