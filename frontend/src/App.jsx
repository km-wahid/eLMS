import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import CourseFormPage from './pages/CourseFormPage'
import MyCoursesPage from './pages/MyCoursesPage'
import MyEnrollmentsPage from './pages/MyEnrollmentsPage'

const Home = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
    <div className="text-center">
      <h1 className="text-5xl font-extrabold text-indigo-600 mb-3">eLMS</h1>
      <p className="text-gray-500 text-lg mb-8">E-Learning Management System</p>
      <div className="flex gap-4 justify-center">
        <a href="/courses" className="btn btn-primary">Browse Courses</a>
        <a href="/register" className="btn btn-secondary">Get Started</a>
      </div>
    </div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
        <Route path="/my-learning" element={<ProtectedRoute><MyEnrollmentsPage /></ProtectedRoute>} />
        <Route path="/courses/new" element={<ProtectedRoute><CourseFormPage /></ProtectedRoute>} />
        <Route path="/courses/:slug/edit" element={<ProtectedRoute><CourseFormPage /></ProtectedRoute>} />

        {/* Public */}
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

