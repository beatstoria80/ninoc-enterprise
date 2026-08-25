export interface MascotVideoConfigType {
  readonly pointerDeadZone: number;       // Dead-zone around center (e.g. +-0.10)
  readonly pointerSensitivity: number;    // Sensitivity multiplier for cursor offset
  
  readonly motionDamping: number;         // Damping factor for inertia (0.05 to 0.25)
  readonly motionResponse: number;        // Spring responsiveness speed (0.02 to 0.15)
  readonly returnToCenterSpeed: number;   // Smooth return speed when pointer leaves hero
  
  readonly videoCrossfadeDurationMs: number; // Layer transition opacity crossfade duration in ms
  readonly chapter2Duration: number;        // Extended duration in seconds for Chapter 2 rightward motion (~1.8s)
  
  readonly videoPaths: {
    readonly singleMascot: string;      // The ONE AND ONLY video file used
  };

  // Timestamps (in seconds) indicating where each animation starts and ends within the single video file
  readonly timestamps: {
    readonly idleStart: number;
    readonly idleEnd: number;
    readonly turnRightStart: number;
    readonly turnRightEnd: number;
    readonly noddingStart: number;
    readonly noddingEnd: number;
  };

  readonly reducedMotionFactor: number;
}

export const DEFAULT_MASCOT_VIDEO_CONFIG: MascotVideoConfigType = Object.freeze({
  pointerDeadZone: 0.05,
  pointerSensitivity: 2.2, // Ditingkatkan agar lebih sensitif terhadap gerakan mouse
  
  motionDamping: 0.25,      // Ditingkatkan agar cepat stabil (tidak berayun-ayun lama)
  motionResponse: 0.85,     // Ditingkatkan drastis agar sangat cepat bereaksi (sebelumnya 0.45)
  returnToCenterSpeed: 0.35, // Ditingkatkan agar cepat kembali ke tengah (sebelumnya 0.15)
  
  videoCrossfadeDurationMs: 120,
  chapter2Duration: 3.2, // Extended long duration for complete Chapter 2 rightward turn and 60 FPS reverse return
  
  videoPaths: Object.freeze({
    singleMascot: '/videos/mascot_ninoc.mp4',
  }),

  timestamps: Object.freeze({
    idleStart: 0.0,         // Mulai idle
    idleEnd: 4.95,          // Durasi penuh animasi tengah (naik turun)
    turnRightStart: 5.0,    // Mulai nengok kanan
    turnRightEnd: 9.95,     // Akhir nengok kanan
    noddingStart: 12.25,    // Mulai mengangguk yang benar (0:00:12:15)
    noddingEnd: 15.28,      // Akhir mengangguk yang benar (0:00:15:17)
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
    timestamps: Object.freeze({
      ...DEFAULT_MASCOT_VIDEO_CONFIG.timestamps,
      ...(overrides.timestamps || {}),
    }),
  });
}
