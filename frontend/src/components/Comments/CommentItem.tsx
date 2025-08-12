import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useCommentStore, Comment } from '../../store/commentStore';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  taskId: string;
  onReply: (content: string, parentCommentId: string) => Promise<void>;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  taskId, 
  onReply, 
  isReply = false 
}) => {
  const { user } = useAuthStore();
  const { updateComment, deleteComment } = useCommentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const canEdit = user?.id === comment.user.id;
  const canDelete = user?.id === comment.user.id; // Could also allow team admins

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      setEditContent(comment.content);
      return;
    }

    setIsLoading(true);
    try {
      await updateComment(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      // Error handled in store
      setEditContent(comment.content); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteComment(comment.id);
    } catch (error) {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (content: string) => {
    setIsLoading(true);
    try {
      await onReply(content, comment.id);
      setIsReplying(false);
    } catch (error) {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className={`${isReply ? 'ml-12 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {comment.user.avatar_url ? (
            <img
              className="h-8 w-8 rounded-full"
              src={comment.user.avatar_url}
              alt={`${comment.user.first_name} ${comment.user.last_name}`}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {getInitials(comment.user.first_name, comment.user.last_name)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {comment.user.first_name} {comment.user.last_name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              {comment.is_edited && (
                <span className="ml-1 text-xs">(edited)</span>
              )}
            </span>
          </div>

          <div className="mt-1">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm resize-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  disabled={isLoading}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    disabled={isLoading || !editContent.trim()}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {comment.content}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              {!isReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Reply
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
                currentUser={user}
                isLoading={isLoading}
                compact
              />
            </div>
          )}

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  taskId={taskId}
                  onReply={onReply}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;