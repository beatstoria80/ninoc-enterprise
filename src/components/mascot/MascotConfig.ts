export interface MascotConfigType {
  // Motion ranges (in degrees and pixels)
  eyeRangeRotation: number;   // Max eye rotation in degrees (approx +-10 deg)
  eyeRangeTranslation: number; // Max eye offset translation in px
  headRangeRotation: number;  // Max head rotation in degrees (approx +-6 deg)
  headRangeTranslation: number;// Max head offset translation in px
  bodyRangeRotation: number;  // Max body rotation in degrees (approx +-4 deg)
  bodyRangeTranslation: number;// Max body offset translation in px
  
  // Spring Physics per layer
  eyeSpring: { stiffness: number; damping: number };
  headSpring: { stiffness: number; damping: number };
  bodySpring: { stiffness: number; damping: number };
  tentacleSpring: { stiffness: number; damping: number };
  
  // Secondary motion parameters
  tentacleLag: number;        // Lag factor for secondary wave motion
  tentacleWaveAmp: number;    // Amplitude of tentacle sway
  
  // Idle floating animation
  idleAmplitudeX: number;     // Horizontal floating offset px
  idleAmplitudeY: number;     // Vertical floating offset px
  idleAmplitudeRot: number;   // Floating rotation deg
  idleSpeed: number;          // Time frequency scale
  
  // Proximity & Focus interaction
  proximityRadius: number;    // Radius (0 to 1) for attentiveness check
  proximityAttentiveScale: number; // Scale boost when mouse is near
  
  // Blink behavior
  blinkIntervalMinMs: number;
  blinkIntervalMaxMs: number;
  blinkDurationMs: number;
  
  // Reduced motion multiplier (scale factor applied when reduced motion preferred)
  reducedMotionFactor: number;
}

export const DEFAULT_MASCOT_CONFIG: MascotConfigType = {
  eyeRangeRotation: 10,
  eyeRangeTranslation: 14,
  headRangeRotation: 6,
  headRangeTranslation: 8,
  bodyRangeRotation: 4,
  bodyRangeTranslation: 5,
  
  eyeSpring: { stiffness: 0.18, damping: 0.70 },
  headSpring: { stiffness: 0.10, damping: 0.78 },
  bodySpring: { stiffness: 0.05, damping: 0.85 },
  tentacleSpring: { stiffness: 0.03, damping: 0.90 },
  
  tentacleLag: 0.35,
  tentacleWaveAmp: 8,
  
  idleAmplitudeX: 6,
  idleAmplitudeY: 14,
  idleAmplitudeRot: 1.8,
  idleSpeed: 0.0016,
  
  proximityRadius: 0.75,
  proximityAttentiveScale: 1.03,
  
  blinkIntervalMinMs: 3500,
  blinkIntervalMaxMs: 7500,
  blinkDurationMs: 160,
  
  reducedMotionFactor: 0.1,
};
