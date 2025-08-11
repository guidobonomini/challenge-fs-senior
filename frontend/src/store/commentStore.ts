import { create } from 'zustand';
import { apiService } from '../services/api';

export interface Comment {
  id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface CommentResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchComments: (taskId: string, page?: number) => Promise<void>;
  addComment: (taskId: string, content: string, parentCommentId?: string) => Promise<Comment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  clearComments: () => void;
  clearError: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,

  fetchComments: async (taskId: string, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.get<CommentResponse>(`/comments/tasks/${taskId}`, {
        page,
        limit: 20,
      });
      
      if (page === 1) {
        set({ comments: response.comments, isLoading: false });
      } else {
        // Append for pagination
        const currentComments = get().comments;
        set({ comments: [...currentComments, ...response.comments], isLoading: false });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch comments';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addComment: async (taskId: string, content: string, parentCommentId?: string) => {
    try {
      const response = await apiService.post<{ comment: Comment }>(`/comments/tasks/${taskId}`, {
        content,
        parent_comment_id: parentCommentId,
      });

      const newComment = response.comment;
      const currentComments = get().comments;

      if (parentCommentId) {
        // Add as reply to existing comment
        const updatedComments = currentComments.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        });
        set({ comments: updatedComments });
      } else {
        // Add as new comment
        set({ comments: [newComment, ...currentComments] });
      }

      return newComment;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add comment';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateComment: async (commentId: string, content: string) => {
    try {
      await apiService.put(`/comments/${commentId}`, { content });

      const currentComments = get().comments;
      const updatedComments = currentComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content,
            is_edited: true,
            updated_at: new Date().toISOString(),
          };
        }
        // Check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                content,
                is_edited: true,
                updated_at: new Date().toISOString(),
              };
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      });

      set({ comments: updatedComments });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update comment';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      await apiService.delete(`/comments/${commentId}`);

      const currentComments = get().comments;
      const updatedComments = currentComments
        .filter(comment => comment.id !== commentId)
        .map(comment => {
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== commentId),
            };
          }
          return comment;
        });

      set({ comments: updatedComments });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete comment';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearComments: () => {
    set({ comments: [], error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));