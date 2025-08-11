import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') });

// Override NODE_ENV for tests
process.env.NODE_ENV = 'test';

// Override database name to use test database
process.env.DB_NAME = 'taskmanagement_test';

// Mock Redis for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
  })),
}));

// Setup database before all tests
beforeAll(async () => {
  // Database setup would go here if needed
});

// Cleanup after all tests
afterAll(async () => {
  // Database cleanup would go here if needed
});