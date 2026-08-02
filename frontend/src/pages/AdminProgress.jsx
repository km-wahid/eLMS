import { useState, useEffect } from 'react'
import { TrendingUp, Award, BarChart3, Users, BookOpen } from 'lucide-react'
import { getProgressOverview, getCourseProgress } from '../services/adminService'
import { toast } from 'react-hot-toast'

export default function AdminProgress() {
  const [overview, setOverview] = useState(null)
  const [courseProgress, setCourseProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, progressRes] = await Promise.all([
        getProgressOverview(),
        getCourseProgress(filterCourse ? { course: filterCourse } : {})
      ])
      setOverview(overviewRes.data)
      setCourseProgress(progressRes.data)
    } catch (error) {
      toast.error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterCourse])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading progress data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor student learning progress</p>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overview.total_students}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overview.active_enrollments}</p>
              <p className="text-sm text-gray-600">Active Enrollments</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {overview.avg_completion_rate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Avg Completion</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overview.courses_completed}</p>
              <p className="text-sm text-gray-600">Courses Completed</p>
            </div>
          </div>
        )}

        {/* Progress Distribution */}
        {overview && overview.progress_distribution && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Progress Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ProgressBadge label="0-20%" count={overview.progress_distribution['0-20'] || 0} color="red" />
              <ProgressBadge label="21-40%" count={overview.progress_distribution['21-40'] || 0} color="orange" />
              <ProgressBadge label="41-60%" count={overview.progress_distribution['41-60'] || 0} color="yellow" />
              <ProgressBadge label="61-80%" count={overview.progress_distribution['61-80'] || 0} color="blue" />
              <ProgressBadge label="81-100%" count={overview.progress_distribution['81-100'] || 0} color="green" />
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <input
            type="text"
            placeholder="Filter by course ID..."
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Course Progress Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Student Progress by Course</h3>
          </div>
          
          {courseProgress.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No progress data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Modules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseProgress.map((progress) => (
                    <tr key={progress.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{progress.student_name}</p>
                        <p className="text-sm text-gray-500">ID: {progress.student_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{progress.course_title}</p>
                        <p className="text-sm text-gray-500">{progress.course_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(progress.progress_percentage)}`}
                              style={{ width: `${progress.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 min-w-[45px]">
                            {progress.progress_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {progress.completed_modules} / {progress.total_modules}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {progress.last_accessed 
                            ? new Date(progress.last_accessed).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          progress.is_completed 
                            ? 'bg-green-100 text-green-800' 
                            : progress.progress_percentage > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {progress.is_completed ? 'Completed' : progress.progress_percentage > 0 ? 'In Progress' : 'Not Started'}
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

function getProgressColor(percentage) {
  if (percentage === 0) return 'bg-gray-400'
  if (percentage < 25) return 'bg-red-500'
  if (percentage < 50) return 'bg-orange-500'
  if (percentage < 75) return 'bg-yellow-500'
  if (percentage < 100) return 'bg-blue-500'
  return 'bg-green-500'
}
