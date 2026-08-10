import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerState } from './PointerTracker';

export type MotionStateName = 
  | 'IDLE_CENTER'
  | 'MOVING_RIGHT'
  | 'RIGHT_HELD'
  | 'RETURNING_CENTER_FROM_RIGHT'
  | 'MOVING_LEFT'
  | 'LEFT_HELD'
  | 'RETURNING_CENTER_FROM_LEFT';

export interface VideoLayerWeights {
  idleOpacity: number;       // Opacity of Chapter 1 (Idle Center)
  horizontalOpacity: number; // Opacity of Chapter 2 (Horizontal Motion)
  returnLeftOpacity: number; // Opacity of Chapter 3 (Left -> Center Continuation)
  
  horizontalTimeFraction: number; // Normalized time fraction [0..1] for Layer 1
  returnLeftTimeFraction: number; // Normalized time fraction [0..1] for Layer 2
}

export interface MotionStateFrame {
  currentX: number;           // Current interpolated horizontal position [-1.0 .. +1.0]
  velocity: number;           // Velocity scalar
  stateName: MotionStateName; // Current state machine name
  weights: VideoLayerWeights; // Video layer opacities and seek ratios
}

export class MotionStateController {
  private config: MascotVideoConfigType;
  
  private currentX = 0;
  private velocity = 0;
  private stateName: MotionStateName = 'IDLE_CENTER';

  constructor(config: MascotVideoConfigType = DEFAULT_MASCOT_VIDEO_CONFIG) {
    this.config = config;
  }

  public updateConfig(newConfig: MascotVideoConfigType) {
    this.config = newConfig;
  }

  public update(pointer: PointerState, dt: number): MotionStateFrame {
    // Determine target X based on hover state
    const targetX = pointer.isHovered ? pointer.targetX : 0.0;

    // Spring physics update for inertia
    const response = pointer.isHovered ? this.config.motionResponse : this.config.returnToCenterSpeed;
    const damping = this.config.motionDamping;

    const accel = response * (targetX - this.currentX) - damping * this.velocity;
    this.velocity += accel * (dt * 60);
    this.currentX += this.velocity * (dt * 60);

    // Clamp current position
    this.currentX = Math.max(-1.0, Math.min(1.0, this.currentX));

    // Update state machine name
    if (Math.abs(this.currentX) < 0.05 && Math.abs(this.velocity) < 0.01) {
      this.stateName = 'IDLE_CENTER';
    } else if (this.currentX > 0.05) {
      if (Math.abs(this.velocity) > 0.01) {
        this.stateName = targetX >= this.currentX ? 'MOVING_RIGHT' : 'RETURNING_CENTER_FROM_RIGHT';
      } else {
        this.stateName = 'RIGHT_HELD';
      }
    } else if (this.currentX < -0.05) {
      if (Math.abs(this.velocity) > 0.01) {
        this.stateName = targetX <= this.currentX ? 'MOVING_LEFT' : 'RETURNING_CENTER_FROM_LEFT';
      } else {
        this.stateName = 'LEFT_HELD';
      }
    }

    // Calculate Video Layer Opacity Weights and Scrub Ratios
    const absX = Math.abs(this.currentX);
    
    // Crossfade curve: Idle is 1.0 when X=0, fades out smoothly as X increases
    const motionWeight = Math.min(1.0, absX * 2.2); // Reaches full motion layer at ~0.45 offset
    const idleOpacity = Math.max(0.0, 1.0 - motionWeight);

    let horizontalOpacity = 0;
    let returnLeftOpacity = 0;
    let horizontalTimeFraction = 0;
    let returnLeftTimeFraction = 0;

    if (this.currentX >= 0) {
      // Moving right or idle: Map [0 .. +1] to first half of horizontal video [0.0 .. 0.48]
      horizontalOpacity = motionWeight;
      horizontalTimeFraction = (this.currentX / 1.0) * 0.48;
    } else {
      // Moving left: Use Chapter 2 second half or Chapter 3 continuation
      if (this.stateName === 'RETURNING_CENTER_FROM_LEFT') {
        // Return from left uses Chapter 3 continuation
        returnLeftOpacity = motionWeight;
        returnLeftTimeFraction = (1.0 - Math.abs(this.currentX));
      } else {
        // Direct left movement uses Chapter 2 second half [0.52 .. 1.0]
        horizontalOpacity = motionWeight;
        horizontalTimeFraction = 0.52 + (Math.abs(this.currentX) * 0.46);
      }
    }

    return {
      currentX: this.currentX,
      velocity: this.velocity,
      stateName: this.stateName,
      weights: {
        idleOpacity,
        horizontalOpacity,
        returnLeftOpacity,
        horizontalTimeFraction,
        returnLeftTimeFraction,
      },
    };
  }

  public getCurrentStateName(): MotionStateName {
    return this.stateName;
  }
}
