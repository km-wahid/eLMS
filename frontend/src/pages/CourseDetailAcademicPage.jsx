import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, FileText, Play } from 'lucide-react';
import useCourseStore from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { courses, loading, fetchCourses } = useCourseStore();
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourses({ search: slug });
  }, [slug]);

  const course = courses?.find((c) => c.slug === slug);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Would call enrollmentService.enrollCourse(course.id)
    setIsEnrolled(true);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Course Content */}
          {!loading && course && (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <div className="mb-6">
                  {course.department && (
                    <p className="text-sm text-indigo-600 font-semibold mb-2">
                      {course.department.name} • {course.course_code}
                    </p>
                  )}
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
                  <p className="text-gray-700 text-lg mb-6">{course.description}</p>

                  {/* Meta Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="text-lg font-semibold text-blue-700">{course.teacher_name || 'Instructor'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Students</p>
                      <p className="text-lg font-semibold text-green-700">{course.enrollment_count || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Level</p>
                      <p className="text-lg font-semibold text-purple-700 capitalize">{course.level}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-semibold text-orange-700">
                        {course.price === 0 ? 'Free' : `$${parseFloat(course.price).toFixed(2)}`}
                      </p>
                    </div>
                  </div>

                  {/* Enroll Button */}
                  {!isEnrolled && (
                    <button
                      onClick={handleEnroll}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
                    >
                      {isAuthenticated ? 'Enroll in Course' : 'Sign in to Enroll'}
                    </button>
                  )}
                  {isEnrolled && (
                    <div className="w-full px-6 py-3 bg-green-100 text-green-700 rounded-lg text-lg font-semibold flex items-center justify-center gap-2">
                      ✓ You are enrolled in this course
                    </div>
                  )}
                </div>
              </div>

              {/* Course Structure */}
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen size={28} />
                  Course Structure
                </h2>

                <div className="space-y-4">
                  {course.modules && course.modules.length > 0 ? (
                    course.modules.map((module, idx) => (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {idx + 1}. {module.title}
                        </h3>
                        {module.description && <p className="text-sm text-gray-600 mb-3">{module.description}</p>}
                        <p className="text-xs text-indigo-600 font-semibold">
                          {module.lectures?.length || 0} lectures
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">Course modules loading...</p>
                  )}
                </div>
              </div>

              {/* Materials Section */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText size={28} />
                  Course Materials
                </h2>

                {course.materials && course.materials.length > 0 ? (
                  <div className="space-y-3">
                    {course.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{material.title}</p>
                          <p className="text-sm text-gray-600">{material.file_type}</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No materials uploaded yet.</p>
                )}
              </div>
            </>
          )}

          {/* Not Found */}
          {!loading && !course && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg mb-4">Course not found.</p>
              <button
                onClick={() => navigate('/courses')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Browse All Courses
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
