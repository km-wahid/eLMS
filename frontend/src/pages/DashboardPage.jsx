import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    try {
      const refresh = useAuthStore.getState().refreshToken
      await api.post('/auth/logout/', { refresh })
    } catch (_) {
      // ignore errors — still clear local state
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl text-indigo-600">eLMS</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name} — <span className="capitalize font-medium text-indigo-600">{user?.role}</span>
          </span>
          <a href="/profile" className="btn btn-secondary text-sm">Profile</a>
          <button onClick={handleLogout} className="btn btn-secondary text-sm">
            Logout
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-500 mb-8">
          You're logged in as a <span className="capitalize font-semibold">{user?.role}</span>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashCard title="📚 Courses" desc="Browse and enroll in available courses" href="/courses" />
          {user?.role === 'teacher' && (
            <DashCard title="➕ Create Course" desc="Create and manage your courses" href="/courses/create" />
          )}
          <DashCard title="🎬 Lectures" desc="Access video lectures and materials" href="/courses" />
          <DashCard title="📝 Assignments" desc="View and submit assignments" href="/assignments" />
          <DashCard title="📡 Live Classes" desc="Join scheduled live sessions" href="/livestream" />
          <DashCard title="🔔 Notifications" desc="View your notifications" href="/notifications" />
        </div>
      </main>
    </div>
  )
}

function DashCard({ title, desc, href }) {
  return (
    <a
      href={href}
      className="card p-6 hover:shadow-md transition-shadow cursor-pointer block"
    >
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </a>
  )
}
