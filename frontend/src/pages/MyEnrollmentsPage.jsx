import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  BookOpen, BarChart2, PlayCircle, Award,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

const GRAD = [
  'from-indigo-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-orange-500 to-red-500',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-teal-600',
];

export default function MyEnrollmentsPage() {
  // Only read auth state — never read from a shared course/enrollment store
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Local state: completely isolated to this component render
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true);
    setError(null);
    // Always use current localStorage token (updated by setAuth before this fires)
    try {
      const { data } = await api.get('/courses/enrollments/mine/');
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setEnrollments(list);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load your enrollments.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on mount, on auth change, and when user identity changes
  useEffect(() => {
    setEnrollments([]); // clear immediately so old data never flashes
    load();
  }, [isAuthenticated, user?.id, user?.email]); // email as extra guard if id missing

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Courses</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {loading ? 'Loading…' : `${enrollments.length} course${enrollments.length !== 1 ? 's' : ''} enrolled`}
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Fetching your enrollments…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-gray-600">{error}</p>
            <button onClick={load} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && enrollments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <BookOpen className="h-16 w-16 text-indigo-200" />
            <h2 className="text-xl font-bold text-gray-700">No courses yet</h2>
            <p className="text-gray-400 text-sm">Enroll in a course to start learning.</p>
            <Link to="/courses" className="mt-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Browse Courses
            </Link>
          </div>
        )}

        {/* Enrollment grid */}
        {!loading && !error && enrollments.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((e, i) => {
              const progress = Math.round(e.progress ?? 0);
              const grad = GRAD[i % GRAD.length];
              const thumb = e.thumbnail_url;
              return (
                <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                  {/* Thumbnail */}
                  <div className={`aspect-video relative overflow-hidden ${!thumb ? `bg-gradient-to-br ${grad}` : ''}`}>
                    {thumb
                      ? <img src={thumb} alt={e.course_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-white/80" />
                        </div>
                    }
                    {/* Progress overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-2">
                      <div className="flex items-center justify-between text-white text-xs mb-1">
                        <span className="font-medium">{progress}% complete</span>
                        {e.status === 'completed' && <Award className="h-3.5 w-3.5 text-yellow-400" />}
                      </div>
                      <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2">{e.course_title}</h3>
                    <p className="text-xs text-gray-400 mb-3">by {e.teacher_name || 'Instructor'}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><BarChart2 className="h-3.5 w-3.5" />{progress}%</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        e.status === 'completed' ? 'bg-green-100 text-green-700'
                        : e.status === 'dropped' ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>{e.status}</span>
                    </div>

                    <Link
                      to={`/courses/${e.course_slug}/learn`}
                      className="block w-full py-2.5 text-center bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      {progress === 0 ? 'Start Learning →' : progress === 100 ? 'Review Course →' : 'Continue Learning →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
