import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerState } from './PointerTracker';

export type MotionStateName = 
  | 'IDLE_CENTER'
  | 'MOVING_HORIZONTAL'
  | 'CATEGORY_NODDING'
  | 'RETURNING_CENTER';

export interface VideoLayerWeights {
  idleOpacity: number;        // Opacity of Chapter 1 (Idle Center)
  horizontalOpacity: number;  // Opacity of Chapter 2 (Rightward Motion)
  categoryNodOpacity: number;  // Opacity of Chapter 3 (Category Nodding Loop)
  horizontalTimeFraction: number;
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
  private turnRightTimer = 0;

  // Zero-Allocation Buffer: Pre-allocated scratch frame mutated in-place
  private readonly scratchFrame: MotionStateFrame = {
    currentX: 0,
    velocity: 0,
    stateName: 'IDLE_CENTER',
    weights: {
      idleOpacity: 1,
      horizontalOpacity: 0,
      categoryNodOpacity: 0,
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
    const isRightDrag = pointer.isHovered && pointer.targetX > 0.05;
    const targetX = isRightDrag ? pointer.targetX : 0.0;

    const response = isRightDrag ? this.config.motionResponse : this.config.returnToCenterSpeed;
    const damping = this.config.motionDamping;

    const accel = response * (targetX - this.currentX) - damping * this.velocity;
    this.velocity += accel * (dt * 60);
    this.currentX += this.velocity * (dt * 60);

    // Clamp position strictly between 0.0 (Idle Main) and 1.0 (Full Right Drag)
    this.currentX = Math.max(0.0, Math.min(1.0, this.currentX));

    let idleOpacity = 1.0;
    let horizontalOpacity = 0.0;
    let categoryNodOpacity = 0.0;

    if (isRightDrag) {
      this.turnRightTimer += dt;

      // Always play Chapter 2 (Rightward Motion) FIRST when turning right (uses config.chapter2Duration, default ~1.8s)
      // Then seamlessly transition to Chapter 3 (Nodding Loop) after Chapter 2 completes
      const ch2Duration = this.config.chapter2Duration ?? 1.8;
      if (this.turnRightTimer < ch2Duration) {
        idleOpacity = 0.0;
        horizontalOpacity = 1.0;
        categoryNodOpacity = 0.0;
        this.stateName = 'MOVING_HORIZONTAL';
      } else {
        idleOpacity = 0.0;
        horizontalOpacity = 0.0;
        categoryNodOpacity = 1.0;
        this.stateName = 'CATEGORY_NODDING';
      }
    } else {
      // Cursor moved back to the left: reset timer & return to Idle Center (Chapter 1)
      this.turnRightTimer = 0;
      idleOpacity = 1.0;
      horizontalOpacity = 0.0;
      categoryNodOpacity = 0.0;
      this.stateName = 'IDLE_CENTER';
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
    w.categoryNodOpacity = categoryNodOpacity;
    w.horizontalTimeFraction = horizontalTimeFraction;

    return frame;
  }

  public getCurrentStateName(): MotionStateName {
    return this.stateName;
  }
}
