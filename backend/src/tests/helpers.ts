import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express, { Express } from 'express';
import cors from 'cors';
import db from '../config/database';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import authRoutes from '../routes/auth';
import teamRoutes from '../routes/teams';
import projectRoutes from '../routes/projects';
import taskRoutes from '../routes/tasks';
import commentRoutes from '../routes/comments';
import userRoutes from '../routes/users';
import attachmentRoutes from '../routes/attachments';
import assignmentRoutes from '../routes/assignments';
import aiCategorizationRoutes from '../routes/aiCategorization';

export interface TestUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'member';
  is_active: boolean;
  password?: string;
}

export interface TestTeam {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_by: string;
  is_active: boolean;
}

export interface TestProject {
  id: string;
  name: string;
  description: string;
  team_id: string;
  created_by: string;
  color: string;
  is_archived: boolean;
}

export interface TestTask {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id?: string;
  reporter_id: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'task' | 'bug' | 'feature' | 'epic';
  position: number;
  is_archived: boolean;
}

export class TestDataBuilder {
  async createUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const defaultData: TestUser = {
      id: uuidv4(),
      email: `test${Date.now()}@example.com`,
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      is_active: true,
    };

    const user = { ...defaultData, ...userData };
    const passwordHash = await bcrypt.hash(userData.password || 'password123', 10);

    await db('users').insert({
      ...user,
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return user;
  }

  async createAdminUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    return this.createUser({ ...userData, role: 'admin' });
  }

  async createTeam(teamData: Partial<TestTeam> = {}, ownerId?: string): Promise<TestTeam> {
    const defaultData: TestTeam = {
      id: uuidv4(),
      name: `Test Team ${Date.now()}`,
      description: 'Test team description',
      owner_id: ownerId || uuidv4(),
      created_by: ownerId || uuidv4(),
      is_active: true,
    };

    const team = { ...defaultData, ...teamData };

    await db('teams').insert({
      ...team,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Add owner as admin member
    await db('team_members').insert({
      id: uuidv4(),
      team_id: team.id,
      user_id: team.owner_id,
      role: 'admin',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    return team;
  }

  async addTeamMember(teamId: string, userId: string, role: 'admin' | 'manager' | 'member' = 'member'): Promise<void> {
    await db('team_members').insert({
      id: uuidv4(),
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async createProject(projectData: Partial<TestProject> = {}): Promise<TestProject> {
    const defaultData: TestProject = {
      id: uuidv4(),
      name: `Test Project ${Date.now()}`,
      description: 'Test project description',
      team_id: uuidv4(),
      created_by: uuidv4(),
      color: '#3B82F6',
      is_archived: false,
    };

    const project = { ...defaultData, ...projectData };

    await db('projects').insert({
      ...project,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return project;
  }

  async createTask(taskData: Partial<TestTask> = {}): Promise<TestTask> {
    const defaultData: TestTask = {
      id: uuidv4(),
      title: `Test Task ${Date.now()}`,
      description: 'Test task description',
      project_id: uuidv4(),
      reporter_id: uuidv4(),
      status: 'todo',
      priority: 'medium',
      type: 'task',
      position: 0,
      is_archived: false,
    };

    const task = { ...defaultData, ...taskData };

    await db('tasks').insert({
      ...task,
      time_spent: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return task;
  }

  generateAuthToken(userId: string, role: string = 'user'): string {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  async cleanup(): Promise<void> {
    // Clean up test data in reverse dependency order
    await db('ai_categorization_history').del();
    await db('task_assignments').del();
    await db('assignment_history').del();
    await db('time_entries').del();
    await db('attachments').del();
    await db('comments').del();
    await db('tasks').del();
    await db('projects').del();
    await db('team_members').del();
    await db('teams').del();
    await db('users').del();
    // Don't delete task_categories as they are system data
  }

  async getAuthToken(userId: string, role: string = 'user'): Promise<string> {
    return this.generateAuthToken(userId, role);
  }

  async createCompleteSetup(): Promise<{
    adminUser: TestUser;
    regularUser: TestUser;
    team: TestTeam;
    project: TestProject;
    task: TestTask;
    adminToken: string;
    userToken: string;
  }> {
    const adminUser = await this.createAdminUser({ email: 'admin@test.com' });
    const regularUser = await this.createUser({ email: 'user@test.com' });
    
    const team = await this.createTeam({}, adminUser.id);
    await this.addTeamMember(team.id, regularUser.id, 'member');
    
    const project = await this.createProject({ team_id: team.id });
    const task = await this.createTask({ 
      project_id: project.id, 
      reporter_id: adminUser.id,
      assignee_id: regularUser.id 
    });

    const adminToken = this.generateAuthToken(adminUser.id, 'admin');
    const userToken = this.generateAuthToken(regularUser.id, 'user');

    return {
      adminUser,
      regularUser,
      team,
      project,
      task,
      adminToken,
      userToken,
    };
  }
}

export const testDataBuilder = new TestDataBuilder();

export function expectValidationError(response: any, field: string): void {
  expect(response.status).toBe(400);
  expect(response.body.error).toContain(field);
}

export function expectAuthError(response: any): void {
  expect(response.status).toBe(401);
  expect(response.body.error).toContain('Unauthorized');
}

export function expectForbiddenError(response: any): void {
  expect(response.status).toBe(403);
  expect(response.body.error).toContain('Access denied');
}

export function expectNotFoundError(response: any): void {
  expect(response.status).toBe(404);
  expect(response.body.error).toContain('not found');
}

export function expectSuccessResponse(response: any, expectedStatus: number = 200): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
}

// Test app creation function
export async function createTestApp(): Promise<Express> {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/attachments', attachmentRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/ai', aiCategorizationRoutes);

  // Mock socket manager and notification service for tests
  app.locals.socketManager = {
    isUserConnected: jest.fn().mockReturnValue(true),
    emitToUser: jest.fn(),
  };
  app.locals.notificationService = {
    sendNotification: jest.fn(),
  };

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Convenience functions for tests
export const createUser = (userData: Partial<TestUser> = {}) => testDataBuilder.createUser(userData);
export const createTeam = (teamData: Partial<TestTeam> = {}, ownerId?: string) => testDataBuilder.createTeam(teamData, ownerId);
export const createProject = (projectData: Partial<TestProject> = {}) => testDataBuilder.createProject(projectData);
export const createTask = (taskData: Partial<TestTask> = {}) => testDataBuilder.createTask(taskData);
export const getAuthToken = (userId: string, role: string = 'user') => testDataBuilder.generateAuthToken(userId, role);