import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Panel, MethodBadge, Btn } from './CMSLayout';
import { Loader2, RefreshCw, ChevronDown, ChevronUp, X, Plus, Pencil, Trash2 } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2.5 flex items-center justify-between sticky top-0">
          <span className="font-semibold text-sm text-gray-700 font-mono">{title}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, type='text', required, readOnly, options, textarea }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <label className="w-36 text-xs font-mono text-gray-600 pt-2 shrink-0">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex-1">
        {options ? (
          <select
            value={value}
            onChange={e => onChange(name, e.target.value)}
            disabled={readOnly}
            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] ${readOnly ? 'bg-gray-50 text-gray-400' : ''}`}
          >
            <option value="">-- Select {label} --</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : textarea ? (
          <textarea
            value={value}
            onChange={e => onChange(name, e.target.value)}
            readOnly={readOnly}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] ${readOnly ? 'bg-gray-50 text-gray-400' : ''}`}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(name, e.target.value)}
            readOnly={readOnly}
            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7] ${readOnly ? 'bg-gray-50 text-gray-400' : ''}`}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        )}
      </div>
    </div>
  );
}

function SemesterRow({ sem, onEdit, onDelete, departmentName }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="px-3 py-2 font-mono text-xs text-gray-600 text-center">{sem.order}</td>
        <td className="px-3 py-2">
          <div className="font-medium text-sm text-gray-800">{sem.name}</div>
          <div className="font-mono text-xs text-gray-400">{sem.slug}</div>
        </td>
        <td className="px-3 py-2 text-sm text-gray-600">{departmentName || '—'}</td>
        <td className="px-3 py-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded border bg-blue-50 border-blue-300 text-blue-700">
            {sem.type || 'semester'}
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate">
          {sem.description || '—'}
        </td>
        <td className="px-3 py-2 font-mono text-xs text-gray-400">
          {sem.created_at ? new Date(sem.created_at).toLocaleDateString() : '—'}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Btn variant="default" size="sm" onClick={() => setOpen(o => !o)}>
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Btn>
            <Btn variant="info" size="sm" onClick={() => onEdit(sem)}>
              <Pencil className="h-3 w-3 mr-1 inline" />Edit
            </Btn>
            <Btn variant="danger" size="sm" onClick={() => onDelete(sem)}>
              <Trash2 className="h-3 w-3 mr-1 inline" />Delete
            </Btn>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#272822]">
          <td colSpan={7} className="px-4 py-3">
            <pre className="text-[#f8f8f2] text-xs font-mono leading-relaxed overflow-x-auto">
              {JSON.stringify(sem, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

const EMPTY_FORM = { name: '', department: '', type: 'semester', order: '', description: '' };

export default function CMSSemesters() {
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSem, setCurrentSem] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState(null);
  const [raw, setRaw] = useState(false);

  const toast$ = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/academics/semesters/', { params: search ? { search } : {} }),
      api.get('/academics/departments/')
    ])
      .then(([semRes, deptRes]) => {
        setSemesters(semRes.data.results ?? semRes.data);
        setDepartments(deptRes.data.results ?? deptRes.data);
      })
      .catch(e => toast$('Failed to load: ' + (e.response?.data?.detail || e.message), false))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditMode(false);
    setCurrentSem(null);
    setShowModal(true);
  };

  const openEdit = (sem) => {
    setForm({
      name: sem.name || '',
      department: sem.department || '',
      type: sem.type || 'semester',
      order: sem.order || '',
      description: sem.description || ''
    });
    setEditMode(true);
    setCurrentSem(sem);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast$('Semester name is required', false);
      return;
    }
    if (!form.department) {
      toast$('Department is required', false);
      return;
    }
    if (!form.order || form.order < 1) {
      toast$('Order must be at least 1', false);
      return;
    }

    setSaving(true);
    try {
      if (editMode && currentSem) {
        await api.patch(`/academics/semesters/${currentSem.id}/`, form);
        toast$('Semester updated successfully');
      } else {
        await api.post('/academics/semesters/', form);
        toast$('Semester created successfully');
      }
      setShowModal(false);
      load();
    } catch (e) {
      const errorMsg = e.response?.data?.detail || e.response?.data?.name?.[0] || e.response?.data?.order?.[0] || 'Save failed';
      toast$(errorMsg, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sem) => {
    if (!window.confirm(`Delete semester "${sem.name}"?\n\nThis will also delete all associated courses. This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/academics/semesters/${sem.id}/`);
      toast$('Semester deleted');
      load();
    } catch (e) {
      toast$('Delete failed: ' + (e.response?.data?.detail || e.message), false);
    }
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const filtered = semesters.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const deptOptions = departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
        <Link to="/cms" className="text-[#337ab7] hover:underline">cms</Link>
        <span>/</span>
        <span className="text-gray-700">semesters</span>
      </div>

      {/* Header */}
      <Panel title={null} className="border-l-4 border-l-[#337ab7]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/academics/semesters/</span>
            </div>
            <p className="text-sm text-gray-500">Manage academic semesters per department — create, edit, delete.</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="default" onClick={() => setRaw(r => !r)}>{raw ? 'Table View' : 'JSON View'}</Btn>
            <Btn variant="success" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 inline mr-1" />Create Semester
            </Btn>
            <Btn variant="primary" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : <RefreshCw className="h-3.5 w-3.5 inline" />}
              {' '}Refresh
            </Btn>
          </div>
        </div>
      </Panel>

      {/* Toast */}
      {toast && (
        <div className={`border rounded px-4 py-3 text-sm font-mono ${toast.ok ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Search & Filter */}
      <Panel title="Search & Filter">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]"
          />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-[#337ab7]"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
      </Panel>

      {loading && !semesters.length && (
        <Panel title="Loading...">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />Fetching semesters...
          </div>
        </Panel>
      )}

      {/* Results */}
      {!loading && (
        <>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="bg-[#49cc90] text-white px-2 py-0.5 rounded">200 OK</span>
            <span className="text-gray-400">Found {filtered.length} semester(s)</span>
          </div>

          {raw ? (
            <Panel title="Response Body (JSON)">
              <pre className="bg-[#272822] text-[#f8f8f2] p-4 rounded text-xs font-mono leading-relaxed overflow-x-auto">
                {JSON.stringify(filtered, null, 2)}
              </pre>
            </Panel>
          ) : (
            <Panel title={`Semesters (${filtered.length})`}>
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm font-mono">No semesters found.</p>
                  <Btn variant="success" onClick={openCreate} className="mt-3">
                    <Plus className="h-3.5 w-3.5 inline mr-1" />Create First Semester
                  </Btn>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-300 rounded">
                    <thead className="bg-gray-100">
                      <tr>
                        {['Order', 'Name', 'Department', 'Type', 'Description', 'Created', 'Actions'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border-b border-gray-300">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filtered.map(sem => (
                        <SemesterRow
                          key={sem.id}
                          sem={sem}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                          departmentName={getDepartmentName(sem.department)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editMode ? `Edit Semester: ${currentSem?.name}` : 'Create New Semester'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <FormField
              label="Semester Name"
              name="name"
              value={form.name}
              onChange={updateForm}
              required
            />
            <FormField
              label="Department"
              name="department"
              value={form.department}
              onChange={updateForm}
              options={deptOptions}
              required
            />
            <FormField
              label="Type"
              name="type"
              value={form.type}
              onChange={updateForm}
              options={[
                { value: 'semester', label: 'Semester' },
                { value: 'trimester', label: 'Trimester' }
              ]}
              required
            />
            <FormField
              label="Order"
              name="order"
              type="number"
              value={form.order}
              onChange={updateForm}
              required
            />
            <FormField
              label="Description"
              name="description"
              value={form.description}
              onChange={updateForm}
              textarea
            />

            <div className="flex items-center gap-2 pt-3">
              <Btn variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-2" /> : null}
                {saving ? 'Saving...' : editMode ? 'Update Semester' : 'Create Semester'}
              </Btn>
              <Btn variant="default" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
