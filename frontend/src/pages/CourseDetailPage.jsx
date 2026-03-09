import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get(`/courses/${slug}/`)
      .then(r => setCourse(r.data))
      .catch(() => setError('Course not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    setEnrolling(true);
    try {
      await api.post(`/courses/${slug}/enroll/`);
      setCourse(prev => ({ ...prev, is_enrolled: true, enrollment_count: prev.enrollment_count + 1 }));
      setSuccessMsg('Enrolled successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error && !course) {
    return <div className="text-center py-20 text-red-600">{error}</div>;
  }

  const levelColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-indigo-800 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/courses" className="text-indigo-300 hover:text-white text-sm mb-4 inline-block">
            ← Back to Courses
          </Link>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[course.level]}`}>
                  {course.level}
                </span>
                {course.category_name && (
                  <span className="text-indigo-300 text-sm">{course.category_name}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
              <p className="text-indigo-200 mb-4">{course.description}</p>
              <p className="text-sm text-indigo-300">
                By <span className="text-white font-medium">{course.teacher_name}</span>
              </p>
              <div className="flex gap-6 mt-4 text-sm text-indigo-200">
                <span>👥 {course.enrollment_count} students</span>
                <span>📚 {course.modules?.length || 0} modules</span>
              </div>
            </div>
            {/* CTA Card */}
            <div className="bg-white rounded-xl p-6 text-gray-900 w-full md:w-72 shadow-xl self-start">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover rounded-lg mb-4" />
              ) : (
                <div className="bg-indigo-100 h-36 rounded-lg mb-4 flex items-center justify-center text-4xl">📚</div>
              )}
              <p className="text-3xl font-bold text-indigo-600 mb-4">
                {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
              </p>
              {successMsg ? (
                <p className="text-green-600 text-center font-medium">{successMsg}</p>
              ) : course.is_enrolled ? (
                <Link to={`/courses/${slug}/learn`} className="btn btn-primary w-full block text-center">
                  Continue Learning →
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn btn-primary w-full"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-3">
            {course.modules.map((mod, i) => (
              <div key={mod.id} className="card flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{mod.title}</h3>
                  {mod.description && <p className="text-gray-500 text-sm">{mod.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No modules added yet.</p>
        )}
      </div>
    </div>
  );
}
