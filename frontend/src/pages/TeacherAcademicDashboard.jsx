import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDepartmentStore } from '../store/departmentStore'
import { useSemesterStore } from '../store/semesterStore'
import { useAuthStore } from '../store/authStore'

/**
 * TeacherAcademicDashboard - Teachers manage departments, semesters, and course assignments
 */
const TeacherAcademicDashboard = () => {
  const { user } = useAuthStore()
  const {
    departments,
    loading: deptLoading,
    error: deptError,
    fetchDepartments,
    createDepartment,
  } = useDepartmentStore()

  const {
    semesters,
    loading: semLoading,
    fetchSemestersByDepartment,
    createSemester,
  } = useSemesterStore()

  const [activeTab, setActiveTab] = useState('departments')
  const [selectedDept, setSelectedDept] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  })

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  useEffect(() => {
    if (selectedDept) {
      fetchSemestersByDepartment(selectedDept.id)
    }
  }, [selectedDept, fetchSemestersByDepartment])

  const handleCreateDept = async (e) => {
    e.preventDefault()
    await createDepartment({
      ...formData,
      logo_url: `https://via.placeholder.com/400x300?text=${formData.name}`,
    })
    setFormData({ name: '', code: '', description: '' })
    setShowCreateForm(false)
    fetchDepartments()
  }

  const handleCreateSemester = async (e) => {
    e.preventDefault()
    if (!selectedDept) return
    
    const semesterNumber = semesters.length + 1
    await createSemester({
      department: selectedDept.id,
      name: `Semester ${semesterNumber}`,
      slug: `sem-${semesterNumber}`,
      type: 'semester',
      order: semesterNumber,
      description: 'Academic semester',
    })
    fetchSemestersByDepartment(selectedDept.id)
  }

  if (!user?.is_teacher && !user?.is_admin) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-gray-600">Only teachers and admins can access this page</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Academic Management</h1>
        <p className="text-gray-600 mt-2">Manage departments, semesters, and courses</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'departments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('semesters')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'semesters'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Semesters
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'courses'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Courses
        </button>
      </div>

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
            {user?.is_admin && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showCreateForm ? 'Cancel' : 'Create Department'}
              </button>
            )}
          </div>

          {showCreateForm && user?.is_admin && (
            <form onSubmit={handleCreateDept} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Department Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Department Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              <button
                type="submit"
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Department
              </button>
            </form>
          )}

          {deptLoading ? (
            <div className="text-gray-600">Loading departments...</div>
          ) : deptError ? (
            <div className="text-red-600">{deptError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedDept?.id === dept.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-600">{dept.code}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{dept.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Semesters Tab */}
      {activeTab === 'semesters' && (
        <div className="space-y-4">
          {selectedDept ? (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Semesters - {selectedDept.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select a department from the Departments tab first
                  </p>
                </div>
                {user?.is_admin && (
                  <button
                    onClick={handleCreateSemester}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Semester
                  </button>
                )}
              </div>

              {semLoading ? (
                <div className="text-gray-600">Loading semesters...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {semesters.map((sem) => (
                    <div
                      key={sem.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition"
                    >
                      <h3 className="font-semibold text-gray-900">{sem.name}</h3>
                      <p className="text-sm text-gray-600 mt-2">{sem.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Order: {sem.order}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">Select a department first to view semesters</p>
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
            <Link
              to="/cms/courses"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Manage Courses
            </Link>
          </div>
          <div className="p-8 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Go to the CMS dashboard to create and manage courses
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherAcademicDashboard
