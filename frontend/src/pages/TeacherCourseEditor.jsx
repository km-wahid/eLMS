import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useCourseStore from '../store/courseStore'
import { useAuthStore } from '../store/authStore'

/**
 * TeacherCourseEditor - Teachers edit courses, add lectures, and upload materials
 */
const TeacherCourseEditor = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { courses, loading, error, updateCourse } = useCourseStore()

  const [course, setCourse] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
  })

  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    video_url: '',
  })

  const [materialForm, setMaterialForm] = useState({
    title: '',
    file_url: '',
    file_type: 'pdf',
  })

  useEffect(() => {
    const found = courses.find((c) => c.id === courseId)
    if (found) {
      setCourse(found)
      setFormData({
        title: found.title,
        description: found.description || '',
        code: found.course_code || '',
      })
    }
  }, [courseId, courses])

  if (!user?.is_teacher && !user?.is_admin) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Only teachers can edit courses</p>
      </div>
    )
  }

  if (!course && !loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  const handleSaveInfo = async () => {
    await updateCourse(courseId, formData)
    setEditMode(false)
  }

  const handleAddLecture = async (e) => {
    e.preventDefault()
    // TODO: Implement lecture creation via API
    console.log('Add lecture:', lectureForm)
    setLectureForm({ title: '', description: '', video_url: '' })
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()
    // TODO: Implement material upload via API
    console.log('Add material:', materialForm)
    setMaterialForm({ title: '', file_url: '', file_type: 'pdf' })
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/my-courses')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Courses
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
        <p className="text-gray-600 mt-2">Course: {course?.course_code || 'N/A'}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'info'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Course Info
        </button>
        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'lectures'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Lectures
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'materials'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'settings'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Course Info Tab */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {!editMode ? (
            <div>
              <button
                onClick={() => setEditMode(true)}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Course Info
              </button>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-gray-900">{course?.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <p className="mt-1 text-gray-900">{course?.course_code || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                    {course?.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveInfo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lectures Tab */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Lecture</h2>
            <form onSubmit={handleAddLecture} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lecture Title</label>
                <input
                  type="text"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Introduction to Python"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe what this lecture covers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Video URL</label>
                <input
                  type="url"
                  value={lectureForm.video_url}
                  onChange={(e) => setLectureForm({ ...lectureForm, video_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://cdn.example.com/video.m3u8"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Lecture
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lectures</h2>
            {course?.lectures && course.lectures.length > 0 ? (
              <div className="space-y-3">
                {course.lectures.map((lecture) => (
                  <div key={lecture.id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">{lecture.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{lecture.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No lectures yet. Add one above.</p>
            )}
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Course Material</h2>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Material Title</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lecture Notes - Week 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File URL</label>
                <input
                  type="url"
                  value={materialForm.file_url}
                  onChange={(e) => setMaterialForm({ ...materialForm, file_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/file.pdf"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File Type</label>
                <select
                  value={materialForm.file_type}
                  onChange={(e) => setMaterialForm({ ...materialForm, file_type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">Word Document</option>
                  <option value="ppt">PowerPoint</option>
                  <option value="xlsx">Spreadsheet</option>
                  <option value="zip">ZIP Archive</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Material
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Materials</h2>
            {course?.materials && course.materials.length > 0 ? (
              <div className="space-y-3">
                {course.materials.map((material) => (
                  <div key={material.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{material.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{material.file_type.toUpperCase()}</p>
                    </div>
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No materials yet. Add one above.</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Status</label>
              <select className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Enrollments</label>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave blank for unlimited"
              />
            </div>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherCourseEditor
