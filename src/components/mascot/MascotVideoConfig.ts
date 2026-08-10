export interface MascotVideoConfigType {
  // Cursor Dead-zone and Sensitivity
  pointerDeadZone: number;       // Dead-zone around center (e.g. +-0.10)
  pointerSensitivity: number;    // Sensitivity multiplier for cursor offset
  
  // Motion Physics & Damping
  motionDamping: number;         // Damping factor for inertia (0.05 to 0.25)
  motionResponse: number;        // Spring responsiveness speed (0.02 to 0.15)
  returnToCenterSpeed: number;   // Smooth return speed when pointer leaves hero
  
  // Video Motion Engine & Layer Crossfading
  videoCrossfadeDurationMs: number; // Layer transition opacity crossfade duration in ms
  
  // Asset Paths (Auto-discovered Google Flow video files in public/videos/)
  videoPaths: {
    idleCenter: string;        // Chapter 1: Neutral Idle / Center
    horizontalMotion: string;  // Chapter 2: Center -> Right -> Center -> Left
    returnLeft: string;        // Chapter 3: Left -> Center Continuation
  };

  // Reduced motion multiplier
  reducedMotionFactor: number;
}

export const DEFAULT_MASCOT_VIDEO_CONFIG: MascotVideoConfigType = {
  pointerDeadZone: 0.10,
  pointerSensitivity: 1.2,
  
  motionDamping: 0.14,
  motionResponse: 0.08,
  returnToCenterSpeed: 0.06,
  
  videoCrossfadeDurationMs: 250,
  
  videoPaths: {
    idleCenter: '/videos/Ninoc_mascot_idle_video_animation_chapter_1.mp4',
    horizontalMotion: '/videos/Mascot_horizontal_motion_video_chapter_2.mp4',
    returnLeft: '/videos/Ninoc_mascot_idle_video_animation_chapter_3.mp4',
  },
  
  reducedMotionFactor: 0.1,
};
