import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useSocket } from './useSocket';

export const useNotifications = () => {
  const socketService = useSocket();
  const { addNotification, fetchNotifications, refreshUnreadCount } = useNotificationStore();

  // Fetch initial notifications on mount
  useEffect(() => {
    fetchNotifications();
    refreshUnreadCount();
  }, [fetchNotifications, refreshUnreadCount]);

  useEffect(() => {
    if (!socketService.connected) return;

    const handleNewNotification = (notification: any) => {
      addNotification(notification);
    };

    // Listen for new notifications
    socketService.onNewNotification(handleNewNotification);

    return () => {
      socketService.off('new_notification', handleNewNotification);
    };
  }, [socketService.connected, addNotification]);

  return useNotificationStore();
};