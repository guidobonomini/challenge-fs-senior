import request from 'supertest';
import { app } from '../../app';
import db from '../../config/database';
import { TestDataBuilder } from '../helpers';

describe('AI Categorization Controller', () => {
  let testData: TestDataBuilder;

  beforeEach(async () => {
    testData = new TestDataBuilder();
    await testData.cleanup();
  });

  afterEach(async () => {
    await testData.cleanup();
  });

  describe('GET /api/ai/categories', () => {
    it('should get all categories', async () => {
      const user = await testData.createUser();
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .get('/api/ai/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      // Should have default system categories
      expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/ai/categories')
        .expect(401);
    });
  });

  describe('POST /api/ai/categories', () => {
    it('should create a new category as admin', async () => {
      const user = await testData.createUser({ role: 'admin' });
      const token = await testData.getAuthToken(user.id);

      const categoryData = {
        name: 'Custom Category',
        description: 'A custom test category',
        color: '#ff5733',
        icon: 'test-icon',
        sort_order: 10
      };

      const response = await request(app)
        .post('/api/ai/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe(categoryData.name);
      expect(response.body.category.description).toBe(categoryData.description);
      expect(response.body.category.color).toBe(categoryData.color);
      expect(response.body.category.is_system).toBe(false);
    });

    it('should not allow regular users to create categories', async () => {
      const user = await testData.createUser({ role: 'member' });
      const token = await testData.getAuthToken(user.id);

      const categoryData = {
        name: 'Custom Category',
        description: 'A custom test category'
      };

      await request(app)
        .post('/api/ai/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const user = await testData.createUser({ role: 'admin' });
      const token = await testData.getAuthToken(user.id);

      await request(app)
        .post('/api/ai/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/ai/tasks/:id/analyze', () => {
    it('should analyze a task for categorization', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        title: 'Fix critical bug in authentication',
        description: 'There is a serious error in the login process',
        reporter_id: user.id
      });
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .get(`/api/ai/tasks/${task.id}/analyze`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.suggestions).toBeDefined();
      expect(Array.isArray(response.body.analysis.suggestions)).toBe(true);
      expect(response.body.analysis.keywords_detected).toBeDefined();
      expect(response.body.task).toBeDefined();
      expect(response.body.task.id).toBe(task.id);
    });

    it('should not allow access to tasks from other teams', async () => {
      const user1 = await testData.createUser();
      const user2 = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user1.id }, user1.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        reporter_id: user1.id
      });
      const token = await testData.getAuthToken(user2.id);

      await request(app)
        .get(`/api/ai/tasks/${task.id}/analyze`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /api/ai/tasks/:id/categorize', () => {
    it('should categorize a task', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        title: 'Fix login bug',
        description: 'Authentication error',
        reporter_id: user.id
      });
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .post(`/api/ai/tasks/${task.id}/categorize`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept_suggestion: false }) // Don't auto-accept to avoid categorizing
        .expect(200);

      expect(response.body.analysis).toBeDefined();
      expect(response.body.categorized).toBeDefined();
      expect(typeof response.body.categorized).toBe('boolean');
    });
  });

  describe('POST /api/ai/tasks/:id/accept-suggestion', () => {
    it('should accept an AI suggestion', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        title: 'Fix login bug',
        description: 'Authentication error',
        reporter_id: user.id
      });
      
      // First get a category ID
      const categoriesResponse = await request(app)
        .get('/api/ai/categories')
        .set('Authorization', `Bearer ${await testData.getAuthToken(user.id)}`)
        .expect(200);
      
      const category = categoriesResponse.body.categories[0];
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .post(`/api/ai/tasks/${task.id}/accept-suggestion`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          category_id: category.id,
          feedback: 'Good suggestion'
        })
        .expect(200);

      expect(response.body.message).toContain('accepted');
    });

    it('should require category_id', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        reporter_id: user.id
      });
      const token = await testData.getAuthToken(user.id);

      await request(app)
        .post(`/api/ai/tasks/${task.id}/accept-suggestion`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('PUT /api/ai/tasks/:id/category', () => {
    it('should manually categorize a task', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        reporter_id: user.id
      });
      
      // Get a category ID
      const categoriesResponse = await request(app)
        .get('/api/ai/categories')
        .set('Authorization', `Bearer ${await testData.getAuthToken(user.id)}`)
        .expect(200);
      
      const category = categoriesResponse.body.categories[0];
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .put(`/api/ai/tasks/${task.id}/category`)
        .set('Authorization', `Bearer ${token}`)
        .send({ category_id: category.id })
        .expect(200);

      expect(response.body.message).toContain('categorized');
    });

    it('should clear category when category_id is null', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const task = await testData.createTask({
        project_id: project.id,
        reporter_id: user.id
      });
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .put(`/api/ai/tasks/${task.id}/category`)
        .set('Authorization', `Bearer ${token}`)
        .send({ category_id: null })
        .expect(200);

      expect(response.body.message).toContain('cleared');
    });
  });

  describe('GET /api/ai/stats', () => {
    it('should get categorization statistics', async () => {
      const user = await testData.createUser();
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .get('/api/ai/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total_tasks).toBeDefined();
      expect(response.body.stats.categorized_tasks).toBeDefined();
      expect(response.body.stats.ai_categorized_tasks).toBeDefined();
      expect(response.body.stats.manual_categorized_tasks).toBeDefined();
      expect(response.body.stats.pending_suggestions).toBeDefined();
      expect(response.body.stats.category_distribution).toBeDefined();
      expect(Array.isArray(response.body.stats.category_distribution)).toBe(true);
    });

    it('should filter statistics by project', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .get(`/api/ai/stats?project_id=${project.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
    });
  });

  describe('GET /api/ai/tasks/pending-suggestions', () => {
    it('should get tasks with pending suggestions', async () => {
      const user = await testData.createUser();
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .get('/api/ai/tasks/pending-suggestions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBeDefined();
      expect(response.body.pagination.limit).toBeDefined();
      expect(response.body.pagination.total).toBeDefined();
      expect(response.body.pagination.pages).toBeDefined();
    });

    it('should support pagination', async () => {
      const user = await testData.createUser();
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .get('/api/ai/tasks/pending-suggestions?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/ai/projects/:project_id/bulk-categorize', () => {
    it('should bulk categorize project tasks', async () => {
      const user = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user.id }, user.id);
      const project = await testData.createProject({ team_id: team.id });
      const token = await testData.getAuthToken(user.id);

      const response = await request(app)
        .post(`/api/ai/projects/${project.id}/bulk-categorize`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept_suggestion: false })
        .expect(200);

      expect(response.body.processed).toBeDefined();
      expect(response.body.categorized).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.processed).toBe('number');
      expect(typeof response.body.categorized).toBe('number');
    });

    it('should not allow access to projects from other teams', async () => {
      const user1 = await testData.createUser();
      const user2 = await testData.createUser();
      const team = await testData.createTeam({ owner_id: user1.id }, user1.id);
      const project = await testData.createProject({ team_id: team.id });
      const token = await testData.getAuthToken(user2.id);

      await request(app)
        .post(`/api/ai/projects/${project.id}/bulk-categorize`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept_suggestion: false })
        .expect(404);
    });
  });
});