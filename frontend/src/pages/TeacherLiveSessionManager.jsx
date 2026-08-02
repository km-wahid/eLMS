import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Video, Calendar, Clock, ArrowLeft, ExternalLink } from 'lucide-react'
import useCourseStore from '../store/courseStore'
import { useAuthStore } from '../store/authStore'
import liveService from '../services/liveService'

/**
 * TeacherLiveSessionManager - Schedule and manage live classes
 */
const TeacherLiveSessionManager = () => {
  const { courseId } = useParams()
  const { user } = useAuthStore()
  const { courses } = useCourseStore()

  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    platform: 'zoom',
    meeting_url: '',
    meeting_id: '',
    passcode: '',
  })
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const platforms = [
    { value: 'zoom', label: 'Zoom' },
    { value: 'meet', label: 'Google Meet' },
    { value: 'jitsi', label: 'Jitsi' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    const found = courses.find((c) => c.id === courseId)
    if (found) {
      setCourse(found)
      loadSessions(found.slug)
    }
  }, [courseId, courses])

  const loadSessions = async (slug) => {
    setLoading(true)
    try {
      const response = await liveService.getSessions(slug)
      setSessions(response.data || [])
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Session title is required')
      return
    }

    if (!formData.scheduled_at) {
      setFormError('Schedule date and time is required')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        scheduled_at: formData.scheduled_at,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        platform: formData.platform,
        meeting_url: formData.meeting_url,
        meeting_id: formData.meeting_id,
        passcode: formData.passcode,
        course: course.id,
        host: user.id,
      }

      await liveService.createSession(course.slug, payload)
      await loadSessions(course.slug)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 60,
        platform: 'zoom',
        meeting_url: '',
        meeting_id: '',
        passcode: '',
      })
      setShowForm(false)
      alert('Live session scheduled successfully!')
    } catch (err) {
      console.error('Failed to create session:', err)
      setFormError(err.response?.data?.detail || 'Failed to create session')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSession = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Session title is required')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        scheduled_at: formData.scheduled_at,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        platform: formData.platform,
        meeting_url: formData.meeting_url,
        meeting_id: formData.meeting_id,
        passcode: formData.passcode,
      }

      await liveService.updateSession(course.slug, editingSession.id, payload)
      await loadSessions(course.slug)
      
      setFormData({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 60,
        platform: 'zoom',
        meeting_url: '',
        meeting_id: '',
        passcode: '',
      })
      setEditingSession(null)
      setShowForm(false)
      alert('Session updated successfully!')
    } catch (err) {
      console.error('Failed to update session:', err)
      setFormError(err.response?.data?.detail || 'Failed to update session')
    } finally {
      setSaving(false)
    }
  }

  const handleEditSession = (session) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      description: session.description || '',
      scheduled_at: session.scheduled_at ? session.scheduled_at.substring(0, 16) : '',
      duration_minutes: session.duration_minutes || 60,
      platform: session.platform || 'zoom',
      meeting_url: session.meeting_url || '',
      meeting_id: session.meeting_id || '',
      passcode: session.passcode || '',
    })
    setShowForm(true)
    setFormError(null)
  }

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return

    try {
      await liveService.deleteSession(course.slug, sessionId)
      await loadSessions(course.slug)
      alert('Session cancelled successfully!')
    } catch (err) {
      alert('Failed to cancel session: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const handleGoLive = async (sessionId) => {
    if (!window.confirm('Start this live session now?')) return

    try {
      await liveService.goLive(course.slug, sessionId)
      await loadSessions(course.slug)
      alert('Session is now live!')
    } catch (err) {
      alert('Failed to start session: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const handleEndSession = async (sessionId) => {
    const recordingUrl = prompt('Enter recording URL (optional):')
    
    try {
      await liveService.endSession(course.slug, sessionId, { recording_url: recordingUrl || '' })
      await loadSessions(course.slug)
      alert('Session ended successfully!')
    } catch (err) {
      alert('Failed to end session: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not scheduled'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (session) => {
    const statusColors = {
      scheduled: 'bg-blue-100 text-blue-700',
      live: 'bg-green-100 text-green-700 animate-pulse',
      ended: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[session.status] || 'bg-gray-100 text-gray-700'}`}>
        {session.status === 'live' && '🔴 '}{session.status?.toUpperCase()}
      </span>
    )
  }

  if (!user?.is_teacher && !user?.is_admin) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Only teachers can manage live sessions</p>
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
        <p className="text-gray-600 mt-2">Live Session Management</p>
      </div>

      {/* Add Session Button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingSession(null)
            setFormData({
              title: '',
              description: '',
              scheduled_at: '',
              duration_minutes: 60,
              platform: 'zoom',
              meeting_url: '',
              meeting_id: '',
              passcode: '',
            })
            setFormError(null)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Live Session
        </button>
      </div>

      {/* Session Form */}
      {showForm && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingSession ? 'Edit Live Session' : 'Schedule New Live Session'}
          </h3>

          {formError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Week 1 Live Q&A"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="What will you cover in this session?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Platform <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting URL</label>
                <input
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting ID</label>
                <input
                  type="text"
                  value={formData.meeting_id}
                  onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Passcode</label>
                <input
                  type="text"
                  value={formData.passcode}
                  onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
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
                  editingSession ? 'Update Session' : 'Schedule Session'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingSession(null)
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

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-5xl mb-4">📹</div>
          <p className="text-gray-600 text-lg">No live sessions scheduled</p>
          <p className="text-gray-500 text-sm mt-2">Schedule your first live class to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.title}
                    </h3>
                    {getStatusBadge(session)}
                  </div>
                  
                  {session.description && (
                    <p className="text-gray-600 mt-2">{session.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(session.scheduled_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.duration_minutes} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {platforms.find(p => p.value === session.platform)?.label || session.platform}
                    </span>
                  </div>

                  {session.meeting_url && (
                    <a
                      href={session.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Meeting
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleGoLive(session.id)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Go Live
                    </button>
                  )}
                  {session.status === 'live' && (
                    <button
                      onClick={() => handleEndSession(session.id)}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      End Session
                    </button>
                  )}
                  {session.status !== 'ended' && session.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleEditSession(session)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit session"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Cancel session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeacherLiveSessionManager
