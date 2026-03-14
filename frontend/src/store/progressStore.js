import { create } from 'zustand';
import progressService from '../services/progressService';

export const useProgressStore = create((set) => ({
  progress: [],
  loading: false,
  error: null,

  // Fetch user's progress
  fetchProgress: async () => {
    set({ loading: true, error: null });
    try {
      const response = await progressService.getProgress();
      set({ progress: response.data.results || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch progress:', error);
    }
  },

  // Track lecture view
  trackLectureView: async (lectureId, watchDurationSeconds = 0) => {
    try {
      const response = await progressService.trackLectureView(
        lectureId,
        watchDurationSeconds
      );
      set((state) => ({
        progress: [...state.progress, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to track lecture view:', error);
      // Don't throw - this is a non-critical operation
    }
  },

  // Track material download
  trackMaterialDownload: async (materialId) => {
    try {
      const response = await progressService.trackMaterialDownload(materialId);
      set((state) => ({
        progress: [...state.progress, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to track material download:', error);
    }
  },

  // Track material view
  trackMaterialView: async (materialId) => {
    try {
      const response = await progressService.trackMaterialView(materialId);
      set((state) => ({
        progress: [...state.progress, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to track material view:', error);
    }
  },

  // Get lecture count
  getLectureCount: (courseId, progress) => {
    return progress?.filter((p) => p.lecture && p.action === 'lecture_watched').length || 0;
  },

  // Get materials count
  getMaterialCount: (courseId, progress) => {
    return progress?.filter(
      (p) =>
        p.material &&
        (p.action === 'material_downloaded' || p.action === 'material_viewed')
    ).length || 0;
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
