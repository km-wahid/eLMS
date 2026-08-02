import { useState, useEffect } from 'react'
import { Search, Filter, Plus, Trash2, Edit, Eye, Video, FileText, Link as LinkIcon, Presentation, FileDown } from 'lucide-react'
import { getContentItems, deleteContentItem, searchContent, getContentByModule } from '../services/adminService'
import { toast } from 'react-hot-toast'

export default function AdminContent() {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  const loadContent = async () => {
    setLoading(true)
    try {
      let response
      if (searchQuery) {
        response = await searchContent(searchQuery, filterType || null)
      } else if (selectedModule) {
        response = await getContentByModule(selectedModule)
      } else {
        const params = {}
        if (filterType) params.type = filterType
        response = await getContentItems(params)
      }
      setContent(response.data)
    } catch (error) {
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [filterType, selectedModule])

  const handleDelete = async (uuid) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    try {
      await deleteContentItem(uuid)
      toast.success('Content deleted successfully')
      loadContent()
    } catch (error) {
      toast.error('Failed to delete content')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadContent()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-600 mt-1">Manage all learning materials</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="video">Videos</option>
              <option value="pdf">PDFs</option>
              <option value="slide">Slides</option>
              <option value="text">Text Notes</option>
              <option value="link">External Links</option>
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No content found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module / Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(item.type)}
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            {item.file && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {item.file.split('/').pop()}
                              </p>
                            )}
                            {item.external_url && (
                              <a 
                                href={item.external_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                {item.external_url}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{item.module_title}</p>
                          <p className="text-gray-500">{item.course_title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{item.uploaded_by_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.order}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {item.file && (
                            <a
                              href={item.file}
                              download
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Download"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function getTypeIcon(type) {
  const icons = {
    video: <Video className="w-5 h-5 text-red-600" />,
    pdf: <FileText className="w-5 h-5 text-blue-600" />,
    slide: <Presentation className="w-5 h-5 text-orange-600" />,
    text: <FileText className="w-5 h-5 text-green-600" />,
    link: <LinkIcon className="w-5 h-5 text-purple-600" />,
  }
  return icons[type.toLowerCase()] || <FileText className="w-5 h-5 text-gray-600" />
}

function getTypeBadge(type) {
  const badges = {
    video: 'bg-red-100 text-red-800',
    pdf: 'bg-blue-100 text-blue-800',
    slide: 'bg-orange-100 text-orange-800',
    text: 'bg-green-100 text-green-800',
    link: 'bg-purple-100 text-purple-800',
  }
  return badges[type.toLowerCase()] || 'bg-gray-100 text-gray-800'
}
