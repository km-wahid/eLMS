import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import CMSLayout from './cms/CMSLayout'
import CMSDashboard from './cms/CMSDashboard'
import CMSUsers from './cms/CMSUsers'
import CMSCourses from './cms/CMSCourses'
import CMSCourseEditor from './cms/CMSCourseEditor'
import CMSMaterials from './cms/CMSMaterials'
import CMSAnalytics from './cms/CMSAnalytics'
import CMSSettings from './cms/CMSSettings'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import CourseFormPage from './pages/CourseFormPage'
import MyCoursesPage from './pages/MyCoursesPage'
import MyEnrollmentsPage from './pages/MyEnrollmentsPage'
import LecturePage from './pages/LecturePage'
import AssignmentsPage from './pages/AssignmentsPage'
import AssignmentDetailPage from './pages/AssignmentDetailPage'
import GradingPage from './pages/GradingPage'
import LiveSessionsPage from './pages/LiveSessionsPage'
import LiveSessionDetailPage from './pages/LiveSessionDetailPage'

function Home() {
  const { isAuthenticated } = useAuthStore()
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center px-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
          🎓 Welcome to eLMS
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
          Learn <span className="text-indigo-600">Anything</span>,<br />Teach <span className="text-purple-600">Everyone</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Access video lectures, live classes, assignments and more — all in one place.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/courses" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Browse Courses
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-8 py-3 bg-white border-2 border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:border-indigo-400 transition-all">
              Go to Dashboard →
            </Link>
          ) : (
            <Link to="/register" className="px-8 py-3 bg-white border-2 border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:border-indigo-400 transition-all">
              Get Started Free
            </Link>
          )}
        </div>
        <div className="mt-14 grid grid-cols-3 gap-8 text-center">
          {[['6+','Courses'],['3,000+','Students'],['4.8★','Avg Rating']].map(([v,l]) => (
            <div key={l}>
              <p className="text-3xl font-extrabold text-indigo-600">{v}</p>
              <p className="text-gray-400 text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// CMS route: requires is_staff OR role admin/superadmin (or any logged-in user in demo)
const CMSRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // In demo mode allow any logged-in user; in production check: user?.is_staff || user?.role==='admin'
  return (
    <CMSLayout>
      {children}
    </CMSLayout>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* ── CMS routes (own layout, no Navbar) ─────── */}
        <Route path="/cms"                    element={<CMSRoute><CMSDashboard /></CMSRoute>} />
        <Route path="/cms/users"              element={<CMSRoute><CMSUsers /></CMSRoute>} />
        <Route path="/cms/courses"            element={<CMSRoute><CMSCourses /></CMSRoute>} />
        <Route path="/cms/courses/:slug"      element={<CMSRoute><CMSCourseEditor /></CMSRoute>} />
        <Route path="/cms/materials"          element={<CMSRoute><CMSMaterials /></CMSRoute>} />
        <Route path="/cms/analytics"          element={<CMSRoute><CMSAnalytics /></CMSRoute>} />
        <Route path="/cms/settings"           element={<CMSRoute><CMSSettings /></CMSRoute>} />

        {/* ── Main app routes (with Navbar Layout) ───── */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/login"     element={<LoginPage />} />
              <Route path="/register"  element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-courses"  element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
              <Route path="/my-learning" element={<ProtectedRoute><MyEnrollmentsPage /></ProtectedRoute>} />
              <Route path="/courses/new"        element={<ProtectedRoute><CourseFormPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/edit" element={<ProtectedRoute><CourseFormPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/learn"            element={<ProtectedRoute><LecturePage /></ProtectedRoute>} />
              <Route path="/courses/:slug/learn/:lectureId" element={<ProtectedRoute><LecturePage /></ProtectedRoute>} />
              <Route path="/courses/:slug/assignments"      element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/assignments/:id"  element={<ProtectedRoute><AssignmentDetailPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/assignments/:id/grade" element={<ProtectedRoute><GradingPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/live"     element={<ProtectedRoute><LiveSessionsPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/live/:id" element={<ProtectedRoute><LiveSessionDetailPage /></ProtectedRoute>} />
              <Route path="/courses"       element={<CoursesPage />} />
              <Route path="/courses/:slug" element={<CourseDetailPage />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
