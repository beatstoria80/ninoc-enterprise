"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MascotVideoConfigType } from './MascotVideoConfig';

interface MascotMobileProps {
  config: MascotVideoConfigType;
}

export const MascotMobile: React.FC<MascotMobileProps> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Mobile Continuous Video Playback Loop
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let animId: number;
    let isPlayPending = false;

    const safePlay = () => {
      if (v.paused && !isPlayPending) {
        isPlayPending = true;
        v.play().catch(() => {}).finally(() => {
          isPlayPending = false;
        });
      }
    };

    const keepPlaying = () => {
      safePlay();

      // Batasi pemutaran video hanya pada fase idle (0.0 - 2.8 detik)
      const idleStart = config.timestamps.idleStart ?? 0.0;
      const idleEnd = config.timestamps.idleEnd ?? 2.8;
      
      if (v.readyState >= 2) {
        if (v.currentTime < idleStart || v.currentTime >= idleEnd - 0.1) {
          try {
            v.currentTime = idleStart;
          } catch (e) {}
        }
      }
      animId = requestAnimationFrame(keepPlaying);
    };
    
    animId = requestAnimationFrame(keepPlaying);

    const handleUserInteraction = () => {
      safePlay();
    };

    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('click', handleUserInteraction, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
    };
  }, [config]);

  return (
    <motion.video
      ref={videoRef}
      src={config.videoPaths.singleMascot}
      autoPlay
      loop
      muted
      playsInline
      // object-cover memastikan video memenuhi seluruh layar HP
      className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-100"
      style={{ scale: 0.9 }}
    />
  );
};
