import { create } from 'zustand';
import bookmarkService from '../services/bookmarkService';

export const useBookmarkStore = create((set) => ({
  bookmarks: [],
  loading: false,
  error: null,

  // Fetch all bookmarks
  fetchBookmarks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await bookmarkService.getBookmarks();
      set({ bookmarks: response.data.results || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch bookmarks:', error);
    }
  },

  // Add bookmark (handles both lecture and material)
  addBookmark: async (lectureId = null, materialId = null) => {
    try {
      let response;
      if (lectureId) {
        response = await bookmarkService.bookmarkLecture(lectureId);
      } else if (materialId) {
        response = await bookmarkService.bookmarkMaterial(materialId);
      }
      set((state) => ({
        bookmarks: [...state.bookmarks, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      throw error;
    }
  },

  // Remove bookmark
  removeBookmark: async (bookmarkId) => {
    try {
      await bookmarkService.removeBookmark(bookmarkId);
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
      }));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  },

  // Check if lecture is bookmarked
  isLectureBookmarked: (lectureId, bookmarks) => {
    return bookmarks?.some((b) => b.lecture === lectureId) || false;
  },

  // Check if material is bookmarked
  isMaterialBookmarked: (materialId, bookmarks) => {
    return bookmarks?.some((b) => b.material === materialId) || false;
  },

  // Get bookmark ID for lecture
  getLectureBookmarkId: (lectureId, bookmarks) => {
    return bookmarks?.find((b) => b.lecture === lectureId)?.id;
  },

  // Get bookmark ID for material
  getMaterialBookmarkId: (materialId, bookmarks) => {
    return bookmarks?.find((b) => b.material === materialId)?.id;
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
