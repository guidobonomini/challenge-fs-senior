import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { attachmentService, Attachment } from '../../services/attachmentService';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socket';

interface AttachmentListProps {
  taskId: string;
  refreshTrigger: number;
}

const AttachmentList: React.FC<AttachmentListProps> = ({ taskId, refreshTrigger }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchAttachments();
  }, [taskId, refreshTrigger]);

  useEffect(() => {
    // Listen for attachment upload notifications
    const handleAttachmentUploaded = (data: { attachment_id: string; task_id: string; task_title: string; project_name: string; uploaded_by: any; attachment: any }) => {
      if (data.task_id === taskId) {
        // Add the new attachment to the list
        setAttachments(prev => [data.attachment, ...prev]);
        
        // Show notification if uploaded by someone else
        if (user && data.uploaded_by.id !== user.id) {
          toast.success(
            `${data.uploaded_by.first_name} ${data.uploaded_by.last_name} uploaded "${data.attachment.original_filename}"`,
            { duration: 4000, position: 'bottom-right', icon: '📎' }
          );
        }
      }
    };

    // Listen for attachment deletion notifications
    const handleAttachmentDeleted = (data: { attachment_id: string; task_id: string; deleted_by: string }) => {
      if (data.task_id === taskId) {
        // Remove the attachment from the list
        setAttachments(prev => prev.filter(a => a.id !== data.attachment_id));
        
        // Show notification if deleted by someone else
        if (user && data.deleted_by !== user.id) {
          toast.success(
            'An attachment was deleted',
            { duration: 3000, position: 'bottom-right', icon: '🗑️' }
          );
        }
      }
    };

    socketService.onAttachmentUploaded(handleAttachmentUploaded);
    socketService.onAttachmentDeleted(handleAttachmentDeleted);

    return () => {
      socketService.off('attachment_uploaded', handleAttachmentUploaded);
      socketService.off('attachment_deleted', handleAttachmentDeleted);
    };
  }, [taskId, user]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const result = await attachmentService.getTaskAttachments(taskId);
      setAttachments(result.attachments);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load attachments';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await attachmentService.downloadAttachment(attachment.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.original_filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to download file';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!window.confirm(`Are you sure you want to delete "${attachment.original_filename}"?`)) {
      return;
    }

    try {
      setDeletingId(attachment.id);
      await attachmentService.deleteAttachment(attachment.id);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast.success('Attachment deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete attachment';
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteAttachment = (attachment: Attachment): boolean => {
    if (!user) return false;
    
    // Admin or uploader can delete
    if (user.role === 'admin' || attachment.uploader.id === user.id) {
      return true;
    }
    
    // Team managers can delete (this would require additional API call to check)
    // For now, just allow admin and uploader
    return false;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📎</div>
        <p className="text-sm">No attachments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {/* File icon */}
          <div className="text-2xl flex-shrink-0">
            {attachmentService.getFileIcon(attachment.mime_type)}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.original_filename}
              </p>
              <span className="text-xs text-gray-500">
                {attachmentService.formatFileSize(attachment.file_size)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>
                Uploaded by {attachment.uploader.first_name} {attachment.uploader.last_name}
              </span>
              <span>•</span>
              <span>
                {format(new Date(attachment.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Download button */}
            <button
              onClick={() => handleDownload(attachment)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Delete button */}
            {canDeleteAttachment(attachment) && (
              <button
                onClick={() => handleDelete(attachment)}
                disabled={deletingId === attachment.id}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === attachment.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttachmentList;