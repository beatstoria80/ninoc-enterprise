"use client";

import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerTracker } from './PointerTracker';
import { MotionStateController, ParallaxFrame } from './MotionStateController';

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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Cached transform ref to eliminate redundant DOM mutations
  const prevTransform = useRef<string>('');

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileVideoReady, setMobileVideoReady] = useState<boolean>(false);
  const [desktopVideoReady, setDesktopVideoReady] = useState<boolean>(false);

  // Detect mobile viewport (<768px) to lock default idle video
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

  // Immediate Video Autoplay Enforcer
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.play().catch(() => {});
    }
    if (onLoaded) onLoaded();
  }, [onLoaded, isMobile]);

  // High-Performance 60 FPS Parallax Render Loop (Desktop/Tablet only)
  useEffect(() => {
    if (isMobile) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const tracker = pointerTracker || internalTrackerRef.current;
      const motion = motionControllerRef.current;
      const video = videoRef.current;

      if (tracker && motion && video) {
        const pointer = tracker.getState();
        const frame: Readonly<ParallaxFrame> = motion.update(pointer, dt);

        // Build CSS transform string
        const transform = `translate3d(${frame.translateX.toFixed(2)}px, ${frame.translateY.toFixed(2)}px, 0) rotateY(${frame.rotateY.toFixed(2)}deg) scale(${frame.scale.toFixed(4)})`;

        // Smart DOM Diffing: Only write style when value changes
        if (prevTransform.current !== transform) {
          prevTransform.current = transform;
          video.style.transform = transform;
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [pointerTracker, isMobile, config]);

  // Mobile Continuous Video Playback Loop (Prevents browser pause on touch)
  useEffect(() => {
    if (!isMobile) return;

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
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7] select-none overflow-hidden ${className}`}
      style={{ touchAction: 'none', perspective: '1200px' }}
    >
      <div className="relative w-full h-full flex items-center justify-center bg-transparent md:bg-[#e3e4e7]">
        {isMobile ? (
          /* Mobile Video Player: Dedicated full-bleed object-cover with auto-resumer */
          <video
            ref={videoRef}
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
            onPlaying={() => {
              setMobileVideoReady(true);
            }}
            onPause={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.play().catch(() => {});
            }}
            className="absolute inset-0 w-full h-full object-cover object-center scale-100 pointer-events-none transition-opacity duration-500 ease-out"
            style={{ opacity: mobileVideoReady ? 1 : 0 }}
          >
            <source src={config.videoPaths.idleCenter} type="video/mp4" />
          </video>
        ) : (
          /* Desktop / PC / Laptop / Tablet: Single Mascot Video with Parallax Mouse Tracking */
          <video
            ref={videoRef}
            src={config.videoPaths.singleMascot}
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
            onPlaying={() => {
              setDesktopVideoReady(true);
            }}
            className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none transition-opacity duration-700 ease-out transform-gpu will-change-transform"
            style={{
              opacity: desktopVideoReady ? 1 : 0,
              filter: 'contrast(1.05) brightness(1.02) saturate(1.03)',
              transformOrigin: 'center center',
            }}
          >
            <source src={config.videoPaths.singleMascot} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
