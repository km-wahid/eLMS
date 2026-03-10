import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import { Loader2, RefreshCw, Upload, Download, Trash2, X, FileText, File, Video, BookOpen } from 'lucide-react';

const FILE_TYPE_ICONS = {
  pdf:   <FileText className="h-4 w-4 text-red-500" />,
  slide: <BookOpen  className="h-4 w-4 text-orange-500" />,
  doc:   <FileText className="h-4 w-4 text-blue-500" />,
  video: <Video     className="h-4 w-4 text-purple-500" />,
  other: <File      className="h-4 w-4 text-gray-400" />,
};

const FILE_TYPE_COLORS = {
  pdf:   'bg-red-100 border-red-300 text-red-700',
  slide: 'bg-orange-100 border-orange-300 text-orange-700',
  doc:   'bg-blue-100 border-blue-300 text-blue-700',
  video: 'bg-purple-100 border-purple-300 text-purple-700',
  other: 'bg-gray-100 border-gray-300 text-gray-600',
};

function fmt(bytes) {
  if (!bytes) return '—';
  const units = ['B','KB','MB','GB'];
  let v = bytes, i = 0;
  while (v >= 1024 && i < 3) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

export default function CMSMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [courseF,   setCourseF]   = useState('');
  const [typeF,     setTypeF]     = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [delItem,   setDelItem]   = useState(null);
  const [toast,     setToast]     = useState(null);
  const [raw,       setRaw]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const [form, setForm] = useState({
    title:'', description:'', file_type:'other', course_id:'', is_downloadable:true
  });

  const toast$ = (msg, ok=true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)  params.q         = search;
    if (courseF) params.course     = courseF;
    if (typeF)   params.file_type  = typeF;
    api.get('/cms/materials/', { params })
      .then(r => setMaterials(r.data.results ?? r.data))
      .catch(() => toast$('Failed to load', false))
      .finally(() => setLoading(false));
  }, [search, courseF, typeF]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    api.get('/cms/courses/').then(r => setCourses(r.data.results ?? r.data));
  }, []);

  const doDelete = async () => {
    try {
      await api.delete(`/cms/materials/${delItem.id}/`);
      setMaterials(ms => ms.filter(m => m.id !== delItem.id));
      setDelItem(null); toast$('Material deleted');
    } catch { toast$('Delete failed', false); }
  };

  const doUpload = async () => {
    if (!fileRef.current?.files[0]) { toast$('Select a file first', false); return; }
    if (!form.title) { toast$('Title required', false); return; }
    if (!form.course_id) { toast$('Select a course', false); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', fileRef.current.files[0]);
    fd.append('title', form.title);
    if (form.description) fd.append('description', form.description);
    fd.append('file_type', form.file_type);
    fd.append('course', form.course_id);
    fd.append('is_downloadable', String(form.is_downloadable));
    try {
      const { data } = await api.post('/cms/materials/', fd, { headers: {'Content-Type':'multipart/form-data'} });
      setMaterials(ms => [data, ...ms]);
      setShowUpload(false);
      setForm({title:'',description:'',file_type:'other',course_id:'',is_downloadable:true});
      toast$('Material uploaded');
    } catch (e) {
      toast$(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Upload failed', false);
    }
    setUploading(false);
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
        <span>/</span><span>cms</span><span>/</span><span className="text-gray-700">materials</span>
      </div>

      {/* Endpoint header */}
      <Panel className="border-l-4 border-l-[#49cc90]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/cms/materials/</span>
              <span className="text-xs text-gray-400">— List all resources</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="POST" />
              <span className="font-mono text-sm text-gray-700">/api/cms/materials/</span>
              <span className="text-xs text-gray-400">— Upload new resource (multipart/form-data)</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="DELETE" />
              <span className="font-mono text-sm text-gray-700">/api/cms/materials/{'{id}/'}</span>
              <span className="text-xs text-gray-400">— Remove resource</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="default" onClick={() => setRaw(r => !r)}>{raw ? 'Table' : 'JSON'}</Btn>
            <Btn variant="success" onClick={() => setShowUpload(true)}>
              <Upload className="h-3 w-3 inline mr-1" />Upload Resource
            </Btn>
            <Btn variant="default" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <RefreshCw className="h-3 w-3 inline" />} Refresh
            </Btn>
          </div>
        </div>
      </Panel>

      {/* Filters */}
      <Panel title="GET Filters">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">?q= (title)</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search title"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] w-44" />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">?course= (slug)</label>
            <select value={courseF} onChange={e => setCourseF(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]">
              <option value="">all courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">?file_type=</label>
            <select value={typeF} onChange={e => setTypeF(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]">
              <option value="">all types</option>
              {['pdf','slide','doc','video','other'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Btn variant="primary" onClick={load}>GET</Btn>
        </div>
      </Panel>

      {/* Response table */}
      <Panel title={loading ? 'Loading…' : `Response — ${materials.length} resource(s)`}
        actions={<span className="text-xs font-mono text-gray-400">200 OK · application/json</span>}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4 font-mono">
            <Loader2 className="h-4 w-4 animate-spin" />Fetching /api/cms/materials/…
          </div>
        ) : raw ? (
          <JsonBlock data={materials} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  {['type','title','course','module / lecture','size','downloadable','uploaded_by','created_at','actions'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${FILE_TYPE_COLORS[m.file_type]||FILE_TYPE_COLORS.other}`}>
                        {FILE_TYPE_ICONS[m.file_type]||FILE_TYPE_ICONS.other}{m.file_type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-sm text-gray-800">{m.title}</div>
                      {m.description && <div className="text-xs text-gray-400 truncate max-w-[160px]">{m.description}</div>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{m.course_title}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">
                      {m.module_title && <div>mod: {m.module_title}</div>}
                      {m.lecture_title && <div>lec: {m.lecture_title}</div>}
                      {!m.module_title && !m.lecture_title && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{fmt(m.file_size)}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded border ${m.is_downloadable ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                        {String(m.is_downloadable)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">{m.uploaded_by_name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5">
                        {m.file_url && (
                          <a href={m.file_url} target="_blank" rel="noreferrer">
                            <Btn variant="info" size="sm"><Download className="h-3 w-3" /></Btn>
                          </a>
                        )}
                        <Btn variant="danger" size="sm" onClick={() => setDelItem(m)}>
                          <Trash2 className="h-3 w-3" />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-xs font-mono text-gray-400">
                    []  // no materials yet — click "Upload Resource"
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-[#49cc90] border-b border-[#3ab57a] px-4 py-2.5 flex items-center justify-between sticky top-0">
              <span className="font-semibold text-sm text-white font-mono">POST /api/cms/materials/  · multipart/form-data</span>
              <button onClick={() => setShowUpload(false)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">file * (PDF, slide, doc, video)</label>
                <input ref={fileRef} type="file"
                  className="block text-sm font-mono text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-mono file:bg-gray-50 hover:file:bg-gray-100 w-full" />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">title *</label>
                <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                  value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">description</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7] resize-none"
                  value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-gray-600 block mb-1">file_type</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                    value={form.file_type} onChange={e => setForm(f => ({...f,file_type:e.target.value}))}>
                    {['pdf','slide','doc','video','other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-600 block mb-1">course *</label>
                  <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                    value={form.course} onChange={e => setForm(f => ({...f,course_id:e.target.value}))}>
                    <option value="">— select course —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">is_downloadable</label>
                <select className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                  value={String(form.is_downloadable)} onChange={e => setForm(f => ({...f,is_downloadable:e.target.value==='true'}))}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>

              {/* request body preview */}
              <div>
                <p className="text-xs font-mono text-gray-400 mb-1">// Request body preview:</p>
                <pre className="bg-[#272822] text-[#f8f8f2] text-xs rounded p-3 font-mono">
{`{
  "title": "${form.title}",
  "file_type": "${form.file_type}",
  "course": "${form.course}",
  "is_downloadable": ${form.is_downloadable},
  "file": <binary>
}`}
                </pre>
              </div>

              <div className="flex gap-3">
                <Btn variant="success" onClick={doUpload} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : <Upload className="h-3.5 w-3.5 inline mr-1" />}
                  POST / Upload
                </Btn>
                <Btn variant="default" onClick={() => setShowUpload(false)}>Cancel</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-96">
            <div className="bg-[#d9534f] px-4 py-2.5 flex justify-between rounded-t">
              <span className="text-white text-sm font-mono font-semibold">DELETE /api/cms/materials/{delItem.id}/</span>
              <button onClick={() => setDelItem(null)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm font-mono mb-1">Delete <strong>"{delItem.title}"</strong>?</p>
              <p className="text-xs text-red-600 font-mono mb-4">HTTP 204 No Content · file will be removed.</p>
              <div className="flex gap-3">
                <Btn variant="default" onClick={() => setDelItem(null)}>Cancel</Btn>
                <Btn variant="danger"  onClick={doDelete}>DELETE</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
