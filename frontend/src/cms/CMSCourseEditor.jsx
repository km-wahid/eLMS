import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import {
  Loader2, ChevronDown, ChevronRight, Plus, Pencil, Trash2,
  Upload, Video, FileText, CheckCircle, X, GripVertical, Eye
} from 'lucide-react';

/* ─── small helpers ─────────────────────────────────────────────────────── */
const Badge = ({ children, color }) => (
  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${color}`}>{children}</span>
);

const HLS_COLORS = {
  ready:      'bg-green-100 border-green-300 text-green-700',
  processing: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  pending:    'bg-gray-100 border-gray-300 text-gray-500',
  failed:     'bg-red-100 border-red-300 text-red-700',
};

/* ─── Video Upload row ───────────────────────────────────────────────────── */
function VideoUploadCell({ lecture, moduleId, onUpdated }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('video_file', file);
    fd.append('title', lecture.title);
    fd.append('order', lecture.order);
    try {
      const { data } = await api.patch(
        `/cms/modules/${moduleId}/lectures/${lecture.id}/`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => setProgress(Math.round(e.loaded / e.total * 100)),
        }
      );
      onUpdated(data);
    } catch { /* ignore */ }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {lecture.video_url ? (
        <Badge color={HLS_COLORS[lecture.hls_status] || HLS_COLORS.pending}>
          <Video className="h-3 w-3 inline mr-1" />{lecture.hls_status}
        </Badge>
      ) : (
        <span className="text-xs font-mono text-gray-400">no video</span>
      )}
      {uploading ? (
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />{progress}%
        </div>
      ) : (
        <>
          <input ref={ref} type="file" accept="video/*" className="hidden"
            onChange={e => upload(e.target.files[0])} />
          <Btn variant="default" size="sm" onClick={() => ref.current.click()}>
            <Upload className="h-3 w-3 inline mr-1" />
            {lecture.video_url ? 'Replace' : 'Upload'}
          </Btn>
        </>
      )}
    </div>
  );
}

/* ─── Lecture row ────────────────────────────────────────────────────────── */
function LectureRow({ lec, moduleId, onEdit, onDelete, onUpdated }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="pl-8 pr-3 py-2 font-mono text-xs text-gray-400">{lec.order}</td>
      <td className="px-3 py-2 text-sm text-gray-800">{lec.title}</td>
      <td className="px-3 py-2"><VideoUploadCell lecture={lec} moduleId={moduleId} onUpdated={onUpdated} /></td>
      <td className="px-3 py-2 font-mono text-xs text-gray-500">{lec.duration_display ?? '—'}</td>
      <td className="px-3 py-2">
        <Badge color={lec.is_published ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}>
          {String(lec.is_published)}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1.5">
          <Btn variant="default" size="sm" onClick={() => onEdit(lec)}><Pencil className="h-3 w-3" /></Btn>
          <Btn variant="danger"  size="sm" onClick={() => onDelete(lec)}><Trash2 className="h-3 w-3" /></Btn>
        </div>
      </td>
    </tr>
  );
}

/* ─── Module row (collapsible) ───────────────────────────────────────────── */
function ModuleRow({ mod, courseSlug, onEdit, onDelete }) {
  const [open,     setOpen]     = useState(false);
  const [lectures, setLectures] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [editLec,  setEditLec]  = useState(null);   // null = add, obj = edit
  const [showForm, setShowForm] = useState(false);
  const [delLec,   setDelLec]   = useState(null);
  const [form,     setForm]     = useState({ title:'', description:'', order:1, is_published:false });

  const loadLectures = async () => {
    if (loading) return;
    setLoading(true);
    const { data } = await api.get(`/cms/modules/${mod.id}/lectures/`);
    setLectures(data.results ?? data);
    setLoading(false);
  };

  const toggle = () => { if (!open) loadLectures(); setOpen(o => !o); };

  const openAdd  = () => { setEditLec(null); setForm({title:'',description:'',order:lectures.length+1,is_published:false}); setShowForm(true); };
  const openEdit = (l) => { setEditLec(l); setForm({title:l.title,description:l.description,order:l.order,is_published:l.is_published}); setShowForm(true); };

  const saveLecture = async () => {
    const payload = { ...form, order: parseInt(form.order) };
    if (editLec) {
      const { data } = await api.patch(`/cms/modules/${mod.id}/lectures/${editLec.id}/`, payload);
      setLectures(ls => ls.map(l => l.id === editLec.id ? {...l,...data} : l));
    } else {
      const { data } = await api.post(`/cms/modules/${mod.id}/lectures/`, payload);
      setLectures(ls => [...ls, data]);
    }
    setShowForm(false);
  };

  const deleteLecture = async () => {
    await api.delete(`/cms/modules/${mod.id}/lectures/${delLec.id}/`);
    setLectures(ls => ls.filter(l => l.id !== delLec.id)); setDelLec(null);
  };

  const onUpdated = (data) => setLectures(ls => ls.map(l => l.id === data.id ? {...l,...data} : l));

  return (
    <>
      <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
        <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{mod.order}</td>
        <td className="px-3 py-2.5 cursor-pointer" onClick={toggle}>
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <span className="font-medium text-sm text-gray-800">{mod.title}</span>
            <Badge color="bg-blue-50 border-blue-200 text-blue-600">{mod.lecture_count} lectures</Badge>
          </div>
          {mod.description && <p className="text-xs text-gray-400 mt-0.5 pl-6 truncate max-w-xs">{mod.description}</p>}
        </td>
        <td className="px-3 py-2.5" colSpan={3} />
        <td className="px-3 py-2.5">
          <div className="flex gap-1.5">
            <Btn variant="success" size="sm" onClick={openAdd}><Plus className="h-3 w-3 inline mr-1" />Add Lecture</Btn>
            <Btn variant="default" size="sm" onClick={() => onEdit(mod)}><Pencil className="h-3 w-3" /></Btn>
            <Btn variant="danger"  size="sm" onClick={() => onDelete(mod)}><Trash2 className="h-3 w-3" /></Btn>
          </div>
        </td>
      </tr>

      {open && (
        <>
          {loading && (
            <tr><td colSpan={6} className="px-8 py-3 text-xs font-mono text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin inline mr-2" />Loading lectures…
            </td></tr>
          )}
          {!loading && lectures.length === 0 && (
            <tr><td colSpan={6} className="px-8 py-3 text-xs font-mono text-gray-400">
              // no lectures yet — click "Add Lecture"
            </td></tr>
          )}
          {lectures.map(l => (
            <LectureRow key={l.id} lec={l} moduleId={mod.id}
              onEdit={openEdit} onDelete={setDelLec} onUpdated={onUpdated} />
          ))}
          {/* add/edit lecture inline form */}
          {showForm && (
            <tr className="bg-blue-50 border-b border-blue-200">
              <td colSpan={6} className="px-8 py-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-mono text-gray-600 block mb-1">title *</label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                      value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-gray-600 block mb-1">order</label>
                    <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                      value={form.order} onChange={e => setForm(f => ({...f, order:e.target.value}))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-mono text-gray-600 block mb-1">description</label>
                    <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7] resize-none"
                      value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-mono text-gray-600">is_published</label>
                    <select className="border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                      value={String(form.is_published)} onChange={e => setForm(f => ({...f, is_published:e.target.value==='true'}))}>
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="primary" onClick={saveLecture}>{editLec ? 'PATCH' : 'POST'} / Save</Btn>
                  <Btn variant="default" onClick={() => setShowForm(false)}>Cancel</Btn>
                </div>
              </td>
            </tr>
          )}
        </>
      )}

      {/* delete lecture confirm */}
      {delLec && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-96">
            <div className="bg-[#d9534f] px-4 py-2.5 flex justify-between rounded-t">
              <span className="text-white text-sm font-mono font-semibold">DELETE lecture</span>
              <button onClick={() => setDelLec(null)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm font-mono mb-1">Delete <strong>"{delLec.title}"</strong>?</p>
              <p className="text-xs text-red-600 font-mono mb-4">HTTP 204 · cannot be undone.</p>
              <div className="flex gap-3">
                <Btn variant="default" onClick={() => setDelLec(null)}>Cancel</Btn>
                <Btn variant="danger"  onClick={deleteLecture}>DELETE</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function CMSCourseEditor() {
  const { slug }  = useParams();
  const [course,  setCourse]  = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMod, setEditMod] = useState(null);
  const [showMod, setShowMod] = useState(false);
  const [delMod,  setDelMod]  = useState(null);
  const [modForm, setModForm] = useState({ title:'', description:'', order:1 });
  const [toast,   setToast]   = useState(null);
  const [editCourse, setEditCourse] = useState(false);
  const thumbRef = useRef();
  const [courseForm, setCourseForm] = useState(null);

  const toast$ = (msg, ok=true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    Promise.all([
      api.get(`/cms/courses/${slug}/`),
      api.get(`/cms/courses/${slug}/modules/`),
    ]).then(([cr, mr]) => {
      setCourse(cr.data);
      setCourseForm({ title:cr.data.title, description:cr.data.description||'', level:cr.data.level,
        price:cr.data.price, is_published:cr.data.is_published, thumbnail_url:cr.data.thumbnail_url||'' });
      setModules(mr.data.results ?? mr.data);
    }).finally(() => setLoading(false));
  }, [slug]);

  /* save course meta */
  const saveCourse = async () => {
    try {
      const fd = new FormData();
      Object.entries(courseForm).forEach(([k,v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (thumbRef.current?.files[0]) fd.append('thumbnail', thumbRef.current.files[0]);
      const { data } = await api.patch(`/cms/courses/${slug}/`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      setCourse(c => ({...c,...data})); setEditCourse(false); toast$('Course updated');
    } catch { toast$('Update failed', false); }
  };

  /* module actions */
  const openAddMod  = () => { setEditMod(null); setModForm({title:'',description:'',order:modules.length+1}); setShowMod(true); };
  const openEditMod = (m) => { setEditMod(m); setModForm({title:m.title,description:m.description,order:m.order}); setShowMod(true); };

  const saveMod = async () => {
    const payload = {...modForm, order:parseInt(modForm.order)};
    try {
      if (editMod) {
        const { data } = await api.patch(`/cms/courses/${slug}/modules/${editMod.id}/`, payload);
        setModules(ms => ms.map(m => m.id===editMod.id ? {...m,...data} : m));
        toast$('Module updated');
      } else {
        const { data } = await api.post(`/cms/courses/${slug}/modules/`, payload);
        setModules(ms => [...ms, data]); toast$('Module created');
      }
      setShowMod(false);
    } catch (e) { toast$(e.response?.data?.detail || 'Save failed', false); }
  };

  const deleteMod = async () => {
    await api.delete(`/cms/courses/${slug}/modules/${delMod.id}/`);
    setModules(ms => ms.filter(m => m.id !== delMod.id)); setDelMod(null); toast$('Module deleted');
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-400 font-mono py-8">
      <Loader2 className="h-4 w-4 animate-spin" />Loading course…
    </div>
  );

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
        <span>/</span>
        <a href="/cms/courses" className="text-[#337ab7] hover:underline">cms</a>
        <span>/</span><span>courses</span><span>/</span>
        <span className="text-gray-700">{slug}</span>
      </div>

      {/* Course header */}
      <Panel className="border-l-4 border-l-[#fca130]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/cms/courses/{slug}/</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">{course?.title}</h1>
            <p className="text-xs font-mono text-gray-400 mt-1">
              teacher: {course?.instructor_name} · level: {course?.level} · price: ${course?.price}
              <span className={`ml-2 px-2 py-0.5 rounded border text-xs ${course?.is_published ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
                is_published: {String(course?.is_published)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Btn variant={editCourse ? 'warning' : 'default'} onClick={() => setEditCourse(e => !e)}>
              {editCourse ? 'Cancel' : <><Pencil className="h-3 w-3 inline mr-1" />Edit Course</>}
            </Btn>
            <Link to={`/courses/${slug}`} target="_blank">
              <Btn variant="info"><Eye className="h-3 w-3 inline mr-1" />Preview</Btn>
            </Link>
          </div>
        </div>

        {/* Inline course edit form */}
        {editCourse && courseForm && (
          <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-gray-600 block mb-1">title *</label>
              <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                value={courseForm.title} onChange={e => setCourseForm(f => ({...f,title:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-600 block mb-1">price</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                value={courseForm.price} onChange={e => setCourseForm(f => ({...f,price:e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-mono text-gray-600 block mb-1">description</label>
              <textarea rows={3} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7] resize-none"
                value={courseForm.description} onChange={e => setCourseForm(f => ({...f,description:e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-600 block mb-1">level</label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                value={courseForm.level} onChange={e => setCourseForm(f => ({...f,level:e.target.value}))}>
                {['beginner','intermediate','advanced'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-gray-600 block mb-1">is_published</label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                value={String(courseForm.is_published)} onChange={e => setCourseForm(f => ({...f,is_published:e.target.value==='true'}))}>
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-mono text-gray-600 block mb-1">thumbnail (file upload)</label>
              <input ref={thumbRef} type="file" accept="image/*"
                className="block text-sm font-mono text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-mono file:bg-gray-50 hover:file:bg-gray-100" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-mono text-gray-600 block mb-1">thumbnail_url (external)</label>
              <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                placeholder="https://…" value={courseForm.thumbnail_url}
                onChange={e => setCourseForm(f => ({...f,thumbnail_url:e.target.value}))} />
            </div>
            <div className="col-span-2 flex gap-2">
              <Btn variant="primary" onClick={saveCourse}>PATCH / Save Course</Btn>
              <Btn variant="default" onClick={() => setEditCourse(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </Panel>

      {/* Modules */}
      <Panel title={`modules  ·  array  ·  ${modules.length} item(s)`}
        actions={<Btn variant="success" onClick={openAddMod}><Plus className="h-3 w-3 inline mr-1" />Add Module</Btn>}>
        <div className="text-xs font-mono text-gray-400 mb-3 flex items-center gap-2">
          <MethodBadge method="POST" />
          <span className="text-gray-600">/api/cms/courses/{slug}/modules/</span>
          <span className="mx-2 text-gray-300">|</span>
          <MethodBadge method="PATCH" />
          <span className="text-gray-600">/api/cms/courses/{slug}/modules/:id/</span>
          <span className="mx-2 text-gray-300">|</span>
          <MethodBadge method="DELETE" />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border border-gray-300">
              {['order','module / lectures','','','','actions'].map((h,i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(m => (
              <ModuleRow key={m.id} mod={m} courseSlug={slug}
                onEdit={openEditMod} onDelete={setDelMod} />
            ))}
            {modules.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-xs font-mono text-gray-400">
                []  // no modules yet — click "+ Add Module"
              </td></tr>
            )}
          </tbody>
        </table>
      </Panel>

      {/* Module add/edit modal */}
      {showMod && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-md">
            <div className="bg-[#337ab7] border-b border-[#2e6da4] px-4 py-2.5 flex items-center justify-between">
              <span className="font-semibold text-sm text-white font-mono">
                {editMod ? `PATCH /modules/${editMod.id}/` : `POST /api/cms/courses/${slug}/modules/`}
              </span>
              <button onClick={() => setShowMod(false)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">title *</label>
                <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                  value={modForm.title} onChange={e => setModForm(f => ({...f,title:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">description</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7] resize-none"
                  value={modForm.description} onChange={e => setModForm(f => ({...f,description:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-mono text-gray-600 block mb-1">order</label>
                <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-[#337ab7]"
                  value={modForm.order} onChange={e => setModForm(f => ({...f,order:e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Btn variant="primary" onClick={saveMod}>{editMod ? 'PATCH' : 'POST'} / Save</Btn>
                <Btn variant="default" onClick={() => setShowMod(false)}>Cancel</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* delete module confirm */}
      {delMod && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-96">
            <div className="bg-[#d9534f] px-4 py-2.5 flex justify-between rounded-t">
              <span className="text-white text-sm font-mono font-semibold">DELETE /modules/{delMod.id}/</span>
              <button onClick={() => setDelMod(null)} className="text-white/80 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm font-mono mb-1">Delete module <strong>"{delMod.title}"</strong> and all its lectures?</p>
              <p className="text-xs text-red-600 font-mono mb-4">HTTP 204 No Content · cannot be undone.</p>
              <div className="flex gap-3">
                <Btn variant="default" onClick={() => setDelMod(null)}>Cancel</Btn>
                <Btn variant="danger"  onClick={deleteMod}>DELETE</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
