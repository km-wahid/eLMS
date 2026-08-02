import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Building2, Layers3 } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import CMSLayout from './cms/CMSLayout'
import CMSDashboard from './cms/CMSDashboard'
import CMSDepartments from './cms/CMSDepartments'
import CMSSemesters from './cms/CMSSemesters'
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
import MyCoursesPage from './pages/MyCoursesPage'
import MyEnrollmentsPage from './pages/MyEnrollmentsPage'
import LecturePage from './pages/LecturePage'
import AssignmentsPage from './pages/AssignmentsPage'
import AssignmentDetailPage from './pages/AssignmentDetailPage'
import GradingPage from './pages/GradingPage'
import LiveSessionsPage from './pages/LiveSessionsPage'
import LiveSessionDetailPage from './pages/LiveSessionDetailPage'
import DepartmentsPage from './pages/DepartmentsPage'
import BookmarksPage from './pages/BookmarksPage'
import ProgressPage from './pages/ProgressPage'
import DepartmentDetailPage from './pages/DepartmentDetailPage'
import SemesterCoursesPage from './pages/SemesterCoursesPage'
import CourseDetailAcademicPage from './pages/CourseDetailAcademicPage'
import TeacherAcademicDashboard from './pages/TeacherAcademicDashboard'
import TeacherCourseEditor from './pages/TeacherCourseEditor'
import TeacherAnalyticsPage from './pages/TeacherAnalyticsPage'
import TeacherMaterialsPage from './pages/TeacherMaterialsPage'
import TeacherAssignmentManager from './pages/TeacherAssignmentManager'
import TeacherLiveSessionManager from './pages/TeacherLiveSessionManager'
import CourseFormPage from './pages/CourseFormPage'
import StudentCourseViewPage from './pages/StudentCourseViewPage'
import MyLearningPage from './pages/MyLearningPage'
import UnifiedAdminDashboard from './pages/UnifiedAdminDashboard'

function Home() {
  const { isAuthenticated } = useAuthStore()
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f6f7fb] py-8 sm:py-12">
      <div className="page-shell">
        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-16 text-white shadow-xl sm:px-14 sm:py-24">
          <img src="/images/departments/cse.jpg" alt="University students learning in a modern computing lab" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/25" />
          <div className="relative max-w-3xl">
            <p className="eyebrow !text-indigo-300">A complete university learning platform</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">Your degree,<br /><span className="text-indigo-300">clearly organized.</span></h1>
            <p className="mb-9 mt-6 max-w-2xl text-lg leading-8 text-slate-300">Discover every department, follow the semester structure, and learn from rich course content—all in one focused workspace.</p>
            <div className="flex flex-wrap gap-3">
          <Link to="/departments" className="btn bg-white text-slate-950 hover:bg-indigo-50">
            Browse Departments <ArrowRight size={17} />
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/register" className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20">
              Get Started Free
            </Link>
          )}
          </div></div>
        </section>
        <section className="grid gap-5 py-8 sm:grid-cols-3">
          {[[Building2,'8','Departments','Explore distinct academic programs.'],[Layers3,'64','Semesters','Follow a clear degree structure.'],[BookOpen,'512','Courses','100 include detailed learning content.']].map(([Icon,value,label,copy]) => <div key={label} className="surface p-6"><Icon className="mb-5 text-indigo-600" size={25}/><p className="text-3xl font-black text-slate-950">{value}</p><p className="mt-1 font-bold text-slate-800">{label}</p><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></div>)}
        </section>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const RoleRoute = ({ roles, children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return roles.includes(user?.role) ? children : <Navigate to="/dashboard" replace />
}

const CMSRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!['admin', 'superuser'].includes(user?.role)) return <Navigate to="/dashboard" replace />
  return (
    <CMSLayout>
      {children}
    </CMSLayout>
  )
}

const SuperuserCMSRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'superuser') return <Navigate to="/cms" replace />
  return <CMSLayout>{children}</CMSLayout>
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
      <Routes>
        {/* ── CMS routes (own layout, no Navbar) ─────── */}
        <Route path="/cms"                    element={<CMSRoute><CMSDashboard /></CMSRoute>} />
        <Route path="/cms/departments"        element={<CMSRoute><CMSDepartments /></CMSRoute>} />
        <Route path="/cms/semesters"          element={<CMSRoute><CMSSemesters /></CMSRoute>} />
        <Route path="/cms/users"              element={<SuperuserCMSRoute><CMSUsers /></SuperuserCMSRoute>} />
        <Route path="/cms/courses"            element={<CMSRoute><CMSCourses /></CMSRoute>} />
        <Route path="/cms/courses/:slug"      element={<CMSRoute><CMSCourseEditor /></CMSRoute>} />
        <Route path="/cms/materials"          element={<CMSRoute><CMSMaterials /></CMSRoute>} />
        <Route path="/cms/analytics"          element={<CMSRoute><CMSAnalytics /></CMSRoute>} />
        <Route path="/cms/settings"           element={<CMSRoute><CMSSettings /></CMSRoute>} />

        {/* ── Admin route (unified dashboard with tabs) ──── */}
        <Route path="/admin"                  element={<CMSRoute><UnifiedAdminDashboard /></CMSRoute>} />

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
              <Route path="/my-learning" element={<ProtectedRoute><MyLearningPage /></ProtectedRoute>} />
              <Route path="/learn/:slug" element={<ProtectedRoute><StudentCourseViewPage /></ProtectedRoute>} />
              <Route path="/teacher/academic" element={<RoleRoute roles={['teacher','admin','superuser']}><TeacherAcademicDashboard /></RoleRoute>} />
              <Route path="/teacher/materials" element={<RoleRoute roles={['teacher','admin','superuser']}><TeacherMaterialsPage /></RoleRoute>} />
              <Route path="/teacher/courses/:courseId/edit" element={<RoleRoute roles={['teacher','admin','superuser']}><TeacherCourseEditor /></RoleRoute>} />
              <Route path="/teacher/courses/:courseId/analytics" element={<RoleRoute roles={['teacher','admin','superuser']}><TeacherAnalyticsPage /></RoleRoute>} />
              <Route path="/teacher/courses/:courseId/assignments" element={<RoleRoute roles={['teacher','admin','superuser']}><TeacherAssignmentManager /></RoleRoute>} />
              <Route path="/teacher/courses/:courseId/live-sessions" element={<RoleRoute roles={['teacher','admin','superuser']}><TeacherLiveSessionManager /></RoleRoute>} />
              <Route path="/courses/new"        element={<RoleRoute roles={['teacher','admin','superuser']}><CourseFormPage /></RoleRoute>} />
              <Route path="/courses/:slug/edit" element={<RoleRoute roles={['teacher','admin','superuser']}><CourseFormPage /></RoleRoute>} />
              <Route path="/courses/:slug/learn"            element={<ProtectedRoute><LecturePage /></ProtectedRoute>} />
              <Route path="/courses/:slug/learn/:lectureId" element={<ProtectedRoute><LecturePage /></ProtectedRoute>} />
              <Route path="/courses/:slug/assignments"      element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/assignments/:id"  element={<ProtectedRoute><AssignmentDetailPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/assignments/:id/grade" element={<ProtectedRoute><GradingPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/live"     element={<ProtectedRoute><LiveSessionsPage /></ProtectedRoute>} />
              <Route path="/courses/:slug/live/:id" element={<ProtectedRoute><LiveSessionDetailPage /></ProtectedRoute>} />
              <Route path="/bookmarks"      element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
              <Route path="/progress"       element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
              <Route path="/departments"   element={<DepartmentsPage />} />
              <Route path="/departments/:slug" element={<DepartmentDetailPage />} />
               <Route path="/semesters/:slug" element={<SemesterCoursesPage />} />
               <Route path="/academic-courses/:slug" element={<CourseDetailAcademicPage />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
    </>
  )
}

export default App
