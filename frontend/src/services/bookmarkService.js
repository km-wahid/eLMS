import api from './api';

const bookmarkService = {
  // Get user's bookmarks
  getBookmarks: () => api.get('/academics/bookmarks/'),

  // Get user's lecture bookmarks
  getLectureBookmarks: () => api.get('/academics/bookmarks/lectures/'),

  // Get user's material bookmarks
  getMaterialBookmarks: () => api.get('/academics/bookmarks/materials/'),

  // Add a bookmark for a lecture
  bookmarkLecture: (lectureId) =>
    api.post('/academics/bookmarks/', {
      lecture: lectureId,
    }),

  // Add a bookmark for a material
  bookmarkMaterial: (materialId) =>
    api.post('/academics/bookmarks/', {
      material: materialId,
    }),

  bookmarkContent: (contentId) =>
    api.post('/academics/bookmarks/', { content_item: contentId }),

  // Remove a bookmark
  removeBookmark: (bookmarkId) => api.delete(`/academics/bookmarks/${bookmarkId}/`),

  // Check if a lecture is bookmarked (done by filtering local state)
  isLectureBookmarked: (lectureId, bookmarks) =>
    bookmarks?.some((b) => b.lecture === lectureId),

  // Check if a material is bookmarked
  isMaterialBookmarked: (materialId, bookmarks) =>
    bookmarks?.some((b) => b.material === materialId),
};

export default bookmarkService;
