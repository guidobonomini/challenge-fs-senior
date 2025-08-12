import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { attachmentService } from '../../services/attachmentService';

interface AttachmentUploadProps {
  taskId: string;
  onUploadComplete: () => void;
  disabled?: boolean;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  taskId,
  onUploadComplete,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Please upload images, documents, or archives.`;
    }
    
    if (file.size > maxFileSize) {
      return `File size exceeds 10MB limit. Current size: ${attachmentService.formatFileSize(file.size)}`;
    }
    
    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);

    try {
      const response = await attachmentService.uploadTaskAttachment(taskId, file);
      toast.success(`File "${file.name}" uploaded successfully`);
      onUploadComplete();
      setUploading(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
      
      // clearData may not be available in all environments (like tests)
      if (e.dataTransfer.clearData) {
        e.dataTransfer.clearData();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file);
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept={allowedTypes.join(',')}
        disabled={disabled || uploading}
      />

      {/* Drag and drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={!disabled && !uploading ? openFileDialog : undefined}
      >
        <div className="space-y-3">
          <div className="text-4xl">
            {uploading ? '⏳' : '📎'}
          </div>
          
          {uploading ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Images, PDFs, Documents, Archives (Max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload button */}
      <button
        onClick={openFileDialog}
        disabled={disabled || uploading}
        className={`
          w-full px-4 py-2 text-sm font-medium rounded-md
          ${disabled || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }
        `}
      >
        {uploading ? 'Uploading...' : '📎 Choose File'}
      </button>
    </div>
  );
};

export default AttachmentUpload;