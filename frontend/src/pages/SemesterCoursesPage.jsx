import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import { useSemesterStore } from '../store/semesterStore';
import useCourseStore from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import CourseCard from '../components/academics/CourseCard';
import Layout from '../components/layout/Layout';
import { departmentCover } from '../utils/departmentCovers';

export default function SemesterCoursesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { fetchSemesterBySlug, selectedSemester, loading: semLoading } = useSemesterStore();
  const { courses, fetchCourses, loading: coursesLoading } = useCourseStore();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;
  
  const isTeacher = user?.role === 'teacher' || user?.is_staff;

  useEffect(() => {
    fetchSemesterBySlug(slug);
  }, [slug]);

  useEffect(() => {
    // Fetch all published courses
    fetchCourses({ semester: slug });
  }, [slug, fetchCourses]);

  // Filter courses for this semester
  const semesterCourses = courses || [];
  const totalPages = Math.ceil(semesterCourses.length / coursesPerPage);
  const startIdx = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = semesterCourses.slice(startIdx, startIdx + coursesPerPage);

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      const pending = courses.find((item) => item.id === courseId);
      navigate('/login', { state: { intent: 'enroll', courseSlug: pending?.slug, courseTitle: pending?.title, returnTo: `/semesters/${slug}` } });
      return;
    }
    const course = courses.find((item) => item.id === courseId);
    if (!course || course.availability !== 'available') return;
    await useCourseStore.getState().enrollCourse(course.slug);
    setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
    navigate(`/learn/${course.slug}`);
  };

  const loading = semLoading || coursesLoading;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f6f7fb] py-8 sm:py-12">
        <div className="page-shell max-w-6xl">
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
            <div className="relative mb-9 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-lg">
              <img src={departmentCover(selectedSemester.department_code || courses?.[0]?.department_code)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />
              <div className="relative flex items-end justify-between gap-6 p-7 sm:p-10">
                <div className="max-w-3xl"><p className="eyebrow !text-indigo-300">{selectedSemester.department_name} • {selectedSemester.type} {selectedSemester.order}</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{selectedSemester.name}</h1><p className="mt-4 max-w-2xl leading-7 text-slate-300">{selectedSemester.description || 'Build your knowledge through a focused collection of lectures, practical work, and assessments.'}</p><div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold"><BookOpen size={16} />{selectedSemester.course_count} courses in this semester</div></div>
                {isTeacher && (
                  <button
                    onClick={() => navigate('/courses/new', { state: { semesterId: selectedSemester.id, semesterSlug: slug } })}
                    className="btn shrink-0 bg-white text-slate-950 hover:bg-indigo-50"
                  >
                    <Plus size={20} /> Create Course
                  </button>
                )}
              </div>
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
              <div className="mb-6"><p className="eyebrow">Course catalog</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Learn this semester</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isEnrolled={enrolledCourseIds.has(course.id)}
                    onEnroll={handleEnroll}
                    onClick={() => navigate(course.availability === 'available' ? `/academic-courses/${course.slug}` : `/academic-courses/${course.slug}`)}
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
              <div className="surface text-center py-16">
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
