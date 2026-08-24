"use client";

import React, { useEffect, useState } from 'react';
import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerTracker } from './PointerTracker';
import { MascotMobile } from './MascotMobile';
import { MascotDesktop } from './MascotDesktop';

export interface InteractiveMascotVideoProps {
  config?: MascotVideoConfigType;
  pointerTracker?: PointerTracker;
  className?: string;
  onLoaded?: () => void;
}

export const InteractiveMascotVideo: React.FC<InteractiveMascotVideoProps> = ({
  config = DEFAULT_MASCOT_VIDEO_CONFIG,
  pointerTracker,
  className = '',
  onLoaded,
}) => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile === null) return null; // Wait for client hydration

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7] select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <div className="relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7]">
        {isMobile ? (
          <MascotMobile config={config} />
        ) : (
          <MascotDesktop config={config} pointerTracker={pointerTracker} onLoaded={onLoaded} />
        )}
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
