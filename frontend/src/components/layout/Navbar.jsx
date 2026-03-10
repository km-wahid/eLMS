import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../ui/NotificationBell';
import { LogOut, BookOpen, LayoutDashboard, GraduationCap, Plus, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin   = user?.is_staff || user?.is_superuser || user?.role === 'admin';

  const handleLogout = () => { logout(); navigate('/login'); };

  const active = (path) =>
    location.pathname === path
      ? 'text-indigo-600 font-semibold'
      : 'text-gray-600 hover:text-indigo-600';

  return (
    <nav className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-indigo-600">
          <GraduationCap className="h-6 w-6" />
          eLMS
        </Link>

        {/* Centre nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/courses" className={active('/courses')}>
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />Courses</span>
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={active('/dashboard')}>
                <span className="flex items-center gap-1"><LayoutDashboard className="h-4 w-4" />Dashboard</span>
              </Link>
              {isTeacher ? (
                <Link to="/my-courses" className={active('/my-courses')}>My Courses</Link>
              ) : (
                <Link to="/my-learning" className={active('/my-learning')}>My Learning</Link>
              )}
              {isAdmin && (
                <Link to="/cms" className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold">
                  <Shield className="h-4 w-4" /> CMS
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isTeacher && (
                <Link to="/courses/new"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                  <Plus className="h-4 w-4" /> New Course
                </Link>
              )}
              <NotificationBell />
              <Link to="/profile" className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase hover:bg-indigo-200 transition-colors">
                {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </Link>
              <button onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"    className="text-sm text-gray-600 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
