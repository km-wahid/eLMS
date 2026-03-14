import { create } from 'zustand';
import analyticsService from '../services/analyticsService';

export const useAnalyticsStore = create((set) => ({
  courseAnalytics: null,
  allAnalytics: [],
  loading: false,
  error: null,

  // Fetch course analytics
  fetchCourseAnalytics: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const response = await analyticsService.getCourseAnalytics(courseId);
      set({ courseAnalytics: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch course analytics:', error);
    }
  },

  // Fetch all analytics (admin only)
  fetchAllAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await analyticsService.getAllAnalytics();
      set({ allAnalytics: response.data.results || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch all analytics:', error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
