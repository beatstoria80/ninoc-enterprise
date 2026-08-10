import { DEFAULT_MASCOT_CONFIG, MascotConfigType } from './MascotConfig';

export interface PointerState {
  normX: number;       // Normalized X position from -1 to 1
  normY: number;       // Normalized Y position from -1 to 1
  distance: number;    // Distance from center (0 to ~1.414)
  attentive: number;   // Attentiveness factor from 0 to 1 based on proximity
  isHovered: boolean;  // Is cursor currently inside the hero interactive zone
  isTouch: boolean;    // Is current pointer interaction driven by touch
  reducedMotion: boolean; // Does user request prefers-reduced-motion
}

export class MascotInteractionController {
  private container: HTMLElement | null = null;
  private config: MascotConfigType;
  
  private state: PointerState = {
    normX: 0,
    normY: 0,
    distance: 0,
    attentive: 0,
    isHovered: false,
    isTouch: false,
    reducedMotion: false,
  };

  private targetX = 0;
  private targetY = 0;
  private mediaQueryList: MediaQueryList | null = null;

  constructor(config: MascotConfigType = DEFAULT_MASCOT_CONFIG) {
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

      // Window level pointer move backup for seamless tracking near edges
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

  public updateConfig(newConfig: MascotConfigType) {
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

  private updatePointerFromClientCoords(clientX: number, clientY: number, isTouch = false) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) return;

    // Calculate center offset
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Compute normalized coordinates [-1..1]
    const rawX = (clientX - centerX) / (rect.width / 2);
    const rawY = (clientY - centerY) / (rect.height / 2);

    // Clamp to reasonable limits [-1..1]
    this.targetX = Math.max(-1, Math.min(1, rawX));
    this.targetY = Math.max(-1, Math.min(1, rawY));

    // Distance calculation
    const dist = Math.sqrt(this.targetX * this.targetX + this.targetY * this.targetY);
    
    // Attentiveness calculation based on proximity threshold
    const rad = this.config.proximityRadius;
    const attentiveFactor = Math.max(0, Math.min(1, 1 - (dist / rad)));

    const mult = this.state.reducedMotion ? this.config.reducedMotionFactor : 1.0;

    this.state.normX = this.targetX * mult;
    this.state.normY = this.targetY * mult;
    this.state.distance = dist;
    this.state.attentive = attentiveFactor;
    this.state.isTouch = isTouch;
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.state.isHovered = true;
    this.updatePointerFromClientCoords(e.clientX, e.clientY, false);
  };

  private handleWindowMouseMove = (e: MouseEvent) => {
    if (!this.container || !this.state.isHovered) return;
    const rect = this.container.getBoundingClientRect();
    // Check if mouse is near container boundary
    const margin = 100;
    if (
      e.clientX >= rect.left - margin &&
      e.clientX <= rect.right + margin &&
      e.clientY >= rect.top - margin &&
      e.clientY <= rect.bottom + margin
    ) {
      this.updatePointerFromClientCoords(e.clientX, e.clientY, false);
    } else {
      this.handleMouseLeave();
    }
  };

  private handleMouseEnter = () => {
    this.state.isHovered = true;
  };

  private handleMouseLeave = () => {
    this.state.isHovered = false;
    this.targetX = 0;
    this.targetY = 0;
    this.state.normX = 0;
    this.state.normY = 0;
    this.state.distance = 0;
    this.state.attentive = 0;
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.state.isHovered = true;
      const touch = e.touches[0];
      this.updatePointerFromClientCoords(touch.clientX, touch.clientY, true);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.state.isHovered = true;
      const touch = e.touches[0];
      this.updatePointerFromClientCoords(touch.clientX, touch.clientY, true);
    }
  };

  private handleTouchEnd = () => {
    this.state.isHovered = false;
    this.handleMouseLeave();
  };
}
