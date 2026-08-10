import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';

export interface PointerState {
  normX: number;          // Raw normalized X [-1.0 .. +1.0]
  normY: number;          // Raw normalized Y [-1.0 .. +1.0]
  targetX: number;        // Smoothstep dead-zone adjusted X target [-1.0 .. +1.0]
  isHovered: boolean;     // Is cursor/touch currently active over hero
  isTouch: boolean;       // Is interaction touch-based
  reducedMotion: boolean; // Does user request reduced motion
}

export class PointerTracker {
  private container: HTMLElement | null = null;
  private config: MascotVideoConfigType;
  private mediaQueryList: MediaQueryList | null = null;

  private state: PointerState = {
    normX: 0,
    normY: 0,
    targetX: 0,
    isHovered: false,
    isTouch: false,
    reducedMotion: false,
  };

  constructor(config: MascotVideoConfigType = DEFAULT_MASCOT_VIDEO_CONFIG) {
    this.config = config;
  }

  public attach(container: HTMLElement) {
    this.container = container;
    this.checkReducedMotion();

    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.mediaQueryList.addEventListener('change', this.handleReducedMotionChange);

      container.addEventListener('mousemove', this.handleMouseMove, { passive: true });
      container.addEventListener('mouseenter', this.handleMouseEnter, { passive: true });
      container.addEventListener('mouseleave', this.handleMouseLeave, { passive: true });

      container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      container.addEventListener('touchmove', this.handleTouchMove, { passive: true });
      container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
      container.addEventListener('touchcancel', this.handleTouchEnd, { passive: true });

      window.addEventListener('mousemove', this.handleWindowMouseMove, { passive: true });
    }
  }

  public detach() {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleReducedMotionChange);
    }
    if (this.container) {
      this.container.removeEventListener('mousemove', this.handleMouseMove);
      this.container.removeEventListener('mouseenter', this.handleMouseEnter);
      this.container.removeEventListener('mouseleave', this.handleMouseLeave);

      this.container.removeEventListener('touchstart', this.handleTouchStart);
      this.container.removeEventListener('touchmove', this.handleTouchMove);
      this.container.removeEventListener('touchend', this.handleTouchEnd);
      this.container.removeEventListener('touchcancel', this.handleTouchEnd);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleWindowMouseMove);
    }
    this.container = null;
  }

  public updateConfig(newConfig: MascotVideoConfigType) {
    this.config = newConfig;
  }

  public getState(): PointerState {
    return { ...this.state };
  }

  private checkReducedMotion() {
    if (typeof window !== 'undefined') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.state.reducedMotion = query.matches;
    }
  }

  private handleReducedMotionChange = (e: MediaQueryListEvent) => {
    this.state.reducedMotion = e.matches;
  };

  private updatePointer(clientX: number, clientY: number, isTouch = false) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalized X and Y from -1.0 to +1.0
    const rawX = (clientX - centerX) / (rect.width / 2);
    const rawY = (clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1.0, Math.min(1.0, rawX * this.config.pointerSensitivity));
    const clampedY = Math.max(-1.0, Math.min(1.0, rawY));

    // Non-linear response curve with center dead-zone
    const absX = Math.abs(clampedX);
    const dz = this.config.pointerDeadZone;

    let targetX = 0;
    if (absX > dz) {
      // Scale from [dz .. 1.0] to [0.0 .. 1.0] with smoothstep curve
      const normRange = (absX - dz) / (1.0 - dz);
      const smoothResponse = normRange * normRange * (3 - 2 * normRange); // Hermite interpolation
      targetX = Math.sign(clampedX) * smoothResponse;
    }

    if (this.state.reducedMotion) {
      targetX *= this.config.reducedMotionFactor;
    }

    this.state.normX = clampedX;
    this.state.normY = clampedY;
    this.state.targetX = targetX;
    this.state.isTouch = isTouch;
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.state.isHovered = true;
    this.updatePointer(e.clientX, e.clientY, false);
  };

  private handleWindowMouseMove = (e: MouseEvent) => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      this.state.isHovered = true;
      this.updatePointer(e.clientX, e.clientY, false);
    } else if (this.state.isHovered) {
      this.handleMouseLeave();
    }
  };

  private handleMouseEnter = () => {
    this.state.isHovered = true;
  };

  private handleMouseLeave = () => {
    this.state.isHovered = false;
    this.state.normX = 0;
    this.state.normY = 0;
    this.state.targetX = 0;
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.state.isHovered = true;
      const touch = e.touches[0];
      this.updatePointer(touch.clientX, touch.clientY, true);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.state.isHovered = true;
      const touch = e.touches[0];
      this.updatePointer(touch.clientX, touch.clientY, true);
    }
  };

  private handleTouchEnd = () => {
    this.state.isHovered = false;
    this.handleMouseLeave();
  };
}
