import { DEFAULT_MASCOT_CONFIG, MascotConfigType } from './MascotConfig';
import { PointerState } from './MascotInteraction';

export interface LayerTransform {
  x: number;
  y: number;
  rotation: number; // in degrees
  scaleX: number;
  scaleY: number;
}

export interface MascotAnimationState {
  eyes: LayerTransform;
  head: LayerTransform;
  body: LayerTransform;
  tentacles: LayerTransform[];
  idleOffset: LayerTransform;
  blinkScaleY: number;
  attentiveScale: number;
  time: number;
}

class SpringState {
  current = 0;
  velocity = 0;

  update(target: number, stiffness: number, damping: number, dt: number): number {
    const force = stiffness * (target - this.current);
    const dampingForce = -damping * this.velocity;
    const accel = force + dampingForce;
    this.velocity += accel * (dt * 60); // Normalized to 60fps frame rate
    this.current += this.velocity * (dt * 60);
    return this.current;
  }

  reset(value = 0) {
    this.current = value;
    this.velocity = 0;
  }
}

export class MascotAnimationEngine {
  private config: MascotConfigType;
  
  // Spring solvers for Eye layer
  private eyeXSpring = new SpringState();
  private eyeYSpring = new SpringState();
  private eyeRotSpring = new SpringState();

  // Spring solvers for Head layer
  private headXSpring = new SpringState();
  private headYSpring = new SpringState();
  private headRotSpring = new SpringState();

  // Spring solvers for Body layer
  private bodyXSpring = new SpringState();
  private bodyYSpring = new SpringState();
  private bodyRotSpring = new SpringState();

  // Spring solvers for Tentacles secondary lag
  private tentacleXSprings: SpringState[] = [new SpringState(), new SpringState(), new SpringState(), new SpringState()];
  private tentacleRotSprings: SpringState[] = [new SpringState(), new SpringState(), new SpringState(), new SpringState()];

  // Idle float time accumulator
  private time = 0;

  // Blink state
  private isBlinking = false;
  private blinkProgress = 0;
  private nextBlinkTime = 0;

  constructor(config: MascotConfigType = DEFAULT_MASCOT_CONFIG) {
    this.config = config;
    this.scheduleNextBlink(0);
  }

  public updateConfig(newConfig: MascotConfigType) {
    this.config = newConfig;
  }

  private scheduleNextBlink(currentTime: number) {
    const range = this.config.blinkIntervalMaxMs - this.config.blinkIntervalMinMs;
    this.nextBlinkTime = currentTime + this.config.blinkIntervalMinMs + Math.random() * range;
  }

  public update(pointer: PointerState, dt: number, timestamp: number): MascotAnimationState {
    this.time += dt * 1000;

    // 1. Reduced motion multiplier check
    const rm = pointer.reducedMotion ? this.config.reducedMotionFactor : 1.0;

    // 2. Idle float calculation (organic dual sine composition)
    const idleSpeed = this.config.idleSpeed;
    const idleX = Math.sin(this.time * idleSpeed * 0.7) * this.config.idleAmplitudeX * (pointer.reducedMotion ? 0.3 : 1.0);
    const idleY = Math.cos(this.time * idleSpeed) * this.config.idleAmplitudeY * (pointer.reducedMotion ? 0.3 : 1.0);
    const idleRot = Math.sin(this.time * idleSpeed * 0.5) * this.config.idleAmplitudeRot * (pointer.reducedMotion ? 0.3 : 1.0);

    // 3. Target calculation per layer based on normalized pointer [-1..1]
    const targetEyeX = pointer.normX * this.config.eyeRangeTranslation * rm;
    const targetEyeY = pointer.normY * (this.config.eyeRangeTranslation * 0.8) * rm;
    const targetEyeRot = pointer.normX * this.config.eyeRangeRotation * rm;

    const targetHeadX = pointer.normX * this.config.headRangeTranslation * rm;
    const targetHeadY = pointer.normY * (this.config.headRangeTranslation * 0.8) * rm;
    const targetHeadRot = pointer.normX * this.config.headRangeRotation * rm;

    const targetBodyX = pointer.normX * this.config.bodyRangeTranslation * rm;
    const targetBodyY = pointer.normY * (this.config.bodyRangeTranslation * 0.8) * rm;
    const targetBodyRot = pointer.normX * this.config.bodyRangeRotation * rm;

    // 4. Update spring physics per layer
    const eyeX = this.eyeXSpring.update(targetEyeX, this.config.eyeSpring.stiffness, this.config.eyeSpring.damping, dt);
    const eyeY = this.eyeYSpring.update(targetEyeY, this.config.eyeSpring.stiffness, this.config.eyeSpring.damping, dt);
    const eyeRot = this.eyeRotSpring.update(targetEyeRot, this.config.eyeSpring.stiffness, this.config.eyeSpring.damping, dt);

    const headX = this.headXSpring.update(targetHeadX, this.config.headSpring.stiffness, this.config.headSpring.damping, dt);
    const headY = this.headYSpring.update(targetHeadY, this.config.headSpring.stiffness, this.config.headSpring.damping, dt);
    const headRot = this.headRotSpring.update(targetHeadRot, this.config.headSpring.stiffness, this.config.headSpring.damping, dt);

    const bodyX = this.bodyXSpring.update(targetBodyX, this.config.bodySpring.stiffness, this.config.bodySpring.damping, dt);
    const bodyY = this.bodyYSpring.update(targetBodyY, this.config.bodySpring.stiffness, this.config.bodySpring.damping, dt);
    const bodyRot = this.bodyRotSpring.update(targetBodyRot, this.config.bodySpring.stiffness, this.config.bodySpring.damping, dt);

    // 5. Secondary Tentacle physics solver (4 tentacle groups)
    const tentacles: LayerTransform[] = [];
    for (let i = 0; i < 4; i++) {
      const phaseOffset = i * 0.6;
      const tentacleWave = Math.sin(this.time * 0.0025 + phaseOffset) * this.config.tentacleWaveAmp;
      const targetTentacleX = bodyX * (1 + (i * 0.15)) + tentacleWave * (pointer.reducedMotion ? 0.2 : 1.0);
      const targetTentacleRot = bodyRot * (1 + (i * 0.25)) + Math.cos(this.time * 0.002 + phaseOffset) * 2;

      const tx = this.tentacleXSprings[i].update(targetTentacleX, this.config.tentacleSpring.stiffness, this.config.tentacleSpring.damping, dt);
      const trot = this.tentacleRotSprings[i].update(targetTentacleRot, this.config.tentacleSpring.stiffness, this.config.tentacleSpring.damping, dt);

      tentacles.push({
        x: tx,
        y: bodyY * 0.5,
        rotation: trot,
        scaleX: 1,
        scaleY: 1,
      });
    }

    // 6. Blink solver
    if (!this.isBlinking && timestamp >= this.nextBlinkTime && !pointer.reducedMotion) {
      this.isBlinking = true;
      this.blinkProgress = 0;
    }

    let blinkScaleY = 1.0;
    if (this.isBlinking) {
      this.blinkProgress += (dt * 1000) / this.config.blinkDurationMs;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.scheduleNextBlink(timestamp);
      } else {
        // Smooth sine blink curve (1 -> 0.08 -> 1)
        blinkScaleY = 1.0 - Math.sin(this.blinkProgress * Math.PI) * 0.92;
      }
    }

    // 7. Attentive scale boost from proximity
    const attentiveScale = 1.0 + (pointer.attentive * (this.config.proximityAttentiveScale - 1.0));

    return {
      eyes: { x: eyeX, y: eyeY, rotation: eyeRot, scaleX: 1, scaleY: 1 },
      head: { x: headX, y: headY, rotation: headRot, scaleX: 1, scaleY: 1 },
      body: { x: bodyX, y: bodyY, rotation: bodyRot, scaleX: 1, scaleY: 1 },
      tentacles,
      idleOffset: { x: idleX, y: idleY, rotation: idleRot, scaleX: 1, scaleY: 1 },
      blinkScaleY,
      attentiveScale,
      time: this.time,
    };
  }
}
