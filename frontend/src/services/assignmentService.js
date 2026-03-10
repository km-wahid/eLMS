import api from './api';

const BASE = (slug) => `/assignments/${slug}`;

const assignmentService = {
  // Assignments
  getAssignments:  (slug)        => api.get(`${BASE(slug)}/assignments/`),
  getAssignment:   (slug, id)    => api.get(`${BASE(slug)}/assignments/${id}/`),
  createAssignment:(slug, data)  => api.post(`${BASE(slug)}/assignments/`, data),
  updateAssignment:(slug, id, d) => api.patch(`${BASE(slug)}/assignments/${id}/`, d),
  deleteAssignment:(slug, id)    => api.delete(`${BASE(slug)}/assignments/${id}/`),

  // Submissions (teacher)
  getSubmissions:  (slug, id)    => api.get(`${BASE(slug)}/assignments/${id}/submissions/`),
  gradeSubmission: (slug, id, subId, data) =>
    api.patch(`${BASE(slug)}/assignments/${id}/submissions/${subId}/grade/`, data),

  // Submissions (student)
  submit:          (slug, id, data) =>
    api.post(`${BASE(slug)}/assignments/${id}/submit/`, data,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMySubmission: (slug, id)    => api.get(`${BASE(slug)}/assignments/${id}/my-submission/`),
  getMySubmissions:(slug)        => api.get(`${BASE(slug)}/my-submissions/`),
};

export default assignmentService;
