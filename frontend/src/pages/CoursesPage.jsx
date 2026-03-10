import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Users, Star, Search, Filter } from 'lucide-react';

// ─── Demo courses (static, always visible) ────────────────
const DEMO_COURSES = [
  {
    id: 1, slug: 'python-for-beginners',
    title: 'Python for Beginners',
    description: 'Learn Python from scratch. Variables, loops, functions and real projects.',
    instructor_name: 'Dr. Sarah Ahmed',
    level: 'beginner', price: '0.00',
    thumbnail: null,
    total_enrolled: 1240, rating: 4.8,
    modules_count: 12, duration: '18h 30m',
    category: 'Programming',
  },
  {
    id: 2, slug: 'web-dev-bootcamp',
    title: 'Full-Stack Web Development',
    description: 'HTML, CSS, JavaScript, React and Django — build real-world web apps.',
    instructor_name: 'Prof. Ali Hassan',
    level: 'intermediate', price: '49.99',
    thumbnail: null,
    total_enrolled: 870, rating: 4.9,
    modules_count: 20, duration: '42h',
    category: 'Web Development',
  },
  {
    id: 3, slug: 'data-science-essentials',
    title: 'Data Science Essentials',
    description: 'Pandas, NumPy, Matplotlib and Machine Learning fundamentals.',
    instructor_name: 'Dr. Fatima Khan',
    level: 'intermediate', price: '39.99',
    thumbnail: null,
    total_enrolled: 650, rating: 4.7,
    modules_count: 15, duration: '28h',
    category: 'Data Science',
  },
  {
    id: 4, slug: 'ui-ux-design',
    title: 'UI/UX Design Masterclass',
    description: 'Figma, design systems, prototyping and user research techniques.',
    instructor_name: 'Usman Malik',
    level: 'beginner', price: '29.99',
    thumbnail: null,
    total_enrolled: 430, rating: 4.6,
    modules_count: 10, duration: '15h',
    category: 'Design',
  },
  {
    id: 5, slug: 'django-rest-api',
    title: 'Django REST API Development',
    description: 'Build production-ready APIs with Django, DRF, JWT and PostgreSQL.',
    instructor_name: 'Prof. Ali Hassan',
    level: 'advanced', price: '59.99',
    thumbnail: null,
    total_enrolled: 310, rating: 4.9,
    modules_count: 18, duration: '32h',
    category: 'Programming',
  },
  {
    id: 6, slug: 'machine-learning-az',
    title: 'Machine Learning A-Z',
    description: 'Supervised & unsupervised learning, neural networks and deployment.',
    instructor_name: 'Dr. Fatima Khan',
    level: 'advanced', price: '69.99',
    thumbnail: null,
    total_enrolled: 520, rating: 4.8,
    modules_count: 22, duration: '48h',
    category: 'Data Science',
  },
];

const LEVEL_BADGE = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
};

const COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-600',
];

function CourseCard({ course, colorIdx }) {
  return (
    <Link to={`/courses/${course.slug}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Thumbnail */}
      <div className={`h-40 bg-gradient-to-br ${COLORS[colorIdx % COLORS.length]} flex items-center justify-center relative`}>
        <BookOpen className="h-14 w-14 text-white/80" />
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/90 ${LEVEL_BADGE[course.level]}`}>
          {course.level}
        </span>
        {parseFloat(course.price) === 0 && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">FREE</span>
        )}
      </div>

      <div className="p-5">
        <span className="text-xs text-indigo-600 font-medium">{course.category}</span>
        <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>

        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {course.instructor_name?.[0]}
          </div>
          <span>{course.instructor_name}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.total_enrolled?.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration || `${course.modules_count} modules`}</span>
          <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3.5 w-3.5 fill-yellow-400" />{course.rating}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-gray-900">
            {parseFloat(course.price) === 0 ? 'Free' : `$${course.price}`}
          </span>
          <span className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg group-hover:bg-indigo-700 transition-colors">
            View Course →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel]   = useState('');
  const [cat, setCat]       = useState('');

  const categories = [...new Set(DEMO_COURSES.map(c => c.category))];

  const filtered = DEMO_COURSES.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchLevel  = !level || c.level === level;
    const matchCat    = !cat   || c.category === cat;
    return matchSearch && matchLevel && matchCat;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 py-14 px-4 text-white text-center">
        <h1 className="text-4xl font-extrabold mb-2">Explore Courses</h1>
        <p className="text-indigo-200 text-lg">Grow your skills with expert-led courses</p>
        <div className="mt-6 max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filter:</span>
          {['', 'beginner', 'intermediate', 'advanced'].map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${level === l ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400'}`}>
              {l || 'All Levels'}
            </button>
          ))}
          <span className="w-px h-4 bg-gray-200" />
          {['', ...categories].map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${cat === c ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-400'}`}>
              {c || 'All Categories'}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-400 mb-4">{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No courses match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => <CourseCard key={course.id} course={course} colorIdx={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
