import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { MediaContent } from '../types';

interface MediaDisplayProps {
  media: MediaContent | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenSettings: () => void;
  onMediaUpload: (file: File) => void;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  isPlaying,
  onTogglePlay,
  onOpenSettings,
  onMediaUpload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [displayUrl, setDisplayUrl] = useState(media?.url || null);
  const [displayType, setDisplayType] = useState(media?.type || 'image');
  const [displayTitle, setDisplayTitle] = useState(media?.title || '');
  const [displayOpacity, setDisplayOpacity] = useState(1);

  const mediaRef = useRef(media);
  mediaRef.current = media;

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
    }, 200);
    return () => clearTimeout(timer);
  }, [media?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync video play/pause state
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onMediaUpload(file);
    if (e.target) e.target.value = '';
  };

  const hasMedia = !!displayUrl;

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
        className="relative left-[15px] w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/10 shadow-xl border border-white/20 transition-all duration-300 transform active:scale-[0.99] cursor-pointer group-hover:shadow-2xl flex flex-col items-center justify-center text-center"
      >
        {hasMedia ? (
          <div
            className="relative w-full h-full transition-opacity duration-200"
            style={{ opacity: displayOpacity }}
          >
            {displayType === 'video' ? (
              <video
                key={displayUrl}
                ref={videoRef}
                src={displayUrl}
                loop
                playsInline
                muted
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            ) : (
              <img
                src={displayUrl}
                alt={displayTitle || 'Display Media'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
              />
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
