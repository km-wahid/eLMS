import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import assignmentService from '../services/assignmentService';
import courseService from '../services/courseService';

const statusColors = {
  submitted: 'bg-blue-100 text-blue-700',
  late:      'bg-orange-100 text-orange-700',
  graded:    'bg-green-100 text-green-700',
};

export default function AssignmentsPage() {
  const { slug }       = useParams();
  const { user }       = useAuthStore();
  const [course, setCourse]             = useState(null);
  const [assignments, setAssignments]   = useState([]);
  const [mySubmissions, setMySubmissions] = useState({});
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', max_score: 100 });
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');

  const isTeacher = course && (user?.role === 'admin' || course.teacher === user?.id);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          courseService.getCourseBySlug(slug),
          assignmentService.getAssignments(slug),
        ]);
        setCourse(cRes.data);
        setAssignments(aRes.data);

        // Students: load their own submission statuses
        if (user?.role === 'student') {
          const sRes = await assignmentService.getMySubmissions(slug);
          const map  = {};
          sRes.data.forEach((s) => { map[s.assignment] = s; });
          setMySubmissions(map);
        }
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    setSaving(true); setFormError('');
    try {
      const res = await assignmentService.createAssignment(slug, {
        ...form,
        due_date:  form.due_date || null,
        is_published: true,
      });
      setAssignments((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm({ title: '', description: '', due_date: '', max_score: 100 });
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await assignmentService.deleteAssignment(slug, id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch { alert('Delete failed.'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 py-10 px-4 text-white">
        <div className="max-w-4xl mx-auto">
          <Link to={`/courses/${slug}`} className="text-indigo-300 hover:text-white text-sm">
            ← {course?.title || 'Back to Course'}
          </Link>
          <h1 className="text-3xl font-bold mt-2">Assignments</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {/* Teacher: create form */}
        {isTeacher && (
          <div className="flex justify-end">
            <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary">
              {showForm ? 'Cancel' : '+ New Assignment'}
            </button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="card space-y-4">
            <h3 className="font-bold text-lg">New Assignment</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input w-full h-28 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="datetime-local" value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                <input type="number" min="1" value={form.max_score}
                  onChange={(e) => setForm((f) => ({ ...f, max_score: Number(e.target.value) }))}
                  className="input w-full" />
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Assignment list */}
        {assignments.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No assignments yet.</p>
        ) : assignments.map((a) => {
          const mySub = mySubmissions[a.id];
          return (
            <div key={a.id} className="card flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  {a.is_overdue && !mySub && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Overdue</span>
                  )}
                  {mySub && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[mySub.status]}`}>
                      {mySub.status === 'graded' ? `Graded: ${mySub.score}/${a.max_score}` : mySub.status}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm line-clamp-2">{a.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {a.due_date && <span>Due: {new Date(a.due_date).toLocaleString()}</span>}
                  <span>Max: {a.max_score} pts</span>
                  {isTeacher && <span>{a.submission_count} submissions</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                <Link to={`/courses/${slug}/assignments/${a.id}`} className="btn btn-primary text-xs">
                  {isTeacher ? 'View / Grade' : mySub ? 'View Submission' : 'Submit'}
                </Link>
                {isTeacher && (
                  <button onClick={() => handleDelete(a.id)}
                    className="text-xs text-red-500 hover:text-red-700">Delete</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
