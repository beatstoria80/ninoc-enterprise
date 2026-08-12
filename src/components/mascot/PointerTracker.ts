import { DEFAULT_MASCOT_VIDEO_CONFIG, MascotVideoConfigType } from './MascotVideoConfig';

export interface PointerState {
  normX: number;              // Raw normalized X [-1.0 .. +1.0]
  normY: number;              // Raw normalized Y [-1.0 .. +1.0]
  targetX: number;            // Smoothstep dead-zone adjusted X target [-1.0 .. +1.0]
  isHovered: boolean;         // Is cursor/touch currently active over hero/right area
  isCategoryHovered: boolean; // Is cursor specifically hovering over category navigation items
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
    targetX: 0,
    isHovered: false,
    isCategoryHovered: false,
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
      container.addEventListener('mouseleave', this.handleMouseLeave, { passive: true });

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

    const rawX = (clientX - centerX) / (rect.width / 2);
    const rawY = (clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1.0, Math.min(1.0, rawX * this.config.pointerSensitivity));
    const clampedY = Math.max(-1.0, Math.min(1.0, rawY));

    const dz = this.config.pointerDeadZone;

    let targetX = 0;
    let isCategory = false;

    // Detect if pointer has reached the right-hand category navigation zone (right of mascot card)
    const categoryThreshold = rect.right - 40;

    if (clientX >= categoryThreshold) {
      // Cursor is at/over the right-hand categories menu
      targetX = 1.0;
      isCategory = true;
    } else if (clampedX > dz || clientX > centerX) {
      // Cursor is in rightward transit area (before categories menu)
      const normRange = Math.max(0, (clampedX - dz) / (1.0 - dz));
      const smoothResponse = normRange * normRange * (3 - 2 * normRange);
      targetX = Math.max(0.6, smoothResponse);
      isCategory = false;
    } else {
      // Cursor is left/centered
      targetX = 0;
      isCategory = false;
    }

    if (this.state.reducedMotion) {
      targetX *= this.config.reducedMotionFactor;
    }

    this.state.normX = clampedX;
    this.state.normY = clampedY;
    this.state.targetX = targetX;
    this.state.isCategoryHovered = isCategory;
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

    // Check if cursor is in vertical vicinity of hero
    const verticalMargin = Math.max(250, windowHeight * 0.45);
    const isYActive = e.clientY >= (rect.top - verticalMargin) && e.clientY <= (rect.bottom + verticalMargin);

    const isRightSideCategories = e.clientX >= (rect.left + rect.width * 0.15);

    if (isYActive && (isRightSideCategories || (e.clientX >= rect.left && e.clientX <= rect.right))) {
      this.state.isHovered = true;
      this.updatePointer(e.clientX, e.clientY, false);
    } else if (this.state.isHovered) {
      if (!isYActive || e.clientX < rect.left - 150) {
        this.handleMouseLeave();
      }
    }
  };

  private handleMouseEnter = (): void => {
    this.state.isHovered = true;
  };

  private handleMouseLeave = (): void => {
    this.state.isHovered = false;
    this.state.isCategoryHovered = false;
    this.state.normX = 0;
    this.state.normY = 0;
    this.state.targetX = 0;
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
