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
  const [isMobile, setIsMobile] = React.useState<boolean>(true);

  // useLayoutEffect prevents visual flashing before the browser paints
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7] select-none ${className}`}
      style={{ touchAction: 'none', ...style }}
    >
      <div className="relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7]">
        {isMobile ? (
          <div className="absolute inset-0 w-full h-full">
            <MascotMobile config={config} />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-[#e3e4e7]">
            <MascotDesktop config={config} pointerTracker={pointerTracker} onLoaded={onLoaded} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
