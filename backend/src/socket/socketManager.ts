import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/auth';
import db from '../config/database';
import { logger } from '../utils/logger';
import { User } from '../types';


class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupAuthenticationMiddleware();
    this.setupConnectionHandlers();
  }

  private setupAuthenticationMiddleware(): void {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Invalid token'));
        }

        const user = await db('users')
          .where({ id: decoded.id, is_active: true })
          .select('id', 'email', 'first_name', 'last_name', 'role')
          .first();

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        socket.userId = user.id;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: any) => {
      const userId = socket.userId;
      const socketId = socket.id;

      logger.info('User connected via WebSocket:', { userId, socketId });

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socketId);

      socket.on('join_project', async (projectId: string) => {
        try {
          const hasAccess = await db('projects as p')
            .join('team_members as tm', 'p.team_id', 'tm.team_id')
            .where('p.id', projectId)
            .where('tm.user_id', userId)
            .first();

          if (hasAccess) {
            socket.join(`project:${projectId}`);
            logger.info('User joined project room:', { userId, projectId, socketId });
            
            socket.to(`project:${projectId}`).emit('user_joined_project', {
              user: socket.user,
              project_id: projectId,
            });
          }
        } catch (error) {
          logger.error('Error joining project room:', error);
        }
      });

      socket.on('leave_project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        logger.info('User left project room:', { userId, projectId, socketId });
        
        socket.to(`project:${projectId}`).emit('user_left_project', {
          user: socket.user,
          project_id: projectId,
        });
      });

      socket.on('join_task', async (taskId: string) => {
        try {
          const hasAccess = await db('tasks as t')
            .join('projects as p', 't.project_id', 'p.id')
            .join('team_members as tm', 'p.team_id', 'tm.team_id')
            .where('t.id', taskId)
            .where('tm.user_id', userId)
            .first();

          if (hasAccess) {
            socket.join(`task:${taskId}`);
            logger.info('User joined task room:', { userId, taskId, socketId });
            
            socket.to(`task:${taskId}`).emit('user_viewing_task', {
              user: socket.user,
              task_id: taskId,
            });
          }
        } catch (error) {
          logger.error('Error joining task room:', error);
        }
      });

      socket.on('leave_task', (taskId: string) => {
        socket.leave(`task:${taskId}`);
        logger.info('User left task room:', { userId, taskId, socketId });
        
        socket.to(`task:${taskId}`).emit('user_stopped_viewing_task', {
          user: socket.user,
          task_id: taskId,
        });
      });

      socket.on('task_typing', (data: { task_id: string; is_typing: boolean }) => {
        socket.to(`task:${data.task_id}`).emit('user_typing', {
          user: socket.user,
          task_id: data.task_id,
          is_typing: data.is_typing,
        });
      });

      socket.on('disconnect', (reason: string) => {
        logger.info('User disconnected from WebSocket:', { userId, socketId, reason });
        
        if (this.connectedUsers.has(userId)) {
          this.connectedUsers.get(userId)!.delete(socketId);
          if (this.connectedUsers.get(userId)!.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });

      socket.on('error', (error: any) => {
        logger.error('Socket error:', { userId, socketId, error });
      });
    });
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToProject(projectId: string, event: string, data: any): void {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public emitToTask(taskId: string, event: string, data: any): void {
    this.io.to(`task:${taskId}`).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketManager;