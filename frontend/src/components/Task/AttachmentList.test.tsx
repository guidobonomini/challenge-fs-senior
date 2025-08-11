import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import AttachmentList from './AttachmentList';
import { attachmentService } from '../../services/attachmentService';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socket';

jest.mock('../../services/attachmentService');
jest.mock('../../store/authStore');
jest.mock('../../services/socket');
jest.mock('react-hot-toast');

const mockedAttachmentService = attachmentService as jest.Mocked<typeof attachmentService>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockedSocketService = socketService as jest.Mocked<typeof socketService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

// Mock window methods
Object.assign(window, {
  URL: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn(),
  },
  confirm: jest.fn(),
});

// Mock document methods
Object.assign(document, {
  createElement: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
    remove: jest.fn(),
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
});

describe('AttachmentList', () => {
  const mockUser = {
    id: 'user-1',
    role: 'member' as const,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    avatar_url: null,
  };

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
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      avatar_url: null,
    },
  };

  const mockProps = {
    taskId: 'task-1',
    refreshTrigger: 0,
  };

  beforeEach(() => {
    mockedUseAuthStore.mockReturnValue({ user: mockUser } as any);
    mockedAttachmentService.getTaskAttachments.mockClear();
    mockedAttachmentService.downloadAttachment.mockClear();
    mockedAttachmentService.deleteAttachment.mockClear();
    mockedAttachmentService.getFileIcon.mockReturnValue('📄');
    mockedAttachmentService.formatFileSize.mockReturnValue('1 KB');
    mockedSocketService.onAttachmentUploaded.mockClear();
    mockedSocketService.onAttachmentDeleted.mockClear();
    mockedSocketService.off.mockClear();
    mockedToast.success.mockClear();
    mockedToast.error.mockClear();
    (window.confirm as jest.Mock).mockClear();
  });

  it('should render loading state initially', () => {
    mockedAttachmentService.getTaskAttachments.mockReturnValue(new Promise(() => {}));

    render(<AttachmentList {...mockProps} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty state when no attachments', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({ attachments: [] });

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('No attachments yet')).toBeInTheDocument();
    });
  });

  it('should render attachment list correctly', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [mockAttachment],
    });

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
      expect(screen.getByText('Uploaded by Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2022')).toBeInTheDocument();
    });
  });

  it('should handle file download', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [mockAttachment],
    });
    
    const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
    mockedAttachmentService.downloadAttachment.mockResolvedValue(mockBlob);

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    const downloadButton = screen.getByTitle('Download');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockedAttachmentService.downloadAttachment).toHaveBeenCalledWith('attachment-1');
    });

    // Check that URL.createObjectURL was called
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('should handle download error', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [mockAttachment],
    });
    
    mockedAttachmentService.downloadAttachment.mockRejectedValue({
      response: { data: { message: 'Download failed' } },
    });

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    const downloadButton = screen.getByTitle('Download');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Download failed');
    });
  });

  it('should handle file deletion for uploader', async () => {
    const myAttachment = { ...mockAttachment, uploader: { ...mockUser } };
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [myAttachment],
    });
    
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockedAttachmentService.deleteAttachment.mockResolvedValue();

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "test-file.pdf"?'
    );

    await waitFor(() => {
      expect(mockedAttachmentService.deleteAttachment).toHaveBeenCalledWith('attachment-1');
      expect(mockedToast.success).toHaveBeenCalledWith('Attachment deleted successfully');
    });
  });

  it('should handle file deletion for admin', async () => {
    mockedUseAuthStore.mockReturnValue({ user: { ...mockUser, role: 'admin' } } as any);
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [mockAttachment],
    });
    
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockedAttachmentService.deleteAttachment.mockResolvedValue();

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedAttachmentService.deleteAttachment).toHaveBeenCalledWith('attachment-1');
    });
  });

  it('should not show delete button for non-uploader/non-admin', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [mockAttachment],
    });

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('should cancel deletion when user cancels confirm', async () => {
    const myAttachment = { ...mockAttachment, uploader: { ...mockUser } };
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [myAttachment],
    });
    
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(mockedAttachmentService.deleteAttachment).not.toHaveBeenCalled();
  });

  it('should handle delete error', async () => {
    const myAttachment = { ...mockAttachment, uploader: { ...mockUser } };
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [myAttachment],
    });
    
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockedAttachmentService.deleteAttachment.mockRejectedValue({
      response: { data: { message: 'Delete failed' } },
    });

    render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Delete failed');
    });
  });

  it('should refresh attachments when refreshTrigger changes', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [mockAttachment],
    });

    const { rerender } = render(<AttachmentList {...mockProps} />);

    await waitFor(() => {
      expect(mockedAttachmentService.getTaskAttachments).toHaveBeenCalledTimes(1);
    });

    rerender(<AttachmentList {...mockProps} refreshTrigger={1} />);

    await waitFor(() => {
      expect(mockedAttachmentService.getTaskAttachments).toHaveBeenCalledTimes(2);
    });
  });

  it('should set up socket listeners on mount', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [],
    });

    render(<AttachmentList {...mockProps} />);

    expect(mockedSocketService.onAttachmentUploaded).toHaveBeenCalled();
    expect(mockedSocketService.onAttachmentDeleted).toHaveBeenCalled();
  });

  it('should cleanup socket listeners on unmount', async () => {
    mockedAttachmentService.getTaskAttachments.mockResolvedValue({
      attachments: [],
    });

    const { unmount } = render(<AttachmentList {...mockProps} />);

    unmount();

    expect(mockedSocketService.off).toHaveBeenCalledWith('attachment_uploaded', expect.any(Function));
    expect(mockedSocketService.off).toHaveBeenCalledWith('attachment_deleted', expect.any(Function));
  });
});