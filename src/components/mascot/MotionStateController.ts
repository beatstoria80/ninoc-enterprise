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
  
  // Separate timers for forward (right) and return (left) phases
  private turnRightTimer = 0;
  private returnTimer = 0;
  
  // Edge detection: was cursor in right zone on previous frame?
  private wasRightDrag = false;

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

    // Spring physics interpolation
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

    const ch2Duration = this.config.chapter2Duration ?? 1.8;

    // ─── Edge Detection: Cursor just entered right zone (fresh turn) ───
    if (isRightDrag && !this.wasRightDrag) {
      // Fresh rightward entry: reset turn timer for full Chapter 2 animation
      this.turnRightTimer = 0;
      this.returnTimer = 0;
    }

    // ─── Edge Detection: Cursor just left right zone (start return) ───
    if (!isRightDrag && this.wasRightDrag) {
      // Just moved left: start return timer from 0 for full Chapter 2 return animation
      this.returnTimer = 0;
    }

    if (isRightDrag) {
      // ═══ RIGHTWARD MOTION ═══
      this.turnRightTimer += dt;

      if (pointer.isCategoryHovered) {
        // Cursor OUTSIDE video frame (in Categories navigation menu): Play pure Nodding Loop (Chapter 3)
        idleOpacity = 0.0;
        horizontalOpacity = 0.0;
        categoryNodOpacity = 1.0;
        this.stateName = 'CATEGORY_NODDING';
      } else {
        // Cursor INSIDE video frame (Right half of mascot frame): Play Rightward Turn Motion (Chapter 2)
        idleOpacity = 0.0;
        horizontalOpacity = 1.0;
        categoryNodOpacity = 0.0;
        this.stateName = 'MOVING_HORIZONTAL';
      }
    } else if (this.wasRightDrag || this.returnTimer > 0) {
      // ═══ RETURNING TO CENTER (CHAPTER 2 REVERSE) ═══
      // Play Chapter 2 in 60 FPS REVERSE to return mascot smoothly from right to center pose
      this.returnTimer += dt;

      if (this.returnTimer < ch2Duration) {
        idleOpacity = 0.0;
        horizontalOpacity = 1.0;
        categoryNodOpacity = 0.0;
        this.stateName = 'RETURNING_CENTER';
      } else {
        // Return animation complete → back to Idle Center (Chapter 1)
        this.returnTimer = 0;
        this.turnRightTimer = 0;
        idleOpacity = 1.0;
        horizontalOpacity = 0.0;
        categoryNodOpacity = 0.0;
        this.stateName = 'IDLE_CENTER';
      }
    } else {
      // ═══ IDLE CENTER ═══
      this.turnRightTimer = 0;
      this.returnTimer = 0;
      idleOpacity = 1.0;
      horizontalOpacity = 0.0;
      categoryNodOpacity = 0.0;
      this.stateName = 'IDLE_CENTER';
    }

    // Update edge detection state for next frame
    this.wasRightDrag = isRightDrag;

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
