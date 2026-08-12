import React, { useState } from 'react';
import { MediaDisplay } from './components/MediaDisplay';
import { CDPlayer } from './components/CDPlayer';
import { SettingsModal } from './components/SettingsModal';
import { CDItem } from './types';
import { ambientSynth } from './utils/audioSynth';

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
  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    // Only use ambient synth for non-video media (images or no media)
    if (activeCd.mediaType !== 'video') {
      ambientSynth.toggle(nextState);
    }
  };

  // Switch Active CD
  const handleSelectActiveCd = (id: string) => {
    // Stop ambient synth if switching to a video CD
    const targetCd = cdList.find((item) => item.id === id);
    if (targetCd?.mediaType === 'video') {
      ambientSynth.pause();
    } else if (isPlaying) {
      // Start ambient synth if switching to image CD while playing
      ambientSynth.play();
    }
    setActiveCdId(id);
  };

  // Add new CD Item
  const handleAddCdItem = () => {
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
  };

  // Delete CD Item
  const handleDeleteCdItem = (id: string) => {
    if (cdList.length <= 1) return;
    const filtered = cdList.filter((item) => item.id !== id);
    setCdList(filtered);
    if (activeCdId === id) {
      setActiveCdId(filtered[0].id);
    }
  };

  // Update specific CD item field
  const handleUpdateCdItem = (id: string, updated: Partial<CDItem>) => {
    setCdList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  // Handle direct media upload on media display
  const handleMediaUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    handleUpdateCdItem(activeCd.id, { mediaUrl: url, mediaType });
  };

  return (
    <div className="min-h-screen w-full text-neutral-800 flex flex-col justify-start items-center py-6 px-4 font-sans select-none overflow-y-auto pb-12 relative">

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

      {/* Main Container */}
      <div className="w-full max-w-sm flex flex-col justify-start items-center my-auto py-2">

        {/* TOP SECTION: Image / Video Display Area (3:4 ratio) */}
        <section className="w-full relative z-0">
          <MediaDisplay
            media={
              activeCd.mediaUrl
                ? {
                    type: activeCd.mediaType,
                    url: activeCd.mediaUrl,
                    title: activeCd.cdText,
                  }
                : null
            }
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
