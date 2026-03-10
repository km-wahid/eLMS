import { create } from 'zustand';

const useLectureStore = create((set, get) => ({
  lectures: [],       // flat list of all lectures in a course
  currentLecture: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setLectures: (lectures) => set({ lectures }),

  setCurrentLecture: (lecture) => set({ currentLecture: lecture }),

  addLecture: (lecture) =>
    set((state) => ({ lectures: [...state.lectures, lecture] })),

  updateLecture: (id, updated) =>
    set((state) => ({
      lectures: state.lectures.map((l) => (l.id === id ? { ...l, ...updated } : l)),
      currentLecture:
        state.currentLecture?.id === id
          ? { ...state.currentLecture, ...updated }
          : state.currentLecture,
    })),

  removeLecture: (id) =>
    set((state) => ({
      lectures: state.lectures.filter((l) => l.id !== id),
      currentLecture:
        state.currentLecture?.id === id ? null : state.currentLecture,
    })),

  reset: () => set({ lectures: [], currentLecture: null, loading: false, error: null }),
}));

export default useLectureStore;
