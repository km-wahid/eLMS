import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import useCourseStore from '../store/courseStore';
import ProgressBar from '../components/academics/ProgressBar';
import Layout from '../components/layout/Layout';

export default function ProgressPage() {
  const { isAuthenticated } = useAuthStore();
  const { progress, loading, fetchProgress } = useProgressStore();
  const { courses } = useCourseStore();
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
    }
  }, [isAuthenticated]);

  // Get courses from enrollments for the user
  const enrolledCourses = courses?.filter((c) => {
    // This would come from enrollment data in real app
    return true; // Placeholder
  }) || [];

  // Calculate progress for each course
  const courseProgress = enrolledCourses.map((course) => {
    const lecturesWatched = progress?.filter(
      (p) => p.lecture && p.action === 'lecture_watched'
    ).length || 0;
    const materialsDownloaded = progress?.filter(
      (p) => p.material && p.action === 'material_downloaded'
    ).length || 0;
    return {
      ...course,
      lecturesWatched,
      materialsDownloaded,
      totalLectures: course.module_count * 2, // Estimated
      totalMaterials: 10, // Estimated
    };
  });

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in to view progress</h2>
            <p className="text-gray-600">You need to be signed in to track your learning progress.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Learning Progress</h1>
            <p className="text-gray-600">Track your completion across all courses</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Overall Stats */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-1">Total Lectures Watched</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {progress?.filter((p) => p.action === 'lecture_watched').length || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-1">Materials Downloaded</p>
                <p className="text-3xl font-bold text-green-600">
                  {progress?.filter((p) => p.action === 'material_downloaded').length || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-1">Active Courses</p>
                <p className="text-3xl font-bold text-purple-600">{enrolledCourses.length}</p>
              </div>
            </div>
          )}

          {/* Course Progress Grid */}
          {!loading && courseProgress.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courseProgress.map((course) => (
                <div key={course.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{course.title}</h3>
                  <ProgressBar
                    lecturesWatched={course.lecturesWatched}
                    totalLectures={course.totalLectures}
                    materialsDownloaded={course.materialsDownloaded}
                    totalMaterials={course.totalMaterials}
                  />
                  <button
                    onClick={() => setSelectedCourse(course.id)}
                    className="mt-4 w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-semibold"
                  >
                    View Course
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500 text-lg">
                  No courses enrolled yet. Enroll in a course to start tracking progress!
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
