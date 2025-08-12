import request from 'supertest';
import express from 'express';
import { register, login } from '../../controllers/authController';
import db from '../../config/database';
import * as authUtils from '../../utils/auth';

// Mock the auth utils
jest.mock('../../utils/auth');

const mockedAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

describe('AuthController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Set up routes
    app.post('/register', register);
    app.post('/login', login);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    test('should register a new user successfully', async () => {
      // Mock database responses
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock database queries
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null) // No existing user
          })
        })
      });

      (db.insert as jest.Mock).mockReturnValue({
        into: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser])
        })
      });

      // Mock auth utilities
      mockedAuthUtils.hashPassword.mockResolvedValue('hashed-password');
      mockedAuthUtils.generateToken.mockReturnValue('mocked-jwt-token');

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBe('mocked-jwt-token');
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing password, first_name, last_name
      };

      const response = await request(app)
        .post('/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email-format',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 409 for duplicate email', async () => {
      // Mock existing user found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ id: 'existing-user' })
          })
        })
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /login', () => {
    test('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        is_active: true,
        email_verified: true
      };

      // Mock database query to find user
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockUser)
          })
        })
      });

      // Mock password comparison
      mockedAuthUtils.comparePassword.mockResolvedValue(true);
      mockedAuthUtils.generateToken.mockReturnValue('mocked-jwt-token');

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.token).toBe('mocked-jwt-token');
    });

    test('should return 401 for invalid email', async () => {
      // Mock no user found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null)
          })
        })
      });

      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    test('should return 401 for wrong password', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: true,
        email_verified: true
      };

      // Mock database query to find user
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockUser)
          })
        })
      });

      // Mock password comparison failure
      mockedAuthUtils.comparePassword.mockResolvedValue(false);

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid email or password');
    });

    test('should return 401 for inactive user', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: false, // Inactive user
        email_verified: true
      };

      // Mock database query to find user
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockUser)
          })
        })
      });

      mockedAuthUtils.comparePassword.mockResolvedValue(true);

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Account is not active');
    });
  });
});