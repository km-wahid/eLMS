import React, { useState, useRef, useEffect } from 'react'
import HLSVideoPlayer from './HLSVideoPlayer'
import CommentSection from './CommentSection'
import BookmarkButton from './BookmarkButton'
import ProgressBar from './ProgressBar'
import { useProgressStore } from '../store/progressStore'

/**
 * LectureViewer - HLS video player with progress tracking, comments, and bookmarks
 */
const LectureViewer = ({ lecture, material, courseId, onProgress }) => {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const playerRef = useRef(null)
  const trackProgressTimer = useRef(null)
  const { trackLectureView } = useProgressStore()

  useEffect(() => {
    // Track lecture view after 5 seconds of watching
    trackProgressTimer.current = setTimeout(() => {
      if (lecture?.id) {
        trackLectureView(lecture.id)
      }
    }, 5000)

    return () => clearTimeout(trackProgressTimer.current)
  }, [lecture?.id, trackLectureView])

  const handleProgress = (progress) => {
    if (onProgress) {
      onProgress(progress)
    }
  }

  if (!lecture && !material) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No content to display</p>
      </div>
    )
  }

  const videoUrl = lecture?.video_url || material?.file_url
  const title = lecture?.title || material?.title || 'Lecture'
  const description = lecture?.description || material?.description || ''

  return (
    <div className="w-full space-y-4">
      {/* Video Player */}
      {videoUrl && (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <HLSVideoPlayer
            ref={playerRef}
            src={videoUrl}
            title={title}
            onProgress={handleProgress}
          />
        </div>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-2 text-sm line-clamp-2">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <BookmarkButton lectureId={lecture?.id} materialId={material?.id} />
          {lecture?.duration && (
            <div className="text-sm text-gray-600">
              {Math.round(lecture.duration / 60)} min
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {lecture && (
        <ProgressBar
          lectureId={lecture.id}
          courseId={courseId}
          className="h-2 rounded-full"
        />
      )}

      {/* Tabs: Description / Materials / Comments */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" role="tablist">
            <button
              role="tab"
              className="px-4 py-3 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-blue-500 hover:text-gray-900 whitespace-nowrap"
              onClick={() => setIsCommentExpanded(false)}
            >
              Description
            </button>
            <button
              role="tab"
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                isCommentExpanded
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-700 border-b-2 border-transparent hover:border-blue-500 hover:text-gray-900'
              }`}
              onClick={() => setIsCommentExpanded(true)}
            >
              Discussion
            </button>
          </nav>
        </div>

        <div className="p-6">
          {!isCommentExpanded ? (
            <div className="prose prose-sm max-w-none">
              {description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
              ) : (
                <p className="text-gray-500">No description available</p>
              )}
            </div>
          ) : (
            <CommentSection lectureId={lecture?.id} />
          )}
        </div>
      </div>

      {/* Materials List */}
      {lecture?.materials && lecture.materials.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Materials</h2>
          <div className="space-y-2">
            {lecture.materials.map((mat) => (
              <div
                key={mat.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{mat.title}</p>
                  <p className="text-xs text-gray-500">{mat.file_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {mat.file_url && (
                    <a
                      href={mat.file_url}
                      download
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download
                    </a>
                  )}
                  <BookmarkButton materialId={mat.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LectureViewer
