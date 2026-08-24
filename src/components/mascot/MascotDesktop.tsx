"use client";

import React, { useEffect, useRef, useState } from 'react';
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
    if (onLoaded) onLoaded();
  }, [onLoaded]);

  // Utility to safely seek video
  const safeSeek = (v: HTMLVideoElement, targetTime: number) => {
    if (v.readyState < 2) return; // Guard: pastikan video sudah memiliki data frame
    if (Math.abs(v.currentTime - targetTime) > 0.02) { // Tolerance
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
        
        // Dapatkan hasil fisika pergerakan (currentX = 0.0 hingga 1.0)
        const frame: Readonly<MotionStateFrame> = motion.update(pointer, dt);
        
        // INTERPOLASI (Scrubbing) Waktu Video secara Halus berdasarkan pergerakan kursor
        // Jika kursor di tengah (currentX = 0), video di detik idleStart (0.0s)
        // Jika kursor di kanan (currentX = 1), video di detik turnRightStart (5.0s)
        // Jika kursor hover kategori, kita asumsikan nilainya meloncat ke noddingStart (10.0s)

        let targetTime = config.timestamps.idleStart ?? 0.0;
        
        if (frame.stateName === 'CATEGORY_NODDING') {
          // Play loop untuk nodding
          if (v.paused) v.play().catch(() => {});
          
          const nodStart = config.timestamps.noddingStart ?? 10.0;
          if (v.currentTime < nodStart || (v.duration && v.currentTime >= v.duration - 0.15)) {
             safeSeek(v, nodStart);
          }
        } else {
          // Pause and Scrub untuk pergerakan kiri-kanan
          if (!v.paused) v.pause();
          
          const idleTime = config.timestamps.idleStart ?? 0.0;
          const rightTime = config.timestamps.turnRightStart ?? 5.0;
          
          // Interpolasi linear dari Idle ke Nengok Kanan berdasarkan currentX
          targetTime = idleTime + (rightTime - idleTime) * frame.currentX;
          
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
        className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none"
        style={{ 
          opacity: isVideoReady ? 1 : 0, 
          transition: 'opacity 0.3s ease-in',
          filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' 
        }}
      />
    </div>
  );
};
