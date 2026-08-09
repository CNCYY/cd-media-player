import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { MediaContent } from '../types';

interface MediaDisplayProps {
  media: MediaContent | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenSettings: () => void;
  onMediaUpload: (file: File) => void;
  liveVideoUrl?: string | null;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  isPlaying,
  onTogglePlay,
  onOpenSettings,
  onMediaUpload,
  liveVideoUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayOpacity, setDisplayOpacity] = useState(1);
  const [displayMedia, setDisplayMedia] = useState(media);
  const [isLivePlaying, setIsLivePlaying] = useState(false);

  // Smooth fade transition when media changes
  useEffect(() => {
    if (media?.url !== displayMedia?.url) {
      setDisplayOpacity(0);
      const timer = setTimeout(() => {
        setDisplayMedia(media);
        setDisplayOpacity(1);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayMedia(media);
    }
  }, [media]);

  // Auto-play Live Photo when CD switches to this one
  useEffect(() => {
    const hasLive = liveVideoUrl && displayMedia?.type === 'image';
    if (!hasLive || !displayMedia?.url) return;
    // Small delay to let the fade transition complete
    const timer = setTimeout(() => {
      setIsLivePlaying(true);
      if (liveVideoRef.current) {
        liveVideoRef.current.currentTime = 0;
        liveVideoRef.current.play().catch(() => {});
      }
      // Auto-stop after 2 seconds
      const stopTimer = setTimeout(() => {
        setIsLivePlaying(false);
        if (liveVideoRef.current) {
          liveVideoRef.current.pause();
          liveVideoRef.current.currentTime = 0;
        }
      }, 2000);
      return () => clearTimeout(stopTimer);
    }, 300);
    return () => clearTimeout(timer);
  }, [displayMedia?.url, liveVideoUrl]);

  // Sync video play/pause state
  useEffect(() => {
    if (displayMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn('Video playback interrupted or auto-play restricted:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, displayMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMediaUpload(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const hasMedia = displayMedia && displayMedia.url;
  const hasLiveVideo = liveVideoUrl && displayMedia?.type === 'image';

  // Long press handlers for Live Photo
  const startLongPress = () => {
    if (!hasLiveVideo) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsLivePlaying(true);
      if (liveVideoRef.current) {
        liveVideoRef.current.currentTime = 0;
        liveVideoRef.current.play().catch(() => {});
      }
    }, 150);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLivePlaying) {
      setIsLivePlaying(false);
      if (liveVideoRef.current) {
        liveVideoRef.current.pause();
        liveVideoRef.current.currentTime = 0;
      }
    }
  };

  // Handle single click (play/pause) vs double click (open settings)
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimeoutRef.current) {
      // Double click detected!
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onOpenSettings();
    } else {
      // Single click delay
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (!hasMedia) {
          onOpenSettings();
        } else {
          onTogglePlay();
        }
      }, 250);
    }
  };

  return (
    <div className="relative w-full max-w-xs mx-auto group">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
        id="top-media-file-input"
      />

      {/* Main Display Container with 3:4 Aspect Ratio */}
      <div 
        onClick={handleContainerClick}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        className="relative left-[15px] w-full aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 shadow-xl border border-white/20 transition-all duration-300 transform active:scale-[0.99] cursor-pointer group-hover:shadow-2xl flex flex-col items-center justify-center text-center"
      >
        {hasMedia ? (
          <div
            className="w-full h-full transition-opacity duration-200"
            style={{ opacity: displayOpacity }}
          >
            {displayMedia.type === 'video' ? (
              <video
                ref={videoRef}
                src={displayMedia.url}
                loop
                playsInline
                muted
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            ) : (
              <>
                <img
                  src={displayMedia.url}
                  alt={displayMedia.title || 'Display Media'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                />
                {/* Live Photo Video Overlay */}
                {hasLiveVideo && (
                  <video
                    ref={liveVideoRef}
                    src={liveVideoUrl}
                    loop
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-150 ${
                      isLivePlaying ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}
              </>
            )}

            {/* Minimal Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-30 transition-opacity pointer-events-none" />

            {/* Optional Title display if set */}
            {displayMedia.title && (
              <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
                <p className="text-white/90 text-xs font-light tracking-wider truncate drop-shadow-sm">
                  {displayMedia.title}
                </p>
              </div>
            )}

            {/* Live Photo indicator */}
            {hasLiveVideo && !isLivePlaying && (
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[9px] text-white/80 font-medium">LIVE</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* INITIAL UPLOAD GUIDE STATE */
          <div 
            onClick={onOpenSettings}
            className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-neutral-800 to-neutral-900 text-neutral-300 hover:text-white transition-colors border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-inner text-neutral-400 group-hover:text-white group-hover:scale-105 transition-all">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium tracking-wide">点击设置 CD 与图片 / 视频</p>
              <p className="text-[11px] text-neutral-500 tracking-normal">支持设置多张 CD 盘面与对应媒体</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};