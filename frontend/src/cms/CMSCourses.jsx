import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import { Loader2, RefreshCw, ChevronDown, ChevronUp, X, Plus, Pencil, Settings } from 'lucide-react';

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
            <Link to={`/cms/courses/${c.slug}`}>
              <Btn variant="info" size="sm"><Settings className="h-3 w-3 inline mr-1" />Manage</Btn>
            </Link>
            <Link to={`/courses/${c.slug}`} target="_blank">
              <Btn variant="default" size="sm">Preview</Btn>
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

const EMPTY_FORM = { title:'', description:'', level:'beginner', price:'0.00', is_published:false, thumbnail_url:'' };

export default function CMSCourses() {
  const navigate = useNavigate();
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoad]       = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('');
  const [delC,       setDelC]       = useState(null);
  const [toast,      setToast]      = useState(null);
  const [raw,        setRaw]        = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [teachers,   setTeachers]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [createForm, setCreateForm] = useState({...EMPTY_FORM, teacher_id:'', category_id:''});
  const thumbRef = useRef();

  const toast$ = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(() => {
    setLoad(true);
    api.get('/cms/courses/', { params: search ? {q:search} : {} })
      .then(r => setCourses(r.data.results ?? r.data))
      .catch(() => toast$('Failed to load', false))
      .finally(() => setLoad(false));
  }, [search]);

  useEffect(() => { const t=setTimeout(load,300); return ()=>clearTimeout(t); }, [load]);

  const openCreate = () => {
    Promise.all([api.get('/cms/teachers/'), api.get('/cms/categories/')]).then(([tr, cr]) => {
      setTeachers(tr.data.results ?? tr.data);
      setCategories(cr.data.results ?? cr.data);
    });
    setCreateForm({...EMPTY_FORM, teacher_id:'', category_id:''});
    setShowCreate(true);
  };

  const doCreate = async () => {
    if (!createForm.title) { toast$('Title required', false); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(createForm).forEach(([k,v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v); });
      if (thumbRef.current?.files[0]) fd.append('thumbnail', thumbRef.current.files[0]);
      const { data } = await api.post('/cms/courses/create/', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setShowCreate(false);
      toast$(`Course "${data.title}" created`);
      navigate(`/cms/courses/${data.slug}`);
    } catch (e) {
      toast$(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Create failed', false);
    }
    setCreating(false);
  };

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
            <Btn variant="success" onClick={openCreate}>+ Create Course</Btn>
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

      {/* Create course modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-[#49cc90] border-b border-[#3ab57a] px-4 py-2.5 flex items-center justify-between sticky top-0">
              <span className="font-semibold text-sm text-white font-mono">POST /api/cms/courses/create/</span>
              <button onClick={() => setShowCreate(false)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">title *</label>
                <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                  value={createForm.title} onChange={e => setCreateForm(f => ({...f,title:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">description *</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7] resize-none"
                  value={createForm.description} onChange={e => setCreateForm(f => ({...f,description:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-gray-600 block mb-1">teacher_id</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                    value={createForm.teacher_id} onChange={e => setCreateForm(f => ({...f,teacher_id:e.target.value}))}>
                    <option value="">— current user —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-600 block mb-1">category_id</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                    value={createForm.category_id} onChange={e => setCreateForm(f => ({...f,category_id:e.target.value}))}>
                    <option value="">— none —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-600 block mb-1">level</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                    value={createForm.level} onChange={e => setCreateForm(f => ({...f,level:e.target.value}))}>
                    {['beginner','intermediate','advanced'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-600 block mb-1">price</label>
                  <input type="number" step="0.01" min="0"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                    value={createForm.price} onChange={e => setCreateForm(f => ({...f,price:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">is_published</label>
                <select className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                  value={String(createForm.is_published)} onChange={e => setCreateForm(f => ({...f,is_published:e.target.value==='true'}))}>
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">thumbnail (file)</label>
                <input ref={thumbRef} type="file" accept="image/*"
                  className="block text-sm font-mono text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-mono file:bg-gray-50 hover:file:bg-gray-100 w-full" />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">thumbnail_url (external)</label>
                <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                  placeholder="https://…" value={createForm.thumbnail_url}
                  onChange={e => setCreateForm(f => ({...f,thumbnail_url:e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-1">
                <Btn variant="success" onClick={doCreate} disabled={creating}>
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
                  POST / Create Course
                </Btn>
                <Btn variant="default" onClick={() => setShowCreate(false)}>Cancel</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
