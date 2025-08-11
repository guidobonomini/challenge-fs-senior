import request from 'supertest';
import app from '../../app';
import { 
  testDataBuilder, 
  expectAuthError, 
  expectForbiddenError, 
  expectNotFoundError, 
  expectSuccessResponse,
  expectValidationError 
} from '../helpers';

describe('ProjectController', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataBuilder.createCompleteSetup();
  });

  describe('POST /api/projects', () => {
    it('should create a project with valid data', async () => {
      const projectData = {
        name: 'New Test Project',
        description: 'Project description',
        team_id: testData.team.id,
        color: '#FF5733'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(projectData);

      expectSuccessResponse(response, 201);
      expect(response.body.project).toBeDefined();
      expect(response.body.project.name).toBe(projectData.name);
      expect(response.body.project.description).toBe(projectData.description);
      expect(response.body.project.color).toBe(projectData.color);
    });

    it('should fail to create project without authentication', async () => {
      const projectData = {
        name: 'New Test Project',
        team_id: testData.team.id
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData);

      expectAuthError(response);
    });

    it('should fail to create project without required fields', async () => {
      const projectData = {
        description: 'Project without name and team'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(projectData);

      expectValidationError(response, 'name');
    });

    it('should fail to create project with invalid team', async () => {
      const projectData = {
        name: 'Test Project',
        team_id: 'invalid-team-id'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(projectData);

      expectNotFoundError(response);
    });

    it('should fail for regular user to create project in team they are not admin/manager of', async () => {
      const outsideTeam = await testDataBuilder.createTeam({}, testData.adminUser.id);
      
      const projectData = {
        name: 'Unauthorized Project',
        team_id: outsideTeam.id
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testData.userToken}`)
        .send(projectData);

      expectForbiddenError(response);
    });

    it('should allow team manager to create project', async () => {
      // Make regular user a manager
      const db = require('../../config/database').default;
      await db('team_members')
        .where({ team_id: testData.team.id, user_id: testData.regularUser.id })
        .update({ role: 'manager' });

      const projectData = {
        name: 'Manager Project',
        team_id: testData.team.id
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testData.userToken}`)
        .send(projectData);

      expectSuccessResponse(response, 201);
      expect(response.body.project.name).toBe(projectData.name);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create additional projects for testing
      await testDataBuilder.createProject({ 
        name: 'Project 1',
        team_id: testData.team.id 
      });
      await testDataBuilder.createProject({ 
        name: 'Project 2',
        team_id: testData.team.id 
      });
    });

    it('should get all projects for admin', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.projects).toBeDefined();
      expect(response.body.projects.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get projects for regular user in their teams', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectSuccessResponse(response);
      expect(response.body.projects).toBeDefined();
      // Should only see projects from teams they're members of
      expect(response.body.projects.every((project: any) => 
        project.team_id === testData.team.id
      )).toBe(true);
    });

    it('should filter projects by team', async () => {
      const response = await request(app)
        .get(`/api/projects?team_id=${testData.team.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.projects.every((project: any) => 
        project.team_id === testData.team.id
      )).toBe(true);
    });

    it('should search projects by name', async () => {
      const response = await request(app)
        .get('/api/projects?search=Project 1')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.projects.some((project: any) => 
        project.name.includes('Project 1')
      )).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=1')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.projects.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should exclude archived projects by default', async () => {
      // Archive a project
      const db = require('../../config/database').default;
      await db('projects')
        .where('id', testData.project.id)
        .update({ is_archived: true });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.projects.every((project: any) => 
        !project.is_archived
      )).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get specific project by id', async () => {
      const response = await request(app)
        .get(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.project.id).toBe(testData.project.id);
      expect(response.body.project.name).toBe(testData.project.name);
      expect(response.body.project.team_name).toBeDefined();
      expect(response.body.project.task_stats).toBeDefined();
    });

    it('should fail to get non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectNotFoundError(response);
    });

    it('should allow team member to access project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectSuccessResponse(response);
    });

    it('should fail for non-team member to access project', async () => {
      const outsideUser = await testDataBuilder.createUser();
      const outsideToken = testDataBuilder.generateAuthToken(outsideUser.id);

      const response = await request(app)
        .get(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${outsideToken}`);

      expectNotFoundError(response);
    });

    it('should include task statistics', async () => {
      // Create tasks with different statuses
      await testDataBuilder.createTask({ 
        project_id: testData.project.id, 
        status: 'todo' 
      });
      await testDataBuilder.createTask({ 
        project_id: testData.project.id, 
        status: 'in_progress' 
      });
      await testDataBuilder.createTask({ 
        project_id: testData.project.id, 
        status: 'done' 
      });

      const response = await request(app)
        .get(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.project.task_stats).toBeDefined();
      expect(response.body.project.task_stats.total).toBeGreaterThan(0);
      expect(response.body.project.task_stats.todo).toBeDefined();
      expect(response.body.project.task_stats.in_progress).toBeDefined();
      expect(response.body.project.task_stats.done).toBeDefined();
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project with valid data', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
        color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.project.name).toBe(updateData.name);
      expect(response.body.project.description).toBe(updateData.description);
      expect(response.body.project.color).toBe(updateData.color);
    });

    it('should allow admin to update any project', async () => {
      const updateData = { name: 'Admin Updated Project' };

      const response = await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.project.name).toBe(updateData.name);
    });

    it('should fail for regular member to update project', async () => {
      const updateData = { name: 'Member Updated Project' };

      const response = await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`)
        .send(updateData);

      expectForbiddenError(response);
    });

    it('should allow team manager to update project', async () => {
      // Make regular user a manager
      const db = require('../../config/database').default;
      await db('team_members')
        .where({ team_id: testData.team.id, user_id: testData.regularUser.id })
        .update({ role: 'manager' });

      const updateData = { name: 'Manager Updated Project' };

      const response = await request(app)
        .put(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.project.name).toBe(updateData.name);
    });

    it('should fail to update non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send({ name: 'Updated' });

      expectNotFoundError(response);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should archive project (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);

      // Verify project is archived
      const db = require('../../config/database').default;
      const project = await db('projects').where('id', testData.project.id).first();
      expect(project.is_archived).toBe(true);
    });

    it('should fail for regular member to delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectForbiddenError(response);
    });

    it('should allow team admin to delete project', async () => {
      // The admin user is already team owner/admin
      const response = await request(app)
        .delete(`/api/projects/${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
    });

    it('should fail to delete non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectNotFoundError(response);
    });
  });

  describe('PUT /api/projects/:id/archive', () => {
    it('should archive project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testData.project.id}/archive`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);

      // Verify project is archived
      const db = require('../../config/database').default;
      const project = await db('projects').where('id', testData.project.id).first();
      expect(project.is_archived).toBe(true);
    });

    it('should fail for non-admin to archive project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testData.project.id}/archive`)
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectForbiddenError(response);
    });
  });

  describe('PUT /api/projects/:id/restore', () => {
    beforeEach(async () => {
      // Archive the project first
      const db = require('../../config/database').default;
      await db('projects')
        .where('id', testData.project.id)
        .update({ is_archived: true });
    });

    it('should restore archived project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testData.project.id}/restore`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);

      // Verify project is restored
      const db = require('../../config/database').default;
      const project = await db('projects').where('id', testData.project.id).first();
      expect(project.is_archived).toBe(false);
    });

    it('should fail for non-admin to restore project', async () => {
      const response = await request(app)
        .put(`/api/projects/${testData.project.id}/restore`)
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectForbiddenError(response);
    });
  });
});