import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import { createServer } from 'http';

import { connectRedis } from './config/redis';
import { generalRateLimit } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import attachmentRoutes from './routes/attachments';
import assignmentRoutes from './routes/assignments';
import aiCategorizationRoutes from './routes/aiCategorization';

import SocketManager from './socket/socketManager';
import NotificationService from './services/notificationService';

const app = express();
const server = createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalRateLimit);

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/ai', aiCategorizationRoutes);

const socketManager = new SocketManager(server);
const notificationService = new NotificationService(socketManager);

app.locals.socketManager = socketManager;
app.locals.notificationService = notificationService;

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();
    logger.info('Redis connected successfully');

    const port = process.env.PORT || 8000;
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export { app, server, socketManager, notificationService };
export default startServer;