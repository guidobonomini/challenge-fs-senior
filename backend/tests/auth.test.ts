import request from 'supertest';
import { app } from '../src/app';
import db from '../src/config/database';

describe('Authentication', () => {
  beforeEach(async () => {
    // Clean up test data
    await db('users').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toMatchObject({
        email: validUserData.email,
        first_name: validUserData.first_name,
        last_name: validUserData.last_name,
        role: 'member',
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual({
        field: 'email',
        message: expect.stringContaining('email'),
      });
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '123',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual({
        field: 'password',
        message: expect.stringContaining('8'),
      });
    });

    it('should return 409 for duplicate email', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toMatchObject({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
      });
      expect(response.body.token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        });

      authToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: userId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'member',
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.error).toContain('No token provided');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('Invalid token');
    });
  });
});