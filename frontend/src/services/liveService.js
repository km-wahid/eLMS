import api from './api';

const BASE = (slug) => `/livestream/${slug}`;

const liveService = {
  // Per-course sessions
  getSessions:  (slug)         => api.get(`${BASE(slug)}/sessions/`),
  getSession:   (slug, id)     => api.get(`${BASE(slug)}/sessions/${id}/`),
  createSession:(slug, data)   => api.post(`${BASE(slug)}/sessions/`, data),
  updateSession:(slug, id, d)  => api.patch(`${BASE(slug)}/sessions/${id}/`, d),
  cancelSession:(slug, id)     => api.delete(`${BASE(slug)}/sessions/${id}/`),

  // Status transitions (teacher)
  goLive:       (slug, id)              => api.post(`${BASE(slug)}/sessions/${id}/go-live/`),
  endSession:   (slug, id, recordingUrl) =>
    api.post(`${BASE(slug)}/sessions/${id}/end/`,
      recordingUrl ? { recording_url: recordingUrl } : {}),

  // Student: upcoming across all enrolled courses
  getUpcoming:  () => api.get('/livestream/upcoming/'),
};

export default liveService;
