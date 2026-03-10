import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import assignmentService from '../services/assignmentService';

const statusColors = {
  submitted: 'bg-blue-100 text-blue-700',
  late:      'bg-orange-100 text-orange-700',
  graded:    'bg-green-100 text-green-700',
};

export default function AssignmentDetailPage() {
  const { slug, id } = useParams();
  const { user }     = useNavigate ? { user: null } : {};
  const { user: authUser } = useAuthStore();
  const navigate     = useNavigate();

  const [assignment, setAssignment]   = useState(null);
  const [submission, setSubmission]   = useState(null);
  const [submissions, setSubmissions] = useState([]); // teacher view
  const [loading, setLoading]         = useState(true);

  // Submit form state
  const [textAnswer, setTextAnswer]   = useState('');
  const [file, setFile]               = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const isTeacher = assignment &&
    (authUser?.role === 'admin' || assignment.teacher === authUser?.id);

  useEffect(() => {
    const load = async () => {
      try {
        const aRes = await assignmentService.getAssignment(slug, id);
        setAssignment(aRes.data);

        // Try to load submission (student) or submissions (teacher via GradingPage)
        try {
          const sRes = await assignmentService.getMySubmission(slug, id);
          setSubmission(sRes.data);
        } catch {
          // No submission yet
        }
      } catch {
        navigate(`/courses/${slug}/assignments`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textAnswer.trim() && !file) {
      setSubmitError('Please provide a text answer or upload a file.');
      return;
    }
    setSubmitting(true); setSubmitError('');
    const data = new FormData();
    if (textAnswer) data.append('text_answer', textAnswer);
    if (file) data.append('file', file);

    try {
      const res = await assignmentService.submit(slug, id, data);
      setSubmission(res.data);
      setSubmitSuccess('Submitted successfully!');
      setTextAnswer(''); setFile(null);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  if (!assignment) return null;

  const isOverdue = assignment.due_date && new Date() > new Date(assignment.due_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 py-10 px-4 text-white">
        <div className="max-w-3xl mx-auto">
          <Link to={`/courses/${slug}/assignments`} className="text-indigo-300 hover:text-white text-sm">
            ← Assignments
          </Link>
          <h1 className="text-3xl font-bold mt-2">{assignment.title}</h1>
          <div className="flex gap-4 mt-2 text-sm text-indigo-200">
            {assignment.due_date && (
              <span className={isOverdue ? 'text-red-300' : ''}>
                Due: {new Date(assignment.due_date).toLocaleString()}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
            <span>Max: {assignment.max_score} pts</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Description */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-2">Instructions</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{assignment.description}</p>
        </div>

        {/* Teacher: link to grading */}
        {authUser?.role !== 'student' && (
          <Link
            to={`/courses/${slug}/assignments/${id}/grade`}
            className="btn btn-primary inline-block"
          >
            📋 View & Grade Submissions ({assignment.submission_count})
          </Link>
        )}

        {/* Student: submission status */}
        {authUser?.role === 'student' && submission && (
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Your Submission</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[submission.status]}`}>
                {submission.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Submitted: {new Date(submission.submitted_at).toLocaleString()}
            </p>
            {submission.text_answer && (
              <p className="text-gray-700 whitespace-pre-wrap border-t pt-2">{submission.text_answer}</p>
            )}
            {submission.file_url && (
              <a href={submission.file_url} download className="text-indigo-600 hover:underline text-sm">
                📎 Download submitted file
              </a>
            )}
            {submission.status === 'graded' && (
              <div className="border-t pt-3 mt-2 space-y-1">
                <p className="font-semibold text-gray-800">
                  Score: <span className="text-indigo-600">{submission.score} / {assignment.max_score}</span>
                </p>
                {submission.feedback && (
                  <p className="text-gray-600 text-sm">{submission.feedback}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Student: submit / re-submit form */}
        {authUser?.role === 'student' && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">
              {submission ? 'Re-submit Assignment' : 'Submit Assignment'}
            </h2>
            {submitSuccess ? (
              <p className="text-green-600 font-medium">{submitSuccess}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Answer</label>
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    className="input w-full h-32 resize-none"
                    placeholder="Write your answer here…"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload File</label>
                  <input type="file" onChange={(e) => setFile(e.target.files[0])}
                    className="text-sm text-gray-600" />
                </div>
                {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting…' : submission ? 'Re-submit' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
