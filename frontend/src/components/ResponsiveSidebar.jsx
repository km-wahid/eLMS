import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * ResponsiveSidebar - Collapsible mobile navigation with academic links
 */
const ResponsiveSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navigationItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Departments', path: '/departments', icon: '🏛️' },
    { label: 'Courses', path: '/courses', icon: '📚' },
    { label: 'Dashboard', path: '/dashboard', icon: '📊', protected: true },
    { label: 'My Enrollments', path: '/my-enrollments', icon: '✓', protected: true },
    { label: 'Bookmarks', path: '/bookmarks', icon: '🔖', protected: true },
    { label: 'Progress', path: '/progress', icon: '📈', protected: true },
  ]

  const teacherItems = [
    { label: 'Academic Mgmt', path: '/teacher/academic', icon: '🎓' },
    { label: 'My Courses', path: '/my-courses', icon: '📖' },
    { label: 'Materials', path: '/teacher/materials', icon: '📄' },
    { label: 'CMS Dashboard', path: '/cms', icon: '⚙️' },
  ]

  const adminItems = [
    { label: 'User Management', path: '/cms/users', icon: '👥' },
    { label: 'Analytics', path: '/cms/analytics', icon: '📊' },
  ]

  const handleNavClick = () => {
    onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">eLMS</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-120px)]">
          {/* Main Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <div className="space-y-2">
              {navigationItems.map((item) => {
                if (item.protected && !user) return null

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Teacher Navigation */}
          {['teacher', 'admin', 'superuser'].includes(user?.role) && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Teacher
              </h3>
              <div className="space-y-2">
                {teacherItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Admin Navigation */}
          {['admin', 'superuser'].includes(user?.role) && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Admin
              </h3>
              <div className="space-y-2">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          {user ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{user.first_name || user.email}</p>
              <button
                onClick={() => {
                  logout()
                  handleNavClick()
                }}
                className="w-full mt-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={handleNavClick}
                className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={handleNavClick}
                className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ResponsiveSidebar
