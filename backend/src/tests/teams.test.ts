import request from 'supertest';
import { app } from '../app';
import db from '../config/database';
import bcrypt from 'bcryptjs';

describe('Teams API Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeEach(async () => {
    // Clean up test data
    await db('team_members').del();
    await db('teams').del();
    await db('users').del();

    // Create admin user
    adminUserId = '123e4567-e89b-12d3-a456-426614174001';
    const hashedPassword = await bcrypt.hash('password123', 12);
    await db('users').insert({
      id: adminUserId,
      email: 'admin@test.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create regular user
    regularUserId = '123e4567-e89b-12d3-a456-426614174002';
    await db('users').insert({
      id: regularUserId,
      email: 'user@test.com',
      password_hash: hashedPassword,
      first_name: 'Regular',
      last_name: 'User',
      role: 'member',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const teamData = {
        name: 'Test Team',
        description: 'A test team',
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(teamData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Team created successfully');
      expect(response.body.team).toHaveProperty('name', teamData.name);
      expect(response.body.team).toHaveProperty('description', teamData.description);
    });

    it('should reject request without authentication', async () => {
      const teamData = {
        name: 'Test Team',
        description: 'A test team',
      };

      await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(401);
    });
  });

  describe('GET /api/teams', () => {
    beforeEach(async () => {
      // Create test team
      const teamId = '123e4567-e89b-12d3-a456-426614174010';
      await db('teams').insert({
        id: teamId,
        name: 'Test Team',
        description: 'A test team',
        owner_id: adminUserId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db('team_members').insert({
        id: '123e4567-e89b-12d3-a456-426614174020',
        team_id: teamId,
        user_id: adminUserId,
        role: 'admin',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    it('should get all teams for admin user', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.teams).toHaveLength(1);
      expect(response.body.teams[0]).toHaveProperty('name', 'Test Team');
    });

    it('should get empty teams for user not in any team', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(response.body.teams).toHaveLength(0);
    });
  });

  describe('GET /api/teams/:id', () => {
    let teamId: string;

    beforeEach(async () => {
      teamId = '123e4567-e89b-12d3-a456-426614174010';
      await db('teams').insert({
        id: teamId,
        name: 'Test Team',
        description: 'A test team',
        owner_id: adminUserId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db('team_members').insert({
        id: '123e4567-e89b-12d3-a456-426614174020',
        team_id: teamId,
        user_id: adminUserId,
        role: 'admin',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    it('should get team details for admin', async () => {
      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('team');
      expect(response.body.team).toHaveProperty('name', 'Test Team');
      expect(response.body.team).toHaveProperty('members');
      expect(response.body.team.members).toHaveLength(1);
    });

    it('should reject unauthorized access', async () => {
      await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/teams/:id', () => {
    let teamId: string;

    beforeEach(async () => {
      teamId = '123e4567-e89b-12d3-a456-426614174010';
      await db('teams').insert({
        id: teamId,
        name: 'Test Team',
        description: 'A test team',
        owner_id: adminUserId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await db('team_members').insert({
        id: '123e4567-e89b-12d3-a456-426614174020',
        team_id: teamId,
        user_id: adminUserId,
        role: 'admin',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    it('should update team for admin', async () => {
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Team updated successfully');
      expect(response.body.team).toHaveProperty('name', updateData.name);
    });

    it('should reject unauthorized update', async () => {
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description',
      };

      await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });
  });
});