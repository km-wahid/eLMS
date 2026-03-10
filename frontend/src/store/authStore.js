import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import useCourseStore from './courseStore'

// Synchronously wipe all user-specific data from every store
function clearAllStores() {
  useCourseStore.setState({
    myEnrollments: [],
    courses: [],
    currentCourse: null,
    teacherCourses: [],
  })
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Always clear stale data from previous user before setting new user
        clearAllStores()
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

      updateUser: (user) => set({ user }),

      clearAuth: () => {
        clearAllStores()
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      logout: () => {
        clearAllStores()
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'elms-auth',
      // Only persist auth tokens/user — never course data
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
