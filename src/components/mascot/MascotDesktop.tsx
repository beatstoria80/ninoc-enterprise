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
        
        // Kunci: Jangan scrubbing! Gunakan Playback Normal (60FPS Halus)
        // Kita mendeteksi transisi antar State untuk melakukan 1x lompatan (seek) di awal, lalu Play normal.
        
        const idleStart = config.timestamps.idleStart ?? 0.0;
        const rightStart = config.timestamps.turnRightStart ?? 5.0;
        const nodStart = config.timestamps.noddingStart ?? 10.0;

        // Tentukan Active State berdasarkan currentX (Fisika kursor)
        let activeState = 'IDLE';
        if (frame.stateName === 'CATEGORY_NODDING') {
          activeState = 'NODDING';
        } else if (frame.currentX > 0.05) {
          activeState = 'RIGHT';
        }

        // Jalankan State Machine
        if (activeState === 'NODDING') {
          if (v.paused) v.play().catch(() => {});
          // Jika baru masuk state Nodding, atau sudah melewati durasi video
          if (v.currentTime < nodStart || (v.duration && v.currentTime >= v.duration - 0.15)) {
             safeSeek(v, nodStart);
          }
        } else if (activeState === 'RIGHT') {
          if (v.paused) v.play().catch(() => {});
          // Saat nengok kanan, biarkan video memutar. 
          // Jika video kebablasan sampai masuk ke area Nodding, loop kembali ke awal Right
          if (v.currentTime < rightStart || v.currentTime >= nodStart - 0.2) {
             safeSeek(v, rightStart);
          }
        } else {
          // IDLE (Center)
          if (v.paused) v.play().catch(() => {});
          // Biarkan video memutar. Jika kebablasan sampai masuk ke area Nengok Kanan, loop ke awal Idle
          if (v.currentTime < idleStart || v.currentTime >= rightStart - 0.2) {
             safeSeek(v, idleStart);
          }
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
