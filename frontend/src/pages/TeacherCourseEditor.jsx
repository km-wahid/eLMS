import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trash2, FileText, Presentation, File, Video, FileIcon, Download, Upload as UploadIcon, Plus, Edit2, GripVertical } from 'lucide-react'
import useCourseStore from '../store/courseStore'
import { useAuthStore } from '../store/authStore'
import materialService from '../services/materialService'
import lectureService from '../services/lectureService'
import courseService from '../services/courseService'
import MaterialUploadModal from '../components/teacher/MaterialUploadModal'

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
    module_id: '', // Add module selection
  })

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [materials, setMaterials] = useState([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [moduleFilter, setModuleFilter] = useState('')
  const [creatingLecture, setCreatingLecture] = useState(false)
  const [lectureError, setLectureError] = useState(null)
  
  // Module management state
  const [modules, setModules] = useState([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
  })
  const [moduleError, setModuleError] = useState(null)
  const [savingModule, setSavingModule] = useState(false)

  useEffect(() => {
    const found = courses.find((c) => c.id === courseId)
    if (found) {
      setCourse(found)
      setFormData({
        title: found.title,
        description: found.description || '',
        code: found.course_code || '',
      })
      // Load modules when course is set
      if (found.slug) {
        loadModules(found.slug)
      }
    }
  }, [courseId, courses])

  // Load modules
  const loadModules = async (slug) => {
    setLoadingModules(true)
    try {
      const response = await courseService.getModules(slug)
      setModules(response.data || [])
      // Also update the course modules
      if (course) {
        setCourse({ ...course, modules: response.data })
      }
    } catch (err) {
      console.error('Failed to load modules:', err)
    } finally {
      setLoadingModules(false)
    }
  }

  // Load materials when materials tab is active
  useEffect(() => {
    if (activeTab === 'materials' && course?.slug) {
      loadMaterials()
    }
  }, [activeTab, course?.slug, moduleFilter])

  const loadMaterials = async () => {
    if (!course?.slug) return
    
    setLoadingMaterials(true)
    try {
      const params = {}
      if (moduleFilter) params.module = moduleFilter
      
      const response = await materialService.getMaterials(course.slug, params)
      setMaterials(response.data)
    } catch (err) {
      console.error('Failed to load materials:', err)
    } finally {
      setLoadingMaterials(false)
    }
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return
    
    try {
      await materialService.deleteMaterial(course.slug, materialId)
      setMaterials(materials.filter(m => m.id !== materialId))
    } catch (err) {
      alert('Failed to delete material: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return FileText
      case 'slide': return Presentation
      case 'doc': return File
      case 'video': return Video
      default: return FileIcon
    }
  }

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

  // Module handlers
  const handleCreateModule = async (e) => {
    e.preventDefault()
    if (!moduleForm.title.trim()) {
      setModuleError('Module title is required')
      return
    }

    setSavingModule(true)
    setModuleError(null)

    try {
      await courseService.createModule(course.slug, {
        title: moduleForm.title,
        description: moduleForm.description,
      })

      // Reload modules
      await loadModules(course.slug)

      // Reset form
      setModuleForm({ title: '', description: '' })
      setShowModuleForm(false)
      alert('Module created successfully!')
    } catch (err) {
      console.error('Failed to create module:', err)
      setModuleError(err.response?.data?.detail || 'Failed to create module')
    } finally {
      setSavingModule(false)
    }
  }

  const handleUpdateModule = async (e) => {
    e.preventDefault()
    if (!moduleForm.title.trim()) {
      setModuleError('Module title is required')
      return
    }

    setSavingModule(true)
    setModuleError(null)

    try {
      await courseService.updateModule(course.slug, editingModule.id, {
        title: moduleForm.title,
        description: moduleForm.description,
      })

      // Reload modules
      await loadModules(course.slug)

      // Reset form
      setModuleForm({ title: '', description: '' })
      setEditingModule(null)
      setShowModuleForm(false)
      alert('Module updated successfully!')
    } catch (err) {
      console.error('Failed to update module:', err)
      setModuleError(err.response?.data?.detail || 'Failed to update module')
    } finally {
      setSavingModule(false)
    }
  }

  const handleEditModule = (module) => {
    setEditingModule(module)
    setModuleForm({
      title: module.title || module.name,
      description: module.description || '',
    })
    setShowModuleForm(true)
    setModuleError(null)
  }

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure? This will delete all lectures in this module.')) return

    try {
      await courseService.deleteModule(course.slug, moduleId)
      await loadModules(course.slug)
      alert('Module deleted successfully!')
    } catch (err) {
      alert('Failed to delete module: ' + (err.response?.data?.detail || 'Unknown error'))
    }
  }

  const handleCancelModuleForm = () => {
    setShowModuleForm(false)
    setEditingModule(null)
    setModuleForm({ title: '', description: '' })
    setModuleError(null)
  }

  const handleAddLecture = async (e) => {
    e.preventDefault()
    
    if (!lectureForm.title.trim()) {
      setLectureError('Lecture title is required')
      return
    }
    
    if (!lectureForm.module_id) {
      setLectureError('Please select a module')
      return
    }
    
    setCreatingLecture(true)
    setLectureError(null)
    
    try {
      const lectureData = {
        title: lectureForm.title,
        description: lectureForm.description,
        video_url: lectureForm.video_url || '',
        order: 0, // Backend will auto-increment
      }
      
      await lectureService.createLecture(
        course.slug,
        lectureForm.module_id,
        lectureData
      )
      
      // Reset form
      setLectureForm({
        title: '',
        description: '',
        video_url: '',
        module_id: lectureForm.module_id, // Keep module selected
      })
      
      // Refresh course data to show new lecture
      // TODO: Ideally we should update the local state or refetch
      alert('Lecture created successfully!')
      
    } catch (err) {
      console.error('Failed to create lecture:', err)
      setLectureError(err.response?.data?.detail || 'Failed to create lecture')
    } finally {
      setCreatingLecture(false)
    }
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
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Course Info
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'modules'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Modules
        </button>
        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'lectures'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Lectures
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
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

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Course Modules</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Organize your course content into modules
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModuleForm(true)
                  setEditingModule(null)
                  setModuleForm({ title: '', description: '' })
                  setModuleError(null)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Module
              </button>
            </div>

            {/* Module Form Modal */}
            {showModuleForm && (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingModule ? 'Edit Module' : 'Create New Module'}
                </h3>

                {moduleError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {moduleError}
                  </div>
                )}

                <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Module Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Introduction to Programming"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Describe what this module covers..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingModule}
                      className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                        savingModule
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {savingModule ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          Saving...
                        </span>
                      ) : (
                        editingModule ? 'Update Module' : 'Create Module'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelModuleForm}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modules List */}
            {loadingModules ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-5xl mb-4">📚</div>
                <p className="text-gray-600 text-lg">No modules yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first module to organize course content</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                            Module {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {module.title || module.name}
                          </h3>
                        </div>
                        {module.description && (
                          <p className="text-gray-600 mt-2 ml-20">{module.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 ml-20 text-sm text-gray-500">
                          <span>{module.lectures?.length || 0} lectures</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditModule(module)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit module"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lectures Tab */}
      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Lecture</h2>
            
            {/* Error Message */}
            {lectureError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {lectureError}
              </div>
            )}
            
            {/* Check if modules exist */}
            {(!course?.modules || course.modules.length === 0) ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="font-medium">No modules found</p>
                <p className="text-sm mt-1">
                  Please create at least one module first before adding lectures.
                  Modules help organize your course content.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddLecture} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={lectureForm.module_id}
                    onChange={(e) => setLectureForm({ ...lectureForm, module_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a module</option>
                    {course.modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title || module.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lecture Title <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">Video URL (HLS)</label>
                  <input
                    type="url"
                    value={lectureForm.video_url}
                    onChange={(e) => setLectureForm({ ...lectureForm, video_url: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://cdn.example.com/video.m3u8"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Provide an HLS video URL. You can also upload video files later.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={creatingLecture}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                    creatingLecture
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {creatingLecture ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Lecture
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lectures</h2>
            {course?.modules && course.modules.length > 0 && (
              <div className="space-y-6">
                {course.modules.map((module) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-3">
                      {module.title || module.name}
                    </h3>
                    {module.lectures && module.lectures.length > 0 ? (
                      <div className="space-y-2 ml-4">
                        {module.lectures.map((lecture) => (
                          <div key={lecture.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <h4 className="font-medium text-gray-900">{lecture.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{lecture.description || 'No description'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm ml-4">No lectures in this module yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(!course?.modules || course.modules.length === 0) && (
              <p className="text-gray-600">No modules or lectures yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          {/* Header with Upload Button */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Course Materials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload and manage course materials for students
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                Upload Material
              </button>
            </div>

            {/* Filter by Module */}
            {course?.modules && course.modules.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Module
                </label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Modules</option>
                  {course.modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Materials List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {loadingMaterials ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading materials...</p>
              </div>
            ) : materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map((material) => {
                  const IconComponent = getFileIcon(material.file_type)
                  return (
                    <div
                      key={material.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{material.title}</h3>
                            {material.description && (
                              <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="uppercase font-medium">{material.file_type}</span>
                              <span>{material.file_size_display}</span>
                              {material.uploaded_by_name && (
                                <span>by {material.uploaded_by_name}</span>
                              )}
                              <span>{new Date(material.created_at).toLocaleDateString()}</span>
                              {material.is_downloadable && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Download className="w-3 h-3" />
                                  Downloadable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">No materials uploaded yet</p>
                <p className="text-sm text-gray-500">
                  Click the "Upload Material" button to add course materials
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Material Upload Modal */}
      <MaterialUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        courseSlug={course?.slug}
        modules={course?.modules || []}
        onSuccess={loadMaterials}
      />

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
