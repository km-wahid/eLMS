import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronDown, ChevronRight, ArrowLeft, 
  Video, FileText, Link as LinkIcon, BookOpen,
  CheckCircle, Circle, Play
} from 'lucide-react';
import api from '../services/api';
import ProgressBar from '../components/courses/ProgressBar';
import ModuleCompletionBadge from '../components/courses/ModuleCompletionBadge';
import ContentViewer from '../components/courses/ContentViewer';
import Layout from '../components/layout/Layout';

export default function StudentCourseViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set([0])); // First module expanded by default
  const [selectedContent, setSelectedContent] = useState(null);
  const [progress, setProgress] = useState({
    completed_modules: 0,
    total_modules: 0,
    percentage: 0
  });

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/courses/${slug}/student/`);
      setCourse(response.data);
      
      // Set progress
      if (response.data.progress) {
        setProgress(response.data.progress);
      }
      
      // Auto-select first content item of first module
      if (response.data.modules?.length > 0 && response.data.modules[0].content_items?.length > 0) {
        setSelectedContent(response.data.modules[0].content_items[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load course:', err);
      setError(err.response?.data?.detail || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (index) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  const handleContentSelect = (content) => {
    setSelectedContent(content);
    // Track module progress
    trackModuleProgress(content.module);
  };

  const trackModuleProgress = async (moduleId) => {
    try {
      await api.post(`/courses/courses/${slug}/progress/module/${moduleId}/`);
      // Refresh course data to get updated progress
      fetchCourse();
    } catch (error) {
      console.error('Failed to track module progress:', error);
    }
  };

  const handleContentViewed = async (contentId) => {
    // Refresh course to get updated progress
    fetchCourse();
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'pdf':
      case 'slide':
        return <FileText className="w-4 h-4" />;
      case 'link':
        return <LinkIcon className="w-4 h-4" />;
      case 'text':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>👨‍🏫 {course.teacher_name}</span>
                  <span>•</span>
                  <span>🏫 {course.department_name}</span>
                  <span>•</span>
                  <span>📅 {course.semester_name}</span>
                </div>
                <p className="text-gray-700">{course.description}</p>
              </div>
              
              <div className="w-64 flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Progress</h3>
                  <ProgressBar percentage={progress.percentage} />
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {progress.completed_modules} of {progress.total_modules} modules completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Module List */}
            <div className="col-span-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <h2 className="text-lg font-bold">Course Content</h2>
                  <p className="text-sm text-indigo-100 mt-1">
                    {course.modules?.length || 0} modules • {
                      course.modules?.reduce((acc, m) => acc + (m.content_items?.length || 0), 0)
                    } items
                  </p>
                </div>
                
                <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                  {course.modules?.map((module, index) => (
                    <div key={module.id} className="border-b border-gray-200 last:border-b-0">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(index)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {expandedModules.has(index) ? (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-indigo-600">
                                Module {index + 1}
                              </span>
                              {module.is_completed && (
                                <CheckCircle className="w-4 h-4 text-green-600 fill-green-100" />
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {module.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {module.viewed_content_count || 0}/{module.content_count || 0} completed
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Content Items */}
                      {expandedModules.has(index) && (
                        <div className="bg-gray-50">
                          {module.content_items?.length > 0 ? (
                            module.content_items.map((content, cIndex) => (
                              <button
                                key={content.id}
                                onClick={() => handleContentSelect(content)}
                                className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white transition-colors text-left border-l-2 ${
                                  selectedContent?.id === content.id
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-transparent'
                                }`}
                              >
                                <div className={`flex-shrink-0 ${content.is_viewed ? 'text-green-600' : 'text-gray-400'}`}>
                                  {content.is_viewed ? (
                                    <CheckCircle className="w-4 h-4 fill-green-100" />
                                  ) : (
                                    getContentIcon(content.content_type)
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${
                                    selectedContent?.id === content.id
                                      ? 'font-semibold text-indigo-900'
                                      : 'text-gray-700'
                                  }`}>
                                    {content.title}
                                  </p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {content.content_type}
                                    {content.duration_seconds && (
                                      <span> • {Math.floor(content.duration_seconds / 60)}m</span>
                                    )}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No content items
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!course.modules || course.modules.length === 0) && (
                    <div className="p-8 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No modules available yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-span-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {selectedContent ? (
                  <ContentViewer
                    content={selectedContent}
                    courseSlug={slug}
                    onViewed={handleContentViewed}
                  />
                ) : (
                  <div className="text-center py-20">
                    <Play className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Ready to start learning?
                    </h3>
                    <p className="text-gray-500">
                      Select a content item from the sidebar to begin
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
