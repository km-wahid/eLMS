import api from './api'

/**
 * Admin CMS Service
 * All endpoints require IsAdminUser permission
 */

// ============================================
// ANALYTICS
// ============================================

export const getAnalyticsDashboard = () => api.get('/cms/analytics/')

// ============================================
// DEPARTMENTS
// ============================================

export const getDepartments = (params = {}) => api.get('/cms/departments/', { params })
export const createDepartment = (data) => api.post('/cms/departments/create/', data)
export const getDepartment = (id) => api.get(`/cms/departments/${id}/`)
export const updateDepartment = (id, data) => api.put(`/cms/departments/${id}/`, data)
export const deleteDepartment = (id) => api.delete(`/cms/departments/${id}/`)

// ============================================
// SEMESTERS
// ============================================

export const getSemesters = (params = {}) => api.get('/cms/semesters/', { params })
export const createSemester = (data) => api.post('/cms/semesters/create/', data)
export const getSemester = (id) => api.get(`/cms/semesters/${id}/`)
export const updateSemester = (id, data) => api.put(`/cms/semesters/${id}/`, data)
export const deleteSemester = (id) => api.delete(`/cms/semesters/${id}/`)

// ============================================
// CONTENT ITEMS
// ============================================

export const getContentItems = (params = {}) => api.get('/cms/content/', { params })
export const createContentItem = (data) => api.post('/cms/content/create/', data)
export const getContentItem = (uuid) => api.get(`/cms/content/${uuid}/`)
export const updateContentItem = (uuid, data) => api.put(`/cms/content/${uuid}/`, data)
export const deleteContentItem = (uuid) => api.delete(`/cms/content/${uuid}/`)

// ============================================
// ENROLLMENTS
// ============================================

export const getEnrollments = (params = {}) => api.get('/cms/enrollments/', { params })
export const createEnrollment = (data) => api.post('/cms/enrollments/create/', data)
export const deleteEnrollment = (id) => api.delete(`/cms/enrollments/${id}/`)

// ============================================
// PROGRESS TRACKING
// ============================================

export const getProgressOverview = () => api.get('/cms/progress/overview/')
export const getCourseProgress = (params = {}) => api.get('/cms/progress/courses/', { params })

// ============================================
// BULK ACTIONS
// ============================================

export const bulkPublishCourses = (courseIds) => 
  api.post('/cms/bulk/publish/', { course_ids: courseIds })

export const bulkUnpublishCourses = (courseIds) => 
  api.post('/cms/bulk/unpublish/', { course_ids: courseIds })

export const bulkDeleteCourses = (courseIds) => 
  api.post('/cms/bulk/delete/', { course_ids: courseIds })

// ============================================
// HELPER FUNCTIONS
// ============================================

export const searchContent = (query, type = null) => {
  const params = { q: query }
  if (type) params.type = type
  return getContentItems(params)
}

export const getContentByModule = (moduleId) => 
  getContentItems({ module: moduleId })

export const getEnrollmentsByStudent = (studentId) => 
  getEnrollments({ student: studentId })

export const getEnrollmentsByCourse = (courseId) => 
  getEnrollments({ course: courseId })

export default {
  // Analytics
  getAnalyticsDashboard,
  
  // Departments
  getDepartments,
  createDepartment,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Semesters
  getSemesters,
  createSemester,
  getSemester,
  updateSemester,
  deleteSemester,
  
  // Content
  getContentItems,
  createContentItem,
  getContentItem,
  updateContentItem,
  deleteContentItem,
  searchContent,
  getContentByModule,
  
  // Enrollments
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  
  // Progress
  getProgressOverview,
  getCourseProgress,
  
  // Bulk Actions
  bulkPublishCourses,
  bulkUnpublishCourses,
  bulkDeleteCourses,
}
