import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import AttachmentUpload from './AttachmentUpload';
import { attachmentService } from '../../services/attachmentService';

jest.mock('../../services/attachmentService');
jest.mock('react-hot-toast');

const mockedAttachmentService = attachmentService as jest.Mocked<typeof attachmentService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('AttachmentUpload', () => {
  const mockProps = {
    taskId: 'task-1',
    onUploadComplete: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    mockedAttachmentService.uploadTaskAttachment.mockClear();
    mockedToast.success.mockClear();
    mockedToast.error.mockClear();
    mockProps.onUploadComplete.mockClear();
  });

  it('should render upload area correctly', () => {
    render(<AttachmentUpload {...mockProps} />);

    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('Images, PDFs, Documents, Archives (Max 10MB)')).toBeInTheDocument();
    expect(screen.getByText('📎 Choose File')).toBeInTheDocument();
  });

  it('should handle file selection and upload', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockResponse = {
      message: 'File uploaded successfully',
      attachment: {
        id: 'attachment-1',
        task_id: 'task-1',
        filename: 'test-123.pdf',
        original_filename: 'test.pdf',
        mime_type: 'application/pdf',
        file_size: 12,
        file_url: 'http://localhost:8000/uploads/test-123.pdf',
        created_at: '2023-01-01T00:00:00Z',
        uploader: {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          avatar_url: null,
        },
      },
    };

    mockedAttachmentService.uploadTaskAttachment.mockResolvedValue(mockResponse);

    render(<AttachmentUpload {...mockProps} />);

    const fileInput = screen.getByRole('button', { name: /choose file/i });
    
    // Create a proper file input change event
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockedAttachmentService.uploadTaskAttachment).toHaveBeenCalledWith('task-1', mockFile);
    });

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith('File "test.pdf" uploaded successfully');
      expect(mockProps.onUploadComplete).toHaveBeenCalled();
    });
  });

  it('should handle drag and drop upload', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockResponse = {
      message: 'File uploaded successfully',
      attachment: {
        id: 'attachment-1',
        task_id: 'task-1',
        filename: 'test-123.pdf',
        original_filename: 'test.pdf',
        mime_type: 'application/pdf',
        file_size: 12,
        file_url: 'http://localhost:8000/uploads/test-123.pdf',
        created_at: '2023-01-01T00:00:00Z',
        uploader: {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          avatar_url: null,
        },
      },
    };

    mockedAttachmentService.uploadTaskAttachment.mockResolvedValue(mockResponse);

    render(<AttachmentUpload {...mockProps} />);

    const dropZone = screen.getByText('Click to upload').closest('div')?.parentElement;

    // Simulate drop (testing the actual functionality, not the visual state)
    fireEvent.drop(dropZone!, { dataTransfer: { files: [mockFile] } });

    await waitFor(() => {
      expect(mockedAttachmentService.uploadTaskAttachment).toHaveBeenCalledWith('task-1', mockFile);
    });

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith('File "test.pdf" uploaded successfully');
      expect(mockProps.onUploadComplete).toHaveBeenCalled();
    });
  });

  it('should validate file type', async () => {
    const mockFile = new File(['test content'], 'test.exe', { type: 'application/x-executable' });

    mockedAttachmentService.formatFileSize = jest.fn().mockReturnValue('1 KB');

    render(<AttachmentUpload {...mockProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        'File type application/x-executable is not allowed. Please upload images, documents, or archives.'
      );
    });

    expect(mockedAttachmentService.uploadTaskAttachment).not.toHaveBeenCalled();
    expect(mockProps.onUploadComplete).not.toHaveBeenCalled();
  });

  it('should validate file size', async () => {
    // Create a file that simulates being larger than 10MB
    const mockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    
    mockedAttachmentService.formatFileSize = jest.fn().mockReturnValue('11 MB');

    render(<AttachmentUpload {...mockProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        'File size exceeds 10MB limit. Current size: 11 MB'
      );
    });

    expect(mockedAttachmentService.uploadTaskAttachment).not.toHaveBeenCalled();
    expect(mockProps.onUploadComplete).not.toHaveBeenCalled();
  });

  it('should handle upload errors', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const mockError = {
      response: {
        data: {
          message: 'Upload failed',
        },
      },
    };

    mockedAttachmentService.uploadTaskAttachment.mockRejectedValue(mockError);

    render(<AttachmentUpload {...mockProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Upload failed');
    });

    expect(mockProps.onUploadComplete).not.toHaveBeenCalled();
  });

  it('should disable upload when disabled prop is true', () => {
    render(<AttachmentUpload {...mockProps} disabled={true} />);

    const button = screen.getByRole('button', { name: /choose file/i });

    // Test that button is disabled - the main functional requirement
    expect(button).toBeDisabled();
  });

  it('should show uploading state', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Make the upload hang so we can check loading state
    let resolveUpload: (value: any) => void;
    const uploadPromise = new Promise<any>(resolve => {
      resolveUpload = resolve;
    });
    
    mockedAttachmentService.uploadTaskAttachment.mockReturnValue(uploadPromise);

    render(<AttachmentUpload {...mockProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    // Should show uploading state
    await waitFor(() => {
      expect(screen.getByText('Uploading file...')).toBeInTheDocument();
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    // Resolve the upload
    resolveUpload!({
      message: 'Success',
      attachment: { id: 'attachment-1', original_filename: 'test.pdf' },
    });

    // Should return to normal state
    await waitFor(() => {
      expect(screen.queryByText('Uploading file...')).not.toBeInTheDocument();
      expect(screen.getByText('📎 Choose File')).toBeInTheDocument();
    });
  });
});