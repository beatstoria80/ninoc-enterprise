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
  
  // Video element refs for the 3 motion state chapters
  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoHorizontalRef = useRef<HTMLVideoElement | null>(null);
  const videoCategoryNodRef = useRef<HTMLVideoElement | null>(null);

  // Cached opacity refs to eliminate redundant DOM mutations
  const prevIdleOpacity = useRef<number>(-1);
  const prevHorizOpacity = useRef<number>(-1);
  const prevCategoryNodOpacity = useRef<number>(-1);

  // Smooth lerp state containers
  const currentIdleOpacity = useRef<number>(1.0);
  const currentHorizOpacity = useRef<number>(0.0);
  const currentCategoryNodOpacity = useRef<number>(0.0);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile viewport (< 768px) to lock default idle video chapter 1
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Controllers
  const motionControllerRef = useRef<MotionStateController | null>(null);
  const internalTrackerRef = useRef<PointerTracker | null>(null);

  useEffect(() => {
    motionControllerRef.current = new MotionStateController(config);
  }, [config]);

  // Pointer Tracker initialization with strict cleanup
  useEffect(() => {
    if (isMobile) return; // Skip pointer tracking on mobile screens

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

  // Immediate Video Autoplay Enforcer for 3 Video Layers
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

  // Track active layer index (0: Idle, 1: Horiz, 2: Category Nodding)
  const activeLayerRef = useRef<number>(0);

  // High-Performance 60 FPS Render Loop with Liquid Smooth Opacity Crossfading
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

        // Frame-Sync Layer Transitioning & Stream Control
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
            // Seek directly to moving frame segment (config.chapter2StartTime, default 0.1s)
            try {
              vHoriz.currentTime = config.chapter2StartTime ?? 0.1;
              vHoriz.play().catch(() => {});
            } catch (e) {}
          } else if (targetActiveLayer === 2 && vCategoryNod) {
            // Seek directly to pure nodding loop frame segment (config.categoryNodStartTime, default 0.1s)
            try {
              vCategoryNod.currentTime = config.categoryNodStartTime ?? 0.1;
              vCategoryNod.play().catch(() => {});
            } catch (e) {}
          } else if (targetActiveLayer === 0) {
            // When returning to center idle, reset chapter_2 to movement start frame so next turn starts smoothly
            if (vIdle && vIdle.paused) {
              vIdle.play().catch(() => {});
            }
            if (vHoriz) {
              vHoriz.currentTime = config.chapter2StartTime ?? 0.1;
            }
          }
        }

        // Active stream playback enforcer
        if (targetActiveLayer === 1 && vHoriz && vHoriz.paused) {
          vHoriz.play().catch(() => {});
        } else if (targetActiveLayer === 2 && vCategoryNod && vCategoryNod.paused) {
          vCategoryNod.play().catch(() => {});
        } else if (targetActiveLayer === 0 && vIdle && vIdle.paused) {
          vIdle.play().catch(() => {});
        }

        // Smooth Opacity Interpolation (Lerp) over ~100ms
        const targetIdle = frame.weights.idleOpacity;
        const targetHoriz = frame.weights.horizontalOpacity;
        const targetCategoryNod = frame.weights.categoryNodOpacity;

        const lerpRate = Math.min(1.0, dt * 20);

        currentIdleOpacity.current = lerp(currentIdleOpacity.current, targetIdle, lerpRate);
        currentHorizOpacity.current = lerp(currentHorizOpacity.current, targetHoriz, lerpRate);
        currentCategoryNodOpacity.current = lerp(currentCategoryNodOpacity.current, targetCategoryNod, lerpRate);

        // Smart DOM Opacity Diffing: Only write style when value changes
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

  // Mobile Continuous Video Playback Loop (Prevents browser pause on touch or card appearance)
  useEffect(() => {
    if (!isMobile) return;

    let animId: number;
    const keepPlaying = () => {
      const v = videoIdleRef.current;
      if (v && v.paused) {
        v.muted = true;
        v.play().catch(() => {});
      }
      animId = requestAnimationFrame(keepPlaying);
    };
    animId = requestAnimationFrame(keepPlaying);

    const handleUserInteraction = () => {
      const v = videoIdleRef.current;
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
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7] select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Video Rendering Stack: Separated for Mobile vs Desktop/PC/Tablet */}
      <div className="relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7]">
        {isMobile ? (
          /* Mobile Video Player: Dedicated full-bleed object-cover with auto-resumer */
          <video
            ref={videoIdleRef}
            src={config.videoPaths.idleCenter}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.play().catch(() => {});
            }}
            onLoadedData={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.play().catch(() => {});
            }}
            onPause={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.play().catch(() => {});
            }}
            className="absolute inset-0 w-full h-full object-cover object-center scale-100 pointer-events-none"
            style={{ opacity: 1 }}
          >
            <source src={config.videoPaths.idleCenter} type="video/mp4" />
          </video>
        ) : (
          /* Desktop / PC / Laptop / Tablet Video Stack: Synchronized 3-Layer Mouse & Category Tracking */
          <>
            {/* Layer 0: Idle Center (Chapter 1) */}
            <video
              ref={videoIdleRef}
              src={config.videoPaths.idleCenter}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              onLoadedData={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none transition-transform duration-500 ease-out transform-gpu will-change-transform"
              style={{ opacity: 1, filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' }}
            >
              <source src={config.videoPaths.idleCenter} type="video/mp4" />
            </video>

            {/* Layer 1: Rightward Motion (Chapter 2 - Moving to Right Area) */}
            <video
              ref={videoHorizontalRef}
              src={config.videoPaths.horizontalMotion}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              onLoadedData={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none transition-transform duration-500 ease-out transform-gpu will-change-transform"
              style={{ opacity: 0, filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' }}
            >
              <source src={config.videoPaths.horizontalMotion} type="video/mp4" />
            </video>

            {/* Layer 2: Category Selection Nodding Loop (Chapter 3 - Looping Mengangguk) */}
            <video
              ref={videoCategoryNodRef}
              src={config.videoPaths.categoryNodding}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              onLoadedData={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(() => {});
              }}
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none transition-transform duration-500 ease-out transform-gpu will-change-transform"
              style={{ opacity: 0, filter: 'contrast(1.08) brightness(1.02) saturate(1.05)' }}
            >
              <source src={config.videoPaths.categoryNodding} type="video/mp4" />
            </video>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
