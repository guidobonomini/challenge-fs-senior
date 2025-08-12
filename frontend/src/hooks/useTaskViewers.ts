import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';
import { useAuthStore } from '../store/authStore';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
}

interface UseTaskViewersOptions {
  taskId?: string;
  enabled?: boolean;
}

export const useTaskViewers = ({ taskId, enabled = true }: UseTaskViewersOptions) => {
  const [viewers, setViewers] = useState<User[]>([]);
  const { user } = useAuthStore();

  const addViewer = useCallback((newViewer: User) => {
    setViewers(prev => {
      // Don't add if already viewing
      if (prev.some(viewer => viewer.id === newViewer.id)) {
        return prev;
      }
      return [...prev, newViewer];
    });
  }, []);

  const removeViewer = useCallback((userId: string) => {
    setViewers(prev => prev.filter(viewer => viewer.id !== userId));
  }, []);

  const clearViewers = useCallback(() => {
    setViewers([]);
  }, []);

  // Join task when component mounts or taskId changes
  useEffect(() => {
    if (!taskId || !enabled || !user || !socketService.connected) {
      return;
    }

    // Join the task room
    socketService.joinTask(taskId);

    return () => {
      // Leave the task room when unmounting
      socketService.leaveTask(taskId);
    };
  }, [taskId, enabled, user]);

  // Set up socket listeners
  useEffect(() => {
    if (!taskId || !enabled) {
      return;
    }

    const handleUserViewingTask = (data: { user: User; task_id: string }) => {
      if (data.task_id === taskId && data.user.id !== user?.id) {
        addViewer(data.user);
      }
    };

    const handleUserStoppedViewingTask = (data: { user: User; task_id: string }) => {
      if (data.task_id === taskId) {
        removeViewer(data.user.id);
      }
    };

    // Set up socket listeners
    socketService.onUserViewingTask(handleUserViewingTask);
    socketService.onUserStoppedViewingTask(handleUserStoppedViewingTask);

    return () => {
      // Clean up listeners
      socketService.off('user_viewing_task', handleUserViewingTask);
      socketService.off('user_stopped_viewing_task', handleUserStoppedViewingTask);
    };
  }, [taskId, enabled, user?.id, addViewer, removeViewer]);

  // Clear viewers when task changes
  useEffect(() => {
    clearViewers();
  }, [taskId, clearViewers]);

  // Clear viewers when component unmounts
  useEffect(() => {
    return () => {
      clearViewers();
    };
  }, [clearViewers]);

  return {
    viewers,
    addViewer,
    removeViewer,
    clearViewers,
  };
};