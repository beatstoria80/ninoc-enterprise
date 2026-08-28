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

    // Pastikan attribute fundamental untuk iOS Safari ter-set secara eksplisit
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;

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

    const handleUserInteraction = () => {
      safePlay();
    };

    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('click', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
    };
  }, [config]);

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
