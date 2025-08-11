import { createClient } from 'redis';
import { logger } from '../utils/logger';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

client.on('connect', () => {
  logger.info('Connected to Redis');
});

client.on('disconnect', () => {
  logger.warn('Disconnected from Redis');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await client.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export default client;