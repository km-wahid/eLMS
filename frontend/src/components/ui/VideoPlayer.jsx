import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, poster, onProgress, onEnded }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError('');
    setIsReady(false);

    const isHLS = src.includes('.m3u8');

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setIsReady(true));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('Video failed to load. Please try again.');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src;
      setIsReady(true);
    } else {
      video.src = src;
      setIsReady(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !onProgress) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    onProgress(Math.round(pct));
  };

  if (!src) {
    return (
      <div className="bg-gray-900 aspect-video flex items-center justify-center rounded-xl">
        <p className="text-gray-400">No video available</p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        controls
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
      />
    </div>
  );
}
