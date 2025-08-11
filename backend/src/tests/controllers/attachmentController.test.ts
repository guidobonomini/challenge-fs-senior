import request from 'supertest';
import { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { createTestApp, createUser, createTeam, createProject, createTask, getAuthToken } from '../helpers';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Attachment Controller', () => {
  let app: Express;
  let adminToken: string;
  let memberToken: string;
  let adminUser: any;
  let memberUser: any;
  let team: any;
  let project: any;
  let task: any;
  
  const mockFile = Buffer.from('test file content');
  const uploadPath = path.join(process.cwd(), 'uploads', 'attachments');

  beforeAll(async () => {
    app = await createTestApp();

    // Create test users
    adminUser = await createUser({ role: 'admin' });
    memberUser = await createUser({ role: 'member' });

    // Create team, project, and task
    team = await createTeam({ created_by: adminUser.id });
    project = await createProject({ 
      team_id: team.id, 
      created_by: adminUser.id 
    });
    task = await createTask({ 
      project_id: project.id,
      reporter_id: adminUser.id
    });

    // Get auth tokens
    adminToken = getAuthToken(adminUser);
    memberToken = getAuthToken(memberUser);

    // Add member to team
    await request(app)
      .post(`/api/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: memberUser.id, role: 'member' });
  });

  beforeEach(() => {
    // Reset file system mocks
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.mkdirSync.mockImplementation();
    mockedFs.unlinkSync.mockImplementation();
    mockedFs.createReadStream.mockReturnValue({
      pipe: jest.fn(),
    } as any);
  });

  describe('POST /api/attachments/tasks/:taskId/upload', () => {
    it('should upload file successfully for team member', async () => {
      const response = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'test.pdf');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('File uploaded successfully');
      expect(response.body.attachment).toHaveProperty('id');
      expect(response.body.attachment).toHaveProperty('original_filename', 'test.pdf');
      expect(response.body.attachment).toHaveProperty('uploader');
      expect(response.body.attachment.uploader.id).toBe(memberUser.id);
    });

    it('should upload file successfully for admin', async () => {
      const response = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', mockFile, 'admin-test.pdf');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('File uploaded successfully');
      expect(response.body.attachment.uploader.id).toBe(adminUser.id);
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No file uploaded');
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .attach('file', mockFile, 'test.pdf');

      expect(response.status).toBe(401);
    });

    it('should reject access to non-existent task', async () => {
      const response = await request(app)
        .post('/api/attachments/tasks/non-existent-task/upload')
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'test.pdf');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found or access denied');
    });

    it('should clean up file if task access denied', async () => {
      // Create a task in a different team
      const otherTeam = await createTeam({ created_by: adminUser.id });
      const otherProject = await createProject({ 
        team_id: otherTeam.id, 
        created_by: adminUser.id 
      });
      const otherTask = await createTask({ 
        project_id: otherProject.id,
        reporter_id: adminUser.id
      });

      const response = await request(app)
        .post(`/api/attachments/tasks/${otherTask.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'test.pdf');

      expect(response.status).toBe(404);
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('GET /api/attachments/tasks/:taskId', () => {
    let attachmentId: string;

    beforeEach(async () => {
      // Upload a test attachment
      const uploadResponse = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'test-list.pdf');
      
      attachmentId = uploadResponse.body.attachment.id;
    });

    it('should get task attachments for team member', async () => {
      const response = await request(app)
        .get(`/api/attachments/tasks/${task.id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.attachments).toBeInstanceOf(Array);
      expect(response.body.attachments.length).toBeGreaterThan(0);
      
      const attachment = response.body.attachments[0];
      expect(attachment).toHaveProperty('id');
      expect(attachment).toHaveProperty('original_filename');
      expect(attachment).toHaveProperty('uploader');
    });

    it('should get task attachments for admin', async () => {
      const response = await request(app)
        .get(`/api/attachments/tasks/${task.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.attachments).toBeInstanceOf(Array);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/attachments/tasks/${task.id}`);

      expect(response.status).toBe(401);
    });

    it('should reject access to non-existent task', async () => {
      const response = await request(app)
        .get('/api/attachments/tasks/non-existent-task')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found or access denied');
    });
  });

  describe('GET /api/attachments/:attachmentId/download', () => {
    let attachmentId: string;

    beforeEach(async () => {
      // Upload a test attachment
      const uploadResponse = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'download-test.pdf');
      
      attachmentId = uploadResponse.body.attachment.id;
    });

    it('should download attachment for team member', async () => {
      const response = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('download-test.pdf');
    });

    it('should download attachment for admin', async () => {
      const response = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/attachments/${attachmentId}/download`);

      expect(response.status).toBe(401);
    });

    it('should reject access to non-existent attachment', async () => {
      const response = await request(app)
        .get('/api/attachments/non-existent-attachment/download')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Attachment not found');
    });

    it('should handle missing file on filesystem', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get(`/api/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('File not found on server');
    });
  });

  describe('DELETE /api/attachments/:attachmentId', () => {
    let attachmentId: string;

    beforeEach(async () => {
      // Upload a test attachment
      const uploadResponse = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'delete-test.pdf');
      
      attachmentId = uploadResponse.body.attachment.id;
    });

    it('should allow uploader to delete their attachment', async () => {
      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Attachment deleted successfully');
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    it('should allow admin to delete any attachment', async () => {
      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Attachment deleted successfully');
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`);

      expect(response.status).toBe(401);
    });

    it('should reject deletion by non-uploader/non-admin', async () => {
      // Create another user who is not the uploader
      const otherUser = await createUser({ role: 'member' });
      const otherToken = getAuthToken(otherUser.id, otherUser.role);

      // Add other user to team
      await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: otherUser.id, role: 'member' });

      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should reject deletion of non-existent attachment', async () => {
      const response = await request(app)
        .delete('/api/attachments/non-existent-attachment')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Attachment not found');
    });

    it('should handle file system cleanup gracefully if file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .delete(`/api/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('File upload validation', () => {
    it('should reject files that are too large', async () => {
      // Mock a large file (>10MB)
      const largeFile = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', largeFile, 'large-file.pdf');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('File too large');
    });

    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post(`/api/attachments/tasks/${task.id}/upload`)
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('file', mockFile, 'test.exe');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not allowed');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to upload endpoint', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const requests = Array.from({ length: 12 }, () =>
        request(app)
          .post(`/api/attachments/tasks/${task.id}/upload`)
          .set('Authorization', `Bearer ${memberToken}`)
          .attach('file', mockFile, 'rate-limit-test.pdf')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});