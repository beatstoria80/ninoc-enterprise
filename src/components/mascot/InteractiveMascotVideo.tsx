"use client";

import React from 'react';
import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerTracker } from './PointerTracker';
import { MascotMobile } from './MascotMobile';
import { MascotDesktop } from './MascotDesktop';

export interface InteractiveMascotVideoProps {
  config?: MascotVideoConfigType;
  pointerTracker?: PointerTracker;
  className?: string;
  onLoaded?: () => void;
  style?: React.CSSProperties;
}

export const InteractiveMascotVideo: React.FC<InteractiveMascotVideoProps> = ({
  config = DEFAULT_MASCOT_VIDEO_CONFIG,
  pointerTracker,
  className = '',
  onLoaded,
  style,
}) => {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7] select-none ${className}`}
      style={{ touchAction: 'none', ...style }}
    >
      <div className="relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7]">
        {/* Kontainer Video Mobile: Tampil secara instan di HP, disembunyikan di MD (768px) ke atas */}
        <div className="absolute inset-0 w-full h-full md:hidden">
          <MascotMobile config={config} />
        </div>

        {/* Kontainer Video Desktop: Tampil secara instan di PC/Laptop/Tablet (768px ke atas), disembunyikan di HP */}
        <div className="relative w-full h-full hidden md:flex items-center justify-center bg-[#e3e4e7]">
          <MascotDesktop config={config} pointerTracker={pointerTracker} onLoaded={onLoaded} />
        </div>
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
