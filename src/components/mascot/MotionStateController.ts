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

  // Zero-Allocation Buffer: Pre-allocated scratch frame mutated in-place
  private readonly scratchFrame: MotionStateFrame = {
    currentX: 0,
    velocity: 0,
    stateName: 'IDLE_CENTER',
    weights: {
      idleOpacity: 1,
      horizontalOpacity: 0,
      returnLeftOpacity: 0,
      horizontalTimeFraction: 0,
      returnLeftTimeFraction: 0,
    },
  };

  constructor(config: MascotVideoConfigType = DEFAULT_MASCOT_VIDEO_CONFIG) {
    this.config = config;
  }

  public updateConfig(newConfig: MascotVideoConfigType): void {
    this.config = newConfig;
  }

  /**
   * Updates state physics and returns pre-allocated scratch frame buffer.
   * Zero GC allocations occur inside this method.
   */
  public update(pointer: Readonly<PointerState>, dt: number): Readonly<MotionStateFrame> {
    const targetX = pointer.isHovered ? pointer.targetX : 0.0;

    const response = pointer.isHovered ? this.config.motionResponse : this.config.returnToCenterSpeed;
    const damping = this.config.motionDamping;

    const accel = response * (targetX - this.currentX) - damping * this.velocity;
    this.velocity += accel * (dt * 60);
    this.currentX += this.velocity * (dt * 60);

    // Clamp position
    this.currentX = Math.max(-1.0, Math.min(1.0, this.currentX));

    // Update state machine
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

    // Calculate Layer Opacities
    const absX = Math.abs(this.currentX);
    const motionWeight = Math.min(1.0, absX * 2.2);
    const idleOpacity = Math.max(0.0, 1.0 - motionWeight);

    let horizontalOpacity = 0;
    let returnLeftOpacity = 0;
    let horizontalTimeFraction = 0;
    let returnLeftTimeFraction = 0;

    if (this.currentX >= 0) {
      horizontalOpacity = motionWeight;
      horizontalTimeFraction = (this.currentX / 1.0) * 0.48;
    } else {
      if (this.stateName === 'RETURNING_CENTER_FROM_LEFT') {
        returnLeftOpacity = motionWeight;
        returnLeftTimeFraction = (1.0 - Math.abs(this.currentX));
      } else {
        horizontalOpacity = motionWeight;
        horizontalTimeFraction = 0.52 + (Math.abs(this.currentX) * 0.46);
      }
    }

    // Mutate internal buffer in-place (Zero Allocation)
    const frame = this.scratchFrame;
    frame.currentX = this.currentX;
    frame.velocity = this.velocity;
    frame.stateName = this.stateName;

    const w = frame.weights;
    w.idleOpacity = idleOpacity;
    w.horizontalOpacity = horizontalOpacity;
    w.returnLeftOpacity = returnLeftOpacity;
    w.horizontalTimeFraction = horizontalTimeFraction;
    w.returnLeftTimeFraction = returnLeftTimeFraction;

    return frame;
  }

  public getCurrentStateName(): MotionStateName {
    return this.stateName;
  }
}
