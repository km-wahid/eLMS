import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import { Loader2, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';

function CourseRow({ c, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="px-3 py-2 font-mono text-xs text-gray-400">{c.id}</td>
        <td className="px-3 py-2">
          <div className="font-medium text-sm text-gray-800">{c.title}</div>
          <div className="font-mono text-xs text-gray-400">{c.slug}</div>
        </td>
        <td className="px-3 py-2 font-mono text-xs text-gray-500">{c.instructor_name ?? '—'}</td>
        <td className="px-3 py-2 font-mono text-xs text-gray-500">{c.category ?? '—'}</td>
        <td className="px-3 py-2 font-mono text-xs text-gray-700">{parseFloat(c.price)===0?'0.00':c.price}</td>
        <td className="px-3 py-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded border
            ${c.is_published ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
            {String(c.is_published)}
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-xs text-gray-500">{c.enrollment_count ?? 0}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Btn variant="default" size="sm" onClick={() => setOpen(o=>!o)}>
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Btn>
            <Btn variant={c.is_published ? 'warning' : 'success'} size="sm" onClick={() => onToggle(c)}>
              {c.is_published ? 'Unpublish' : 'Publish'}
            </Btn>
            <Link to={`/courses/${c.slug}`}>
              <Btn variant="info" size="sm">View</Btn>
            </Link>
            <Btn variant="danger" size="sm" onClick={() => onDelete(c)}>Delete</Btn>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#272822]">
          <td colSpan={8} className="px-4 py-3">
            <pre className="text-[#f8f8f2] text-xs font-mono leading-relaxed overflow-x-auto">
              {JSON.stringify(c, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CMSCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoad]   = useState(true);
  const [search,  setSearch] = useState('');
  const [filter,  setFilter] = useState('');
  const [delC,    setDelC]   = useState(null);
  const [toast,   setToast]  = useState(null);
  const [raw,     setRaw]    = useState(false);

  const toast$ = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(() => {
    setLoad(true);
    api.get('/cms/courses/', { params: search ? {q:search} : {} })
      .then(r => setCourses(r.data.results ?? r.data))
      .catch(() => toast$('Failed to load', false))
      .finally(() => setLoad(false));
  }, [search]);

  useEffect(() => { const t=setTimeout(load,300); return ()=>clearTimeout(t); }, [load]);

  const displayed = courses.filter(c => {
    if (filter==='published')   return c.is_published;
    if (filter==='unpublished') return !c.is_published;
    return true;
  });

  const doToggle = async (c) => {
    try {
      const {data} = await api.patch(`/cms/courses/${c.slug}/`, {is_published:!c.is_published});
      setCourses(cs => cs.map(x => x.slug===c.slug ? {...x,...data} : x));
      toast$(`Course ${data.is_published?'published':'unpublished'}`);
    } catch { toast$('Update failed', false); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/cms/courses/${delC.slug}/`);
      setCourses(cs => cs.filter(x=>x.slug!==delC.slug)); setDelC(null); toast$('Course deleted');
    } catch { toast$('Delete failed', false); }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 border rounded px-4 py-2.5 text-sm font-mono shadow-lg
          ${toast.ok ? 'bg-[#dff0d8] border-[#d6e9c6] text-[#3c763d]' : 'bg-[#f2dede] border-[#ebccd1] text-[#a94442]'}`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
        <a href="/cms" className="text-[#337ab7] hover:underline">api</a>
        <span>/</span><span>cms</span><span>/</span><span className="text-gray-700">courses</span>
      </div>

      {/* Endpoint header */}
      <Panel className="border-l-4 border-l-[#fca130]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/cms/courses/</span>
              <span className="text-xs text-gray-400">— List all courses</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="PATCH" />
              <span className="font-mono text-sm text-gray-700">/api/cms/courses/{'{slug}/'}</span>
              <span className="text-xs text-gray-400">— Toggle publish / update</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="DELETE" />
              <span className="font-mono text-sm text-gray-700">/api/cms/courses/{'{slug}/'}</span>
              <span className="text-xs text-gray-400">— Delete course</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="default" onClick={() => setRaw(r=>!r)}>{raw ? 'Table' : 'JSON'}</Btn>
            <Link to="/courses/new"><Btn variant="success">+ Create Course</Btn></Link>
            <Btn variant="default" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <RefreshCw className="h-3 w-3 inline" />}{' '}Refresh
            </Btn>
          </div>
        </div>
      </Panel>

      {/* Filter form */}
      <Panel title="GET Filters">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">?q= (title search)</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search title"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] w-48" />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">is_published filter</label>
            <select value={filter} onChange={e=>setFilter(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]">
              <option value="">all</option>
              <option value="published">true</option>
              <option value="unpublished">false</option>
            </select>
          </div>
          <Btn variant="primary" onClick={load}>GET</Btn>
        </div>
      </Panel>

      {/* Response */}
      <Panel title={loading ? 'Loading…' : `Response — ${displayed.length} object(s)`}
        actions={<span className="text-xs font-mono text-gray-400">200 OK</span>}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4 font-mono">
            <Loader2 className="h-4 w-4 animate-spin" />Fetching /api/cms/courses/…
          </div>
        ) : raw ? (
          <JsonBlock data={displayed} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  {['id','title / slug','instructor','category','price','is_published','enrollments','actions'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(c => (
                  <CourseRow key={c.id} c={c} onToggle={doToggle} onDelete={setDelC} />
                ))}
                {displayed.length===0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-xs font-mono text-gray-400">
                    []  // no courses yet — <Link to="/courses/new" className="text-[#337ab7] hover:underline">create one</Link>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Delete confirm */}
      {delC && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-md">
            <div className="bg-[#d9534f] border-b border-[#d43f3a] px-4 py-2.5 flex items-center justify-between">
              <span className="font-semibold text-sm text-white font-mono">DELETE /api/cms/courses/{delC.slug}/</span>
              <button onClick={()=>setDelC(null)} className="text-white/80 hover:text-white p-1"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm font-mono text-gray-700 mb-1">
                Delete <strong>"{delC.title}"</strong>?
              </p>
              <p className="text-xs text-red-600 font-mono mb-4">HTTP 204 No Content — cannot be undone.</p>
              <div className="flex gap-3">
                <Btn variant="default" onClick={()=>setDelC(null)}>Cancel</Btn>
                <Btn variant="danger"  onClick={doDelete}>DELETE</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
