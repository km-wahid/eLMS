import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Users, Calendar, CheckCircle, Clock, ArrowLeft } from 'lucide-react'
import useCourseStore from '../store/courseStore'
import { useAuthStore } from '../store/authStore'
import assignmentService from '../services/assignmentService'

/**
 * TeacherAssignmentManager - Manage course assignments and grade submissions
 */
const TeacherAssignmentManager = () => {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const { courses } = useCourseStore()

  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: '',
    due_date: '',
    max_score: 100,
    is_published: false,
  })
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  useEffect(() => {
    const found = courses.find((c) => c.id === courseId)
    if (found) {
      setCourse(found)
      setModules(found.modules || [])
      loadAssignments(found.slug)
    }
  }, [courseId, courses])

  const loadAssignments = async (slug) => {
    setLoading(true)
    try {
      const response = await assignmentService.getAssignments(slug)
      setAssignments(response.data || [])
    } catch (err) {
      console.error('Failed to load assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async (assignmentId) => {
    setLoadingSubmissions(true)
    try {
      const response = await assignmentService.getSubmissions(course.slug, assignmentId)
      setSubmissions(response.data || [])
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Assignment title is required')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        module: formData.module || null,
        due_date: formData.due_date || null,
        max_score: parseInt(formData.max_score) || 100,
        is_published: formData.is_published,
        course: course.id,
      }

      await assignmentService.createAssignment(course.slug, payload)
      await loadAssignments(course.slug)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        module: '',
        due_date: '',
        max_score: 100,
        is_published: false,
      })
      setShowForm(false)
      alert('Assignment created successfully!')
    } catch (err) {
      console.error('Failed to create assignment:', err)
      setFormError(err.response?.data?.detail || 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAssignment = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Assignment title is required')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        module: formData.module || null,
        due_date: formData.due_date || null,
        max_score: parseInt(formData.max_score) || 100,
        is_published: formData.is_published,
      }

      await assignmentService.updateAssignment(course.slug, editingAssignment.id, payload)
      await loadAssignments(course.slug)
      
      setFormData({
        title: '',
        description: '',
        module: '',
        due_date: '',
        max_score: 100,
        is_published: false,
      })
      setEditingAssignment(null)
      setShowForm(false)
      alert('Assignment updated successfully!')
    } catch (err) {
      console.error('Failed to update assignment:', err)
      setFormError(err.response?.data?.detail || 'Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment)
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      module: assignment.module?.id || '',
      due_date: assignment.due_date ? assignment.due_date.substring(0, 16) : '',
      max_score: assignment.max_score || 100,
      is_published: assignment.is_published || false,
    })
    setShowForm(true)
    setFormError(null)
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure? This will delete all student submissions.')) return

    try {
      await assignmentService.deleteAssignment(course.slug, assignmentId)
      await loadAssignments(course.slug)
      alert('Assignment deleted successfully!')
    } catch (err) {
      alert('Failed to delete assignment: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment)
    await loadSubmissions(assignment.id)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (assignment) => {
    const now = new Date()
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null
    
    if (!assignment.is_published) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Draft</span>
    }
    
    if (dueDate && dueDate < now) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Closed</span>
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
  }

  if (!user?.is_teacher && !user?.is_admin) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Only teachers can manage assignments</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/my-courses"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Courses
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-600 mt-2">Assignment Management</p>
      </div>

      {/* Main Content */}
      {!selectedAssignment ? (
        <>
          {/* Add Assignment Button */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingAssignment(null)
                setFormData({
                  title: '',
                  description: '',
                  module: '',
                  due_date: '',
                  max_score: 100,
                  is_published: false,
                })
                setFormError(null)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>

          {/* Assignment Form */}
          {showForm && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>

              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Assignment Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Week 1 Quiz"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Assignment instructions and requirements..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Module (Optional)</label>
                    <select
                      value={formData.module}
                      onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No specific module</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.title || module.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_score}
                      onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Publish (make visible to students)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                      saving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Saving...
                      </span>
                    ) : (
                      editingAssignment ? 'Update Assignment' : 'Create Assignment'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingAssignment(null)
                      setFormError(null)
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assignments List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-600 text-lg">No assignments yet</p>
              <p className="text-gray-500 text-sm mt-2">Create your first assignment to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>
                      
                      {assignment.description && (
                        <p className="text-gray-600 mt-2 line-clamp-2">{assignment.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(assignment.due_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assignment.submission_count || 0} submission{assignment.submission_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Max: {assignment.max_score} points
                        </span>
                        {assignment.module && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {assignment.module.title || assignment.module.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewSubmissions(assignment)}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        View Submissions
                      </button>
                      <button
                        onClick={() => handleEditAssignment(assignment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit assignment"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Submissions View */
        <div>
          <button
            onClick={() => {
              setSelectedAssignment(null)
              setSubmissions([])
            }}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h2>
            <p className="text-gray-600 mt-2">{selectedAssignment.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>Due: {formatDate(selectedAssignment.due_date)}</span>
              <span>•</span>
              <span>Max Score: {selectedAssignment.max_score}</span>
              <span>•</span>
              <span>{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {loadingSubmissions ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-600 text-lg">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {submission.student?.name || submission.student?.email || 'Student'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Submitted: {formatDate(submission.submitted_at)}
                      </p>
                      {submission.text_answer && (
                        <p className="text-gray-700 mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                          {submission.text_answer}
                        </p>
                      )}
                      {submission.file && (
                        <a
                          href={submission.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          📎 View Submitted File
                        </a>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {submission.score !== null && submission.score !== undefined ? (
                        <div className="text-2xl font-bold text-green-600">
                          {submission.score}/{selectedAssignment.max_score}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Not graded</div>
                      )}
                      {submission.status && (
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                          submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                          submission.status === 'late' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {submission.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {submission.feedback && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Teacher Feedback:</p>
                      <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/teacher/assignments/${selectedAssignment.id}/submissions/${submission.id}/grade`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Grade This Submission →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeacherAssignmentManager
