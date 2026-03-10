import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import assignmentService from '../services/assignmentService';

const statusColors = {
  submitted: 'bg-blue-100 text-blue-700',
  late:      'bg-orange-100 text-orange-700',
  graded:    'bg-green-100 text-green-700',
};

export default function GradingPage() {
  const { slug, id } = useParams();
  const { user }     = useAuthStore();

  const [assignment, setAssignment]   = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [grading, setGrading]         = useState({}); // subId → {score, feedback}
  const [saving, setSaving]           = useState({});
  const [errors, setErrors]           = useState({});
  const [saved, setSaved]             = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          assignmentService.getAssignment(slug, id),
          assignmentService.getSubmissions(slug, id),
        ]);
        setAssignment(aRes.data);
        setSubmissions(sRes.data);
        // Pre-fill grading fields for already-graded submissions
        const init = {};
        sRes.data.forEach((s) => {
          init[s.id] = { score: s.score ?? '', feedback: s.feedback ?? '' };
        });
        setGrading(init);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id]);

  const handleGrade = async (sub) => {
    const g = grading[sub.id] || {};
    if (g.score === '' || g.score === undefined) {
      setErrors((e) => ({ ...e, [sub.id]: 'Score is required.' }));
      return;
    }
    setSaving((s) => ({ ...s, [sub.id]: true }));
    setErrors((e) => ({ ...e, [sub.id]: '' }));
    try {
      const res = await assignmentService.gradeSubmission(slug, id, sub.id, {
        score:    Number(g.score),
        feedback: g.feedback || '',
      });
      setSubmissions((prev) => prev.map((s) => s.id === sub.id ? { ...s, ...res.data, status: 'graded' } : s));
      setSaved((sv) => ({ ...sv, [sub.id]: true }));
      setTimeout(() => setSaved((sv) => ({ ...sv, [sub.id]: false })), 2000);
    } catch (err) {
      setErrors((e) => ({ ...e, [sub.id]: err.response?.data?.score?.[0] || 'Save failed.' }));
    } finally {
      setSaving((s) => ({ ...s, [sub.id]: false }));
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 py-10 px-4 text-white">
        <div className="max-w-5xl mx-auto">
          <Link to={`/courses/${slug}/assignments/${id}`} className="text-indigo-300 hover:text-white text-sm">
            ← Back to Assignment
          </Link>
          <h1 className="text-3xl font-bold mt-2">Grade: {assignment?.title}</h1>
          <p className="text-indigo-200 mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} ·
            Max score: {assignment?.max_score} pts
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {submissions.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No submissions yet.</p>
        ) : submissions.map((sub) => (
          <div key={sub.id} className="card space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-900">{sub.student_name || sub.student_email}</p>
                <p className="text-xs text-gray-400">{sub.student_email} · {new Date(sub.submitted_at).toLocaleString()}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                {sub.status}
              </span>
            </div>

            {/* Answer */}
            {sub.text_answer && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border">
                {sub.text_answer}
              </div>
            )}
            {sub.file_url && (
              <a href={sub.file_url} download className="text-indigo-600 hover:underline text-sm">
                📎 Download submission file
              </a>
            )}

            {/* Grade form */}
            <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Score (max {assignment?.max_score})
                </label>
                <input
                  type="number" min="0" max={assignment?.max_score}
                  value={grading[sub.id]?.score ?? ''}
                  onChange={(e) => setGrading((g) => ({
                    ...g, [sub.id]: { ...g[sub.id], score: e.target.value }
                  }))}
                  className="input w-full text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
                <input
                  type="text"
                  value={grading[sub.id]?.feedback ?? ''}
                  onChange={(e) => setGrading((g) => ({
                    ...g, [sub.id]: { ...g[sub.id], feedback: e.target.value }
                  }))}
                  className="input w-full text-sm"
                  placeholder="Optional feedback for student"
                />
              </div>
            </div>
            {errors[sub.id] && <p className="text-red-600 text-xs">{errors[sub.id]}</p>}
            <div className="flex justify-end">
              <button
                onClick={() => handleGrade(sub)}
                disabled={saving[sub.id]}
                className="btn btn-primary text-sm"
              >
                {saving[sub.id] ? 'Saving…' : saved[sub.id] ? '✓ Saved' : 'Save Grade'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
