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

    // Pastikan attribute fundamental untuk iOS Safari ter-set secara eksplisit
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;

    let animId: number;
    let isPlayPending = false;

    // safePlay hanya dipanggil saat ada interaksi user untuk fallback, JANGAN dipanggil di loop
    const safePlay = () => {
      if (v.paused && !isPlayPending) {
        isPlayPending = true;
        v.play().catch(() => {}).finally(() => {
          isPlayPending = false;
        });
      }
    };

    // Coba play sekali saat mount (dibungkus catch agar tidak throw error jika diblokir)
    safePlay();

    const keepPlaying = () => {
      // BATAS PENTING: JANGAN panggil safePlay() di sini! 
      // Memanggil play() 60fps tanpa user gesture akan membuat iOS Safari memblokir video sepenuhnya.

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
        src={config.videoPaths.mobileMascot || config.videoPaths.singleMascot}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-100"
      />
    </>
  );
};
