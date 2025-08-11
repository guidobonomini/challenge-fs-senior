import { io, Socket } from 'socket.io-client';
import { SocketEvents, Notification } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Project-related events
  joinProject(projectId: string): void {
    this.socket?.emit('join_project', projectId);
  }

  leaveProject(projectId: string): void {
    this.socket?.emit('leave_project', projectId);
  }

  onUserJoinedProject(callback: (data: { user: any; project_id: string }) => void): void {
    this.socket?.on('user_joined_project', callback);
  }

  onUserLeftProject(callback: (data: { user: any; project_id: string }) => void): void {
    this.socket?.on('user_left_project', callback);
  }

  onProjectUpdated(callback: (data: { project_id: string; updated_by: any }) => void): void {
    this.socket?.on('project_updated', callback);
  }

  // Task-related events
  joinTask(taskId: string): void {
    this.socket?.emit('join_task', taskId);
  }

  leaveTask(taskId: string): void {
    this.socket?.emit('leave_task', taskId);
  }

  onUserViewingTask(callback: (data: { user: any; task_id: string }) => void): void {
    this.socket?.on('user_viewing_task', callback);
  }

  onUserStoppedViewingTask(callback: (data: { user: any; task_id: string }) => void): void {
    this.socket?.on('user_stopped_viewing_task', callback);
  }

  onTaskStatusChanged(callback: (data: { task_id: string; new_status: string; changed_by: any }) => void): void {
    this.socket?.on('task_status_changed', callback);
  }

  onTaskCommented(callback: (data: { task_id: string; comment_id: string; commented_by: any }) => void): void {
    this.socket?.on('task_commented', callback);
  }

  onTaskCreated(callback: (data: { task: any; project_id: string; created_by: any }) => void): void {
    this.socket?.on('task_created', callback);
  }

  onTaskUpdated(callback: (data: { task_id: string; task: any; changes: string[]; updated_by: any; project_id: string }) => void): void {
    this.socket?.on('task_updated', callback);
  }

  // Attachment-related events
  onAttachmentUploaded(callback: (data: { attachment_id: string; task_id: string; task_title: string; project_name: string; uploaded_by: any; attachment: any }) => void): void {
    this.socket?.on('attachment_uploaded', callback);
  }

  onAttachmentDeleted(callback: (data: { attachment_id: string; task_id: string; deleted_by: string }) => void): void {
    this.socket?.on('attachment_deleted', callback);
  }

  // Assignment-related events
  onTaskAssigned(callback: (data: { task_id: string; assigned_by: any; assignment: any }) => void): void {
    this.socket?.on('task_assigned', callback);
  }

  onTaskUnassigned(callback: (data: { task_id: string; unassigned_by: any; role: string }) => void): void {
    this.socket?.on('task_unassigned', callback);
  }

  // Typing indicators
  emitTaskTyping(taskId: string, isTyping: boolean): void {
    this.socket?.emit('task_typing', { task_id: taskId, is_typing: isTyping });
  }

  onUserTyping(callback: (data: { user: any; task_id: string; is_typing: boolean }) => void): void {
    this.socket?.on('user_typing', callback);
  }

  // Notification events
  onNewNotification(callback: (notification: Notification) => void): void {
    this.socket?.on('new_notification', callback);
  }

  // Generic event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  // Connection status
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;