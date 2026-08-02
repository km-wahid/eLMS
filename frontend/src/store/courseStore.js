import { create } from 'zustand';
import courseService from '../services/courseService';

const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  myEnrollments: [],
  teacherCourses: [],
  categories: [],
  loading: false,
  error: null,
  filters: { search: '', level: '', category: '' },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setCategories: (categories) => set({ categories }),

  setCourses: (courses) => set({ courses }),

  setCurrentCourse: (course) => set({ currentCourse: course }),

  setTeacherCourses: (courses) => set({ teacherCourses: courses }),

  setMyEnrollments: (enrollments) => set({ myEnrollments: enrollments }),

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  // Fetch all courses
  fetchCourses: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await courseService.getCourses(params);
      set({ courses: response.data.results || response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  },

  // Fetch course by slug
  fetchCourseBySlug: async (slug) => {
    set({ loading: true, error: null });
    try {
      const response = await courseService.getCourseBySlug(slug);
      set({ currentCourse: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch course:', error);
      throw error;
    }
  },

  // Fetch teacher courses
  fetchTeacherCourses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await courseService.getTeacherCourses();
      set({ teacherCourses: response.data.results || response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch teacher courses:', error);
      throw error;
    }
  },

  // Fetch my enrollments
  fetchMyEnrollments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await courseService.getMyEnrollments();
      set({ myEnrollments: response.data.results || response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch enrollments:', error);
      throw error;
    }
  },

  enrollCourse: async (slug) => {
    const response = await courseService.enrollInCourse(slug);
    set((state) => ({ myEnrollments: [response.data, ...state.myEnrollments] }));
    return response.data;
  },

  addCourse: (course) =>
    set((state) => ({ teacherCourses: [course, ...state.teacherCourses] })),

  updateCourse: (slug, updated) =>
    set((state) => ({
      teacherCourses: state.teacherCourses.map((c) =>
        c.slug === slug ? { ...c, ...updated } : c
      ),
      currentCourse:
        state.currentCourse?.slug === slug
          ? { ...state.currentCourse, ...updated }
          : state.currentCourse,
    })),

  removeCourse: (slug) =>
    set((state) => ({
      teacherCourses: state.teacherCourses.filter((c) => c.slug !== slug),
    })),

  addModule: (module) =>
    set((state) => ({
      currentCourse: state.currentCourse
        ? {
            ...state.currentCourse,
            modules: [...(state.currentCourse.modules || []), module],
          }
        : state.currentCourse,
    })),

  updateModule: (moduleId, updated) =>
    set((state) => ({
      currentCourse: state.currentCourse
        ? {
            ...state.currentCourse,
            modules: (state.currentCourse.modules || []).map((m) =>
              m.id === moduleId ? { ...m, ...updated } : m
            ),
          }
        : state.currentCourse,
    })),

  removeModule: (moduleId) =>
    set((state) => ({
      currentCourse: state.currentCourse
        ? {
            ...state.currentCourse,
            modules: (state.currentCourse.modules || []).filter(
              (m) => m.id !== moduleId
            ),
          }
        : state.currentCourse,
    })),

  // Track module progress
  trackModuleProgress: async (courseSlug, moduleId) => {
    try {
      const response = await courseService.trackModuleProgress(courseSlug, moduleId);
      return response.data;
    } catch (error) {
      console.error('Failed to track module progress:', error);
      throw error;
    }
  },

  // Track content progress
  trackContentProgress: async (courseSlug, contentId, duration = 0) => {
    try {
      const response = await courseService.trackContentProgress(courseSlug, contentId, duration);
      return response.data;
    } catch (error) {
      console.error('Failed to track content progress:', error);
      throw error;
    }
  },

  // Get course progress
  getCourseProgress: async (courseSlug) => {
    try {
      const response = await courseService.getCourseProgress(courseSlug);
      return response.data;
    } catch (error) {
      console.error('Failed to get course progress:', error);
      throw error;
    }
  },
}));

export default useCourseStore;
