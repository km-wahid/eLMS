import { create } from 'zustand';
import semesterService from '../services/semesterService';

export const useSemesterStore = create((set) => ({
  semesters: [],
  selectedSemester: null,
  loading: false,
  error: null,

  // Fetch semesters by department
  fetchSemestersByDepartment: async (departmentId) => {
    set({ loading: true, error: null });
    try {
      const response = await semesterService.getSemestersByDepartment(departmentId);
      set({ semesters: response.data.results || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch semesters:', error);
    }
  },

  // Fetch single semester
  fetchSemesterBySlug: async (slug) => {
    set({ loading: true, error: null });
    try {
      const response = await semesterService.getSemesterBySlug(slug);
      set({ selectedSemester: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch semester:', error);
    }
  },

  // Select semester (local state only)
  selectSemester: (semester) => {
    set({ selectedSemester: semester });
  },

  // Create semester
  createSemester: async (data) => {
    try {
      const response = await semesterService.createSemester(data);
      set((state) => ({
        semesters: [...state.semesters, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to create semester:', error);
      throw error;
    }
  },

  // Update semester
  updateSemester: async (id, data) => {
    try {
      const response = await semesterService.updateSemester(id, data);
      set((state) => ({
        semesters: state.semesters.map((s) => (s.id === id ? response.data : s)),
        selectedSemester:
          state.selectedSemester?.id === id ? response.data : state.selectedSemester,
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update semester:', error);
      throw error;
    }
  },

  // Delete semester
  deleteSemester: async (id) => {
    try {
      await semesterService.deleteSemester(id);
      set((state) => ({
        semesters: state.semesters.filter((s) => s.id !== id),
        selectedSemester: state.selectedSemester?.id === id ? null : state.selectedSemester,
      }));
    } catch (error) {
      console.error('Failed to delete semester:', error);
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
