import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import courseService from '../services/courseService';
import liveService from '../services/liveService';

const STATUS_STYLES = {
  scheduled: { dot: 'bg-blue-400',   text: 'text-blue-700',   label: 'Scheduled' },
  live:      { dot: 'bg-red-500 animate-pulse', text: 'text-red-600', label: '● LIVE' },
  ended:     { dot: 'bg-gray-400',   text: 'text-gray-500',   label: 'Ended' },
  cancelled: { dot: 'bg-yellow-400', text: 'text-yellow-600', label: 'Cancelled' },
};

const PLATFORMS = { zoom: '🎥 Zoom', jitsi: '🔵 Jitsi', meet: '🟢 Meet',
                    teams: '💜 Teams', other: '🌐 Other' };

function Countdown({ scheduledAt }) {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    const calc = () => { const ms = new Date(scheduledAt) - Date.now(); setDiff(ms > 0 ? ms : 0); };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  if (diff === null || diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return <span className="text-xs text-indigo-600 font-mono">Starts in {h > 0 ? `${h}h ` : ''}{m}m {s}s</span>;
}

export default function LiveSessionsPage() {
  const { slug }  = useParams();
  const { user }  = useAuthStore();
  const [course, setCourse]       = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', scheduled_at: '',
    duration_minutes: 60, platform: 'zoom',
    meeting_url: '', meeting_id: '', passcode: '',
  });

  const isTeacher = course && (user?.role === 'admin' || course.teacher === user?.id);

  const loadData = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        courseService.getCourseBySlug(slug),
        liveService.getSessions(slug),
      ]);
      setCourse(cRes.data);
      setSessions(sRes.data);
    } finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduled_at) { setFormError('Title and scheduled time are required.'); return; }
    setSaving(true); setFormError('');
    try {
      const res = await liveService.createSession(slug, form);
      setSessions((prev) => [...prev, res.data]);
      setShowForm(false);
      setForm({ title: '', description: '', scheduled_at: '', duration_minutes: 60, platform: 'zoom', meeting_url: '', meeting_id: '', passcode: '' });
    } catch (err) {
      const d = err.response?.data;
      setFormError(d?.scheduled_at?.[0] || d?.detail || 'Failed to create.');
    } finally { setSaving(false); }
  };

  const handleGoLive  = async (id) => {
    try { const res = await liveService.goLive(slug, id); setSessions((p) => p.map((s) => s.id === id ? { ...s, ...res.data } : s)); }
    catch (err) { alert(err.response?.data?.detail || 'Could not go live.'); }
  };
  const handleEnd = async (id) => {
    const rec = window.prompt('Recording URL (optional):') ?? '';
    try { const res = await liveService.endSession(slug, id, rec); setSessions((p) => p.map((s) => s.id === id ? { ...s, ...res.data } : s)); }
    catch (err) { alert(err.response?.data?.detail || 'Could not end session.'); }
  };
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this session?')) return;
    try { await liveService.cancelSession(slug, id); setSessions((p) => p.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s)); }
    catch { alert('Failed.'); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 py-10 px-4 text-white">
        <div className="max-w-4xl mx-auto">
          <Link to={`/courses/${slug}`} className="text-indigo-300 hover:text-white text-sm">← {course?.title || 'Back'}</Link>
          <h1 className="text-3xl font-bold mt-2">Live Classes</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {isTeacher && (
          <div className="flex justify-end">
            <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary">
              {showForm ? 'Cancel' : '+ Schedule Session'}
            </button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="card space-y-4">
            <h3 className="font-bold text-lg">Schedule Live Session</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At *</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input type="number" min="15" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} className="input w-full">
                  {Object.entries(PLATFORMS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL</label>
                <input type="url" value={form.meeting_url} onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))} className="input w-full" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
                <input type="text" value={form.meeting_id} onChange={(e) => setForm((f) => ({ ...f, meeting_id: e.target.value }))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passcode</label>
                <input type="text" value={form.passcode} onChange={(e) => setForm((f) => ({ ...f, passcode: e.target.value }))} className="input w-full" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input w-full h-20 resize-none" />
              </div>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Scheduling…' : 'Schedule'}</button>
            </div>
          </form>
        )}

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No live sessions scheduled yet.</p>
        ) : sessions.map((s) => {
          const st = STATUS_STYLES[s.status] || STATUS_STYLES.scheduled;
          return (
            <div key={s.id} className="card flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${st.text}`}>
                    <span className={`w-2 h-2 rounded-full inline-block ${st.dot}`} />
                    {st.label}
                  </span>
                  <span className="text-xs text-gray-400">{PLATFORMS[s.platform] || s.platform}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{s.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min · Host: {s.host_name}
                </p>
                {s.status === 'scheduled' && <Countdown scheduledAt={s.scheduled_at} />}
              </div>
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                <Link to={`/courses/${slug}/live/${s.id}`} className="btn btn-primary text-xs">View Details</Link>
                {isTeacher && s.status === 'scheduled' && (
                  <button onClick={() => handleGoLive(s.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">Go Live</button>
                )}
                {isTeacher && s.status === 'live' && (
                  <button onClick={() => handleEnd(s.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">End Session</button>
                )}
                {isTeacher && s.status === 'scheduled' && (
                  <button onClick={() => handleCancel(s.id)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
