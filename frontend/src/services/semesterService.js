import api from './api';

const semesterService = {
  // Get semester by slug
  getSemesterBySlug: (slug) => api.get(`/academics/semesters/${slug}/`),

  // Get semesters by department
  getSemestersByDepartment: (departmentId) =>
    api.get(`/academics/semesters/?department=${departmentId}`),

  // Get courses in a semester
  getCoursesBySemester: (semesterId) =>
    api.get(`/academics/semesters/${semesterId}/courses/`),

  // Create semester (admin only)
  createSemester: (data) => api.post('/academics/semesters/', data),

  // Update semester (admin only)
  updateSemester: (id, data) => api.patch(`/academics/semesters/${id}/`, data),

  // Delete semester (admin only)
  deleteSemester: (id) => api.delete(`/academics/semesters/${id}/`),
};

export default semesterService;
