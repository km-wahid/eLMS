import { useState, useEffect } from 'react'
import { 
  BarChart3, Users, BookOpen, GraduationCap, TrendingUp, 
  Activity, Clock, Award, AlertCircle, RefreshCw, Download
} from 'lucide-react'
import { getAnalyticsDashboard } from '../services/adminService'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAnalyticsDashboard()
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 text-center">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { core_metrics, activity_metrics, course_analytics, content_analytics, progress, system_health, activity_timeline } = data

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time platform analytics and insights</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Students"
            value={core_metrics.total_students}
            icon={Users}
            color="blue"
            subtitle={`${activity_metrics.active_students} active this week`}
          />
          <MetricCard
            title="Total Teachers"
            value={core_metrics.total_teachers}
            icon={GraduationCap}
            color="green"
            subtitle={`${activity_metrics.active_teachers} active this week`}
          />
          <MetricCard
            title="Total Courses"
            value={core_metrics.total_courses}
            icon={BookOpen}
            color="purple"
            subtitle={`${core_metrics.published_courses} published`}
          />
          <MetricCard
            title="Total Enrollments"
            value={core_metrics.total_enrollments}
            icon={TrendingUp}
            color="orange"
            subtitle={`Avg ${activity_metrics.avg_completion_percentage.toFixed(1)}% completion`}
          />
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600">Last 7 days</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Content Views</span>
                <span className="font-bold text-indigo-600">{activity_metrics.recent_activity_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recent Uploads</span>
                <span className="font-bold text-green-600">{activity_metrics.recent_uploads}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Content Overview</h3>
                <p className="text-sm text-gray-600">Platform-wide</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Modules</span>
                <span className="font-bold text-green-600">{core_metrics.total_modules}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Content Items</span>
                <span className="font-bold text-green-600">{core_metrics.total_content_items}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Structure</h3>
                <p className="text-sm text-gray-600">Organization</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Departments</span>
                <span className="font-bold text-purple-600">{core_metrics.total_departments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Semesters</span>
                <span className="font-bold text-purple-600">{core_metrics.total_semesters || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Courses */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Popular Courses
            </h3>
            <div className="space-y-3">
              {course_analytics.popular_courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.code}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">{course.enrollment_count}</p>
                      <p className="text-xs text-gray-500">enrolled</p>
                    </div>
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, (course.enrollment_count / 50) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {course_analytics.popular_courses.length === 0 && (
                <p className="text-center text-gray-500 py-4">No enrollment data yet</p>
              )}
            </div>
          </div>

          {/* Content Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Content Distribution
            </h3>
            <div className="space-y-3">
              {content_analytics.content_by_type.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getContentIcon(item.type)}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${Math.min(100, (item.count / Math.max(...content_analytics.content_by_type.map(i => i.count))) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {content_analytics.content_by_type.length === 0 && (
                <p className="text-center text-gray-500 py-4">No content uploaded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Activity Timeline (Last 7 Days)
          </h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {activity_timeline.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end">
                  <div 
                    className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition cursor-pointer relative group"
                    style={{ height: `${Math.max(10, (day.views / Math.max(...activity_timeline.map(d => d.views || 1))) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {day.views} views
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Alerts */}
        {(system_health.courses_without_modules > 0 || system_health.modules_without_content > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              System Health Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {system_health.courses_without_modules > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Courses without modules</p>
                  <p className="text-2xl font-bold text-yellow-600">{system_health.courses_without_modules}</p>
                </div>
              )}
              {system_health.modules_without_content > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Empty modules</p>
                  <p className="text-2xl font-bold text-yellow-600">{system_health.modules_without_content}</p>
                </div>
              )}
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Unpublished courses</p>
                <p className="text-2xl font-bold text-gray-600">{system_health.unpublished_courses}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Students */}
        {progress.top_students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Top Performing Students
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.top_students.slice(0, 6).map((student, idx) => (
                <div key={student.student_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-indigo-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.student_name}</p>
                    <p className="text-xs text-gray-500">{student.courses_completed} courses • {student.avg_progress.toFixed(0)}% avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</p>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function getContentIcon(type) {
  const icons = {
    video: '🎥',
    pdf: '📄',
    slide: '📊',
    text: '📝',
    link: '🔗',
  }
  return icons[type.toLowerCase()] || '📦'
}
