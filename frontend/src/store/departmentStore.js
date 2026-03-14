import { create } from 'zustand';
import departmentService from '../services/departmentService';

export const useDepartmentStore = create((set) => ({
  departments: [],
  selectedDepartment: null,
  loading: false,
  error: null,

  // Fetch all departments
  fetchDepartments: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await departmentService.getDepartments(params);
      set({ departments: response.data.results || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch departments:', error);
    }
  },

  // Fetch single department
  fetchDepartmentBySlug: async (slug) => {
    set({ loading: true, error: null });
    try {
      const response = await departmentService.getDepartmentBySlug(slug);
      set({ selectedDepartment: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch department:', error);
    }
  },

  // Select department (local state only)
  selectDepartment: (department) => {
    set({ selectedDepartment: department });
  },

  // Create department
  createDepartment: async (data) => {
    try {
      const response = await departmentService.createDepartment(data);
      set((state) => ({
        departments: [...state.departments, response.data],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to create department:', error);
      throw error;
    }
  },

  // Update department
  updateDepartment: async (id, data) => {
    try {
      const response = await departmentService.updateDepartment(id, data);
      set((state) => ({
        departments: state.departments.map((d) => (d.id === id ? response.data : d)),
        selectedDepartment:
          state.selectedDepartment?.id === id ? response.data : state.selectedDepartment,
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update department:', error);
      throw error;
    }
  },

  // Delete department
  deleteDepartment: async (id) => {
    try {
      await departmentService.deleteDepartment(id);
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id),
        selectedDepartment: state.selectedDepartment?.id === id ? null : state.selectedDepartment,
      }));
    } catch (error) {
      console.error('Failed to delete department:', error);
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
