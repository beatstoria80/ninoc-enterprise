export interface MascotVideoConfigType {
  readonly pointerDeadZone: number;       // Dead-zone around center (e.g. +-0.10)
  readonly pointerSensitivity: number;    // Sensitivity multiplier for cursor offset
  
  readonly motionDamping: number;         // Damping factor for inertia (0.05 to 0.25)
  readonly motionResponse: number;        // Spring responsiveness speed (0.02 to 0.15)
  readonly returnToCenterSpeed: number;   // Smooth return speed when pointer leaves hero
  
  readonly videoCrossfadeDurationMs: number; // Layer transition opacity crossfade duration in ms
  
  readonly videoPaths: {
    readonly idleCenter: string;        // Chapter 1: Neutral Idle / Center
    readonly horizontalMotion: string;  // Chapter 2: Center -> Right -> Center -> Left
    readonly returnLeft: string;        // Chapter 3: Left -> Center Continuation
  };

  readonly reducedMotionFactor: number;
}

export const DEFAULT_MASCOT_VIDEO_CONFIG: MascotVideoConfigType = Object.freeze({
  pointerDeadZone: 0.10,
  pointerSensitivity: 1.2,
  
  motionDamping: 0.14,
  motionResponse: 0.08,
  returnToCenterSpeed: 0.06,
  
  videoCrossfadeDurationMs: 250,
  
  videoPaths: Object.freeze({
    idleCenter: '/videos/Ninoc_mascot_idle_video_animation_chapter_1.mp4',
    horizontalMotion: '/videos/Mascot_horizontal_motion_video_chapter_2.mp4',
    returnLeft: '/videos/Ninoc_mascot_idle_video_animation_chapter_3.mp4',
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
