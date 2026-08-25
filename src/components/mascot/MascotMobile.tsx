"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MascotVideoConfigType } from './MascotVideoConfig';

interface MascotMobileProps {
  config: MascotVideoConfigType;
}

export const MascotMobile: React.FC<MascotMobileProps> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

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
        if (!isVideoReady) setIsVideoReady(true);
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
  }, [config, isVideoReady]);

  return (
    <>
      <motion.video
        ref={videoRef}
        src={config.videoPaths.singleMascot}
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setIsVideoReady(true)}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{ 
          scale: 0.95,
          opacity: isVideoReady ? 1 : 0 
        }}
      />
      {/* 
        Vignette Inset Shadow: 
        Menutupi batas pinggir video yang terekspos karena disusutkan (scale: 0.95).
        Shadow abu-abu membaur sempurna dengan background #e3e4e7.
      */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ boxShadow: 'inset 0 0 35px 35px #e3e4e7' }} 
      />
    </>
  );
};
