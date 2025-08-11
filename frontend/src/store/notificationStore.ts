import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Notification } from '../types';
import { toast } from 'react-hot-toast';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
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

      markAsRead: (notificationId: string) => {
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
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));
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