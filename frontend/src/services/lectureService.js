import api from './api';

const lectureService = {
  // All lectures for a course (flat list, for the learning view)
  getCourseLectures: (courseSlug) =>
    api.get(`/lectures/${courseSlug}/lectures/`),

  // Module-scoped
  getModuleLectures: (courseSlug, moduleId) =>
    api.get(`/lectures/${courseSlug}/modules/${moduleId}/lectures/`),

  getLecture: (courseSlug, moduleId, lectureId) =>
    api.get(`/lectures/${courseSlug}/modules/${moduleId}/lectures/${lectureId}/`),

  createLecture: (courseSlug, moduleId, data) =>
    api.post(
      `/lectures/${courseSlug}/modules/${moduleId}/lectures/`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  updateLecture: (courseSlug, moduleId, lectureId, data) =>
    api.patch(
      `/lectures/${courseSlug}/modules/${moduleId}/lectures/${lectureId}/`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  deleteLecture: (courseSlug, moduleId, lectureId) =>
    api.delete(`/lectures/${courseSlug}/modules/${moduleId}/lectures/${lectureId}/`),
};

export default lectureService;
