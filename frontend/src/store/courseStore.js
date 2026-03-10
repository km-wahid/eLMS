import { create } from 'zustand';

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
}));

export default useCourseStore;
