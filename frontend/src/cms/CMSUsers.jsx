import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import { Loader2, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-lg">
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2.5 flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-700 font-mono">{title}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-gray-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, type='text', options, readOnly }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <label className="w-32 text-xs font-mono text-gray-600 pt-2 shrink-0">{label}</label>
      <div className="flex-1">
        {options ? (
          <select value={value} onChange={e => onChange(name, e.target.value)} disabled={readOnly}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === 'checkbox' ? (
          <input type="checkbox" checked={value} onChange={e => onChange(name, e.target.checked)}
            className="mt-2 h-4 w-4 text-[#337ab7] border-gray-300 rounded" disabled={readOnly} />
        ) : (
          <input type={type} value={value} readOnly={readOnly}
            onChange={e => onChange(name, e.target.value)}
            className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] ${readOnly ? 'bg-gray-50 text-gray-400' : ''}`} />
        )}
      </div>
    </div>
  );
}

function UserRow({ u, onEdit, onDelete, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="px-3 py-2 font-mono text-xs text-gray-400">{u.id}</td>
        <td className="px-3 py-2">
          <div className="font-medium text-sm text-gray-800">{u.name}</div>
          <div className="font-mono text-xs text-gray-400">{u.email}</div>
        </td>
        <td className="px-3 py-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded border
            ${ u.role==='teacher'||u.role==='admin'||u.role==='superadmin'
               ? 'border-blue-300 bg-blue-50 text-blue-700'
               : 'border-green-300 bg-green-50 text-green-700'}`}>
            {u.role}
          </span>
          {u.is_staff && <span className="ml-1 text-xs font-mono px-1.5 py-0.5 rounded border border-purple-300 bg-purple-50 text-purple-700">staff</span>}
        </td>
        <td className="px-3 py-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${u.is_active ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            {u.is_active ? 'true' : 'false'}
          </span>
        </td>
        <td className="px-3 py-2 text-xs font-mono text-gray-400">
          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Btn variant="default"  size="sm" onClick={() => setOpen(o=>!o)}>
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Btn>
            <Btn variant="info"    size="sm" onClick={() => onEdit(u)}>Edit</Btn>
            <Btn variant="warning" size="sm" onClick={() => onToggle(u)}>
              {u.is_active ? 'Deactivate' : 'Activate'}
            </Btn>
            <Btn variant="danger"  size="sm" onClick={() => onDelete(u)}>Delete</Btn>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#272822]">
          <td colSpan={6} className="px-4 py-3">
            <pre className="text-[#f8f8f2] text-xs font-mono leading-relaxed overflow-x-auto">
              {JSON.stringify(u, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CMSUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [editU,   setEditU]   = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [delU,    setDelU]    = useState(null);
  const [toast,   setToast]   = useState(null);
  const [editForm, setEF]     = useState({});
  const [addForm,  setAF]     = useState({ name:'', email:'', role:'student', password:'Pass@1234' });

  const toast$ = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(() => {
    setLoad(true);
    const p = {};
    if (role)   p.role = role;
    if (search) p.q    = search;
    api.get('/cms/users/', {params:p})
      .then(r => setUsers(r.data.results ?? r.data))
      .catch(() => toast$('Failed to load users', false))
      .finally(() => setLoad(false));
  }, [role, search]);

  useEffect(() => { const t=setTimeout(load,300); return ()=>clearTimeout(t); }, [load]);

  const openEdit = (u) => { setEditU(u); setEF({ name:u.name, role:u.role, is_active:u.is_active, is_staff:!!u.is_staff }); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const {data} = await api.patch(`/cms/users/${editU.id}/`, editForm);
      setUsers(us => us.map(u => u.id===editU.id ? {...u,...data} : u));
      setEditU(null); toast$('User updated');
    } catch(e) { toast$(e.response?.data?.detail || 'Update failed', false); }
    finally { setSaving(false); }
  };

  const doAdd = async () => {
    setSaving(true);
    try {
      await api.post('/auth/register/', { ...addForm, password2: addForm.password });
      setAddOpen(false); toast$('User created'); load();
    } catch(e) {
      const errs = e.response?.data;
      toast$(errs ? Object.values(errs).flat().join(' ') : 'Create failed', false);
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/cms/users/${delU.id}/`);
      setUsers(us => us.filter(u=>u.id!==delU.id)); setDelU(null); toast$('User deleted');
    } catch { toast$('Delete failed', false); }
  };

  const doToggle = async (u) => {
    try {
      const {data} = await api.patch(`/cms/users/${u.id}/`, {is_active:!u.is_active});
      setUsers(us => us.map(x => x.id===u.id ? {...x,...data} : x));
      toast$(`User ${data.is_active ? 'activated' : 'deactivated'}`);
    } catch { toast$('Failed', false); }
  };

  const efChange = (k,v) => setEF(p=>({...p,[k]:v}));
  const afChange = (k,v) => setAF(p=>({...p,[k]:v}));

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 border rounded px-4 py-2.5 text-sm font-mono shadow-lg
          ${toast.ok ? 'bg-[#dff0d8] border-[#d6e9c6] text-[#3c763d]' : 'bg-[#f2dede] border-[#ebccd1] text-[#a94442]'}`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
        <a href="/cms" className="text-[#337ab7] hover:underline">api</a>
        <span>/</span><span>cms</span><span>/</span><span className="text-gray-700">users</span>
      </div>

      {/* Endpoint header */}
      <Panel className="border-l-4 border-l-[#49cc90]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/cms/users/</span>
              <span className="text-xs text-gray-400">— List & filter all users</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="POST" />
              <span className="font-mono text-sm text-gray-700">/api/cms/users/</span>
              <span className="text-xs text-gray-400">— Create a new user</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="PATCH" />
              <span className="font-mono text-sm text-gray-700">/api/cms/users/{'{id}/'}</span>
              <span className="text-xs text-gray-400">— Update user</span>
            </div>
            <div className="flex items-center gap-2">
              <MethodBadge method="DELETE" />
              <span className="font-mono text-sm text-gray-700">/api/cms/users/{'{id}/'}</span>
              <span className="text-xs text-gray-400">— Delete user</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="success" onClick={() => setAddOpen(true)}>+ POST New User</Btn>
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
            <label className="block text-xs font-mono text-gray-600 mb-1">?role=</label>
            <select value={role} onChange={e=>setRole(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]">
              <option value="">all</option>
              {['student','teacher','admin'].map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-600 mb-1">?q= (search)</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="name or email"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] w-48" />
          </div>
          <Btn variant="primary" onClick={load}>GET</Btn>
        </div>
      </Panel>

      {/* Response */}
      <Panel title={loading ? 'Loading…' : `Response — ${users.length} object(s)`}
        actions={<span className="text-xs font-mono text-gray-400">200 OK · application/json</span>}>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4 font-mono">
            <Loader2 className="h-4 w-4 animate-spin" />Fetching /api/cms/users/…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  {['id','name / email','role','is_active','created_at','actions'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <UserRow key={u.id} u={u} onEdit={openEdit} onDelete={setDelU} onToggle={doToggle} />
                ))}
                {users.length===0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-xs font-mono text-gray-400">[]  // no results</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Edit modal */}
      {editU && (
        <Modal title={`PATCH /api/cms/users/${editU.id}/`} onClose={()=>setEditU(null)}>
          <div className="mb-3">
            <span className="text-xs font-mono text-gray-400">Editing: <strong>{editU.email}</strong></span>
          </div>
          {[
            {label:'name',      name:'name',      type:'text'    },
            {label:'role',      name:'role',      options:['student','teacher','admin']},
            {label:'is_active', name:'is_active', type:'checkbox'},
            {label:'is_staff',  name:'is_staff',  type:'checkbox'},
          ].map(f => <FormField key={f.name} {...f} value={editForm[f.name]} onChange={efChange} />)}
          <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
            <Btn variant="default" onClick={()=>setEditU(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
              {saving ? 'Saving…' : 'PATCH'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Add modal */}
      {addOpen && (
        <Modal title="POST /api/auth/register/" onClose={()=>setAddOpen(false)}>
          {[
            {label:'name',     name:'name',     type:'text'},
            {label:'email',    name:'email',    type:'email'},
            {label:'role',     name:'role',     options:['student','teacher','admin']},
            {label:'password', name:'password', type:'text'},
          ].map(f => <FormField key={f.name} {...f} value={addForm[f.name]} onChange={afChange} />)}
          <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
            <Btn variant="default" onClick={()=>setAddOpen(false)}>Cancel</Btn>
            <Btn variant="success" onClick={doAdd} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
              {saving ? 'POSTing…' : 'POST'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {delU && (
        <Modal title={`DELETE /api/cms/users/${delU.id}/`} onClose={()=>setDelU(null)}>
          <p className="text-sm font-mono text-gray-700 mb-4">
            Are you sure you want to delete <strong>{delU.name}</strong>?<br />
            <span className="text-red-600 text-xs">This action cannot be undone. HTTP 204 No Content will be returned.</span>
          </p>
          <div className="flex gap-3">
            <Btn variant="default" onClick={()=>setDelU(null)}>Cancel</Btn>
            <Btn variant="danger"  onClick={doDelete}>DELETE</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
