import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';

export interface PointerState {
  normX: number;              // Normalized X [-1.0 .. +1.0] relative to container center
  normY: number;              // Normalized Y [-1.0 .. +1.0] relative to container center
  isHovered: boolean;         // Is cursor/touch currently active over hero area
  isTouch: boolean;           // Is interaction touch-based
  reducedMotion: boolean;     // Does user request reduced motion
}

export class PointerTracker {
  private container: HTMLElement | null = null;
  private config: MascotVideoConfigType;
  private mediaQueryList: MediaQueryList | null = null;
  private isAttached = false;

  private readonly state: PointerState = {
    normX: 0,
    normY: 0,
    isHovered: false,
    isTouch: false,
    reducedMotion: false,
  };

  constructor(config: MascotVideoConfigType = DEFAULT_MASCOT_VIDEO_CONFIG) {
    this.config = config;
  }

  public attach(container: HTMLElement): void {
    if (this.isAttached && this.container === container) return;
    if (this.isAttached) this.detach();

    this.container = container;
    this.checkReducedMotion();

    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.mediaQueryList.addEventListener('change', this.handleReducedMotionChange);

      container.addEventListener('mousemove', this.handleMouseMove, { passive: true });
      container.addEventListener('mouseenter', this.handleMouseEnter, { passive: true });

      container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      container.addEventListener('touchmove', this.handleTouchMove, { passive: true });
      container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
      container.addEventListener('touchcancel', this.handleTouchEnd, { passive: true });

      window.addEventListener('mousemove', this.handleWindowMouseMove, { passive: true });
      this.isAttached = true;
    }
  }

  public detach(): void {
    if (!this.isAttached) return;

    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleReducedMotionChange);
      this.mediaQueryList = null;
    }
    if (this.container) {
      this.container.removeEventListener('mousemove', this.handleMouseMove);
      this.container.removeEventListener('mouseenter', this.handleMouseEnter);

      this.container.removeEventListener('touchstart', this.handleTouchStart);
      this.container.removeEventListener('touchmove', this.handleTouchMove);
      this.container.removeEventListener('touchend', this.handleTouchEnd);
      this.container.removeEventListener('touchcancel', this.handleTouchEnd);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleWindowMouseMove);
    }
    this.container = null;
    this.isAttached = false;
  }

  public updateConfig(newConfig: MascotVideoConfigType): void {
    this.config = newConfig;
  }

  public getState(): Readonly<PointerState> {
    return this.state;
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.state.reducedMotion = query.matches;
    }
  }

  private handleReducedMotionChange = (e: MediaQueryListEvent): void => {
    this.state.reducedMotion = e.matches;
  };

  private updatePointer(clientX: number, clientY: number, isTouch = false): void {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Simple normalized position relative to container center [-1.0 .. +1.0]
    let normX = ((clientX - centerX) / (rect.width / 2)) * this.config.pointerSensitivity;
    let normY = ((clientY - centerY) / (rect.height / 2)) * this.config.pointerSensitivity;

    // Clamp to [-1.0 .. +1.0]
    normX = Math.max(-1.0, Math.min(1.0, normX));
    normY = Math.max(-1.0, Math.min(1.0, normY));

    if (this.state.reducedMotion) {
      normX *= this.config.reducedMotionFactor;
      normY *= this.config.reducedMotionFactor;
    }

    this.state.normX = normX;
    this.state.normY = normY;
    this.state.isTouch = isTouch;
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.state.isHovered = true;
    this.updatePointer(e.clientX, e.clientY, false);
  };

  private handleWindowMouseMove = (e: MouseEvent): void => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Keep pointer tracking active across the viewport hero section
    const isYActive = e.clientY >= 0 && e.clientY <= Math.max(rect.bottom + 250, windowHeight * 0.85);

    if (isYActive) {
      this.state.isHovered = true;
      this.updatePointer(e.clientX, e.clientY, false);
    } else if (this.state.isHovered) {
      this.handleMouseLeave();
    }
  };

  private handleMouseEnter = (): void => {
    this.state.isHovered = true;
  };

  private handleMouseLeave = (): void => {
    this.state.isHovered = false;
    this.state.normX = 0;
    this.state.normY = 0;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      this.state.isHovered = true;
      const touch = e.touches[0];
      this.updatePointer(touch.clientX, touch.clientY, true);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      this.state.isHovered = true;
      const touch = e.touches[0];
      this.updatePointer(touch.clientX, touch.clientY, true);
    }
  };

  private handleTouchEnd = (): void => {
    this.state.isHovered = false;
    this.handleMouseLeave();
  };
}
