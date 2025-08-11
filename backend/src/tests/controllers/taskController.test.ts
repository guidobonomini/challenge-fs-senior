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

describe('TaskController', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataBuilder.createCompleteSetup();
  });

  describe('POST /api/tasks', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'New Test Task',
        description: 'Task description',
        project_id: testData.project.id,
        status: 'todo',
        priority: 'high',
        type: 'feature'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(taskData);

      expectSuccessResponse(response, 201);
      expect(response.body.task).toBeDefined();
      expect(response.body.task.title).toBe(taskData.title);
      expect(response.body.task.priority).toBe(taskData.priority);
    });

    it('should fail to create task without authentication', async () => {
      const taskData = {
        title: 'New Test Task',
        project_id: testData.project.id
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expectAuthError(response);
    });

    it('should fail to create task with invalid project', async () => {
      const taskData = {
        title: 'New Test Task',
        project_id: 'invalid-project-id'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(taskData);

      expectNotFoundError(response);
    });

    it('should fail to create task without required fields', async () => {
      const taskData = {
        description: 'Task without title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(taskData);

      expectValidationError(response, 'title');
    });

    it('should create task with assignee', async () => {
      const taskData = {
        title: 'Task with Assignee',
        project_id: testData.project.id,
        assignee_id: testData.regularUser.id
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(taskData);

      expectSuccessResponse(response, 201);
      expect(response.body.task.assignee_id).toBe(testData.regularUser.id);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create multiple tasks for testing
      await testDataBuilder.createTask({ 
        project_id: testData.project.id, 
        title: 'Task 1',
        status: 'todo' 
      });
      await testDataBuilder.createTask({ 
        project_id: testData.project.id, 
        title: 'Task 2',
        status: 'in_progress' 
      });
    });

    it('should get all tasks for admin', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.tasks).toBeDefined();
      expect(response.body.tasks.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get tasks for regular user in their projects', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectSuccessResponse(response);
      expect(response.body.tasks).toBeDefined();
    });

    it('should filter tasks by project', async () => {
      const response = await request(app)
        .get(`/api/tasks?project_id=${testData.project.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.tasks.every((task: any) => task.project_id === testData.project.id)).toBe(true);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.tasks.every((task: any) => task.status === 'todo')).toBe(true);
    });

    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks?search=Task 1')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.tasks.some((task: any) => task.title.includes('Task 1'))).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=1')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.tasks.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get specific task by id', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
      expect(response.body.task.id).toBe(testData.task.id);
      expect(response.body.task.title).toBe(testData.task.title);
    });

    it('should fail to get non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectNotFoundError(response);
    });

    it('should allow regular user to access task in their project', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectSuccessResponse(response);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.task.title).toBe(updateData.title);
      expect(response.body.task.status).toBe(updateData.status);
    });

    it('should allow regular user to update task in their project', async () => {
      const updateData = { title: 'Updated by user' };

      const response = await request(app)
        .put(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.task.title).toBe(updateData.title);
    });

    it('should fail to update non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send({ title: 'Updated' });

      expectNotFoundError(response);
    });

    it('should update task timestamps correctly', async () => {
      const updateData = { status: 'in_progress' };

      const response = await request(app)
        .put(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.task.updated_at).toBeDefined();
    });
  });

  describe('PATCH /api/tasks/:id/position', () => {
    it('should update task position and status', async () => {
      const updateData = {
        status: 'in_progress',
        position: 1
      };

      const response = await request(app)
        .patch(`/api/tasks/${testData.task.id}/position`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(updateData);

      expectSuccessResponse(response);
    });

    it('should allow admin to update any task position', async () => {
      const updateData = {
        status: 'done',
        position: 0
      };

      const response = await request(app)
        .patch(`/api/tasks/${testData.task.id}/position`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(updateData);

      expectSuccessResponse(response);
    });

    it('should allow regular user to update task position in their project', async () => {
      const updateData = {
        status: 'in_review',
        position: 2
      };

      const response = await request(app)
        .patch(`/api/tasks/${testData.task.id}/position`)
        .set('Authorization', `Bearer ${testData.userToken}`)
        .send(updateData);

      expectSuccessResponse(response);
    });
  });

  describe('PATCH /api/tasks/:id/assign', () => {
    it('should assign task to user', async () => {
      const assignData = {
        assignee_id: testData.regularUser.id
      };

      const response = await request(app)
        .patch(`/api/tasks/${testData.task.id}/assign`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(assignData);

      expectSuccessResponse(response);
      expect(response.body.task.assignee_id).toBe(testData.regularUser.id);
    });

    it('should unassign task', async () => {
      const assignData = {
        assignee_id: null
      };

      const response = await request(app)
        .patch(`/api/tasks/${testData.task.id}/assign`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(assignData);

      expectSuccessResponse(response);
      expect(response.body.task.assignee_id).toBeNull();
    });

    it('should fail to assign non-team member', async () => {
      const outsideUser = await testDataBuilder.createUser();
      const assignData = {
        assignee_id: outsideUser.id
      };

      const response = await request(app)
        .patch(`/api/tasks/${testData.task.id}/assign`)
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(assignData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not a member');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should archive task (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.adminToken}`);

      expectSuccessResponse(response);
    });

    it('should fail to delete task as regular user without manager role', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${testData.userToken}`);

      expectNotFoundError(response);
    });

    it('should allow team manager to delete task', async () => {
      // Create a manager user
      const managerUser = await testDataBuilder.createUser();
      await testDataBuilder.addTeamMember(testData.team.id, managerUser.id, 'manager');
      const managerToken = testDataBuilder.generateAuthToken(managerUser.id);

      const response = await request(app)
        .delete(`/api/tasks/${testData.task.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expectSuccessResponse(response);
    });
  });

  describe('POST /api/tasks/bulk', () => {
    let task1: any, task2: any;

    beforeEach(async () => {
      task1 = await testDataBuilder.createTask({ project_id: testData.project.id });
      task2 = await testDataBuilder.createTask({ project_id: testData.project.id });
    });

    it('should bulk update tasks', async () => {
      const bulkData = {
        task_ids: [task1.id, task2.id],
        updates: {
          status: 'in_progress',
          priority: 'high'
        }
      };

      const response = await request(app)
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(bulkData);

      expectSuccessResponse(response);
      expect(response.body.tasks).toHaveLength(2);
    });

    it('should fail bulk update with invalid task ids', async () => {
      const bulkData = {
        task_ids: ['invalid-id'],
        updates: { status: 'done' }
      };

      const response = await request(app)
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(bulkData);

      expectNotFoundError(response);
    });

    it('should fail bulk update without task_ids array', async () => {
      const bulkData = {
        updates: { status: 'done' }
      };

      const response = await request(app)
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${testData.adminToken}`)
        .send(bulkData);

      expectValidationError(response, 'task_ids');
    });
  });
});