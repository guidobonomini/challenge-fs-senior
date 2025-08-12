import request from 'supertest';
import app from '../../app';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  testDataBuilder, 
  expectAuthError, 
  expectSuccessResponse,
  expectValidationError,
  TestUser
} from '../helpers';

describe('AuthController', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await testDataBuilder.createUser({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectSuccessResponse(response, 201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.first_name).toBe(userData.first_name);
      expect(response.body.user.last_name).toBe(userData.last_name);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password_hash).toBeUndefined(); // Should not expose password
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        email: 'incomplete@example.com'
        // missing password, first_name, last_name
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectValidationError(response, 'password');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectValidationError(response, 'email');
    });

    it('should fail with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // too short
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectValidationError(response, 'password');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: testUser.email, // already exists
        password: 'password123',
        first_name: 'Duplicate',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'hashtest@example.com',
        password: 'password123',
        first_name: 'Hash',
        last_name: 'Test'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectSuccessResponse(response, 201);

      // Verify password is hashed in database
      const db = require('../../config/database').default;
      const user = await db('users').where('email', userData.email).first();
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user.password_hash)).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expectSuccessResponse(response);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should fail with invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expectAuthError(response);
    });

    it('should fail with invalid password', async () => {
      const credentials = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expectAuthError(response);
    });

    it('should fail with inactive user', async () => {
      // Create inactive user
      const inactiveUser = await testDataBuilder.createUser({
        email: 'inactive@example.com',
        is_active: false
      });

      const credentials = {
        email: inactiveUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expectAuthError(response);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expectValidationError(response, 'email');
    });

    it('should return valid JWT token', async () => {
      const credentials = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expectSuccessResponse(response);
      
      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test-secret') as any;
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.role).toBe(testUser.role);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = testDataBuilder.generateAuthToken(testUser.id, testUser.role);
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expectSuccessResponse(response);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expectAuthError(response);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectAuthError(response);
    });

    it('should fail with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser.id, role: testUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' } // Immediately expired
      );

      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expectAuthError(response);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = testDataBuilder.generateAuthToken(testUser.id, testUser.role);
    });

    it('should update user profile', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.user.first_name).toBe(updateData.first_name);
      expect(response.body.user.last_name).toBe(updateData.last_name);
    });

    it('should fail to update email to existing email', async () => {
      const anotherUser = await testDataBuilder.createUser({
        email: 'another@example.com'
      });

      const updateData = {
        email: anotherUser.email
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        first_name: 'Updated'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData);

      expectAuthError(response);
    });

    it('should not allow updating role', async () => {
      const updateData = {
        role: 'admin' // Should not be allowed
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.user.role).toBe(testUser.role); // Should remain unchanged
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = testDataBuilder.generateAuthToken(testUser.id, testUser.role);
    });

    it('should change password with valid current password', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expectSuccessResponse(response);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: passwordData.new_password
        });

      expectSuccessResponse(loginResponse);
    });

    it('should fail with invalid current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Current password is incorrect');
    });

    it('should fail with weak new password', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: '123' // too short
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expectValidationError(response, 'new_password');
    });

    it('should fail without authentication', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .send(passwordData);

      expectAuthError(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = testDataBuilder.generateAuthToken(testUser.id, testUser.role);
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expectSuccessResponse(response);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expectAuthError(response);
    });
  });
});