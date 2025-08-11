import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';

export const useSocket = () => {
  const { isAuthenticated, token } = useAuthStore();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token && !isConnectedRef.current) {
      socketService.connect(token);
      isConnectedRef.current = true;
    } else if (!isAuthenticated && isConnectedRef.current) {
      socketService.disconnect();
      isConnectedRef.current = false;
    }

    return () => {
      if (isConnectedRef.current) {
        socketService.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, [isAuthenticated, token]);

  return socketService;
};