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
  
  // Video element refs for the 2 motion state chapters
  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoHorizontalRef = useRef<HTMLVideoElement | null>(null);

  // Cached opacity refs to eliminate redundant DOM mutations
  const prevIdleOpacity = useRef<number>(-1);
  const prevHorizOpacity = useRef<number>(-1);

  const [isPreloaded, setIsPreloaded] = useState(true);
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

  // Immediate Video Autoplay Enforcer for 2 Video Layers
  useEffect(() => {
    const vIdle = videoIdleRef.current;
    const vHoriz = videoHorizontalRef.current;

    [vIdle, vHoriz].forEach((v) => {
      if (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.play().catch(() => {});
      }
    });

    if (onLoaded) onLoaded();
  }, [onLoaded, isMobile]);

  // High-Performance 60 FPS Render Loop (Zero GC, Cached DOM Updates)
  useEffect(() => {
    if (isMobile) return; // Mobile uses default idle center Chapter 1 without dual-layer crossfade overhead

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const tracker = pointerTracker || internalTrackerRef.current;
      const motion = motionControllerRef.current;

      const vIdle = videoIdleRef.current;
      const vHoriz = videoHorizontalRef.current;

      if (tracker && motion && vIdle && vHoriz) {
        const pointer = tracker.getState();
        const frame: Readonly<MotionStateFrame> = motion.update(pointer, dt);

        // Ensure background video playback
        if (vIdle.paused) {
          vIdle.muted = true;
          vIdle.play().catch(() => {});
        }
        if (vHoriz.paused) {
          vHoriz.muted = true;
          vHoriz.play().catch(() => {});
        }

        // Smart DOM Opacity Diffing: Only write style when value changes meaningfully
        const nextIdle = frame.weights.idleOpacity;
        const nextHoriz = frame.weights.horizontalOpacity;

        if (Math.abs(prevIdleOpacity.current - nextIdle) > 0.001) {
          prevIdleOpacity.current = nextIdle;
          vIdle.style.opacity = nextIdle.toFixed(3);
        }

        if (Math.abs(prevHorizOpacity.current - nextHoriz) > 0.001) {
          prevHorizOpacity.current = nextHoriz;
          vHoriz.style.opacity = nextHoriz.toFixed(3);
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [isPreloaded, pointerTracker, isMobile]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-[#e3e4e7] select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Video Rendering Stack: Separated for Mobile vs Desktop/PC/Tablet */}
      <div className="relative w-full h-full flex items-center justify-center bg-[#e3e4e7]">
        {isMobile ? (
          /* Mobile Video Player: Dedicated object-cover scale-[0.96] */
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
            className="absolute inset-0 w-full h-full object-cover object-center scale-100 pointer-events-none"
            style={{ opacity: 1 }}
          >
            <source src={config.videoPaths.idleCenter} type="video/mp4" />
          </video>
        ) : (
          /* Desktop / PC / Laptop / Tablet Video Stack: Synchronized 2-Layer 3D Mouse Tracking */
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
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none transition-transform duration-500 ease-out"
              style={{ opacity: 1 }}
            >
              <source src={config.videoPaths.idleCenter} type="video/mp4" />
            </video>

            {/* Layer 1: Horizontal Motion (Chapter 2) */}
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
              className="absolute inset-0 w-full h-full object-contain object-center scale-[0.94] pointer-events-none transition-transform duration-500 ease-out"
              style={{ opacity: 0 }}
            >
              <source src={config.videoPaths.horizontalMotion} type="video/mp4" />
            </video>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
