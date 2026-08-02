import { useState, useEffect } from 'react'
import { 
  BarChart3, Users, BookOpen, GraduationCap, TrendingUp, 
  Activity, Clock, Award, AlertCircle, RefreshCw, FileText,
  UserPlus, Trash2, Video, Link as LinkIcon, Presentation,
  FileDown, Search
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  getAnalyticsDashboard, 
  getContentItems, 
  deleteContentItem,
  searchContent,
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  getProgressOverview,
  getCourseProgress
} from '../services/adminService'

export default function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics')
  
  const tabs = [
    { id: 'analytics', label: '📊 Analytics', icon: BarChart3 },
    { id: 'content', label: '📦 Content', icon: FileText },
    { id: 'enrollments', label: '�� Enrollments', icon: UserPlus },
    { id: 'progress', label: '📈 Progress', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'enrollments' && <EnrollmentsTab />}
        {activeTab === 'progress' && <ProgressTab />}
      </div>
    </div>
  )
}

// ============================================
// ANALYTICS TAB
// ============================================
function AnalyticsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAnalyticsDashboard()
      console.log('Analytics data:', response.data)
      setData(response.data)
    } catch (err) {
      console.error('Analytics error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load analytics'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Error Loading Analytics</h3>
          </div>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Reload
        </button>
      </div>
    )
  }

  const core_metrics = data.core_metrics || {}
  const activity_metrics = data.activity_metrics || {}
  const course_analytics = data.course_analytics || { popular_courses: [] }
  const content_analytics = data.content_analytics || { content_by_type: [] }
  const progress = data.progress || { top_students: [] }
  const system_health = data.system_health || {}
  const activity_timeline = data.activity_timeline || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time platform insights</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Students" 
          value={core_metrics.total_students || 0} 
          icon={Users} 
          color="blue" 
          subtitle={`${activity_metrics.active_students || 0} active`} 
        />
        <MetricCard 
          title="Total Teachers" 
          value={core_metrics.total_teachers || 0} 
          icon={GraduationCap} 
          color="green" 
          subtitle={`${activity_metrics.active_teachers || 0} active`} 
        />
        <MetricCard 
          title="Total Courses" 
          value={core_metrics.total_courses || 0} 
          icon={BookOpen} 
          color="purple" 
          subtitle={`${core_metrics.published_courses || 0} published`} 
        />
        <MetricCard 
          title="Enrollments" 
          value={core_metrics.total_enrollments || 0} 
          icon={TrendingUp} 
          color="orange" 
          subtitle={`${(activity_metrics.avg_completion_percentage || 0).toFixed(1)}% avg`} 
        />
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
            {course_analytics.popular_courses && course_analytics.popular_courses.length > 0 ? (
              course_analytics.popular_courses.slice(0, 5).map((course) => (
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
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, (course.enrollment_count / 50) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
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
            {content_analytics.content_by_type && content_analytics.content_by_type.length > 0 ? (
              content_analytics.content_by_type.map((item) => (
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
                        style={{ 
                          width: `${Math.min(100, (item.count / Math.max(...content_analytics.content_by_type.map(i => i.count), 1)) * 100)}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No content uploaded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {activity_timeline && activity_timeline.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Activity Timeline (Last 7 Days)
          </h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {activity_timeline.map((day, idx) => {
              const maxViews = Math.max(...activity_timeline.map(d => d.views || 1), 1)
              const height = Math.max(10, ((day.views || 0) / maxViews) * 100)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div 
                      className="w-full bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition cursor-pointer relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {day.views || 0} views
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* System Health */}
      {system_health && (system_health.courses_without_modules > 0 || system_health.modules_without_content > 0) && (
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
              <p className="text-2xl font-bold text-gray-600">{system_health.unpublished_courses || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Students */}
      {progress && progress.top_students && progress.top_students.length > 0 && (
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
                  <p className="text-xs text-gray-500">{student.courses_completed} courses • {student.avg_progress.toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// CONTENT TAB
// ============================================
function ContentTab() {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')

  const loadContent = async () => {
    setLoading(true)
    try {
      let response
      if (searchQuery) {
        response = await searchContent(searchQuery, filterType || null)
      } else {
        const params = {}
        if (filterType) params.type = filterType
        response = await getContentItems(params)
      }
      setContent(response.data || [])
    } catch (error) {
      console.error('Content load error:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [filterType])

  const handleDelete = async (uuid) => {
    if (!confirm('Delete this content?')) return
    try {
      await deleteContentItem(uuid)
      toast.success('Content deleted')
      loadContent()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-600 mt-1">Manage all learning materials</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <form onSubmit={(e) => { e.preventDefault(); loadContent(); }} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">All Types</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
            <option value="slide">Slides</option>
            <option value="text">Text</option>
            <option value="link">Links</option>
          </select>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Search
          </button>
        </form>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
        ) : content.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No content found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module/Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {content.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.file && <p className="text-xs text-gray-500 truncate max-w-xs">{item.file.split('/').pop()}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{item.module_title}</p>
                        <p className="text-gray-500">{item.course_title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.uploaded_by_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {item.file && (
                          <a href={item.file} download className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                            <FileDown className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// ENROLLMENTS TAB
// ============================================
function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadEnrollments = async () => {
    setLoading(true)
    try {
      const response = await getEnrollments()
      setEnrollments(response.data || [])
    } catch (error) {
      console.error('Enrollments load error:', error)
      toast.error('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEnrollments()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this enrollment?')) return
    try {
      await deleteEnrollment(id)
      toast.success('Enrollment removed')
      loadEnrollments()
    } catch (error) {
      toast.error('Failed to remove enrollment')
    }
  }

  const handleCreate = async (data) => {
    try {
      await createEnrollment(data)
      toast.success('Student enrolled successfully')
      setShowModal(false)
      loadEnrollments()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to enroll')
    }
  }

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => !e.completed).length,
    completed: enrollments.filter(e => e.completed).length,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="text-gray-600 mt-1">Manage student enrollments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-indigo-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <BookOpen className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
        ) : enrollments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No enrollments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{e.student_name}</p>
                      <p className="text-sm text-gray-500">ID: {e.student}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{e.course_title}</p>
                      <p className="text-sm text-gray-500">ID: {e.course}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(e.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${e.progress_percentage || 0}%` }} />
                        </div>
                        <span className="text-sm text-gray-600">{e.progress_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button onClick={() => handleDelete(e.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <EnrollModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  )
}

// ============================================
// PROGRESS TAB
// ============================================
function ProgressTab() {
  const [overview, setOverview] = useState(null)
  const [courseProgress, setCourseProgress] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, progressRes] = await Promise.all([
        getProgressOverview(),
        getCourseProgress()
      ])
      setOverview(overviewRes.data)
      setCourseProgress(progressRes.data || [])
    } catch (error) {
      console.error('Progress load error:', error)
      toast.error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor student learning progress</p>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <Users className="w-10 h-10 text-indigo-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{overview.total_students || 0}</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <BookOpen className="w-10 h-10 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{overview.active_enrollments || 0}</p>
            <p className="text-sm text-gray-600">Active Enrollments</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <TrendingUp className="w-10 h-10 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{(overview.avg_completion_rate || 0).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Avg Completion</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <Award className="w-10 h-10 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{overview.courses_completed || 0}</p>
            <p className="text-sm text-gray-600">Courses Completed</p>
          </div>
        </div>
      )}

      {/* Progress Distribution */}
      {overview && overview.progress_distribution && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Progress Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ProgressBadge label="0-20%" count={overview.progress_distribution['0-20'] || 0} color="red" />
            <ProgressBadge label="21-40%" count={overview.progress_distribution['21-40'] || 0} color="orange" />
            <ProgressBadge label="41-60%" count={overview.progress_distribution['41-60'] || 0} color="yellow" />
            <ProgressBadge label="61-80%" count={overview.progress_distribution['61-80'] || 0} color="blue" />
            <ProgressBadge label="81-100%" count={overview.progress_distribution['81-100'] || 0} color="green" />
          </div>
        </div>
      )}

      {/* Progress Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Student Progress by Course</h3>
        </div>
        {courseProgress.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No progress data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courseProgress.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{p.student_name}</p>
                      <p className="text-sm text-gray-500">ID: {p.student_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{p.course_title}</p>
                      <p className="text-sm text-gray-500">{p.course_code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                          <div className={`h-2 rounded-full ${getProgressColor(p.progress_percentage)}`} style={{ width: `${p.progress_percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{p.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.completed_modules} / {p.total_modules}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.is_completed ? 'bg-green-100 text-green-800' : p.progress_percentage > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.is_completed ? 'Completed' : p.progress_percentage > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================
function MetricCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]} mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  )
}

function ProgressBadge({ label, count, color }) {
  const colors = {
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-2xl font-bold mb-1">{count}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

function EnrollModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({ student: '', course: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onCreate(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Enroll Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="number"
              required
              value={formData.student}
              onChange={(e) => setFormData({ ...formData, student: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course ID</label>
            <input
              type="number"
              required
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Helper functions
function getContentIcon(type) {
  const icons = { video: '🎥', pdf: '📄', slide: '📊', text: '📝', link: '🔗' }
  return icons[type?.toLowerCase()] || '📦'
}

function getTypeIcon(type) {
  const icons = {
    video: <Video className="w-5 h-5 text-red-600" />,
    pdf: <FileText className="w-5 h-5 text-blue-600" />,
    slide: <Presentation className="w-5 h-5 text-orange-600" />,
    text: <FileText className="w-5 h-5 text-green-600" />,
    link: <LinkIcon className="w-5 h-5 text-purple-600" />,
  }
  return icons[type?.toLowerCase()] || <FileText className="w-5 h-5 text-gray-600" />
}

function getTypeBadge(type) {
  const badges = {
    video: 'bg-red-100 text-red-800',
    pdf: 'bg-blue-100 text-blue-800',
    slide: 'bg-orange-100 text-orange-800',
    text: 'bg-green-100 text-green-800',
    link: 'bg-purple-100 text-purple-800',
  }
  return badges[type?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

function getProgressColor(percentage) {
  if (percentage === 0) return 'bg-gray-400'
  if (percentage < 25) return 'bg-red-500'
  if (percentage < 50) return 'bg-orange-500'
  if (percentage < 75) return 'bg-yellow-500'
  if (percentage < 100) return 'bg-blue-500'
  return 'bg-green-500'
}
