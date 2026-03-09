import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    api.get('/courses/categories/').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (level) params.append('level', level);
    if (selectedCategory) params.append('category', selectedCategory);

    api.get(`/courses/?${params.toString()}`)
      .then(r => setCourses(r.data))
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, [search, level, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 py-12 px-4 text-white text-center">
        <h1 className="text-4xl font-bold mb-2">Explore Courses</h1>
        <p className="text-indigo-200">Grow your skills with expert-led courses</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input flex-1 min-w-[200px]"
          />
          <select value={level} onChange={e => setLevel(e.target.value)} className="input w-44">
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input w-44">
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : courses.length === 0 ? (
          <p className="text-gray-500 text-center py-20">No courses found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }) {
  const levelColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <Link to={`/courses/${course.slug}`} className="card hover:shadow-lg transition-shadow block">
      {course.thumbnail_url ? (
        <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover rounded-t-xl -mt-6 -mx-6 mb-4" style={{width: 'calc(100% + 3rem)'}} />
      ) : (
        <div className="bg-indigo-100 h-40 rounded-t-xl -mt-6 -mx-6 mb-4 flex items-center justify-center">
          <span className="text-indigo-400 text-4xl">📚</span>
        </div>
      )}
      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{course.title}</h3>
      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">by {course.teacher_name}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[course.level] || ''}`}>
          {course.level}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>{course.module_count} modules</span>
        <span>{course.enrollment_count} students</span>
        <span className="font-semibold text-indigo-600">
          {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
        </span>
      </div>
    </Link>
  );
}
