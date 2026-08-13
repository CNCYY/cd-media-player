import React, { useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CDItem } from '../types';

// Generate a cassette sliding-into-deck click sound
const playClickSound = () => {
  try {
    const ctx = new AudioContext();
    ctx.resume();

    // Wait for context to be ready, then play
    const play = () => {
      const now = ctx.currentTime;

      // Cassette slide: filtered noise with higher volume
      const slideDuration = 0.15;
      const bufferSize = Math.floor(ctx.sampleRate * slideDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * (1 - t);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bpFilter = ctx.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.value = 3000;
      bpFilter.Q.value = 0.8;

      const slideGain = ctx.createGain();
      slideGain.gain.setValueAtTime(0.6, now);
      slideGain.gain.exponentialRampToValueAtTime(0.001, now + slideDuration);

      noise.connect(bpFilter).connect(slideGain).connect(ctx.destination);
      noise.start(now);

      // Two clear clicks
      const makeClick = (delay: number, freq: number, vol: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.04);
        g.gain.setValueAtTime(vol, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
        osc.connect(g).connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      };

      makeClick(0.08, 600, 0.5);
      makeClick(0.14, 400, 0.4);

      setTimeout(() => ctx.close(), 400);
    };

    // If already running, play immediately; otherwise wait for resume
    if (ctx.state === 'running') {
      play();
    } else {
      ctx.onstatechange = () => {
        if (ctx.state === 'running') {
          ctx.onstatechange = null;
          play();
        }
      };
    }
  } catch {
    // Audio not available, silently ignore
  }
};

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
  const cdContainerRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = cdList.findIndex((cd) => cd.id === activeCdId);
  const activeCd = cdList[activeIndex] || cdList[0];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < cdList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      playClickSound();
      onSelectCd(cdList[activeIndex - 1].id);
    }
  }, [hasPrev, activeIndex, cdList, onSelectCd]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      playClickSound();
      onSelectCd(cdList[activeIndex + 1].id);
    }
  }, [hasNext, activeIndex, cdList, onSelectCd]);

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

  const cd = activeCd;

  return (
    <div className="w-full select-none">
      {/* CD Disc Area */}
      <div
        ref={cdContainerRef}
        className="relative flex items-center justify-center py-6"
      >
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!hasPrev}
          className={`absolute left-0 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            hasPrev
              ? 'cursor-pointer active:scale-90'
              : 'cursor-default opacity-30'
          }`}
          style={{
            background: `linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 40%, #b0b0b0 60%, #d0d0d0 100%)`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.5),
              inset 0 -1px 2px rgba(0,0,0,0.15),
              0 2px 6px rgba(0,0,0,0.25),
              0 0 0 1px rgba(180,180,180,0.5)
            `,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-neutral-700" strokeWidth={2.5} />
        </button>

        {/* Active CD Disc */}
        <div
          onClick={onTogglePlay}
          className="relative flex-shrink-0 cursor-pointer transition-all duration-300 ease-out scale-100 z-10"
        >
          <div
            ref={cdDiscRef}
            className="relative rounded-full shadow-xl overflow-hidden border border-neutral-200/80 w-52 h-52 sm:w-60 sm:h-60"
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

            {/* CD Grooves */}
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

            {/* CD Rainbow Holographic Texture */}
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
              <div className="rounded-full border border-neutral-300/80 bg-white/30 backdrop-blur-[1px] shadow-inner flex items-center justify-center w-18 h-18 sm:w-22 sm:h-22">
                <div className="rounded-full bg-gradient-to-tr from-neutral-300 via-white to-neutral-400 border border-neutral-400/60 shadow-sm flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
                  <div className="rounded-full bg-neutral-900 border border-neutral-700 shadow-inner w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>

            {/* CD Label Text */}
            <div className="absolute top-6 sm:top-8 left-0 right-0 text-center z-20 pointer-events-none px-[22px]">
              <p className="text-[10px] font-semibold tracking-widest text-white uppercase leading-snug whitespace-normal break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {cd.cdText || 'COMPACT DISC'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNext}
          className={`absolute right-0 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
            hasNext
              ? 'cursor-pointer active:scale-90'
              : 'cursor-default opacity-30'
          }`}
          style={{
            background: `linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 40%, #b0b0b0 60%, #d0d0d0 100%)`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.5),
              inset 0 -1px 2px rgba(0,0,0,0.15),
              0 2px 6px rgba(0,0,0,0.25),
              0 0 0 1px rgba(180,180,180,0.5)
            `,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-neutral-700" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
