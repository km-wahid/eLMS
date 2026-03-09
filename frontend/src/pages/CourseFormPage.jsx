import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function CourseFormPage() {
  const { slug } = useParams(); // if slug → edit mode
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = Boolean(slug);

  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'beginner',
    price: '0.00',
    thumbnail_url: '',
    category_id: '',
    is_published: false,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses/categories/').then(r => setCategories(r.data)).catch(() => {});
    if (isEdit) {
      api.get(`/courses/${slug}/`).then(r => {
        const c = r.data;
        setForm({
          title: c.title,
          description: c.description,
          level: c.level,
          price: c.price,
          thumbnail_url: c.thumbnail_url || '',
          category_id: c.category?.id || '',
          is_published: c.is_published,
        });
      }).catch(() => setError('Failed to load course.'));
    }
  }, [slug]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (isEdit) {
        await api.patch(`/courses/${slug}/update/`, payload);
        navigate(`/courses/${slug}`);
      } else {
        const res = await api.post('/courses/create/', payload);
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
    return <div className="text-center py-20 text-red-600">Students cannot create courses.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="card w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Course' : 'Create New Course'}
        </h1>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input" placeholder="e.g. Introduction to Python" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required className="input h-32 resize-none" placeholder="What will students learn?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select name="level" value={form.level} onChange={handleChange} className="input">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="input" />
            </div>
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
