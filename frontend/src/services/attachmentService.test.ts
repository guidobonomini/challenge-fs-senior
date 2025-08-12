import axios from 'axios';
import { attachmentService } from './attachmentService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AttachmentService', () => {
  const mockAttachment = {
    id: 'attachment-1',
    task_id: 'task-1',
    filename: 'test-file.pdf',
    original_filename: 'test-file.pdf',
    mime_type: 'application/pdf',
    file_size: 1024,
    file_url: '/api/attachments/attachment-1/download',
    created_at: '2022-01-01T00:00:00Z',
    uploader: {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      avatar_url: null,
    },
  };

  beforeEach(() => {
    mockedAxios.post.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
  });

  describe('uploadTaskAttachment', () => {
    it('should upload a file successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        data: {
          message: 'File uploaded successfully',
          attachment: mockAttachment,
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await attachmentService.uploadTaskAttachment('task-1', mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/attachments/tasks/task-1/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockError = {
        response: {
          data: {
            message: 'File too large',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        attachmentService.uploadTaskAttachment('task-1', mockFile)
      ).rejects.toEqual(mockError);
    });
  });

  describe('getTaskAttachments', () => {
    it('should fetch task attachments', async () => {
      const mockResponse = {
        data: {
          attachments: [mockAttachment],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await attachmentService.getTaskAttachments('task-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/attachments/tasks/task-1'
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment as blob', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      const mockResponse = {
        data: mockBlob,
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await attachmentService.downloadAttachment('attachment-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/attachments/attachment-1/download',
        {
          responseType: 'blob',
        }
      );

      expect(result).toEqual(mockBlob);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment', async () => {
      mockedAxios.delete.mockResolvedValue({ data: {} });

      await attachmentService.deleteAttachment('attachment-1');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:8000/api/attachments/attachment-1'
      );
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(attachmentService.formatFileSize(0)).toBe('0 Bytes');
      expect(attachmentService.formatFileSize(1024)).toBe('1 KB');
      expect(attachmentService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(attachmentService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(attachmentService.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('getFileIcon', () => {
    it('should return correct icons for different file types', () => {
      expect(attachmentService.getFileIcon('image/png')).toBe('🖼️');
      expect(attachmentService.getFileIcon('image/jpeg')).toBe('🖼️');
      expect(attachmentService.getFileIcon('application/pdf')).toBe('📄');
      expect(attachmentService.getFileIcon('application/msword')).toBe('📝');
      expect(attachmentService.getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('📝');
      expect(attachmentService.getFileIcon('application/vnd.ms-excel')).toBe('📊');
      expect(attachmentService.getFileIcon('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('📊');
      expect(attachmentService.getFileIcon('application/vnd.ms-powerpoint')).toBe('📱');
      expect(attachmentService.getFileIcon('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('📱');
      expect(attachmentService.getFileIcon('application/zip')).toBe('🗜️');
      expect(attachmentService.getFileIcon('application/x-zip-compressed')).toBe('🗜️');
      expect(attachmentService.getFileIcon('text/plain')).toBe('📄');
      expect(attachmentService.getFileIcon('text/csv')).toBe('📋');
      expect(attachmentService.getFileIcon('application/unknown')).toBe('📎');
    });
  });
});