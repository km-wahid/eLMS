import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, FileText, Play, ExternalLink, Clock3, CheckCircle2, LockKeyhole } from 'lucide-react';
import useCourseStore from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';
import { departmentCover } from '../utils/departmentCovers';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentCourse: course, loading, fetchCourseBySlug, enrollCourse } = useCourseStore();
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourseBySlug(slug);
  }, [slug]);

  useEffect(() => {
    setIsEnrolled(Boolean(course?.is_enrolled));
  }, [course?.is_enrolled]);

  const contentIcon = (type) => type === 'video' ? Play : type === 'link' ? ExternalLink : type === 'text' ? BookOpen : FileText;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { intent: 'enroll', courseSlug: course.slug, courseTitle: course.title, returnTo: `/academic-courses/${course.slug}` } });
      return;
    }
    if (course.availability !== 'available') return;
    await enrollCourse(course.slug);
    setIsEnrolled(true);
    navigate(`/learn/${course.slug}`);
  };

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
              <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl mb-8">
                <img src={departmentCover(course.department?.code)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
                <div className="relative max-w-3xl p-7 sm:p-12">
                  {course.department && (
                    <p className="eyebrow !text-indigo-300 mb-3">
                      {course.department.name} • {course.course_code}
                    </p>
                  )}
                  <h1 className="text-4xl font-black tracking-tight sm:text-6xl mb-5">{course.title}</h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg mb-8">{course.description}</p>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs text-slate-300">Instructor</p>
                      <p className="mt-1 font-semibold text-white">{course.teacher_name || 'Instructor'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs text-slate-300">Learners</p><p className="mt-1 font-semibold">{course.enrollment_count || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs text-slate-300">Level</p><p className="mt-1 font-semibold capitalize">{course.level}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs text-slate-300">Access</p><p className="mt-1 font-semibold">
                        {course.price === 0 ? 'Free' : `$${parseFloat(course.price).toFixed(2)}`}
                      </p>
                    </div>
                  </div>

                  {/* Enroll Button */}
                  {course.availability !== 'available' && (
                    <div className="w-full px-6 py-3 bg-amber-100 text-amber-800 rounded-lg text-lg font-semibold text-center">Coming soon — enrollment is not open yet</div>
                  )}
                  {course.availability === 'available' && !isEnrolled && (
                    <button
                      onClick={handleEnroll}
                      className="btn bg-white text-slate-950 hover:bg-indigo-50 text-base"
                    >
                      {isAuthenticated ? 'Enroll in Course' : 'Sign in to Enroll'}
                    </button>
                  )}
                  {isEnrolled && (
                    <button onClick={() => navigate(`/learn/${course.slug}`)} className="btn bg-emerald-400 text-emerald-950 hover:bg-emerald-300"><CheckCircle2 size={18} /> Continue learning</button>
                  )}
                </div>
              </div>

              {/* Course Structure */}
              <div className="surface p-6 sm:p-8 mb-8">
                <div className="mb-7"><p className="eyebrow">Curriculum</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 flex items-center gap-3">
                  <BookOpen size={28} />
                  What you’ll learn
                </h2><p className="mt-2 text-slate-600">Browse the complete module and content outline before you begin.</p></div>

                <div className="space-y-4">
                  {course.modules && course.modules.length > 0 ? (
                    course.modules.map((module, idx) => (
                      <div key={module.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
                        <div className="flex items-start gap-4 border-b border-slate-200 bg-white p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 font-black text-indigo-700">{String(idx + 1).padStart(2, '0')}</span><div><h3 className="font-bold text-slate-950">{module.title}</h3>{module.description && <p className="mt-1 text-sm text-slate-600">{module.description}</p>}</div></div>
                        <div className="divide-y divide-slate-200/80">
                          {(module.content_items || []).map((item) => { const Icon = contentIcon(item.content_type); return <div key={item.id} className="flex items-center gap-3 px-5 py-3.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm"><Icon size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{item.title}</p><p className="text-xs capitalize text-slate-500">{item.content_type}</p></div>{isEnrolled ? <CheckCircle2 size={17} className="text-emerald-500" /> : <LockKeyhole size={15} className="text-slate-400" />}</div> })}
                          {!module.content_items?.length && <p className="px-5 py-4 text-sm text-slate-500">Content is being prepared.</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">This course is coming soon. Its curriculum will appear here when publishing is complete.</div>
                  )}
                </div>
              </div>

              {/* Learning callout */}
              <div className="rounded-3xl bg-indigo-600 p-7 text-white sm:flex sm:items-center sm:justify-between">
                <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <FileText size={28} />
                  Ready to start?
                </h2>
                <p className="text-indigo-100">Enroll to unlock videos, readings, notes, discussions, assignments, and progress tracking.</p>
                </div>
                {isEnrolled && <button onClick={() => navigate(`/learn/${course.slug}`)} className="btn mt-5 bg-white text-indigo-700 hover:bg-indigo-50 sm:mt-0">Open classroom <Play size={17} /></button>}
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
