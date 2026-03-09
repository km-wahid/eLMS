import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/mine/')
      .then(r => setCourses(r.data))
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (course) => {
    try {
      const res = await api.patch(`/courses/${course.slug}/update/`, {
        is_published: !course.is_published,
      });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: res.data.is_published } : c));
    } catch {
      alert('Failed to update course.');
    }
  };

  const deleteCourse = async (slug) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await api.delete(`/courses/${slug}/delete/`);
      setCourses(prev => prev.filter(c => c.slug !== slug));
    } catch {
      alert('Failed to delete course.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <Link to="/courses/new" className="btn btn-primary">+ New Course</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-lg">No courses yet.</p>
            <Link to="/courses/new" className="btn btn-primary mt-4 inline-block">Create your first course</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(course => (
              <div key={course.id} className="card flex items-center gap-4">
                <div className="w-20 h-16 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                  <p className="text-sm text-gray-500">{course.enrollment_count} students · {course.module_count} modules</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                  <Link to={`/courses/${course.slug}`} className="btn btn-secondary text-xs px-3 py-1">View</Link>
                  <Link to={`/courses/${course.slug}/edit`} className="btn btn-secondary text-xs px-3 py-1">Edit</Link>
                  <button onClick={() => togglePublish(course)} className="btn btn-secondary text-xs px-3 py-1">
                    {course.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => deleteCourse(course.slug)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
