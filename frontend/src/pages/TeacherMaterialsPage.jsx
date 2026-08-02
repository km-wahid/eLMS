import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, FileText, Presentation, File, Video, FileIcon, Download, Upload as UploadIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import materialService from '../services/materialService';
import MaterialUploadModal from '../components/teacher/MaterialUploadModal';

export default function TeacherMaterialsPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(new Set());

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadMaterials();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses/mine/');
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadMaterials = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      const response = await materialService.getMaterials(selectedCourse);
      setMaterials(response.data);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await materialService.deleteMaterial(selectedCourse, materialId);
      setMaterials(materials.filter(m => m.id !== materialId));
      setSelectedForDelete(prev => {
        const next = new Set(prev);
        next.delete(materialId);
        return next;
      });
    } catch (err) {
      alert('Failed to delete material: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedForDelete.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedForDelete.size} materials? This cannot be undone.`)) return;
    
    const deletePromises = Array.from(selectedForDelete).map(id =>
      materialService.deleteMaterial(selectedCourse, id)
    );
    
    try {
      await Promise.all(deletePromises);
      setMaterials(materials.filter(m => !selectedForDelete.has(m.id)));
      setSelectedForDelete(new Set());
    } catch (err) {
      alert('Some materials failed to delete');
      loadMaterials(); // Reload to get accurate state
    }
  };

  const toggleSelectMaterial = (materialId) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return FileText;
      case 'slide': return Presentation;
      case 'doc': return File;
      case 'video': return Video;
      default: return FileIcon;
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFileType = !fileTypeFilter || material.file_type === fileTypeFilter;
    return matchesSearch && matchesFileType;
  });

  const currentCourse = courses.find(c => c.slug === selectedCourse);

  if (!user?.is_teacher && !user?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Only teachers can access this page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Material Management</h1>
          <p className="text-gray-600">Manage all your course materials in one place</p>
        </div>

        {/* Course Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.slug}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div className="flex items-end">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UploadIcon className="w-4 h-4" />
                  Upload New Material
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedCourse && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search materials..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All File Types</option>
                    <option value="pdf">PDF</option>
                    <option value="slide">Presentation</option>
                    <option value="doc">Document</option>
                    <option value="video">Video</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {selectedForDelete.size > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-red-700">
                    {selectedForDelete.size} material(s) selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {/* Materials Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading materials...</p>
                </div>
              ) : filteredMaterials.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedForDelete.size === filteredMaterials.length && filteredMaterials.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedForDelete(new Set(filteredMaterials.map(m => m.id)));
                              } else {
                                setSelectedForDelete(new Set());
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMaterials.map(material => {
                        const IconComponent = getFileIcon(material.file_type);
                        return (
                          <tr key={material.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedForDelete.has(material.id)}
                                onChange={() => toggleSelectMaterial(material.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <IconComponent className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{material.title}</p>
                                  {material.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                      {material.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm uppercase font-medium text-gray-600">
                                {material.file_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {material.file_size_display}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(material.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              {material.is_downloadable && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                                  <Download className="w-3 h-3" />
                                  Downloadable
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={material.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  View
                                </a>
                                <button
                                  onClick={() => handleDeleteMaterial(material.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">
                    {searchQuery || fileTypeFilter ? 'No materials match your filters' : 'No materials uploaded yet'}
                  </p>
                  {!searchQuery && !fileTypeFilter && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Upload your first material
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedCourse && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Course Selected</h3>
            <p className="text-gray-600">
              Select a course above to view and manage its materials
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {currentCourse && (
        <MaterialUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          courseSlug={currentCourse.slug}
          modules={currentCourse.modules || []}
          onSuccess={() => {
            loadMaterials();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
