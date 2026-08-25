"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MascotVideoConfigType } from './MascotVideoConfig';
import { PointerTracker } from './PointerTracker';
import { MotionStateController, MotionStateFrame } from './MotionStateController';

interface MascotDesktopProps {
  config: MascotVideoConfigType;
  pointerTracker?: PointerTracker;
  onLoaded?: () => void;
}

export const MascotDesktop: React.FC<MascotDesktopProps> = ({ config, pointerTracker, onLoaded }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // HANYA SATU VIDEO TAG - Mencegah tumpang tindih (ghosting) dan video hilang
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const motionControllerRef = useRef<MotionStateController | null>(null);
  const internalTrackerRef = useRef<PointerTracker | null>(null);

  useEffect(() => {
    motionControllerRef.current = new MotionStateController(config);
  }, [config]);

  useEffect(() => {
    const activeTracker = pointerTracker || internalTrackerRef.current || new PointerTracker(config);
    if (!pointerTracker) {
      internalTrackerRef.current = activeTracker;
    }

    if (containerRef.current) {
      activeTracker.attach(containerRef.current);
    }

    return () => {
      if (!pointerTracker && internalTrackerRef.current) {
        internalTrackerRef.current.detach();
      }
    };
  }, [pointerTracker, config]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      // Jangan autoplay terus-menerus, kita akan mengontrol (scrub) frame-nya
      v.pause();
    }
  }, []);

  useEffect(() => {
    if (isVideoReady && onLoaded) {
      onLoaded();
    }
  }, [isVideoReady, onLoaded]);

  // Utility to safely seek video
  const safeSeek = (v: HTMLVideoElement, targetTime: number) => {
    if (v.readyState < 2) return; // Guard: pastikan video sudah memiliki data frame
    if (Math.abs(v.currentTime - targetTime) > 0.001) { // Tolerance diturunkan drastis untuk 60FPS murni
      try {
        v.currentTime = targetTime;
      } catch (e) {}
    }
  };

  useEffect(() => {
    let animFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const tracker = pointerTracker || internalTrackerRef.current;
      const motion = motionControllerRef.current;
      const v = videoRef.current;

      if (tracker && motion && v && isVideoReady) {
        const pointer = tracker.getState();
        const frame: Readonly<MotionStateFrame> = motion.update(pointer, dt);
        
        const idleStart = config.timestamps.idleStart ?? 0.0;
        const idleEnd = config.timestamps.idleEnd ?? 2.8;
        const rightStart = config.timestamps.turnRightStart ?? 3.0;
        const rightEnd = config.timestamps.turnRightEnd ?? 5.5;
        const nodStart = config.timestamps.noddingStart ?? 12.25;
        const nodEnd = config.timestamps.noddingEnd ?? 15.28;

        if (frame.stateName === 'CATEGORY_NODDING') {
          // Play loop untuk nodding
          if (v.paused) v.play().catch(() => {});
          
          if (v.currentTime < nodStart || v.currentTime >= nodEnd - 0.05) {
             safeSeek(v, nodStart);
          }
        } else if (frame.currentX <= 0.01) {
          // KURSOR DI TENGAH (IDLE): PLAY ANIMASI LOOPING
          // Jika kursor statis di tengah, mascot HARUS bergerak/bernafas (tidak freeze)
          if (v.paused) v.play().catch(() => {});
          
          // Potong tepat sebelum maskot mulai nengok kanan agar tidak bocor ke kanan sendiri
          if (v.currentTime < idleStart || v.currentTime >= idleEnd - 0.1) {
             safeSeek(v, idleStart);
          }
        } else {
          // KURSOR BERGERAK KE KANAN: PAUSE & SCRUB
          // Ini adalah transisi halus di mana maskot mengikuti kursor secara interaktif
          if (!v.paused) v.pause();
          
          const turnDuration = rightEnd - rightStart; // Range durasi untuk gerakan nengok kanan
          
          // Interpolasi linear berdasarkan posisi tarikan fisika mouse
          let targetTime = rightStart + (turnDuration * frame.currentX);
          
          safeSeek(v, targetTime);
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [pointerTracker, config, isVideoReady]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Premium Loader: Tampil selama video belum siap */}
      {!isVideoReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#e3e4e7] z-[15] transition-opacity duration-500">
          <div className="flex flex-col items-center gap-5">
            {/* Denyut Logo NINOC */}
            <div className="relative w-16 h-16 opacity-30 animate-pulse">
              <Image
                src="/logo.png"
                alt="NINOC Logo"
                fill
                className="object-contain filter grayscale"
                unoptimized
              />
            </div>
            {/* Loading progress bar minimalis */}
            <div className="w-24 h-[1.5px] bg-black/5 overflow-hidden rounded-full relative">
              <div className="absolute left-0 top-0 bottom-0 bg-black/40 w-1/2 rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      )}

      {/* 
        HANYA 1 TAG VIDEO. 
        Mencegah tumpang tindih frame dan kebocoran memori.
      */}
      <video
        ref={videoRef}
        src={config.videoPaths.singleMascot}
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setIsVideoReady(true)}
        className="absolute inset-0 w-full h-full object-contain object-center scale-[0.98] pointer-events-none"
        style={{ 
          opacity: isVideoReady ? 1 : 0, 
          transition: 'opacity 0.3s ease-in',
          filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' 
        }}
      />

      {/* Animasi Kustom CSS untuk Loader Bar */}
      <style jsx>{`
        @keyframes loading-bar-move {
          0% { left: -50%; width: 50%; }
          50% { left: 25%; width: 50%; }
          100% { left: 100%; width: 50%; }
        }
        .animate-loading-bar {
          animation: loading-bar-move 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
