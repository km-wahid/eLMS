import api from './api';

const analyticsService = {
  // Get course analytics (teacher only)
  getCourseAnalytics: (courseId) =>
    api.get(`/academics/analytics/${courseId}/`),

  // Get all analytics (admin only)
  getAllAnalytics: () => api.get('/academics/analytics/'),
};

export default analyticsService;
