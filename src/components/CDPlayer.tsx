import React, { useEffect, useRef, useState } from 'react';
import { CDItem } from '../types';

interface CDPlayerProps {
  cdList: CDItem[];
  activeCdId: string;
  onSelectCd: (id: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const CDPlayer: React.FC<CDPlayerProps> = ({
  cdList,
  activeCdId,
  onSelectCd,
  isPlaying,
  onTogglePlay,
}) => {
  const cdDiscRef = useRef<HTMLDivElement | null>(null);
  const cdRotationsRef = useRef<{[key: string]: number}>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isAutoScrolling = useRef(false);

  // Scroll the active CD into centered view when activeCdId changes (e.g. init, settings)
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeEl = itemRefs.current[activeCdId];
    if (!container || !activeEl) return;

    isAutoScrolling.current = true;
    activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

    const timer = setTimeout(() => {
      isAutoScrolling.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [activeCdId]);

  // Detect which CD is closest to the center while user scrolls
  const [pendingCdId, setPendingCdId] = useState<string | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      if (isAutoScrolling.current) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const center = container.scrollLeft + container.clientWidth / 2;
        let closestId = activeCdId;
        let minDistance = Infinity;

        cdList.forEach((cd) => {
          const el = itemRefs.current[cd.id];
          if (!el) return;
          const elCenter = el.offsetLeft + el.offsetWidth / 2;
          const distance = Math.abs(center - elCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestId = cd.id;
          }
        });

        // Set pending CD for smooth transition
        if (closestId !== activeCdId) {
          setPendingCdId(closestId);
          if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = setTimeout(() => {
            onSelectCd(closestId);
            setPendingCdId(null);
          }, 350);
        } else {
          setPendingCdId(null);
        }
      }, 200);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, [cdList, activeCdId, onSelectCd]);

  // Inject CSS keyframe animation for CD spinning
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'cd-spin-keyframes';
    style.textContent = `
      @keyframes cd-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Control CD rotation animation via CSS
  useEffect(() => {
    const el = cdDiscRef.current;
    if (!el) return;

    if (isPlaying) {
      // Start CSS animation from saved rotation
      const savedRot = cdRotationsRef.current[activeCdId] || 0;
      const delay = -((savedRot % 360) / 360) * 2.5; // 2.5s = one full rotation
      el.style.transform = '';
      el.style.transition = 'none';
      el.style.animation = 'none';
      // Force reflow to ensure animation restart
      void el.offsetHeight;
      el.style.animation = `cd-spin 2.5s linear infinite`;
      el.style.animationDelay = `${delay}s`;
    } else {
      // Pause: capture current rotation from animation, save as static transform
      const cs = getComputedStyle(el);
      const matrix = el.style.animation ? cs.transform : el.style.transform;
      if (el.style.animation) {
        el.style.animation = 'none';
      }

      let angle = 0;
      if (matrix && matrix !== 'none') {
        const match = matrix.match(/matrix\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(', ');
          const a = parseFloat(parts[0]);
          const b = parseFloat(parts[1]);
          angle = Math.atan2(b, a) * (180 / Math.PI);
          if (angle < 0) angle += 360;
        }
      }
      cdRotationsRef.current[activeCdId] = angle;
      el.style.transform = `rotate(${angle}deg)`;
      el.style.transition = 'transform 0.5s ease-out';
      el.style.animationDelay = '';
    }
  }, [isPlaying, activeCdId]);

  // Re-trigger animation when CD becomes active while playing
  // (ensures ref is ready after React render)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = requestAnimationFrame(() => {
      const el = cdDiscRef.current;
      if (!el || el.style.animation) return;
      const savedRot = cdRotationsRef.current[activeCdId] || 0;
      const delay = -((savedRot % 360) / 360) * 2.5;
      void el.offsetHeight;
      el.style.animation = `cd-spin 2.5s linear infinite`;
      el.style.animationDelay = `${delay}s`;
    });
    return () => cancelAnimationFrame(timer);
  }, [activeCdId, isPlaying]);

  // Tonearm position - set once on mount, never moves
  const [tonearmPos, setTonearmPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = itemRefs.current[activeCdId];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setTonearmPos({
        top: rect.top - 8,
        left: rect.right + 4,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full select-none">
      {/* Horizontal CD Discs Container */}
      <div
        ref={scrollContainerRef}
        className="w-full flex items-center justify-start overflow-x-auto no-scrollbar py-6 px-[50vw] gap-4 snap-x snap-mandatory"
      >
        {cdList.map((cd) => {
          const isActive = cd.id === activeCdId;
          const isPending = cd.id === pendingCdId && !isActive;

          return (
            <div
              key={cd.id}
              ref={(el) => {
                itemRefs.current[cd.id] = el;
              }}
              onClick={() => {
                if (isActive) {
                  onTogglePlay();
                } else {
                  onSelectCd(cd.id);
                }
              }}
              className={`relative flex-shrink-0 cursor-pointer snap-center transition-all duration-500 ease-out ${
                isActive
                  ? 'scale-100 z-10'
                  : isPending
                  ? 'scale-95 opacity-80'
                  : 'scale-85 opacity-60 hover:opacity-90 hover:scale-90'
              }`}
            >
              {/* CD Disc Body */}
              <div
                ref={isActive ? cdDiscRef : null}
                className={`relative rounded-full shadow-xl overflow-hidden border border-neutral-200/80 transition-all duration-300 ${
                  isActive ? 'w-52 h-52 sm:w-60 sm:h-60' : 'w-40 h-40 sm:w-44 sm:h-44'
                }`}
                style={isActive ? undefined : { animation: 'none', transform: `rotate(${cdRotationsRef.current[cd.id] || 0}deg)` }}
              >
                {/* Outer Rim Gloss */}
                <div className="absolute inset-0 rounded-full border-[1.5px] border-neutral-300/60 z-20 pointer-events-none" />

                {/* Base Surface */}
                <div className="absolute inset-0 rounded-full bg-white transition-colors duration-500" />

                {/* Custom CD Surface Image */}
                {cd.cdSurfaceImage && (
                  <img
                    src={cd.cdSurfaceImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover rounded-full select-none"
                  />
                )}

                {/* CD Grooves - always visible on top */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none z-10"
                  style={{
                    backgroundImage: `radial-gradient(circle, 
                      transparent 22%, 
                      rgba(0,0,0,0.15) 23%, transparent 24%, 
                      transparent 38%, rgba(0,0,0,0.12) 39%, transparent 40%, 
                      transparent 58%, rgba(0,0,0,0.12) 59%, transparent 60%, 
                      transparent 76%, rgba(0,0,0,0.18) 77%, transparent 78%)`,
                  }}
                />

                {/* Glossy Light Streak Reflection */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none z-10"
                  style={{
                    background: `linear-gradient(135deg, 
                      rgba(255,255,255,0.35) 0%, 
                      transparent 35%, 
                      transparent 70%, 
                      rgba(255,255,255,0.15) 100%)`,
                  }}
                />

                {/* CD Rainbow Holographic Texture - fan-shaped streaks from center */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none z-10"
                  style={{
                    background: `conic-gradient(from 0deg at 50% 50%, 
                      transparent 0deg,
                      rgba(255,100,100,0.25) 10deg,
                      rgba(255,200,50,0.25) 20deg,
                      rgba(100,255,100,0.25) 30deg,
                      rgba(50,200,255,0.25) 40deg,
                      rgba(100,100,255,0.25) 50deg,
                      rgba(255,100,255,0.25) 60deg,
                      transparent 70deg,
                      transparent 220deg,
                      rgba(255,100,100,0.15) 240deg,
                      rgba(255,200,50,0.15) 250deg,
                      rgba(100,255,100,0.15) 260deg,
                      rgba(50,200,255,0.15) 270deg,
                      rgba(100,100,255,0.15) 280deg,
                      rgba(255,100,255,0.15) 290deg,
                      transparent 300deg,
                      transparent 360deg)`,
                    WebkitMaskImage: `radial-gradient(circle, transparent 18%, black 22%, black 78%, transparent 82%)`,
                    maskImage: `radial-gradient(circle, transparent 18%, black 22%, black 78%, transparent 82%)`,
                  }}
                />

                {/* Center Spindle Hole */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div
                    className={`rounded-full border border-neutral-300/80 bg-white/30 backdrop-blur-[1px] shadow-inner flex items-center justify-center ${
                      isActive ? 'w-18 h-18 sm:w-22 sm:h-22' : 'w-14 h-14 sm:w-16 sm:h-16'
                    }`}
                  >
                    <div
                      className={`rounded-full bg-gradient-to-tr from-neutral-300 via-white to-neutral-400 border border-neutral-400/60 shadow-sm flex items-center justify-center ${
                        isActive ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8'
                      }`}
                    >
                      <div
                        className={`rounded-full bg-neutral-900 border border-neutral-700 shadow-inner ${
                          isActive ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-3 h-3'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* CD Label Text */}
                <div className="absolute top-6 sm:top-8 left-0 right-0 text-center z-20 pointer-events-none px-3">
                  <p className="text-[10px] font-semibold tracking-widest text-white uppercase truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {cd.cdText || 'COMPACT DISC'}
                  </p>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Tonearm - fixed position on screen, does not move when CD switches */}
      <div
        className="fixed z-30 pointer-events-none transition-all duration-700 ease-out origin-top-right"
        style={{
          top: tonearmPos.top,
          left: tonearmPos.left,
          transform: isPlaying ? 'rotate(20deg)' : 'rotate(0deg)',
        }}
      >
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 border border-neutral-300 shadow-md flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-600 border border-neutral-200" />
          <div className="absolute top-5 right-3 w-1 h-28 sm:h-32 bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 rounded-full shadow-sm origin-top">
            <div className="absolute -bottom-2 -left-1 w-3 h-4 bg-neutral-800 rounded-sm border border-neutral-600 flex items-center justify-center shadow-md">
              <div className="w-1 h-1 rounded-full bg-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
