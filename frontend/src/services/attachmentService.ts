import axios from 'axios';

export interface Attachment {
  id: string;
  task_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  uploader: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface AttachmentUploadResponse {
  message: string;
  attachment: Attachment;
}

export interface AttachmentListResponse {
  attachments: Attachment[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const attachmentService = {
  async uploadTaskAttachment(taskId: string, file: File): Promise<AttachmentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE_URL}/attachments/tasks/${taskId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  async getTaskAttachments(taskId: string): Promise<AttachmentListResponse> {
    const response = await axios.get(`${API_BASE_URL}/attachments/tasks/${taskId}`);
    return response.data;
  },

  async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/attachments/${attachmentId}/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/attachments/${attachmentId}`);
  },

  // Utility function to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Utility function to get file icon based on mime type
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📱';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
    if (mimeType === 'text/plain') return '📄';
    if (mimeType === 'text/csv') return '📋';
    return '📎';
  },
};