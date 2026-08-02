import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays } from 'lucide-react';
import { useDepartmentStore } from '../store/departmentStore';
import { useSemesterStore } from '../store/semesterStore';
import Layout from '../components/layout/Layout';
import { departmentCover } from '../utils/departmentCovers';

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
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f6f7fb] py-8 sm:py-12">
        <div className="page-shell max-w-6xl">
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
              <div className="relative mb-10 min-h-[390px] overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
                <img src={departmentCover(selectedDepartment.code)} alt={`${selectedDepartment.name} facilities`} className="absolute inset-0 h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                <div className="relative flex min-h-[390px] max-w-3xl flex-col justify-end p-7 sm:p-12">
                  <p className="eyebrow !text-indigo-300">Department of {selectedDepartment.code}</p>
                  <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{selectedDepartment.name}</h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">{selectedDepartment.description || 'Explore the full academic journey, from foundations to advanced practice.'}</p>
                  <div className="mt-7 flex gap-3"><div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur"><p className="text-2xl font-black">{selectedDepartment.semester_count}</p><p className="text-xs text-slate-300">Semesters</p></div><div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur"><p className="text-2xl font-black">{selectedDepartment.course_count}</p><p className="text-xs text-slate-300">Courses</p></div></div>
                </div>
              </div>

              {/* Semesters Section */}
              <div>
                <p className="eyebrow">Program structure</p><h2 className="mb-6 mt-2 flex items-center gap-2 text-3xl font-black tracking-tight text-slate-950"><BookOpen size={28} />Choose a semester</h2>

                {semesters && semesters.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {semesters.map((semester) => (
                      <div
                        key={semester.id}
                        onClick={() => navigate(`/semesters/${semester.slug}`)}
                        className="group surface cursor-pointer p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 font-black text-indigo-700">{String(semester.order).padStart(2, '0')}</span><h3 className="text-xl font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                              {semester.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {semester.type === 'semester' ? 'Semester' : 'Trimester'} {semester.order}
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

                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-700">
                            {semester.course_count} course{semester.course_count !== 1 ? 's' : ''}
                          </p><ArrowUpRight size={18} className="text-indigo-600 transition-transform group-hover:rotate-45" />
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
