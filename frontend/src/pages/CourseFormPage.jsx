import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function CourseFormPage() {
  const { slug } = useParams(); // if slug → edit mode
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isEdit = Boolean(slug);
  
  // Get semester info from navigation state if creating from semester page
  const semesterState = location.state || {};

  const [form, setForm] = useState({
    title: '',
    course_code: '',
    description: '',
    thumbnail_url: '',
    category_id: '',
    is_published: false,
    department: semesterState.departmentId || '',
    semester: semesterState.semesterId || '',
  });
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch departments
    api.get('/academics/departments/').then(r => setDepartments(r.data.results || r.data)).catch(() => {});
    api.get('/courses/categories/').then(r => setCategories(r.data.results || r.data)).catch(() => {});
    
    if (isEdit) {
      api.get(`/courses/${slug}/`).then(r => {
        const c = r.data;
        setForm({
          title: c.title,
          course_code: c.course_code || '',
          description: c.description,
          thumbnail_url: c.thumbnail_url || '',
          category_id: c.category?.id || '',
          is_published: c.is_published,
          department: c.department?.id || '',
          semester: c.semester?.id || '',
        });
      }).catch(() => setError('Failed to load course.'))
      .finally(() => setPageLoading(false));
    } else {
      setPageLoading(false);
    }
  }, [slug, isEdit]);

  // Fetch semesters when department changes
  useEffect(() => {
    if (form.department) {
      api.get('/academics/semesters/', { params: { department: form.department } })
        .then(r => setSemesters(r.data.results || r.data))
        .catch(() => setSemesters([]));
    } else {
      setSemesters([]);
    }
  }, [form.department]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        course_code: form.course_code,
        description: form.description,
        thumbnail_url: form.thumbnail_url,
        is_published: form.is_published,
      };
      
      // Add optional fields
      if (form.category_id) payload.category_id = form.category_id;
      if (form.department) payload.department_id = form.department;
      if (form.semester) payload.semester_id = form.semester;
      
      if (isEdit) {
        await api.patch(`/courses/courses/${slug}/update/`, payload);
        navigate(`/courses/${slug}`);
      } else {
        const res = await api.post('/courses/courses/create/', payload);
        navigate(`/courses/${res.data.slug}`);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        setError(Object.values(data).flat().join(' '));
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-20">
          <p className="text-red-600 text-lg">Students cannot create courses.</p>
          <button onClick={() => navigate('/my-learning')} className="mt-4 btn btn-primary">
            Go to My Learning
          </button>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="card w-full max-w-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Course' : 'Create New Course'}
        </h1>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select name="department" value={form.department} onChange={handleChange} className="input">
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select name="semester" value={form.semester} onChange={handleChange} disabled={!form.department} className="input disabled:bg-gray-100">
                <option value="">— Select Semester —</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input" placeholder="e.g. Introduction to Python" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
            <input name="course_code" value={form.course_code} onChange={handleChange} required className="input" placeholder="e.g. CS101, BBA201, ENG301" />
            <p className="text-xs text-gray-500 mt-1">Unique identifier for this course</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required className="input h-32 resize-none" placeholder="What will students learn?" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="input">
              <option value="">— None —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input name="thumbnail_url" value={form.thumbnail_url} onChange={handleChange} className="input" placeholder="https://..." />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_published" name="is_published" checked={form.is_published} onChange={handleChange} className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">Publish course (visible to students)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
