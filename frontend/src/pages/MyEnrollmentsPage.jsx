import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MyEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/enrollments/mine/')
      .then(r => setEnrollments(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Learning</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-lg">You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="btn btn-primary mt-4 inline-block">Browse Courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(e => (
              <div key={e.id} className="card">
                <div className="bg-indigo-100 h-28 rounded-lg mb-3 flex items-center justify-center text-3xl overflow-hidden">
                  {e.thumbnail_url ? (
                    <img src={e.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : '📚'}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{e.course_title}</h3>
                <p className="text-sm text-gray-500 mb-3">by {e.teacher_name}</p>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(e.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${e.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.status === 'completed' ? 'bg-green-100 text-green-700'
                    : e.status === 'dropped' ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                    {e.status}
                  </span>
                  <Link to={`/courses/${e.course_id}`} className="btn btn-secondary text-xs px-3 py-1">
                    {e.progress > 0 ? 'Continue →' : 'Start →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
