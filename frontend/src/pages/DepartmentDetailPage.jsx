import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useDepartmentStore } from '../store/departmentStore';
import { useSemesterStore } from '../store/semesterStore';
import Layout from '../components/layout/Layout';

export default function DepartmentDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { fetchDepartmentBySlug, selectedDepartment, loading: deptLoading } = useDepartmentStore();
  const { semesters, fetchSemestersByDepartment, loading: semLoading } = useSemesterStore();

  useEffect(() => {
    const loadDepartment = async () => {
      const dept = await fetchDepartmentBySlug(slug);
      if (dept) {
        fetchSemestersByDepartment(dept.id);
      }
    };
    loadDepartment();
  }, [slug]);

  const loading = deptLoading || semLoading;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/departments')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Departments
          </button>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Department Header */}
          {!loading && selectedDepartment && (
            <>
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl font-bold text-white">{selectedDepartment.code.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{selectedDepartment.name}</h1>
                    <p className="text-lg text-gray-600 mb-4">{selectedDepartment.code}</p>
                    <p className="text-gray-700 mb-6 max-w-2xl">{selectedDepartment.description || 'No description available'}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Semesters/Trimesters</p>
                        <p className="text-2xl font-bold text-indigo-600">{selectedDepartment.semester_count}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Courses</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedDepartment.course_count}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Semesters Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen size={28} />
                  Available Semesters
                </h2>

                {semesters && semesters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {semesters.map((semester) => (
                      <div
                        key={semester.id}
                        onClick={() => navigate(`/semesters/${semester.slug}`)}
                        className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {semester.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {semester.type === 'semester' ? '📚 Semester' : '⏱️ Trimester'} {semester.order}
                            </p>
                          </div>
                        </div>

                        {semester.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{semester.description}</p>
                        )}

                        {semester.start_date && semester.end_date && (
                          <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
                            <p>📅 {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}</p>
                          </div>
                        )}

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-indigo-700">
                            {semester.course_count} course{semester.course_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500 text-lg">No semesters available for this department yet.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Not Found State */}
          {!loading && !selectedDepartment && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg mb-4">Department not found.</p>
              <button
                onClick={() => navigate('/departments')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Return to Departments
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
