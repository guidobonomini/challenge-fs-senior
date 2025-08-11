import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useSocket } from './useSocket';

export const useNotifications = () => {
  const socketService = useSocket();
  const { addNotification } = useNotificationStore();

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