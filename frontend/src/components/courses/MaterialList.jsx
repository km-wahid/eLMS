import { useState, useEffect } from 'react';
import materialService from '../../services/materialService';
import { useAuthStore } from '../../store/authStore';

const FILE_ICONS = {
  pdf:   { icon: '📄', color: 'text-red-600',    bg: 'bg-red-50' },
  slide: { icon: '📊', color: 'text-orange-600', bg: 'bg-orange-50' },
  doc:   { icon: '📝', color: 'text-blue-600',   bg: 'bg-blue-50' },
  video: { icon: '🎬', color: 'text-purple-600', bg: 'bg-purple-50' },
  other: { icon: '📎', color: 'text-gray-600',   bg: 'bg-gray-50' },
};

export default function MaterialList({ courseSlug, moduleId, lectureId, isOwner }) {
  const { user } = useAuthStore();
  const [materials, setMaterials]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showUpload, setShowUpload]       = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState('');
  const [form, setForm] = useState({
    title: '', description: '', file: null, file_type: 'other', is_downloadable: true,
  });

  const fetchMaterials = () => {
    setLoading(true);
    const params = {};
    if (lectureId) params.lecture = lectureId;
    else if (moduleId) params.module = moduleId;

    materialService
      .getMaterials(courseSlug, params)
      .then((r) => setMaterials(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMaterials(); }, [courseSlug, moduleId, lectureId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.file) {
      setUploadError('Title and file are required.');
      return;
    }
    setUploading(true);
    setUploadError('');
    const data = new FormData();
    data.append('title',           form.title);
    data.append('description',     form.description);
    data.append('file',            form.file);
    data.append('file_type',       form.file_type);
    data.append('is_downloadable', form.is_downloadable);
    if (lectureId) data.append('lecture', lectureId);
    else if (moduleId) data.append('module', moduleId);

    try {
      const res = await materialService.uploadMaterial(courseSlug, data);
      setMaterials((prev) => [...prev, res.data]);
      setShowUpload(false);
      setForm({ title: '', description: '', file: null, file_type: 'other', is_downloadable: true });
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await materialService.deleteMaterial(courseSlug, id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert('Failed to delete.');
    }
  };

  if (loading) {
    return <div className="text-gray-400 text-sm py-2">Loading materials…</div>;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">
          📎 Materials {materials.length > 0 && <span className="text-gray-500 font-normal">({materials.length})</span>}
        </h3>
        {isOwner && (
          <button
            onClick={() => { setShowUpload((s) => !s); setUploadError(''); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {showUpload ? 'Cancel' : '+ Upload'}
          </button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleUpload} className="border border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="input w-full text-sm" placeholder="Material title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.file_type}
                onChange={(e) => setForm((f) => ({ ...f, file_type: e.target.value }))}
                className="input w-full text-sm"
              >
                <option value="pdf">PDF</option>
                <option value="slide">Slide</option>
                <option value="doc">Document</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File *</label>
            <input
              type="file"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] }))}
              className="text-sm text-gray-600 w-full"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox" checked={form.is_downloadable}
              onChange={(e) => setForm((f) => ({ ...f, is_downloadable: e.target.checked }))}
              className="rounded"
            />
            Allow students to download
          </label>
          {uploadError && <p className="text-red-600 text-xs">{uploadError}</p>}
          <button type="submit" disabled={uploading} className="btn btn-primary text-sm">
            {uploading ? 'Uploading…' : 'Upload Material'}
          </button>
        </form>
      )}

      {/* List */}
      {materials.length === 0 ? (
        <p className="text-gray-400 text-sm">No materials yet.</p>
      ) : (
        <ul className="space-y-2">
          {materials.map((mat) => {
            const { icon, color, bg } = FILE_ICONS[mat.file_type] || FILE_ICONS.other;
            return (
              <li key={mat.id} className={`flex items-center gap-3 p-3 rounded-lg ${bg}`}>
                <span className={`text-2xl ${color}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{mat.title}</p>
                  <p className="text-gray-500 text-xs">
                    {mat.file_size_display} · {mat.uploaded_by_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {mat.is_downloadable && (
                    <a
                      href={mat.file_url}
                      download
                      className={`text-xs font-medium ${color} hover:underline`}
                    >
                      Download
                    </a>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(mat.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
