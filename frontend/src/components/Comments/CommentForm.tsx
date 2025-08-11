import React, { useState } from 'react';
import { User } from '../../types';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  currentUser: User | null;
  isLoading?: boolean;
  compact?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = 'Add a comment...',
  currentUser,
  isLoading = false,
  compact = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {currentUser.avatar_url ? (
            <img
              className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} rounded-full`}
              src={currentUser.avatar_url}
              alt={`${currentUser.first_name} ${currentUser.last_name}`}
            />
          ) : (
            <div className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} rounded-full bg-indigo-500 flex items-center justify-center`}>
              <span className={`${compact ? 'text-xs' : 'text-xs'} font-medium text-white`}>
                {getInitials(currentUser.first_name, currentUser.last_name)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm resize-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                compact ? 'text-sm' : ''
              }`}
              rows={compact ? 2 : 3}
              disabled={isSubmitting || isLoading}
            />
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Press <kbd className="font-mono text-gray-600 dark:text-gray-300">Cmd+Enter</kbd> to submit
            </div>
            
            <div className="flex space-x-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting || isLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting || isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;