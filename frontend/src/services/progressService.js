import api from './api';

const progressService = {
  // Get user's progress
  getProgress: () => api.get('/academics/progress/'),

  // Get progress for a specific lecture
  getLectureProgress: (lectureId) =>
    api.get(`/academics/progress/lecture_progress/?lecture=${lectureId}`),

  // Track lecture view
  trackLectureView: (lectureId, watchDurationSeconds = 0) =>
    api.post('/academics/progress/track_lecture_view/', {
      lecture_id: lectureId,
      watch_duration_seconds: watchDurationSeconds,
    }),

  // Track material download
  trackMaterialDownload: (materialId) =>
    api.post('/academics/progress/', {
      material: materialId,
      action: 'material_downloaded',
    }),

  // Track material view
  trackMaterialView: (materialId) =>
    api.post('/academics/progress/', {
      material: materialId,
      action: 'material_viewed',
    }),

  // Get progress by course (for analytics)
  getProgressByCourse: (courseId) =>
    api.get(`/academics/progress/?course=${courseId}`),
};

export default progressService;
