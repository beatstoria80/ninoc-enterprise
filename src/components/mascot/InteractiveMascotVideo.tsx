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

  // Cached opacity refs to eliminate redundant DOM mutations
  const prevIdleOpacity = useRef<number>(-1);
  const prevHorizOpacity = useRef<number>(-1);
  const prevRetOpacity = useRef<number>(-1);

  const [isPreloaded, setIsPreloaded] = useState(true);

  // Controllers
  const motionControllerRef = useRef<MotionStateController | null>(null);
  const internalTrackerRef = useRef<PointerTracker | null>(null);

  useEffect(() => {
    motionControllerRef.current = new MotionStateController(config);
  }, [config]);

  // Pointer Tracker initialization with strict cleanup
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

  // Immediate Video Autoplay Enforcer
  useEffect(() => {
    const vIdle = videoIdleRef.current;
    const vHoriz = videoHorizontalRef.current;
    const vRet = videoReturnLeftRef.current;

    [vIdle, vHoriz, vRet].forEach((v) => {
      if (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.play().catch(() => {});
      }
    });
  }, []);

  // High-Performance 60 FPS Render Loop (Zero GC, Cached DOM Updates)
  useEffect(() => {
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
        if (vRet.paused) {
          vRet.muted = true;
          vRet.play().catch(() => {});
        }

        // Smart DOM Opacity Diffing: Only write style when value changes meaningfully
        const nextIdle = frame.weights.idleOpacity;
        const nextHoriz = frame.weights.horizontalOpacity;
        const nextRet = frame.weights.returnLeftOpacity;

        if (Math.abs(prevIdleOpacity.current - nextIdle) > 0.001) {
          prevIdleOpacity.current = nextIdle;
          vIdle.style.opacity = nextIdle.toFixed(3);
        }

        if (Math.abs(prevHorizOpacity.current - nextHoriz) > 0.001) {
          prevHorizOpacity.current = nextHoriz;
          vHoriz.style.opacity = nextHoriz.toFixed(3);
        }

        if (Math.abs(prevRetOpacity.current - nextRet) > 0.001) {
          prevRetOpacity.current = nextRet;
          vRet.style.opacity = nextRet.toFixed(3);
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
      {/* Synchronized 3-Layer Video Stack (100% Viewport Frame Coverage) */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white">
        
        {/* Layer 0: Idle Center (Chapter 1) */}
        <video
          ref={videoIdleRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300 bg-white"
          style={{ opacity: 1 }}
        >
          <source src={config.videoPaths.idleCenter} type="video/mp4" />
        </video>

        {/* Layer 1: Horizontal Motion (Chapter 2) */}
        <video
          ref={videoHorizontalRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300 bg-white"
          style={{ opacity: 0 }}
        >
          <source src={config.videoPaths.horizontalMotion} type="video/mp4" />
        </video>

        {/* Layer 2: Return Left Continuation (Chapter 3) */}
        <video
          ref={videoReturnLeftRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300 bg-white"
          style={{ opacity: 0 }}
        >
          <source src={config.videoPaths.returnLeft} type="video/mp4" />
        </video>

      </div>
    </div>
  );
};

export default InteractiveMascotVideo;
