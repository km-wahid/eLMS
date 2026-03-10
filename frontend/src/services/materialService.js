import api from './api';

const materialService = {
  // List materials for a course (optional ?module=id or ?lecture=id filter)
  getMaterials: (courseSlug, params = {}) => {
    const query = new URLSearchParams();
    if (params.module)  query.append('module',  params.module);
    if (params.lecture) query.append('lecture', params.lecture);
    return api.get(`/materials/${courseSlug}/materials/?${query.toString()}`);
  },

  getMaterial: (courseSlug, materialId) =>
    api.get(`/materials/${courseSlug}/materials/${materialId}/`),

  uploadMaterial: (courseSlug, data) =>
    api.post(`/materials/${courseSlug}/materials/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMaterial: (courseSlug, materialId) =>
    api.delete(`/materials/${courseSlug}/materials/${materialId}/`),
};

export default materialService;
