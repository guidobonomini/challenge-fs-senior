import dotenv from 'dotenv';
import path from 'path';
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import db from '../config/database';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

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

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Ensure test database is ready
  await db.raw('SELECT 1');
});

beforeEach(async () => {
  // Clean up test data before each test
  const tables = [
    'comments',
    'attachments', 
    'time_entries',
    'tasks',
    'projects',
    'team_members',
    'teams',
    'users',
    'notifications'
  ];
  
  // Disable foreign key checks temporarily
  await db.raw('SET session_replication_role = replica');
  
  for (const table of tables) {
    await db.raw(`TRUNCATE TABLE ${table} CASCADE`);
  }
  
  // Re-enable foreign key checks
  await db.raw('SET session_replication_role = DEFAULT');
});

afterEach(async () => {
  // Additional cleanup if needed
});

afterAll(async () => {
  await db.destroy();
});