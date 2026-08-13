import React, { useRef, useState, useEffect, useCallback } from 'react';
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

  const [displayUrl, setDisplayUrl] = useState(media?.url || null);
  const [displayType, setDisplayType] = useState(media?.type || 'image');
  const [displayTitle, setDisplayTitle] = useState(media?.title || '');
  const [displayOpacity, setDisplayOpacity] = useState(1);
  const [isLivePlaying, setIsLivePlaying] = useState(false);

  const mediaRef = useRef(media);
  mediaRef.current = media;

  // Live Photo only applies when media is image type AND liveVideoUrl exists
  const isLivePhoto = displayType === 'image' && !!liveVideoUrl;

  // Smooth fade transition when media URL changes
  useEffect(() => {
    const newUrl = media?.url || null;
    if (newUrl === displayUrl) return;

    setDisplayOpacity(0);
    const timer = setTimeout(() => {
      const m = mediaRef.current;
      setDisplayUrl(m?.url || null);
      setDisplayType(m?.type || 'image');
      setDisplayTitle(m?.title || '');
      setDisplayOpacity(1);
    }, 100);
    return () => clearTimeout(timer);
  }, [media?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-play Live Photo when CD switches (image + live video only)
  useEffect(() => {
    if (!isLivePhoto || !displayUrl) return;

    const timer = setTimeout(() => {
      setIsLivePlaying(true);
      if (liveVideoRef.current) {
        liveVideoRef.current.currentTime = 0;
        liveVideoRef.current.play().catch(() => {});
      }
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
  }, [displayUrl, isLivePhoto]);

  // Sync video play/pause (standalone video only, not Live Photo)
  useEffect(() => {
    if (displayType !== 'video') return;
    const el = videoRef.current;
    if (!el) return;

    if (isPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isPlaying, displayType]);

  // Set Live Photo video src after mount to avoid StrictMode ERR_ABORTED
  useEffect(() => {
    if (!isLivePhoto || !liveVideoUrl) return;
    const timer = setTimeout(() => {
      const el = liveVideoRef.current;
      if (el && el.src !== liveVideoUrl) {
        el.src = liveVideoUrl;
        el.load();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [liveVideoUrl, isLivePhoto]);
  useEffect(() => {
    if (displayType !== 'video' || !displayUrl) return;
    const timer = setTimeout(() => {
      const el = videoRef.current;
      if (el && el.src !== displayUrl) {
        el.src = displayUrl;
        el.load();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [displayUrl, displayType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onMediaUpload(file);
    if (e.target) e.target.value = '';
  };

  const hasMedia = !!displayUrl;

  // Long press handlers for Live Photo
  const startLongPress = useCallback(() => {
    if (!isLivePhoto) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsLivePlaying(true);
      if (liveVideoRef.current) {
        liveVideoRef.current.currentTime = 0;
        liveVideoRef.current.play().catch(() => {});
      }
    }, 150);
  }, [isLivePhoto]);

  const cancelLongPress = useCallback(() => {
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
  }, [isLivePlaying]);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onOpenSettings();
    } else {
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
        id="top-media-file-input"
      />

      <div
        onClick={handleContainerClick}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        className="relative left-[15px] w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/10 shadow-xl border border-white/20 transition-all duration-300 transform active:scale-[0.99] cursor-pointer group-hover:shadow-2xl flex flex-col items-center justify-center text-center"
      >
        {hasMedia ? (
          <div
            className="relative w-full h-full transition-opacity duration-150"
            style={{ opacity: displayOpacity }}
          >
            {displayType === 'video' ? (
              /* Standalone video - no Live Photo overlay */
              <video
                ref={videoRef}
                loop
                playsInline
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            ) : (
              /* Image (possibly with Live Photo overlay) */
              <>
                <img
                  src={displayUrl}
                  alt={displayTitle || 'Display Media'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                />
                {/* Live Photo video overlay */}
                {isLivePhoto && (
                  <video
                    ref={liveVideoRef}
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

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-30 transition-opacity pointer-events-none" />

            {/* Title */}
            {displayTitle && (
              <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
                <p className="text-white/90 text-xs font-light tracking-wider truncate drop-shadow-sm">
                  {displayTitle}
                </p>
              </div>
            )}

            {/* LIVE indicator */}
            {isLivePhoto && !isLivePlaying && (
              <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[9px] text-white/80 font-medium">LIVE</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={onOpenSettings}
            className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 bg-white/10 backdrop-blur-sm text-neutral-400 hover:text-white transition-colors border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl"
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