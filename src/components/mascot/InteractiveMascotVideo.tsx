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
  const videoReturnLeftRef = useRef<HTMLVideoElement | null>(null);

  const [isPreloaded, setIsPreloaded] = useState(false);

  // Controllers
  const motionControllerRef = useRef<MotionStateController | null>(null);
  const internalTrackerRef = useRef<PointerTracker | null>(null);

  useEffect(() => {
    motionControllerRef.current = new MotionStateController(config);
  }, [config]);

  // Pointer Tracker initialization
  useEffect(() => {
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
  }, [pointerTracker, config]);

  // Asset Preloading Verification
  useEffect(() => {
    let loadedCount = 0;
    const totalVideos = 3;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalVideos) {
        setIsPreloaded(true);
        if (onLoaded) onLoaded();
      }
    };

    const vIdle = videoIdleRef.current;
    const vHoriz = videoHorizontalRef.current;
    const vRet = videoReturnLeftRef.current;

    [vIdle, vHoriz, vRet].forEach((v) => {
      if (v) {
        if (v.readyState >= 3) {
          checkAllLoaded();
        } else {
          v.addEventListener('canplaythrough', checkAllLoaded, { once: true });
          v.addEventListener('loadeddata', checkAllLoaded, { once: true });
        }
      }
    });

    // Fallback timeout to guarantee interaction readiness
    const fallbackTimer = setTimeout(() => {
      setIsPreloaded(true);
      if (onLoaded) onLoaded();
    }, 1500);

    return () => clearTimeout(fallbackTimer);
  }, [onLoaded]);

  // 60 FPS Video Motion State Engine Loop
  useEffect(() => {
    if (!isPreloaded) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const tracker = pointerTracker || internalTrackerRef.current;
      const motion = motionControllerRef.current;

      const vIdle = videoIdleRef.current;
      const vHoriz = videoHorizontalRef.current;
      const vRet = videoReturnLeftRef.current;

      if (tracker && motion && vIdle && vHoriz && vRet) {
        const pointer = tracker.getState();
        const frame: MotionStateFrame = motion.update(pointer, dt);

        // Ensure video playback
        if (vIdle.paused) vIdle.play().catch(() => {});
        if (vHoriz.paused) vHoriz.play().catch(() => {});
        if (vRet.paused) vRet.play().catch(() => {});

        // Set layer opacities GPU blended
        vIdle.style.opacity = frame.weights.idleOpacity.toFixed(3);
        vHoriz.style.opacity = frame.weights.horizontalOpacity.toFixed(3);
        vRet.style.opacity = frame.weights.returnLeftOpacity.toFixed(3);

        // Synchronize seek time for layer 1 (horizontal motion)
        if (vHoriz.duration && !isNaN(vHoriz.duration)) {
          const targetTime = vHoriz.duration * frame.weights.horizontalTimeFraction;
          // Smooth lerp seek time if delta is significant
          if (Math.abs(vHoriz.currentTime - targetTime) > 0.08) {
            vHoriz.currentTime = targetTime;
          }
        }

        // Synchronize seek time for layer 2 (return left)
        if (vRet.duration && !isNaN(vRet.duration)) {
          const targetTime = vRet.duration * frame.weights.returnLeftTimeFraction;
          if (Math.abs(vRet.currentTime - targetTime) > 0.08) {
            vRet.currentTime = targetTime;
          }
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [isPreloaded, pointerTracker]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-white select-none overflow-hidden ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Loading Placeholder */}
      {!isPreloaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="w-10 h-10 rounded-full border-2 border-ink/10 border-t-ink animate-spin" />
        </div>
      )}

      {/* Synchronized 3-Layer Video Stack */}
      <div className="relative w-full h-full aspect-[16/9] flex items-center justify-center">
        
        {/* Layer 0: Idle Center (Chapter 1) */}
        <video
          ref={videoIdleRef}
          src={config.videoPaths.idleCenter}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 bg-white"
          style={{ opacity: isPreloaded ? 1 : 0 }}
        />

        {/* Layer 1: Horizontal Motion (Chapter 2) */}
        <video
          ref={videoHorizontalRef}
          src={config.videoPaths.horizontalMotion}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 bg-white"
          style={{ opacity: 0 }}
        />

        {/* Layer 2: Return Left Continuation (Chapter 3) */}
        <video
          ref={videoReturnLeftRef}
          src={config.videoPaths.returnLeft}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 bg-white"
          style={{ opacity: 0 }}
        />

      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
