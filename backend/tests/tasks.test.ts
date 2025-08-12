import request from 'supertest';
import { app } from '../src/app';
import db from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

describe('Tasks', () => {
  let authToken: string;
  let userId: string;
  let teamId: string;
  let projectId: string;

  beforeEach(async () => {
    // Clean up test data
    await db('tasks').del();
    await db('projects').del();
    await db('team_members').del();
    await db('teams').del();
    await db('users').del();

    // Create a user and get auth token
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

    // Create a team
    const teamResponse = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Team',
        description: 'Test team description',
      });

    teamId = teamResponse.body.team.id;

    // Create a project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Test project description',
        team_id: teamId,
      });

    projectId = projectResponse.body.project.id;
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/tasks', () => {
    const validTaskData = {
      title: 'Test Task',
      description: 'Test task description',
      priority: 'medium',
      type: 'task',
      story_points: 5,
      time_estimate: 3600,
    };

    it('should create a new task successfully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validTaskData,
          project_id: projectId,
        })
        .expect(201);

      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.task).toMatchObject({
        title: validTaskData.title,
        description: validTaskData.description,
        priority: validTaskData.priority,
        type: validTaskData.type,
        story_points: validTaskData.story_points,
        status: 'todo',
        project_id: projectId,
        reporter_id: userId,
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: validTaskData.description,
          // Missing title and project_id
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.stringContaining('required'),
          }),
          expect.objectContaining({
            field: 'project_id',
            message: expect.stringContaining('required'),
          }),
        ])
      );
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validTaskData,
          project_id: uuidv4(),
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/tasks')
        .send({
          ...validTaskData,
          project_id: projectId,
        })
        .expect(401);
    });
  });

  describe('GET /api/tasks', () => {
    let taskId: string;

    beforeEach(async () => {
      // Create a task
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          project_id: projectId,
        });

      taskId = taskResponse.body.task.id;
    });

    it('should return list of tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0]).toMatchObject({
        id: taskId,
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'medium',
        project_id: projectId,
      });
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter tasks by project_id', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ project_id: projectId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].project_id).toBe(projectId);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'todo' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].status).toBe('todo');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          project_id: projectId,
        });

      taskId = taskResponse.body.task.id;
    });

    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.task).toMatchObject(updateData);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });
  });

  describe('PATCH /api/tasks/:id/position', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          project_id: projectId,
        });

      taskId = taskResponse.body.task.id;
    });

    it('should update task position and status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in_progress',
          position: 1,
        })
        .expect(200);

      expect(response.body.message).toBe('Task position updated successfully');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/position`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid_status',
          position: 1,
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});