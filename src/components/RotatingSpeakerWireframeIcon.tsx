import React, { useEffect, useRef } from 'react';

interface RotatingSpeakerWireframeIconProps {
  /**
   * 'pure-white': All speaker outlines and WLED ring rendered in crisp pure white (for "Inspect 3D GLB")
   * 'cobalt-wled': Crisp white speaker outline with the middle WLED ring glowing in faint Cobalt Blue (for WLED App tab)
   */
  variant: 'pure-white' | 'cobalt-wled';
  initialPhase?: number;
  active?: boolean;
  className?: string;
}

/**
 * Slowly rotating 3D wireframe outline drawing of the exact DIY Party Box Speaker.
 * Accurately models the 781:1491 cabinet geometry, 8 corner mounting bosses,
 * 2 horizontal internal bracing bars, 4-ear Upper Dynamic Speaker with central dome
 * and dual voice-coil prongs, 16-LED Middle WLED Ring Light with side mounting tabs,
 * 4-ear Lower Woofer, side dual bass-reflex ports, top handle trench, and rear plate.
 */
export default function RotatingSpeakerWireframeIcon({
  variant,
  initialPhase = 0.35,
  active = true,
  className = 'w-14 h-[72px]',
}: RotatingSpeakerWireframeIconProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isNarrowMobile =
      typeof window !== 'undefined' && window.innerWidth < 768;
    const minFrameMs = isNarrowMobile ? 66 : 16;

    let rafId = 0;
    let timerId = 0;
    let angleY = initialPhase;
    let lastTs = performance.now();
    const tiltX = 0.14; // Subtle downward architectural viewing angle

    // Speaker 3D half-dimensions (matching exact 781 : 1491 aspect ratio)
    const hw = 14.2; // half width
    const hh = 27.0; // half height
    const hd = 13.5; // half depth
    const zFront = hd;
    const zBack = -hd;

    const project = (
      x: number,
      y: number,
      z: number,
      cosY: number,
      sinY: number,
      cosX: number,
      sinX: number,
      cx: number,
      cy: number,
      scale: number
    ): [number, number, number] => {
      // Rotate around Y axis
      const rx = x * cosY + z * sinY;
      const rz = -x * sinY + z * cosY;
      // Rotate around X axis
      const ry = y * cosX - rz * sinX;
      const rz2 = y * sinX + rz * cosX;
      // Gentle perspective factor
      const fov = 145;
      const persp = fov / (fov - rz2);
      return [cx + rx * scale * persp, cy + ry * scale * persp, rz2];
    };

    const drawCurrent = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - lastTs) / 1000));
      lastTs = now;
      if (active && !prefersReducedMotion) {
        angleY += 0.66 * dt;
      }

      const dpr = isNarrowMobile
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 2, 2);
      const cw = 140;
      const ch = 176;
      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      const cx = cw * 0.5;
      const cy = ch * 0.51;
      const scale = 2.62;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);

      const p = (x: number, y: number, z: number) =>
        project(x, y, z, cosY, sinY, cosX, sinX, cx, cy, scale);

      const drawLine3D = (
        x1: number,
        y1: number,
        z1: number,
        x2: number,
        y2: number,
        z2: number
      ) => {
        const [px1, py1] = p(x1, y1, z1);
        const [px2, py2] = p(x2, y2, z2);
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.stroke();
      };

      const drawCircleZ = (
        cx3d: number,
        cy3d: number,
        cz3d: number,
        r: number,
        segments = 36,
        close = true
      ) => {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const x = cx3d + Math.cos(theta) * r;
          const y = cy3d + Math.sin(theta) * r;
          const [px, py] = p(x, y, cz3d);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        if (close) ctx.closePath();
        ctx.stroke();
      };

      const drawCircleX = (
        cx3d: number,
        cy3d: number,
        cz3d: number,
        r: number,
        segments = 24
      ) => {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const y = cy3d + Math.sin(theta) * r;
          const z = cz3d + Math.cos(theta) * r;
          const [px, py] = p(cx3d, y, z);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // =====================================================================
      // 1. OUTER 3D CABINET WIREFRAME BOX & INTERNAL BRACING
      // =====================================================================
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
      ctx.lineWidth = 0.9;

      // Back face rectangle
      drawLine3D(-hw, -hh, zBack, hw, -hh, zBack);
      drawLine3D(hw, -hh, zBack, hw, hh, zBack);
      drawLine3D(hw, hh, zBack, -hw, hh, zBack);
      drawLine3D(-hw, hh, zBack, -hw, -hh, zBack);

      // 4 Depth edges connecting Front and Back
      drawLine3D(-hw, -hh, zFront, -hw, -hh, zBack);
      drawLine3D(hw, -hh, zFront, hw, -hh, zBack);
      drawLine3D(hw, hh, zFront, hw, hh, zBack);
      drawLine3D(-hw, hh, zFront, -hw, hh, zBack);

      // Top Recessed Carry-Handle Trench
      drawLine3D(-5.5, -hh, -3.2, 5.5, -hh, -3.2);
      drawLine3D(5.5, -hh, -3.2, 5.5, -hh, 3.2);
      drawLine3D(5.5, -hh, 3.2, -5.5, -hh, 3.2);
      drawLine3D(-5.5, -hh, 3.2, -5.5, -hh, -3.2);

      // Left (-hw) & Right (+hw) Side Panels: 1 Passive Radiator on Each Side (Lower-Middle Section, matching R_left & R_right photos)
      const yPassiveRadiator = 10.2;
      const activeSideX = sinY < 0 ? hw : -hw;
      const sideVisibility = Math.min(1, Math.abs(sinY) * 1.65 + 0.15);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.72 * sideVisibility).toFixed(2)})`;
      ctx.lineWidth = 1.0;
      drawCircleX(activeSideX, yPassiveRadiator, 0, 3.8, 24);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.48 * sideVisibility).toFixed(2)})`;
      ctx.lineWidth = 0.8;
      drawCircleX(activeSideX, yPassiveRadiator, 0, 2.75, 20);

      // Front Face Outer Cabinet Frame (Crisp White)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = 1.25;
      drawLine3D(-hw, -hh, zFront, hw, -hh, zFront);
      drawLine3D(hw, -hh, zFront, hw, hh, zFront);
      drawLine3D(hw, hh, zFront, -hw, hh, zFront);
      drawLine3D(-hw, hh, zFront, -hw, -hh, zFront);

      // Inner Baffle Inset Wall & 2 Horizontal Internal Bracing Bars (matching X-Ray)
      const iw = hw - 2.3;
      const ih = hh - 2.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 0.85;
      drawLine3D(-iw, -ih, zFront, iw, -ih, zFront);
      drawLine3D(iw, -ih, zFront, iw, ih, zFront);
      drawLine3D(iw, ih, zFront, -iw, ih, zFront);
      drawLine3D(-iw, ih, zFront, -iw, -ih, zFront);

      // 2 Horizontal Bracing Ribs above and below WLED ring
      drawLine3D(-iw, -4.8, zFront, iw, -4.8, zFront);
      drawLine3D(-iw, -3.6, zFront, iw, -3.6, zFront);
      drawLine3D(-iw, 8.9, zFront, iw, 8.9, zFront);
      drawLine3D(-iw, 10.1, zFront, iw, 10.1, zFront);

      // 8 Corner & Mid-Wall Mounting Bosses (matching X-Ray blueprint)
      const bossYs = [-ih + 1.4, -4.2, 9.5, ih - 1.4];
      for (const by of bossYs) {
        drawCircleZ(-hw + 1.2, by, zFront, 0.8, 12);
        drawCircleZ(hw - 1.2, by, zFront, 0.8, 12);
      }

      // =====================================================================
      // 2. UPPER DYNAMIC SPEAKER (y = -14.2, r = 8.1)
      // =====================================================================
      const yUpper = -14.2;
      const rUpper = 8.1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.2;
      drawCircleZ(0, yUpper, zFront, rUpper, 40);

      // Inner surround & cone rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.lineWidth = 0.9;
      drawCircleZ(0, yUpper, zFront, rUpper * 0.84, 36);

      // 4 Diagonal Screw Mounting Ears on Upper Driver
      for (const deg of [45, 135, 225, 315]) {
        const rad = (deg * Math.PI) / 180;
        const ex = Math.cos(rad) * (rUpper + 1.15);
        const ey = yUpper + Math.sin(rad) * (rUpper + 1.15);
        drawCircleZ(ex, ey, zFront, 0.85, 12);
      }

      // Central Dome Dustcap (r = 2.8) + Signature Dual Voice-Coil Lead Prongs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.15;
      drawCircleZ(0, yUpper, zFront + 0.8, 2.8, 28);
      drawLine3D(-0.9, yUpper + 2.3, zFront + 0.6, -1.5, yUpper + 3.8, zFront + 0.2);
      drawLine3D(0.9, yUpper + 2.3, zFront + 0.6, 1.5, yUpper + 3.8, zFront + 0.2);

      // =====================================================================
      // 3. MIDDLE WLED RING LIGHT (y = +2.3, rOut = 7.1, rIn = 4.65)
      // =====================================================================
      const yRing = 2.3;
      const rRingOut = 7.1;
      const rRingIn = 4.65;
      const rRingMid = (rRingOut + rRingIn) * 0.5;

      if (variant === 'cobalt-wled') {
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 91, 255, 0.28)';
        ctx.lineWidth = 7.5;
        drawCircleZ(0, yRing, zFront + 0.12, rRingMid, 36);

        ctx.strokeStyle = 'rgba(59, 91, 255, 0.56)';
        ctx.lineWidth = 3.6;
        drawCircleZ(0, yRing, zFront + 0.15, rRingMid, 36);

        ctx.strokeStyle = 'rgba(147, 197, 253, 0.95)';
        ctx.lineWidth = 1.25;
        drawCircleZ(0, yRing, zFront + 0.2, rRingOut, 36);
        drawCircleZ(0, yRing, zFront + 0.2, rRingIn, 36);

        ctx.fillStyle = 'rgba(219, 234, 254, 0.95)';
        for (let i = 0; i < 12; i++) {
          const theta = (i / 12) * Math.PI * 2;
          const lx = Math.cos(theta) * rRingMid;
          const ly = yRing + Math.sin(theta) * rRingMid;
          const [px, py] = p(lx, ly, zFront + 0.25);
          ctx.beginPath();
          ctx.arc(px, py, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.2;
        drawCircleZ(0, yRing, zFront, rRingOut, 40);
        drawCircleZ(0, yRing, zFront, rRingIn, 40);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let i = 0; i < 12; i++) {
          const theta = (i / 12) * Math.PI * 2;
          const lx = Math.cos(theta) * rRingMid;
          const ly = yRing + Math.sin(theta) * rRingMid;
          const [px, py] = p(lx, ly, zFront + 0.1);
          ctx.beginPath();
          ctx.arc(px, py, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =====================================================================
      // 4. LOWER WOOFER (y = +16.8, r = 6.0)
      // =====================================================================
      const yLower = 16.8;
      const rLower = 6.0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.2;
      drawCircleZ(0, yLower, zFront, rLower, 36);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.lineWidth = 0.9;
      drawCircleZ(0, yLower, zFront, rLower * 0.82, 32);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.05;
      drawCircleZ(0, yLower, zFront - 0.3, 2.0, 24);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.lineWidth = 0.85;
      for (const deg of [45, 135, 225, 315]) {
        const rad = (deg * Math.PI) / 180;
        const ex = Math.cos(rad) * (rLower + 0.95);
        const ey = yLower + Math.sin(rad) * (rLower + 0.95);
        drawCircleZ(ex, ey, zFront, 0.72, 10);
      }

      ctx.restore();
    };

    drawCurrent(performance.now());

    if (active && !prefersReducedMotion) {
      let isCancelled = false;
      let idleId: number | null = null;
      let startTimerId: number | null = null;

      const startLoop = () => {
        if (isCancelled) return;
        let lastDrawNow = performance.now();
        const loop = (now: number) => {
          if (isCancelled) return;
          if (now - lastDrawNow >= minFrameMs) {
            lastDrawNow = now;
            drawCurrent(now);
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      };

      if (typeof window !== 'undefined') {
        if (typeof (window as any).requestIdleCallback === 'function') {
          idleId = (window as any).requestIdleCallback(
            () => {
              startTimerId = window.setTimeout(startLoop, 300);
            },
            { timeout: 1200 }
          );
        } else {
          startTimerId = window.setTimeout(startLoop, 1200);
        }
      }

      return () => {
        isCancelled = true;
        if (rafId) cancelAnimationFrame(rafId);
        if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleId);
        }
        if (startTimerId) window.clearTimeout(startTimerId);
      };
    }
  }, [variant, initialPhase, active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none block ${className}`}
    />
  );
}
