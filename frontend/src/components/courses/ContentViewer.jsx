import React, { useEffect, useState } from 'react';
import { 
  Video, FileText, ExternalLink, 
  Download, Eye, Clock 
} from 'lucide-react';
import api from '../../services/api';
import ContentDiscussion from './ContentDiscussion';
import VideoPlayer from '../ui/VideoPlayer';

export default function ContentViewer({ content, courseSlug, onViewed }) {
  const [watchTime, setWatchTime] = useState(0);

  // Track content as viewed when component mounts
  useEffect(() => {
    if (content && !content.is_viewed) {
      trackView();
    }
  }, [content?.id]);

  const trackView = async (duration = 0) => {
    if (!content || !courseSlug) return;
    
    try {
      await api.post(`/courses/courses/${courseSlug}/progress/content/${content.id}/`, {
        watch_duration_seconds: duration
      });
      if (onViewed) {
        onViewed(content.id);
      }
    } catch (error) {
      console.error('Failed to track content view:', error);
    }
  };

  if (!content) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Select content to view</p>
      </div>
    );
  }

  // Render based on content type
  const renderContent = () => {
    switch (content.content_type) {
      case 'video':
        return (
          <div className="space-y-4">
            {(content.hls_playlist_url || content.video_url || content.file_url) ? (
              <VideoPlayer
                src={content.hls_playlist_url || content.video_url || content.file_url}
                onProgress={(percentage) => {
                  const seconds = Math.round((percentage / 100) * (content.duration_seconds || 0));
                  if (seconds > watchTime) {
                    setWatchTime(seconds);
                    trackView(seconds);
                  }
                }}
              />
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Video not available</p>
              </div>
            )}
            
            {content.duration_seconds && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Duration: {Math.floor(content.duration_seconds / 60)}m {content.duration_seconds % 60}s</span>
              </div>
            )}
          </div>
        );

      case 'pdf':
      case 'slide':
        return (
          <div className="space-y-4">
            {(content.file_url || content.file || content.external_file_url) ? (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{content.title}</h3>
                      {content.file_size && (
                        <p className="text-sm text-gray-500">
                          {(content.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>
                  {content.is_downloadable && (
                    <a
                      href={content.file_url || content.file || content.external_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  )}
                </div>
                
                {/* PDF Preview */}
                <iframe
                  src={content.file_url || content.file || content.external_file_url}
                  className="w-full h-96 border border-gray-200 rounded"
                  title={content.title}
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">File not available</p>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content.content_text }} />
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <ExternalLink className="w-8 h-8 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{content.title}</h3>
                <p className="text-sm text-gray-500">External Resource</p>
              </div>
            </div>
            {content.description && (
              <p className="text-gray-700 mb-4">{content.description}</p>
            )}
            <a
              href={content.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Link
            </a>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-500">Unsupported content type</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Content Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
          {content.description && (
            <p className="text-gray-600">{content.description}</p>
          )}
        </div>
        {content.is_viewed && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <Eye className="w-4 h-4" />
            <span>Viewed</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      {renderContent()}
      <ContentDiscussion contentId={content.id} />
    </div>
  );
}
