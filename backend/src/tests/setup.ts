import dotenv from 'dotenv';
import path from 'path';
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Mock database to avoid complex setup
jest.mock('../config/database', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    first: jest.fn(),
    returning: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    count: jest.fn(),
    raw: jest.fn(),
    transaction: jest.fn((callback) => callback(mockDb)),
    migrate: {
      latest: jest.fn().mockResolvedValue([]),
    },
    destroy: jest.fn().mockResolvedValue(undefined),
  };
  return { default: mockDb };
});

// Mock Sentry to avoid initialization in tests
jest.mock('../config/sentry', () => ({
  initializeSentry: jest.fn(),
  Sentry: {
    captureException: jest.fn(),
  },
}));

// Mock logger to prevent console noise during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis
jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
}));

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  },
  createWriteStream: jest.fn(),
}));

// Mock multer for file upload tests
jest.mock('multer', () => {
  const multer: any = jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.file = {
        filename: 'test-file.txt',
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
        path: '/tmp/test-file.txt',
      };
      next();
    }),
  }));
  multer.memoryStorage = jest.fn();
  multer.diskStorage = jest.fn();
  return multer;
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Test setup complete
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Additional cleanup if needed
});

afterAll(async () => {
  // Test cleanup complete
});