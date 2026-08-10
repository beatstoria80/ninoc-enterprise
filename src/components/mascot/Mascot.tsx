"use client";

import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_MASCOT_CONFIG, MascotConfigType } from './MascotConfig';
import { MascotInteractionController } from './MascotInteraction';
import { MascotAnimationEngine, MascotAnimationState } from './MascotAnimation';

export interface MascotProps {
  config?: MascotConfigType;
  interactionController?: MascotInteractionController;
  className?: string;
  onLoaded?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  config = DEFAULT_MASCOT_CONFIG,
  interactionController,
  className = '',
  onLoaded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Animation Engine & Internal Controller instance if not passed
  const engineRef = useRef<MascotAnimationEngine | null>(null);
  const internalControllerRef = useRef<MascotInteractionController | null>(null);

  useEffect(() => {
    engineRef.current = new MascotAnimationEngine(config);
  }, [config]);

  useEffect(() => {
    const activeController = interactionController || internalControllerRef.current || new MascotInteractionController(config);
    if (!interactionController) {
      internalControllerRef.current = activeController;
    }

    if (containerRef.current) {
      activeController.attach(containerRef.current);
    }

    return () => {
      if (!interactionController && internalControllerRef.current) {
        internalControllerRef.current.detach();
      }
    };
  }, [interactionController, config]);

  // Preload original master reference image from public/asset/mascot/ninoc-mascot-master.png
  useEffect(() => {
    const img = new Image();
    img.src = '/asset/mascot/ninoc-mascot-master.png';
    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
      if (onLoaded) onLoaded();
    };
    img.onerror = (err) => {
      console.error('Failed to load mascot reference image:', err);
    };
  }, [onLoaded]);

  // Main 60 FPS Render Loop (Decoupled from React state re-renders)
  useEffect(() => {
    if (!isLoaded) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05); // Cap delta time to 50ms
      lastTimestamp = now;

      const canvas = canvasRef.current;
      const img = imageRef.current;
      const controller = interactionController || internalControllerRef.current;
      const engine = engineRef.current;

      if (canvas && img && controller && engine) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const rect = canvas.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            const displayW = Math.round(rect.width * dpr);
            const displayH = Math.round(rect.height * dpr);

            if (canvas.width !== displayW || canvas.height !== displayH) {
              canvas.width = displayW;
              canvas.height = displayH;
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Get pointer state & calculate current physics frame
            const pointer = controller.getState();
            const anim: MascotAnimationState = engine.update(pointer, dt, now);

            // Draw Mascot Render Layers
            drawMascotCanvas(ctx, img, rect.width, rect.height, anim, pointer);

            ctx.restore();
          }
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isLoaded, interactionController]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-2xl ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Loading Skeleton / Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-50/50">
          <div className="w-12 h-12 rounded-full border-2 border-rose/30 border-t-rose animate-spin" />
        </div>
      )}

      {/* Interactive High-DPI Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ display: 'block' }}
      />
    </div>
  );
};

// Canvas Layer Compositor function
function drawMascotCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  anim: MascotAnimationState,
  pointer: { normX: number; normY: number; attentive: number }
) {
  // Source bounds for main hero mascot on the left half of ninoc-mascot-master.png (1678 x 937)
  const srcX = 0;
  const srcY = 0;
  const srcW = 839; // Left 50% section
  const srcH = 937;

  const centerX = width / 2;
  const centerY = height / 2;

  // Aspect ratio preserving scaling
  const scale = Math.min((width * 0.9) / srcW, (height * 0.9) / srcH) * anim.attentiveScale;
  const destW = srcW * scale;
  const destH = srcH * scale;

  ctx.save();

  // 1. Soft matching background fill
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#f8f5fc');
  bgGrad.addColorStop(0.5, '#ede6f7');
  bgGrad.addColorStop(1, '#f9f6fd');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Iridescent Background Aura Glow
  const glowX = centerX + anim.idleOffset.x + anim.body.x;
  const glowY = centerY + anim.idleOffset.y + anim.body.y;
  const auraGrad = ctx.createRadialGradient(
    glowX, glowY, destW * 0.15,
    glowX, glowY, destW * 0.7
  );
  auraGrad.addColorStop(0, 'rgba(216, 180, 254, 0.35)'); // Soft lavender core
  auraGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.18)'); // Iridescent pink
  auraGrad.addColorStop(1, 'rgba(248, 245, 252, 0)');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Base Body Position (Combines idle float + body spring + head spring)
  const totalX = centerX + anim.idleOffset.x + anim.body.x + anim.head.x * 0.3;
  const totalY = centerY + anim.idleOffset.y + anim.body.y + anim.head.y * 0.3;
  const totalRot = (anim.idleOffset.rotation + anim.body.rotation + anim.head.rotation * 0.4) * (Math.PI / 180);

  ctx.translate(totalX, totalY);
  ctx.rotate(totalRot);

  // 4. Draw Master Character Image (Left section of reference asset)
  ctx.drawImage(
    img,
    srcX, srcY, srcW, srcH,
    -destW / 2, -destH / 2, destW, destH
  );

  // 5. Edge Vignette Masking to smoothly dissolve image borders into background
  const vignette = ctx.createRadialGradient(
    0, 0, destW * 0.38,
    0, 0, destW * 0.51
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.8, 'rgba(248, 245, 252, 0.35)');
  vignette.addColorStop(1, 'rgba(248, 245, 252, 0.95)');
  ctx.fillStyle = vignette;
  ctx.fillRect(-destW / 2 - 20, -destH / 2 - 20, destW + 40, destH + 40);

  // 6. Draw Layered Eye Focus & Pupil Light Glare overlay (Moves ahead of head)
  const eyeDx = (anim.eyes.x - anim.head.x * 0.5) * scale * 0.6;
  const eyeDy = (anim.eyes.y - anim.head.y * 0.5) * scale * 0.6;

  // Render pupil specular highlight tracking if cursor moves
  if (Math.abs(eyeDx) > 0.1 || Math.abs(eyeDy) > 0.1 || anim.blinkScaleY < 0.95) {
    ctx.save();
    
    // Left eye approximate position in character space
    const leftEyeX = -destW * 0.105 + eyeDx;
    const leftEyeY = -destH * 0.075 + eyeDy;
    // Right eye approximate position
    const rightEyeX = destW * 0.105 + eyeDx;
    const rightEyeY = -destH * 0.075 + eyeDy;

    // Apply Blink compression if blinking
    if (anim.blinkScaleY < 0.95) {
      ctx.fillStyle = 'rgba(235, 225, 250, 0.95)';
      const lidH = destH * 0.08 * (1 - anim.blinkScaleY);
      ctx.fillRect(leftEyeX - destW * 0.08, leftEyeY - lidH / 2, destW * 0.16, lidH);
      ctx.fillRect(rightEyeX - destW * 0.08, rightEyeY - lidH / 2, destW * 0.16, lidH);
    }

    // Dynamic pupil specular reflection point tracking
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(leftEyeX + destW * 0.02, leftEyeY - destH * 0.02, destW * 0.014, 0, Math.PI * 2);
    ctx.arc(rightEyeX + destW * 0.02, rightEyeY - destH * 0.02, destW * 0.014, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 7. Tentacle Secondary Motion Wave Highlight Overlay
  if (anim.tentacles.length > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.lineCap = 'round';

    anim.tentacles.forEach((t, i) => {
      const offsetX = (i - 1.5) * (destW * 0.12) + t.x * scale;
      const startY = destH * 0.12;
      const endY = destH * 0.42;

      ctx.beginPath();
      ctx.moveTo(offsetX, startY);
      ctx.quadraticCurveTo(
        offsetX + Math.sin(anim.time * 0.003 + i) * (10 * scale),
        (startY + endY) / 2,
        offsetX + t.x * scale * 0.5,
        endY
      );
      ctx.stroke();
    });

    ctx.restore();
  }

  ctx.restore();
}

export default Mascot;
