import React, { useEffect, useRef } from 'react';
import {
  DEFAULT_ACOUSTIC_RIBBONS,
  DEFAULT_TOPO_LOOPS,
  Point2D,
  createInitialCursorWaveState,
  evaluateAcousticRibbonPoints,
  evaluateTopoLoopPoints,
  stepCursorWaveState,
} from '../kinetic/acousticWaves';
import { getMobilePerformanceProfile } from '../kinetic/editorialStages';

interface AcousticWaveCanvasProps {
  tone: 'dark-cobalt' | 'light-ice';
  lightSurfaceBlend?: number;
  scrollTimelinePos?: number;
  interactive?: boolean;
  className?: string;
}

function drawSmoothOpenSpline(ctx: CanvasRenderingContext2D, pts: Point2D[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) * 0.5;
    const midY = (pts[i].y + pts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function drawSmoothClosedSpline(ctx: CanvasRenderingContext2D, pts: Point2D[]) {
  const n = pts.length;
  if (n < 3) return;
  const startMidX = (pts[n - 1].x + pts[0].x) * 0.5;
  const startMidY = (pts[n - 1].y + pts[0].y) * 0.5;
  ctx.beginPath();
  ctx.moveTo(startMidX, startMidY);
  for (let i = 0; i < n; i++) {
    const next = pts[(i + 1) % n];
    const midX = (pts[i].x + next.x) * 0.5;
    const midY = (pts[i].y + next.y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.closePath();
  ctx.stroke();
}

/**
 * Interactive 60fps canvas rendering organic multi-harmonic acoustic contours & closed
 * topographic pressure loops that drift continuously and bend smoothly around the cursor.
 */
export default function AcousticWaveCanvas({
  tone,
  lightSurfaceBlend,
  scrollTimelinePos = 0,
  interactive = true,
  className = '',
}: AcousticWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    tone,
    lightSurfaceBlend,
    scrollTimelinePos,
    interactive,
  });
  propsRef.current = { tone, lightSurfaceBlend, scrollTimelinePos, interactive };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const isCoarsePointer =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(pointer: coarse)').matches);

    let width = canvas.clientWidth || window.innerWidth || 1440;
    let height = canvas.clientHeight || window.innerHeight || 900;
    let perf = getMobilePerformanceProfile(window.innerWidth || width, isCoarsePointer);
    let dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width || window.innerWidth || 1440);
      height = Math.max(320, rect.height || window.innerHeight || 900);
      perf = getMobilePerformanceProfile(window.innerWidth || width, isCoarsePointer);
      dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    resize();

    let cursorState = createInitialCursorWaveState(width, height);
    let lastMoveMs = 0;
    let animPhase = 0;

    const renderFrame = (timeSec: number) => {
      const { tone: curTone, lightSurfaceBlend: curBlend, scrollTimelinePos: curPos } =
        propsRef.current;
      const blend =
        curBlend !== undefined ? curBlend : curTone === 'light-ice' ? 1 : 0;

      // Interpolate smoothly from luminous sky-cobalt (#93C5FD) on dark scenes
      // to crisp Cobalt Blue Deep (#2C3480) on Architectural Ice (#F1F5FF)
      const r = Math.round(147 + (44 - 147) * blend);
      const g = Math.round(197 + (52 - 197) * blend);
      const b = Math.round(253 + (128 - 253) * blend);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const influenceRadius = Math.max(190, Math.min(340, Math.min(width, height) * 0.3));
      const baseAlpha = blend >= 0.5 ? 0.145 : 0.135;

      const buildStrokeStyle = (opacityMultiplier: number): string | CanvasGradient => {
        const outerA = Number((baseAlpha * opacityMultiplier).toFixed(3));
        if (!cursorState.hasPointer || cursorState.energy <= 0.02) {
          return `rgba(${r}, ${g}, ${b}, ${outerA})`;
        }
        const grad = ctx.createRadialGradient(
          cursorState.x,
          cursorState.y,
          8,
          cursorState.x,
          cursorState.y,
          influenceRadius * 1.15
        );
        const peakAlpha = Math.min(
          0.46,
          outerA + (0.24 * cursorState.energy * opacityMultiplier)
        );
        const midAlpha = Math.min(
          0.3,
          outerA + (0.11 * cursorState.energy * opacityMultiplier)
        );
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${peakAlpha.toFixed(3)})`);
        grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${midAlpha.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${outerA})`);
        return grad;
      };

      // 1. Render sweeping multi-harmonic acoustic contour ribbons
      const segScale = perf.waveSegmentScale;
      const ribbonSegs = Math.max(24, Math.round(64 * segScale));
      const loopOuterSegs = Math.max(20, Math.round(56 * segScale));
      const loopInnerSegs = Math.max(18, Math.round(48 * segScale));

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const ribbon of DEFAULT_ACOUSTIC_RIBBONS) {
        const pts = evaluateAcousticRibbonPoints(
          ribbon,
          width,
          height,
          timeSec,
          curPos,
          cursorState,
          ribbonSegs
        );
        ctx.strokeStyle = buildStrokeStyle(ribbon.opacityScale);
        ctx.lineWidth = 1.25;
        drawSmoothOpenSpline(ctx, pts);
      }

      // 2. Render drifting, morphing closed topographic pressure loops & inner echo contours
      for (const loop of DEFAULT_TOPO_LOOPS) {
        const outerPts = evaluateTopoLoopPoints(
          loop,
          width,
          height,
          timeSec,
          curPos,
          cursorState,
          loopOuterSegs,
          1.0
        );
        ctx.strokeStyle = buildStrokeStyle(loop.opacityScale);
        ctx.lineWidth = 1.15;
        drawSmoothClosedSpline(ctx, outerPts);

        if (loop.hasInnerEcho) {
          const innerPts = evaluateTopoLoopPoints(
            loop,
            width,
            height,
            timeSec + 0.8,
            curPos,
            cursorState,
            loopInnerSegs,
            0.56
          );
          ctx.strokeStyle = buildStrokeStyle(loop.opacityScale * 0.72);
          ctx.lineWidth = 1.0;
          drawSmoothClosedSpline(ctx, innerPts);
        }
      }

      // 3. Subtle signature Cobalt acoustic cursor reticle arcs (tactile, zero neon bloom)
      if (cursorState.hasPointer && cursorState.energy > 0.04) {
        const speedMag = Math.hypot(cursorState.vx, cursorState.vy);
        const ringRadius = 26 + Math.min(22, speedMag * 0.024) + Math.sin(timeSec * 3.4) * 2.5;
        const headingAngle =
          speedMag > 25 ? Math.atan2(cursorState.vy, cursorState.vx) : timeSec * 0.65;
        const arcAlpha = Math.min(0.28, 0.22 * cursorState.energy);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${arcAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(
          cursorState.x,
          cursorState.y,
          ringRadius,
          headingAngle - 0.72,
          headingAngle + 0.72
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          cursorState.x,
          cursorState.y,
          ringRadius * 1.48,
          headingAngle + Math.PI - 0.55,
          headingAngle + Math.PI + 0.55
        );
        ctx.stroke();
      }

      ctx.restore();
    };

    if (prefersReducedMotion) {
      renderFrame(0);
      window.addEventListener('resize', resize);
      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    const onPointerMove = (e: PointerEvent | MouseEvent) => {
      if (!propsRef.current.interactive) return;
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      cursorState = {
        ...cursorState,
        targetX: localX,
        targetY: localY,
        hasPointer: true,
      };
      if (cursorState.energy < 0.05) {
        cursorState.x = localX;
        cursorState.y = localY;
      }
      lastMoveMs = performance.now();
      canvas.setAttribute('data-cursor-x', String(Math.round(localX)));
      canvas.setAttribute('data-cursor-y', String(Math.round(localY)));
      canvas.setAttribute('data-cursor-active', 'true');
    };

    const onPointerLeave = () => {
      cursorState = {
        ...cursorState,
        hasPointer: false,
      };
      canvas.setAttribute('data-cursor-active', 'false');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastFrameMs = performance.now();

    const tick = (nowMs: number) => {
      const targetInterval =
        perf.canvasTargetFps <= 30
          ? 33
          : perf.canvasTargetFps < 60
          ? 27
          : 16;

      if (!document.hidden && nowMs - lastFrameMs >= targetInterval) {
        const dtSec = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) / 1000));
        lastFrameMs = nowMs;
        animPhase += dtSec;

        const pointerRecent = !isCoarsePointer && nowMs - lastMoveMs < 650;
        cursorState = stepCursorWaveState(cursorState, dtSec, pointerRecent);
        renderFrame(animPhase);
      } else if (document.hidden) {
        lastFrameMs = nowMs;
      }
      rafId = requestAnimationFrame(tick);
    };

    renderFrame(0);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="acoustic-wave-canvas"
      data-cursor-active="false"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  );
}
