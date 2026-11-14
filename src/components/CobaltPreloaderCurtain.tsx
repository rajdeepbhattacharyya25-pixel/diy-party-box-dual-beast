import React, { useEffect, useRef, useState } from 'react';
import RotatingSpeakerWireframeIcon from './RotatingSpeakerWireframeIcon';
import {
  CORE_PRELOAD_IMAGES,
  SECONDARY_WARMUP_IMAGES,
  getPreloaderDisplayState,
} from '../kinetic/editorialStages';

interface CobaltPreloaderCurtainProps {
  onComplete: () => void;
  onZoomStart?: () => void;
  bypass?: boolean;
}

/**
 * Retains decoded HTMLImageElement instances in memory across the session so
 * the browser never evicts decoded bitmaps for offscreen/hidden scenes.
 */
const pinnedImageCache = new Map<string, HTMLImageElement>();

export function preloadSingleImage(src: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const existing = pinnedImageCache.get(src);
  if (existing && existing.complete) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    pinnedImageCache.set(src, img);
    const done = () => resolve();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = src;
  });
}

export function warmupAllSceneImages(): void {
  if (typeof window === 'undefined') return;

  // Primary hero render is preloaded immediately
  CORE_PRELOAD_IMAGES.forEach((src) => {
    void preloadSingleImage(src);
  });

  // Secondary images warmed up ONLY during idle time after window loads or curtain completion
  const triggerSecondary = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(
        () => {
          SECONDARY_WARMUP_IMAGES.forEach((src) => {
            void preloadSingleImage(src);
          });
        },
        { timeout: 4000 }
      );
    } else {
      window.setTimeout(() => {
        SECONDARY_WARMUP_IMAGES.forEach((src) => {
          void preloadSingleImage(src);
        });
      }, 1500);
    }
  };

  if (document.readyState === 'complete') {
    triggerSecondary();
  } else {
    window.addEventListener('load', triggerSecondary, { once: true });
  }
}

/**
 * Full-screen Cobalt Blue Deep (#2C3480) asset preloader curtain.
 * Pre-decodes core speaker renders, workshop photographs, 360 turntable keyframes,
 * and document fonts before performing a cinematic zoom-in transition straight into Scene 01.
 */
export default function CobaltPreloaderCurtain({
  onComplete,
  onZoomStart,
  bypass = false,
}: CobaltPreloaderCurtainProps) {
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const [phase, setPhase] = useState<'loading' | 'zooming' | 'done'>(
    bypass ? 'done' : 'loading'
  );
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onZoomStartRef = useRef(onZoomStart);
  onZoomStartRef.current = onZoomStart;

  const totalAssets = CORE_PRELOAD_IMAGES.length + 1; // +1 for document.fonts.ready race

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (bypass) {
      warmupAllSceneImages();
      onCompleteRef.current();
      return;
    }

    let cancelled = false;
    const startTime = performance.now();

    // Kick off real parallel hero image preloading into pinned browser bitmap cache
    CORE_PRELOAD_IMAGES.forEach((src) => {
      preloadSingleImage(src).then(() => {
        if (!cancelled) {
          setLoadedCount((c) => c + 1);
        }
      });
    });

    // Font readiness: race document.fonts.ready with a 150ms timeout so font network delays never trap the preloader
    const fontsPromise =
      typeof document !== 'undefined' && document.fonts?.ready
        ? document.fonts.ready
        : Promise.resolve();

    const fontRaceTimeout = new Promise((resolve) =>
      window.setTimeout(resolve, 150)
    );

    Promise.race([fontsPromise, fontRaceTimeout]).then(() => {
      if (!cancelled) {
        setLoadedCount((c) => c + 1);
      }
    });

    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        setElapsedMs(performance.now() - startTime);
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bypass]);

  // Uniform authentic preloader timing for all visitors
  const minDisplayMs = prefersReducedMotion ? 100 : 150;
  const displayState = getPreloaderDisplayState(
    loadedCount,
    totalAssets,
    elapsedMs,
    minDisplayMs,
    2500
  );

  useEffect(() => {
    if (bypass || phase !== 'loading' || !displayState.isComplete) return;
    setPhase('zooming');
    onZoomStartRef.current?.();
  }, [bypass, phase, displayState.isComplete]);

  useEffect(() => {
    if (bypass || phase !== 'zooming') return;
    const zoomDuration = prefersReducedMotion ? 140 : 240;
    const zoomTimer = window.setTimeout(() => {
      setPhase('done');
      onCompleteRef.current();
    }, zoomDuration);
    return () => window.clearTimeout(zoomTimer);
  }, [bypass, phase, prefersReducedMotion]);

  if (phase === 'done') return null;

  const isZooming = phase === 'zooming';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading dualbeast — Two Speakers. One Powerful Experience.: ${displayState.formattedPercent}`}
      data-testid="cobalt-preloader-curtain"
      data-preloader-phase={phase}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between px-8 py-10 text-white select-none overflow-hidden will-change-[transform,opacity]"
      style={{
        backgroundColor: '#2C3480',
        transition: prefersReducedMotion
          ? 'opacity 240ms ease-out'
          : 'transform 760ms cubic-bezier(0.72, 0, 0.22, 1), opacity 640ms cubic-bezier(0.55, 0, 0.25, 1) 100ms',
        transform:
          isZooming && !prefersReducedMotion
            ? 'scale3d(1.22, 1.22, 1)'
            : 'scale3d(1, 1, 1)',
        opacity: isZooming ? 0 : 1,
        pointerEvents: isZooming ? 'none' : 'auto',
      }}
    >
      {/* Subtle Cobalt radial studio atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 60% at 50% 48%, rgba(59, 91, 255, 0.36) 0%, rgba(44, 52, 128, 0.85) 55%, rgba(16, 22, 68, 1) 100%)',
        }}
      />

      {/* Top Architectural Header — fades back cleanly as camera zooms forward */}
      <div
        className="relative z-10 w-full max-w-[1440px] flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.26em] text-white/80 transition-opacity duration-300"
        style={{ opacity: isZooming ? 0 : 1 }}
      >
        <span>DUALBEAST · DIY PARTY BOX</span>
        <span className="hidden sm:inline">TWO SPEAKERS. ONE POWERFUL EXPERIENCE.</span>
        <span>LEFT + RIGHT</span>
      </div>

      {/* Center Rotating Wireframe Speaker + Large Counter — zooms cleanly past the viewer */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 my-auto will-change-[transform,opacity]"
        style={{
          transition: prefersReducedMotion
            ? 'opacity 220ms ease-out'
            : 'transform 740ms cubic-bezier(0.7, 0, 0.2, 1), opacity 420ms ease-in 120ms',
          transform:
            isZooming && !prefersReducedMotion
              ? 'scale3d(4.4, 4.4, 1)'
              : 'scale3d(1, 1, 1)',
          opacity: isZooming ? 0 : 1,
        }}
      >
        <div className="relative flex items-center justify-center p-4">
          <RotatingSpeakerWireframeIcon
            variant="cobalt-wled"
            initialPhase={0.45}
            active={phase === 'loading'}
            className="w-[92px] h-[116px] sm:w-[112px] sm:h-[142px]"
          />
        </div>

        <div
          className="flex flex-col items-center gap-2.5 transition-opacity duration-250"
          style={{ opacity: isZooming ? 0 : 1 }}
        >
          <div
            data-testid="preloader-percent"
            className="font-mono text-4xl sm:text-5xl font-medium tracking-tight tabular-nums text-white"
          >
            {displayState.formattedPercent}
          </div>
          <div className="w-56 sm:w-72 h-[2px] bg-white/20 overflow-hidden rounded-full">
            <div
              className="w-full h-full bg-white origin-left will-change-transform"
              style={{ transform: `scaleX(${displayState.percent / 100})` }}
            />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#93C5FD]">
            Loading Images &amp; Fonts
          </p>
        </div>
      </div>

      {/* Bottom Dimension Readout — fades cleanly as camera zooms forward */}
      <div
        className="relative z-10 w-full max-w-[1440px] flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-white/60 transition-opacity duration-300"
        style={{ opacity: isZooming ? 0 : 1 }}
      >
        <span>15 × 14.7 × 27.5 CM</span>
        <span>3D MODELS + WLED PREVIEW</span>
      </div>
    </div>
  );
}
