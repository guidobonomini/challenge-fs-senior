import dotenv from 'dotenv';
import path from 'path';
import { initializeSentry } from './config/sentry';
import startServer from './app';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Sentry before importing other modules
initializeSentry();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback-secret') {
  console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET in environment variables.');
}

startServer();