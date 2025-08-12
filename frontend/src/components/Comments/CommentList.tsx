import React, { useEffect } from 'react';
import { useCommentStore } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CommentListProps {
  taskId: string;
}

const CommentList: React.FC<CommentListProps> = ({ taskId }) => {
  const { user } = useAuthStore();
  const { 
    comments, 
    isLoading, 
    error, 
    fetchComments, 
    addComment, 
    clearComments,
    clearError 
  } = useCommentStore();

  useEffect(() => {
    fetchComments(taskId);
    
    return () => {
      clearComments();
    };
  }, [taskId, fetchComments, clearComments]);

  const handleAddComment = async (content: string) => {
    try {
      await addComment(taskId, content);
    } catch (error) {
      // Error is handled in store
    }
  };

  const handleAddReply = async (content: string, parentCommentId: string) => {
    try {
      await addComment(taskId, content, parentCommentId);
    } catch (error) {
      // Error is handled in store
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Comments ({comments.length})
        </h3>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            <div className="flex">
              <div className="flex-1">
                {error}
              </div>
              <button
                onClick={clearError}
                className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          </div>
        )}

        <CommentForm
          onSubmit={handleAddComment}
          placeholder="Add a comment..."
          currentUser={user}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to add a comment</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              onReply={handleAddReply}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentList;