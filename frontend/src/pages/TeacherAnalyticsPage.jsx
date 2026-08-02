import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAnalyticsStore } from '../store/analyticsStore'
import useCourseStore from '../store/courseStore'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, TrendingUp, Users, Clock, BarChart3 } from 'lucide-react'

/**
 * TeacherAnalyticsPage - View course engagement and student analytics
 */
const TeacherAnalyticsPage = () => {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const { courses } = useCourseStore()
  const {
    courseAnalytics,
    loading,
    error,
    fetchCourseAnalytics,
  } = useAnalyticsStore()

  const [course, setCourse] = useState(null)
  const [timeRange, setTimeRange] = useState('month')
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    const found = courses.find((c) => c.id === courseId)
    if (found) {
      setCourse(found)
    }
  }, [courseId, courses])

  useEffect(() => {
    if (courseId) {
      fetchCourseAnalytics(courseId).catch(err => {
        console.error('Analytics fetch error:', err)
        setFetchError(err.message || 'Failed to load analytics')
      })
    }
  }, [courseId, fetchCourseAnalytics])

  if (!user?.is_teacher && !user?.is_admin) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Only teachers can view analytics</p>
      </div>
    )
  }

  if (loading && !courseAnalytics[courseId]) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Course not found</p>
          <Link to="/my-courses" className="text-indigo-600 hover:text-indigo-700">
            ← Back to My Courses
          </Link>
        </div>
      </div>
    )
  }

  const analytics = courseAnalytics[courseId] || {
    total_enrollments: 0,
    engagement_score: 0,
    completion_rate: 0,
    active_students: 0,
  }

  const StatCard = ({ label, value, icon, change }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% vs last period
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-600 mt-2">Course Analytics & Engagement</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {['week', 'month', 'semester'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg capitalize ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Enrollments"
          value={analytics.total_enrollments || 0}
          icon="👥"
          change={12}
        />
        <StatCard
          label="Active Students"
          value={analytics.active_students || 0}
          icon="✓"
          change={8}
        />
        <StatCard
          label="Avg. Engagement"
          value={`${analytics.engagement_score || 0}%`}
          icon="📊"
          change={5}
        />
        <StatCard
          label="Course Completion"
          value={`${analytics.completion_rate || 0}%`}
          icon="🏁"
          change={-2}
        />
      </div>

      {/* Content Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Viewed Lectures */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Viewed Lectures</h2>
          {course.lectures && course.lectures.length > 0 ? (
            <div className="space-y-3">
              {course.lectures.slice(0, 5).map((lecture, idx) => (
                <div key={lecture.id} className="flex items-center justify-between p-3 border border-gray-100 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{idx + 1}. {lecture.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.floor(Math.random() * 500) + 50} views
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {Math.floor(Math.random() * 40) + 10}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No lectures yet</p>
          )}
        </div>

        {/* Most Downloaded Materials */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Downloaded Materials</h2>
          {course.materials && course.materials.length > 0 ? (
            <div className="space-y-3">
              {course.materials.slice(0, 5).map((material, idx) => (
                <div key={material.id} className="flex items-center justify-between p-3 border border-gray-100 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{idx + 1}. {material.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.floor(Math.random() * 300) + 20} downloads
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">
                        {Math.floor(Math.random() * 60) + 20}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No materials yet</p>
          )}
        </div>
      </div>

      {/* Student Activity Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Timeline</h2>
        <div className="space-y-2 h-64 flex items-end gap-2">
          {Array.from({ length: 7 }).map((_, idx) => {
            const height = Math.floor(Math.random() * 80) + 20
            return (
              <div
                key={idx}
                className="flex-1 bg-blue-500 rounded-t cursor-pointer hover:bg-blue-600 transition"
                style={{ height: `${height}%` }}
                title={`Day ${idx + 1}: ${Math.floor(height * 10)} activities`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      {/* Student Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Performance Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Excellent (80-100%)</span>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: '45%' }} />
            </div>
            <span className="text-sm font-medium text-gray-900">45%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Good (60-80%)</span>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '30%' }} />
            </div>
            <span className="text-sm font-medium text-gray-900">30%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Average (40-60%)</span>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: '18%' }} />
            </div>
            <span className="text-sm font-medium text-gray-900">18%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Needs Improvement (&lt;40%)</span>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: '7%' }} />
            </div>
            <span className="text-sm font-medium text-gray-900">7%</span>
          </div>
        </div>
      </div>

      {/* Export and Actions */}
      <div className="mt-8 flex gap-3 justify-center">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Export Report (PDF)
        </button>
        <button className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400">
          Send Notifications
        </button>
      </div>
    </div>
  )
}

export default TeacherAnalyticsPage
