import { create } from 'zustand';
import commentService from '../services/commentService';

export const useCommentStore = create((set) => ({
  comments: [],
  loading: false,
  error: null,

  // Fetch comments for a lecture
  fetchCommentsByLecture: async (lectureId) => {
    set({ loading: true, error: null });
    try {
      const response = await commentService.getCommentsByLecture(lectureId);
      set({ comments: response.data.results || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch comments:', error);
    }
  },

  // Post a comment
  postComment: async (lectureId, content, parentId = null) => {
    try {
      const response = await commentService.postComment(lectureId, content, parentId);
      set((state) => ({
        comments: parentId 
          ? state.comments.map((c) =>
              c.id === parentId ? { ...c, replies: [...(c.replies || []), response.data] } : c
            )
          : [response.data, ...state.comments],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to post comment:', error);
      throw error;
    }
  },

  // Upvote a comment
  upvoteComment: async (commentId) => {
    try {
      const response = await commentService.upvoteComment(commentId);
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, upvotes: response.data.upvotes } : c
        ),
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to upvote comment:', error);
      throw error;
    }
  },

  // Pin a comment
  pinComment: async (commentId) => {
    try {
      const response = await commentService.pinComment(commentId);
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, pinned: response.data.pinned } : c
        ),
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to pin comment:', error);
      throw error;
    }
  },

  // Resolve a comment
  resolveComment: async (commentId) => {
    try {
      const response = await commentService.resolveComment(commentId);
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, is_resolved: response.data.is_resolved } : c
        ),
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to resolve comment:', error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
      }));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
