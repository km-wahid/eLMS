import React, { useEffect, useRef, useState } from 'react'

/**
 * HLSVideoPlayer - Video player component with HLS/M3U8 support
 * Renders an HTML5 video element with controls
 */
const HLSVideoPlayer = React.forwardRef(({ src, title, onProgress, onEnded }, ref) => {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  React.useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
      }
    },
  }))

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      if (onProgress) {
        onProgress({
          currentTime: video.currentTime,
          duration: video.duration,
          percentage: (video.currentTime / video.duration) * 100,
        })
      }
    }
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => {
      if (onEnded) onEnded()
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onProgress, onEnded])

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen()
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen()
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        }
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  return (
    <div className="relative w-full bg-black">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        title={title}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-8 pb-2 px-4 opacity-0 hover:opacity-100 transition-opacity group">
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value)
              setCurrentTime(newTime)
              if (videoRef.current) {
                videoRef.current.currentTime = newTime
              }
            }}
            className="w-full h-1 bg-gray-600 rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
            aria-label="Video progress"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => {
                if (isPlaying) {
                  videoRef.current?.pause()
                } else {
                  videoRef.current?.play()
                }
              }}
              className="text-white hover:text-gray-200 text-lg w-8 h-8 flex items-center justify-center"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 1)}
                className="text-white hover:text-gray-200 text-lg w-8 h-8 flex items-center justify-center"
                aria-label="Mute"
              >
                {volume > 0 ? '🔊' : '🔇'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value)
                  setVolume(newVolume)
                  if (videoRef.current) {
                    videoRef.current.volume = newVolume
                  }
                }}
                className="w-16 h-1 bg-gray-600 rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                aria-label="Volume"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-xs ml-2 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-gray-200 text-lg w-8 h-8 flex items-center justify-center"
              aria-label="Fullscreen"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Center Play Button */}
      {!isPlaying && (
        <button
          onClick={() => videoRef.current?.play()}
          className="absolute inset-0 flex items-center justify-center text-white text-6xl hover:opacity-80 transition-opacity"
          aria-label="Play video"
        >
          ▶
        </button>
      )}
    </div>
  )
})

HLSVideoPlayer.displayName = 'HLSVideoPlayer'

export default HLSVideoPlayer
