import api from './api';

const courseService = {
  // Categories
  getCategories: () => api.get('/courses/categories/'),

  // Courses
  getCourses: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.level) query.append('level', params.level);
    if (params.category) query.append('category', params.category);
    return api.get(`/courses/?${query.toString()}`);
  },

  getCourseBySlug: (slug) => api.get(`/courses/${slug}/`),

  getTeacherCourses: () => api.get('/courses/mine/'),

  createCourse: (data) =>
    api.post('/courses/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCourse: (slug, data) =>
    api.patch(`/courses/${slug}/update/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteCourse: (slug) => api.delete(`/courses/${slug}/delete/`),

  // Enrollments
  enrollInCourse: (slug) => api.post(`/courses/${slug}/enroll/`),

  unenrollFromCourse: (slug) => api.delete(`/courses/${slug}/enroll/`),

  getMyEnrollments: () => api.get('/courses/enrollments/mine/'),

  // Modules
  getModules: (slug) => api.get(`/courses/${slug}/modules/`),

  createModule: (slug, data) => api.post(`/courses/${slug}/modules/`, data),

  updateModule: (slug, moduleId, data) =>
    api.patch(`/courses/${slug}/modules/${moduleId}/`, data),

  deleteModule: (slug, moduleId) =>
    api.delete(`/courses/${slug}/modules/${moduleId}/`),
};

export default courseService;
