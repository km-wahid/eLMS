import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSemesterStore } from '../store/semesterStore';
import useCourseStore from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import CourseCard from '../components/academics/CourseCard';
import Layout from '../components/layout/Layout';

export default function SemesterCoursesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { fetchSemesterBySlug, selectedSemester, loading: semLoading } = useSemesterStore();
  const { courses, loading: coursesLoading } = useCourseStore();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  useEffect(() => {
    fetchSemesterBySlug(slug);
  }, [slug]);

  // Filter courses for this semester
  const semesterCourses = courses.filter((c) => c.semester?.slug === slug) || [];
  const totalPages = Math.ceil(semesterCourses.length / coursesPerPage);
  const startIdx = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = semesterCourses.slice(startIdx, startIdx + coursesPerPage);

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    // Would call enrollmentService.enrollCourse(courseId)
    setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
  };

  const loading = semLoading || coursesLoading;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {/* Header */}
          {selectedSemester && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{selectedSemester.name}</h1>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                  {selectedSemester.type === 'semester' ? '📚 Semester' : '⏱️ Trimester'} {selectedSemester.order}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{selectedSemester.description || 'Available courses for this semester'}</p>
              {selectedSemester.start_date && (
                <p className="text-sm text-gray-500">
                  📅 {new Date(selectedSemester.start_date).toLocaleDateString()} - {new Date(selectedSemester.end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && paginatedCourses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={enrolledCourseIds.has(course.id)}
                    onEnroll={handleEnroll}
                    onClick={() => navigate(`/courses/${course.slug}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                          currentPage === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500 text-lg">
                  {selectedSemester
                    ? `No courses available for ${selectedSemester.name}`
                    : 'No courses found'}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
