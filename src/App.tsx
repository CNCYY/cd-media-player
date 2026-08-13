import React, { useState, useMemo, useCallback } from 'react';
import { MediaDisplay } from './components/MediaDisplay';
import { CDPlayer } from './components/CDPlayer';
import { SettingsModal } from './components/SettingsModal';
import { CDItem } from './types';
import { ambientSynth } from './utils/audioSynth';
import { MediaContent } from './types';

// Generated Asset Imports
import cdDisplaySample from './assets/images/cd_display_sample_1786179914334.jpg';
import cdSurfaceArt from './assets/images/cd_surface_art_1786179926240.jpg';

const DEFAULT_CD_LIST: CDItem[] = [
  {
    id: 'cd-1',
    cdSurfaceImage: null,
    mediaUrl: cdDisplaySample,
    mediaType: 'image',
    cdText: 'PURE WHITE',
  },
  {
    id: 'cd-2',
    cdSurfaceImage: cdSurfaceArt,
    mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    cdText: 'ABSTRACT ART',
  },
  {
    id: 'cd-3',
    cdSurfaceImage: cdSurfaceArt,
    mediaUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    cdText: 'MONOCHROME',
  },
];

export default function App() {
  // State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [cdList, setCdList] = useState<CDItem[]>(DEFAULT_CD_LIST);
  const [activeCdId, setActiveCdId] = useState<string>('cd-1');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active CD object
  const activeCd = cdList.find((item) => item.id === activeCdId) || cdList[0] || {
    id: 'default',
    cdSurfaceImage: null,
    mediaUrl: null,
    mediaType: 'image',
    cdText: 'COMPACT DISC',
  };

  // Play / Pause Toggle Handler
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (activeCd.mediaType !== 'video') {
        ambientSynth.toggle(next);
      }
      return next;
    });
  }, [activeCd.mediaType]);

  // Switch Active CD
  const handleSelectActiveCd = useCallback((id: string) => {
    const targetCd = cdList.find((item) => item.id === id);
    setIsPlaying((prev) => {
      if (targetCd?.mediaType === 'video') {
        ambientSynth.pause();
      } else if (prev) {
        ambientSynth.play();
      }
      return prev;
    });
    setActiveCdId(id);
  }, [cdList]);

  // Add new CD Item
  const handleAddCdItem = useCallback(() => {
    const newId = `cd-${Date.now()}`;
    const newCd: CDItem = {
      id: newId,
      cdSurfaceImage: null,
      mediaUrl: null,
      mediaType: 'image',
      cdText: `CD VOL.${cdList.length + 1}`,
    };
    setCdList((prev) => [...prev, newCd]);
    setActiveCdId(newId);
  }, [cdList.length]);

  // Delete CD Item
  const handleDeleteCdItem = useCallback((id: string) => {
    setCdList((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
    setActiveCdId((prev) => {
      if (prev === id) {
        const filtered = cdList.filter((item) => item.id !== id);
        return filtered[0]?.id || prev;
      }
      return prev;
    });
  }, [cdList]);

  // Update specific CD item field
  const handleUpdateCdItem = useCallback((id: string, updated: Partial<CDItem>) => {
    setCdList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  }, []);

  // Handle direct media upload on media display
  const handleMediaUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    handleUpdateCdItem(activeCd.id, { mediaUrl: url, mediaType });
  }, [activeCd.id, handleUpdateCdItem]);

  // Memoized media prop for MediaDisplay
  const mediaContent: MediaContent | null = useMemo(() => {
    if (!activeCd.mediaUrl) return null;
    return {
      type: activeCd.mediaType,
      url: activeCd.mediaUrl,
      title: activeCd.cdText,
    };
  }, [activeCd.mediaUrl, activeCd.mediaType, activeCd.cdText]);

  return (
    <div className="min-h-screen w-full text-neutral-800 flex flex-col justify-center items-center py-6 px-4 font-sans select-none overflow-hidden relative">

      {/* Background image fills the page from the current media */}
      {activeCd.mediaUrl && activeCd.mediaType === 'image' ? (
        <div className="fixed inset-0 z-[-1]">
          <img
            src={activeCd.mediaUrl}
            alt=""
            className="w-full h-full object-cover blur-[30px] opacity-[0.55]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/20" />
        </div>
      ) : (
        <div className="fixed inset-0 z-[-1] bg-[#F4F4F2]" />
      )}

      {/* Y2K Metallic Shell */}
      <div className="w-full max-w-sm my-auto py-2">
        <div
          className="relative rounded-[2rem] p-4 sm:p-5 overflow-hidden"
          style={{
            background: `linear-gradient(145deg, 
              #e8e8e8 0%, 
              #f5f5f5 5%, 
              #e0e0e0 10%,
              #c0c0c0 20%,
              #d4d4d4 30%,
              #b8b8b8 45%,
              #d0d0d0 55%,
              #a8a8a8 70%,
              #c8c8c8 80%,
              #e0e0e0 90%,
              #f0f0f0 95%,
              #d8d8d8 100%)`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.6),
              inset 0 -2px 4px rgba(0,0,0,0.15),
              inset 2px 0 4px rgba(0,0,0,0.08),
              inset -2px 0 4px rgba(0,0,0,0.08),
              0 8px 32px rgba(0,0,0,0.3),
              0 2px 8px rgba(0,0,0,0.2),
              0 0 0 4px rgba(180,180,180,0.4),
              0 0 0 6px rgba(160,160,160,0.2)
            `,
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          {/* Inner rim highlight */}
          <div className="absolute inset-2 rounded-[1.75rem] pointer-events-none"
            style={{
              boxShadow: `
                inset 0 0 20px rgba(0,0,0,0.15),
                inset 0 1px 2px rgba(255,255,255,0.4)
              `,
            }}
          />

          {/* Main Container */}
          <div className="w-full flex flex-col justify-start items-center relative z-0">

            {/* TOP SECTION: Image / Video Display Area (3:4 ratio) */}
            <section className="w-full relative z-0">
              <MediaDisplay
                media={mediaContent}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onMediaUpload={handleMediaUpload}
                liveVideoUrl={activeCd.liveVideoUrl}
              />
            </section>

            {/* BOTTOM SECTION: CD Discs directly arranged horizontally */}
            <section className="w-full relative z-10 -mt-20 sm:-mt-24">
              <CDPlayer
                cdList={cdList}
                activeCdId={activeCd.id}
                onSelectCd={handleSelectActiveCd}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
              />
            </section>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cdList={cdList}
        activeCdId={activeCd.id}
        onSelectActiveCd={handleSelectActiveCd}
        onUpdateCdItem={handleUpdateCdItem}
        onAddCdItem={handleAddCdItem}
        onDeleteCdItem={handleDeleteCdItem}
      />
    </div>
  );
}
