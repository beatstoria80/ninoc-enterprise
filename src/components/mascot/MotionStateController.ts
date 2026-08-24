import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';
import { PointerState } from './PointerTracker';

export interface ParallaxFrame {
  translateX: number;   // Horizontal translate in px
  translateY: number;   // Vertical translate in px
  rotateY: number;      // Subtle Y-axis tilt rotation in degrees
  scale: number;        // Subtle scale for breathing effect
}

export class MotionStateController {
  private config: MascotVideoConfigType;
  
  private currentX = 0;
  private currentY = 0;
  private velocityX = 0;
  private velocityY = 0;

  // Zero-Allocation Buffer: Pre-allocated scratch frame mutated in-place
  private readonly scratchFrame: ParallaxFrame = {
    translateX: 0,
    translateY: 0,
    rotateY: 0,
    scale: 1,
  };

  constructor(config: MascotVideoConfigType = DEFAULT_MASCOT_VIDEO_CONFIG) {
    this.config = config;
  }

  public updateConfig(newConfig: MascotVideoConfigType): void {
    this.config = newConfig;
  }

  /**
   * Updates parallax state physics and returns pre-allocated scratch frame buffer.
   * Zero GC allocations occur inside this method.
   */
  public update(pointer: Readonly<PointerState>, dt: number): Readonly<ParallaxFrame> {
    const isActive = pointer.isHovered;
    const targetX = isActive ? pointer.normX : 0.0;
    const targetY = isActive ? pointer.normY : 0.0;

    // Spring physics interpolation
    const response = isActive ? this.config.motionResponse : this.config.returnToCenterSpeed;
    const damping = this.config.motionDamping;

    // X-axis spring
    const accelX = response * (targetX - this.currentX) - damping * this.velocityX;
    this.velocityX += accelX * (dt * 60);
    this.currentX += this.velocityX * (dt * 60);
    this.currentX = Math.max(-1.0, Math.min(1.0, this.currentX));

    // Y-axis spring
    const accelY = response * (targetY - this.currentY) - damping * this.velocityY;
    this.velocityY += accelY * (dt * 60);
    this.currentY += this.velocityY * (dt * 60);
    this.currentY = Math.max(-1.0, Math.min(1.0, this.currentY));

    // Convert to parallax transforms
    const frame = this.scratchFrame;
    frame.translateX = this.currentX * this.config.parallaxIntensityX;
    frame.translateY = this.currentY * this.config.parallaxIntensityY;
    frame.rotateY = this.currentX * this.config.parallaxTiltDeg;
    frame.scale = 1 + Math.abs(this.currentX) * 0.02; // Subtle 2% scale when offset

    return frame;
  }
}
