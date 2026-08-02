import { create } from 'zustand';
import analyticsService from '../services/analyticsService';

export const useAnalyticsStore = create((set, get) => ({
  courseAnalytics: {}, // Changed to object with courseId as keys
  allAnalytics: [],
  loading: false,
  error: null,

  // Fetch course analytics
  fetchCourseAnalytics: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const response = await analyticsService.getCourseAnalytics(courseId);
      // Store analytics with courseId as key for easy lookup
      set(state => ({
        courseAnalytics: {
          ...state.courseAnalytics,
          [courseId]: response.data
        },
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch course analytics:', error);
      throw error;
    }
  },

  // Fetch all analytics (admin only)
  fetchAllAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await analyticsService.getAllAnalytics();
      const analytics = response.data.results || response.data;
      set({ allAnalytics: analytics, loading: false });
      
      // Also store in courseAnalytics for quick access
      const analyticsMap = {};
      analytics.forEach(item => {
        if (item.course) {
          analyticsMap[item.course.id || item.course] = item;
        }
      });
      set(state => ({
        courseAnalytics: { ...state.courseAnalytics, ...analyticsMap }
      }));
      
      return analytics;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch all analytics:', error);
      throw error;
    }
  },

  // Get analytics for a specific course from cache
  getCourseAnalytics: (courseId) => {
    return get().courseAnalytics[courseId] || null;
  },

  // Clear error
  clearError: () => set({ error: null }),
  
  // Reset store
  reset: () => set({ courseAnalytics: {}, allAnalytics: [], loading: false, error: null }),
}));
