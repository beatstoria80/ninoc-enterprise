import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerState } from './PointerTracker';

export type MotionStateName = 
  | 'IDLE_CENTER'
  | 'MOVING_HORIZONTAL'
  | 'HORIZONTAL_HELD'
  | 'RETURNING_CENTER';

export interface VideoLayerWeights {
  idleOpacity: number;       // Opacity of Chapter 1 (Idle Center)
  horizontalOpacity: number; // Opacity of Chapter 2 (Horizontal Motion)
  horizontalTimeFraction: number; // Normalized time fraction [0..1] for Layer 1
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
      horizontalTimeFraction: 0,
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
    const isRightDrag = pointer.isHovered && pointer.targetX > 0;
    const targetX = isRightDrag ? pointer.targetX : 0.0;

    const response = isRightDrag ? this.config.motionResponse : this.config.returnToCenterSpeed;
    const damping = this.config.motionDamping;

    const accel = response * (targetX - this.currentX) - damping * this.velocity;
    this.velocity += accel * (dt * 60);
    this.currentX += this.velocity * (dt * 60);

    // Clamp position strictly between 0.0 (Idle Main) and 1.0 (Full Right Drag)
    this.currentX = Math.max(0.0, Math.min(1.0, this.currentX));

    // Update state machine
    if (this.currentX < 0.02 && Math.abs(this.velocity) < 0.005) {
      this.currentX = 0.0;
      this.velocity = 0.0;
      this.stateName = 'IDLE_CENTER';
    } else if (Math.abs(this.velocity) > 0.005) {
      this.stateName = targetX < this.currentX ? 'RETURNING_CENTER' : 'MOVING_HORIZONTAL';
    } else {
      this.stateName = 'HORIZONTAL_HELD';
    }

    // Video 1 (Chapter 1 Idle Center) is MAIN and continuously loops when idle.
    // Video 2 (Chapter 2) activates strictly when rightward drag is triggered (currentX > 0.03).
    // Discrete layer threshold switching eliminates semi-transparent double-image ghosting artifacts completely.
    let idleOpacity = 1.0;
    let horizontalOpacity = 0.0;

    if (this.currentX > 0.03) {
      idleOpacity = 0.0;
      horizontalOpacity = 1.0;
    } else {
      idleOpacity = 1.0;
      horizontalOpacity = 0.0;
    }

    const horizontalTimeFraction = Math.max(0.0, Math.min(1.0, this.currentX));

    // Mutate internal buffer in-place (Zero Allocation)
    const frame = this.scratchFrame;
    frame.currentX = this.currentX;
    frame.velocity = this.velocity;
    frame.stateName = this.stateName;

    const w = frame.weights;
    w.idleOpacity = idleOpacity;
    w.horizontalOpacity = horizontalOpacity;
    w.horizontalTimeFraction = horizontalTimeFraction;

    return frame;
  }

  public getCurrentStateName(): MotionStateName {
    return this.stateName;
  }
}
