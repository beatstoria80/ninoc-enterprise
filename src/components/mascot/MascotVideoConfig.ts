export interface MascotVideoConfigType {
  readonly pointerDeadZone: number;       // Dead-zone around center (e.g. +-0.10)
  readonly pointerSensitivity: number;    // Sensitivity multiplier for cursor offset
  
  readonly motionDamping: number;         // Damping factor for inertia (0.05 to 0.25)
  readonly motionResponse: number;        // Spring responsiveness speed (0.02 to 0.15)
  readonly returnToCenterSpeed: number;   // Smooth return speed when pointer leaves hero
  
  readonly parallaxIntensityX: number;    // Max horizontal translate in px
  readonly parallaxIntensityY: number;    // Max vertical translate in px
  readonly parallaxTiltDeg: number;       // Max subtle tilt rotation in degrees
  
  readonly videoPaths: {
    readonly idleCenter: string;        // Chapter 1: Neutral Idle / Center (mobile fallback)
    readonly singleMascot: string;      // Single full mascot video (desktop/tablet)
  };

  readonly reducedMotionFactor: number;
}

export const DEFAULT_MASCOT_VIDEO_CONFIG: MascotVideoConfigType = Object.freeze({
  pointerDeadZone: 0.05,
  pointerSensitivity: 1.8,
  
  motionDamping: 0.12,
  motionResponse: 0.45,
  returnToCenterSpeed: 0.15,
  
  parallaxIntensityX: 30,   // Max 30px horizontal shift
  parallaxIntensityY: 15,   // Max 15px vertical shift
  parallaxTiltDeg: 3,       // Max 3 degree subtle tilt
  
  videoPaths: Object.freeze({
    idleCenter: '/videos/Ninoc_mascot_idle_video_animation_chapter_1.mp4',
    singleMascot: '/videos/mascot_ninoc.mp4',
  }),
  
  reducedMotionFactor: 0.1,
});

export function createMascotVideoConfig(
  overrides?: Partial<MascotVideoConfigType>
): MascotVideoConfigType {
  if (!overrides) return DEFAULT_MASCOT_VIDEO_CONFIG;
  
  return Object.freeze({
    ...DEFAULT_MASCOT_VIDEO_CONFIG,
    ...overrides,
    videoPaths: Object.freeze({
      ...DEFAULT_MASCOT_VIDEO_CONFIG.videoPaths,
      ...(overrides.videoPaths || {}),
    }),
  });
}
