"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MascotVideoConfigType } from './MascotVideoConfig';

interface MascotMobileProps {
  config: MascotVideoConfigType;
}

export const MascotMobile: React.FC<MascotMobileProps> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mobileVideoReady, setMobileVideoReady] = useState<boolean>(false);

  // Mobile Continuous Video Playback Loop (Prevents browser pause on touch or card appearance)
  useEffect(() => {
    let animId: number;
    const keepPlaying = () => {
      const v = videoRef.current;
      if (v && v.paused) {
        v.muted = true;
        v.play().catch(() => {});
      }
      animId = requestAnimationFrame(keepPlaying);
    };
    animId = requestAnimationFrame(keepPlaying);

    const handleUserInteraction = () => {
      const v = videoRef.current;
      if (v && v.paused) {
        v.muted = true;
        v.play().catch(() => {});
      }
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
  }, []);

  return (
    <video
      ref={videoRef}
      src={config.videoPaths.singleMascot}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      onPlaying={() => setMobileVideoReady(true)}
      className="absolute inset-0 w-full h-full object-cover object-center scale-100 pointer-events-none transition-opacity duration-500 ease-out"
      style={{ opacity: mobileVideoReady ? 1 : 0 }}
    />
  );
};
