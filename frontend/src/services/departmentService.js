import api from './api';

const departmentService = {
  // Get all departments
  getDepartments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    return api.get(`/academics/departments/?${query.toString()}`);
  },

  // Get department by slug
  getDepartmentBySlug: (slug) => api.get(`/academics/departments/${slug}/`),

  // Get semesters by department
  getSemestersByDepartment: (departmentId) =>
    api.get(`/academics/semesters/?department=${departmentId}`),

  // Create department (admin only)
  createDepartment: (data) =>
    api.post('/academics/departments/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Update department (admin only)
  updateDepartment: (id, data) =>
    api.patch(`/academics/departments/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Delete department (admin only)
  deleteDepartment: (id) => api.delete(`/academics/departments/${id}/`),
};

export default departmentService;
