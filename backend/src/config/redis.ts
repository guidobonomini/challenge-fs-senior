import { logger } from '../utils/logger';

// Mock Redis client to avoid connection issues
const client = {
  connect: async () => { 
    logger.warn('Redis not available, using mock client');
    return Promise.resolve(); 
  },
  get: async (key: string) => null,
  set: async (key: string, value: any) => 'OK',
  setEx: async (key: string, seconds: number, value: any) => 'OK',
  del: async (key: string) => 1,
  exists: async (key: string) => 0,
  expire: async (key: string, seconds: number) => 1,
  on: (event: string, handler: Function) => {},
  off: (event: string, handler: Function) => {},
};

export const connectRedis = async (): Promise<void> => {
  try {
    await client.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't throw error to allow server to start without Redis
    logger.warn('Continuing without Redis connection');
  }
};

export default client;