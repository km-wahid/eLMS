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
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    return api.get(`/courses/courses/?${query.toString()}`);
  },

  getCourseBySlug: (slug) => api.get(`/courses/courses/${slug}/`),

  getTeacherCourses: () => api.get('/courses/courses/mine/'),

  createCourse: (data) =>
    api.post('/courses/courses/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCourse: (slug, data) =>
    api.patch(`/courses/courses/${slug}/update/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteCourse: (slug) => api.delete(`/courses/courses/${slug}/delete/`),

  // Enrollments
  enrollInCourse: (slug) => api.post(`/courses/courses/${slug}/enroll/`),

  unenrollFromCourse: (slug) => api.delete(`/courses/courses/${slug}/enroll/`),

  getMyEnrollments: () => api.get('/courses/enrollments/mine/'),

  // Modules
  getModules: (slug) => api.get(`/courses/courses/${slug}/modules/`),

  createModule: (slug, data) => api.post(`/courses/courses/${slug}/modules/`, data),

  updateModule: (slug, moduleId, data) =>
    api.patch(`/courses/courses/${slug}/modules/${moduleId}/`, data),

  deleteModule: (slug, moduleId) =>
    api.delete(`/courses/courses/${slug}/modules/${moduleId}/`),

  // Progress Tracking
  trackModuleProgress: (courseSlug, moduleId) =>
    api.post(`/courses/courses/${courseSlug}/progress/module/${moduleId}/`),

  trackContentProgress: (courseSlug, contentId, duration = 0) =>
    api.post(`/courses/courses/${courseSlug}/progress/content/${contentId}/`, {
      watch_duration: duration,
    }),

  getCourseProgress: (courseSlug) =>
    api.get(`/courses/courses/${courseSlug}/progress/`),

  getMyCoursesWithProgress: () =>
    api.get('/courses/progress/my-courses/'),

  // Content
  getContentItem: (contentId) =>
    api.get(`/courses/content/${contentId}/`),

  downloadContent: (contentId) =>
    api.get(`/courses/content/${contentId}/download/`, {
      responseType: 'blob',
    }),
};

export default courseService;
