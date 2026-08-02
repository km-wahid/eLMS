import api from './api';

export const noteService = {
  // Get all notes for the current user
  getNotes: (params = {}) => api.get('/notes/', { params }),

  // Get notes for a specific module
  getNotesByModule: (moduleId) => api.get('/notes/by_module/', { params: { module: moduleId } }),

  // Get notes for a specific course
  getNotesByCourse: (courseId) => api.get('/notes/', { params: { course: courseId } }),

  // Get a specific note
  getNote: (id) => api.get(`/notes/${id}/`),

  // Create a new note
  createNote: (data) => api.post('/notes/', data),

  // Update a note
  updateNote: (id, data) => api.patch(`/notes/${id}/`, data),

  // Delete a note
  deleteNote: (id) => api.delete(`/notes/${id}/`),
};

export default noteService;
