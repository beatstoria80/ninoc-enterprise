"use client";

import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerTracker } from './PointerTracker';
import { MotionStateController, MotionStateFrame } from './MotionStateController';

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // 3 Duplikasi elemen video yang SEMUANYA menggunakan file yang SAMA (mascot_ninoc.mp4)
  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoHorizontalRef = useRef<HTMLVideoElement | null>(null);
  const videoCategoryNodRef = useRef<HTMLVideoElement | null>(null);

  // Cached opacity refs
  const prevIdleOpacity = useRef<number>(-1);
  const prevHorizOpacity = useRef<number>(-1);
  const prevCategoryNodOpacity = useRef<number>(-1);

  // Smooth lerp state containers
  const currentIdleOpacity = useRef<number>(1.0);
  const currentHorizOpacity = useRef<number>(0.0);
  const currentCategoryNodOpacity = useRef<number>(0.0);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileVideoReady, setMobileVideoReady] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const motionControllerRef = useRef<MotionStateController | null>(null);
  const internalTrackerRef = useRef<PointerTracker | null>(null);

  useEffect(() => {
    motionControllerRef.current = new MotionStateController(config);
  }, [config]);

  useEffect(() => {
    if (isMobile) return;

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
  }, [pointerTracker, config, isMobile]);

  useEffect(() => {
    const vIdle = videoIdleRef.current;
    const vHoriz = videoHorizontalRef.current;
    const vCategoryNod = videoCategoryNodRef.current;

    [vIdle, vHoriz, vCategoryNod].forEach((v) => {
      if (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.play().catch(() => {});
      }
    });

    if (onLoaded) onLoaded();
  }, [onLoaded, isMobile]);

  const activeLayerRef = useRef<number>(0);

  useEffect(() => {
    if (isMobile) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const tracker = pointerTracker || internalTrackerRef.current;
      const motion = motionControllerRef.current;

      const vIdle = videoIdleRef.current;
      const vHoriz = videoHorizontalRef.current;
      const vCategoryNod = videoCategoryNodRef.current;

      if (tracker && motion && vIdle && vHoriz) {
        const pointer = tracker.getState();
        const frame: Readonly<MotionStateFrame> = motion.update(pointer, dt);

        let targetActiveLayer = 0;
        if (frame.weights.categoryNodOpacity > 0.5) {
          targetActiveLayer = 2;
        } else if (frame.weights.horizontalOpacity > 0.5) {
          targetActiveLayer = 1;
        } else {
          targetActiveLayer = 0;
        }

        if (activeLayerRef.current !== targetActiveLayer) {
          activeLayerRef.current = targetActiveLayer;
          
          if (targetActiveLayer === 1 && vHoriz) {
            try {
              if (frame.stateName === 'RETURNING_CENTER') {
                const maxReturnTime = Math.min(vHoriz.duration || 3.2, (config.timestamps.turnRightStart ?? 5.0) + 2.8);
                vHoriz.currentTime = maxReturnTime;
                vHoriz.pause();
              } else {
                vHoriz.currentTime = config.timestamps.turnRightStart ?? 5.0;
                vHoriz.play().catch(() => {});
              }
            } catch (e) {}
          } else if (targetActiveLayer === 2 && vCategoryNod) {
            try {
              vCategoryNod.currentTime = config.timestamps.noddingStart ?? 10.0;
              vCategoryNod.play().catch(() => {});
            } catch (e) {}
          } else if (targetActiveLayer === 0) {
            if (vIdle && vIdle.paused) {
              vIdle.play().catch(() => {});
            }
          }
        }

        if (targetActiveLayer === 1 && vHoriz) {
          if (frame.stateName === 'RETURNING_CENTER') {
            vHoriz.pause();
            const minTime = config.timestamps.turnRightStart ?? 5.0;
            const currentT = vHoriz.currentTime;
            if (currentT > minTime) {
              vHoriz.currentTime = Math.max(minTime, currentT - dt * 0.95);
            }
          } else if (vHoriz.paused) {
            vHoriz.play().catch(() => {});
          }
        } else if (targetActiveLayer === 2 && vCategoryNod) {
          if (vHoriz && !vHoriz.paused) {
            vHoriz.pause();
          }
          if (vCategoryNod.paused) {
            vCategoryNod.play().catch(() => {});
          }
          // Loop safeguard for nodding
          const nodStart = config.timestamps.noddingStart ?? 10.0;
          if (vCategoryNod.duration && vCategoryNod.currentTime >= vCategoryNod.duration - 0.15) {
            try {
              vCategoryNod.currentTime = nodStart;
            } catch (e) {}
          }
        } else if (targetActiveLayer === 0 && vIdle && vIdle.paused) {
          vIdle.play().catch(() => {});
        }

        const targetIdle = frame.weights.idleOpacity;
        const targetHoriz = frame.weights.horizontalOpacity;
        const targetCategoryNod = frame.weights.categoryNodOpacity;

        const lerpRate = Math.min(1.0, dt * 20);

        currentIdleOpacity.current = lerp(currentIdleOpacity.current, targetIdle, lerpRate);
        currentHorizOpacity.current = lerp(currentHorizOpacity.current, targetHoriz, lerpRate);
        currentCategoryNodOpacity.current = lerp(currentCategoryNodOpacity.current, targetCategoryNod, lerpRate);

        if (Math.abs(prevIdleOpacity.current - currentIdleOpacity.current) > 0.001) {
          prevIdleOpacity.current = currentIdleOpacity.current;
          vIdle.style.opacity = currentIdleOpacity.current.toFixed(3);
        }

        if (Math.abs(prevHorizOpacity.current - currentHorizOpacity.current) > 0.001) {
          prevHorizOpacity.current = currentHorizOpacity.current;
          vHoriz.style.opacity = currentHorizOpacity.current.toFixed(3);
        }

        if (vCategoryNod && Math.abs(prevCategoryNodOpacity.current - currentCategoryNodOpacity.current) > 0.001) {
          prevCategoryNodOpacity.current = currentCategoryNodOpacity.current;
          vCategoryNod.style.opacity = currentCategoryNodOpacity.current.toFixed(3);
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [pointerTracker, isMobile, config]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7] select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <div className="relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7]">
        {isMobile ? (
          /* Mobile */
          <video
            ref={videoIdleRef}
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
        ) : (
          /* Desktop / PC: DUPLIKASI 3 ELEMEN VIDEO YANG SAMA (NO PARALLAX SHAKING) */
          <>
            {/* DUPLIKAT 1: IDLE */}
            <video
              ref={videoIdleRef}
              src={config.videoPaths.singleMascot}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none"
              style={{ opacity: 1, filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' }}
            />

            {/* DUPLIKAT 2: MENGHADAP KANAN (DI-SEEK KE DURASI TERTENTU) */}
            <video
              ref={videoHorizontalRef}
              src={config.videoPaths.singleMascot}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none"
              style={{ opacity: 0, filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' }}
            />

            {/* DUPLIKAT 3: MENGANGGUK (DI-SEEK KE DURASI TERTENTU) */}
            <video
              ref={videoCategoryNodRef}
              src={config.videoPaths.singleMascot}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.88] pointer-events-none"
              style={{ opacity: 0, filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
