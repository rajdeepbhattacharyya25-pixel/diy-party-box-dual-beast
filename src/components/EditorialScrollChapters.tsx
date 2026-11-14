import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLLAGE_BACKGROUND_NOTES,
  COLLAGE_CLOSING_STATEMENT,
  COLLAGE_PART_ITEMS,
  CollagePartItem,
  DesignedIn3DRevealState,
  SPEAKER_COMPONENTS_USED,
  SPLIT_COMPONENTS_BG_SRC,
  SPLIT_REVEAL_PHOTO_SRC,
  SplitSlideTransformState,
  getChapterBackgroundStyle,
  getCollageBackgroundNoteTransform,
  getCollageCanvasContainerState,
  getCollageClosingStatementState,
  getCustomSignatureProgress,
  getDesignedIn3DRevealState,
  getEditorialCollageItemTransform,
  getOpposingSplitState,
  getSignatureRevealState,
  getSplitScreenStageState,
} from '../kinetic/editorialStages';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import AcousticWaveCanvas from './AcousticWaveCanvas';
import CollagePlateMedia from './CollagePlateMedia';

interface ChapterVisibilityProps {
  timelinePos: number;
  sceneIndex: number;
  isVisible: boolean;
  isInteractive: boolean;
  viewportSize: { width: number; height: number };
}

/**
 * Shared edge-to-edge organic & cursor-responsive acoustic contour canvas
 * transitioning smoothly between dark Midnight Cobalt (#080C1E) and Architectural Ice (#F1F5FF).
 */
function ChapterTopographicBackdrop({
  tone,
  lightSurfaceBlend,
  scrollTimelinePos = 0,
  interactive = true,
}: {
  tone: 'dark-cobalt' | 'light-ice';
  lightSurfaceBlend?: number;
  scrollTimelinePos?: number;
  interactive?: boolean;
}) {
  return (
    <AcousticWaveCanvas
      tone={tone}
      lightSurfaceBlend={lightSurfaceBlend}
      scrollTimelinePos={scrollTimelinePos}
      interactive={interactive}
    />
  );
}

/**
 * True reference-faithful Cobalt Block-Wipe Reveal:
 * - Phase A (0.02..0.18): Solid Electric Cobalt (#3B5BFF) bar fills over the text bounds.
 * - Phase B (0.18..1.00): As scroll progresses, the text reveals cleanly left-to-right underneath
 *   while the solid Cobalt bar sweeps away to the right edge (and reverses cleanly on scroll up).
 */
function CobaltBlockRevealText({
  text,
  progress,
  className = '',
  style,
}: {
  text: string;
  progress: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const phaseAEnd = 0.18;

  const isBeforeStart = clamped <= 0.01;
  const isPhaseA = clamped > 0.01 && clamped < phaseAEnd;
  const isComplete = clamped >= 0.99;

  const revealT = isBeforeStart
    ? 0
    : isPhaseA
    ? 0
    : isComplete
    ? 1
    : (clamped - phaseAEnd) / (1 - phaseAEnd);

  const barScaleX = isBeforeStart
    ? 0
    : isPhaseA
    ? clamped / phaseAEnd
    : isComplete
    ? 0
    : Math.max(0, 1 - revealT);

  const barOrigin = isPhaseA ? 'left center' : 'right center';
  const unrevealedRightPct = Number(((1 - revealT) * 100).toFixed(2));

  return (
    <span className={`relative inline-block overflow-hidden align-baseline ${className}`} style={style}>
      <span
        className="inline-block"
        style={{
          opacity: isPhaseA || isBeforeStart ? 0 : 1,
          clipPath: isComplete ? undefined : `inset(0 ${unrevealedRightPct}% 0 0)`,
        }}
      >
        {text}
      </span>
      {barScaleX > 0.005 && (
        <span
          aria-hidden="true"
          data-testid="cobalt-reveal-cursor"
          className="pointer-events-none absolute inset-0 bg-[#2C3480] border border-[#93C5FD]/25"
          style={{
            transform: `scaleX(${barScaleX.toFixed(4)})`,
            transformOrigin: barOrigin,
          }}
        />
      )}
    </span>
  );
}

/**
 * Compact Rajdeep + M crown SVG signature rendered beneath the closing editorial story quote.
 */
function MiniRajdeepSignature({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      data-testid="mini-rajdeep-signature"
      viewBox="125 70 765 505"
      fill="none"
      className={className}
    >
      <path
        d="M 742 268 Q 450 342 156 422 C 138 427 140 436 164 432 Q 492 374 876 284"
        stroke="currentColor"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 168 560 C 220 480 282 374 336 260 C 362 246 404 246 400 278 C 396 312 356 340 312 354 C 324 380 350 398 384 380 C 398 370 410 356 398 354 C 386 352 382 378 396 378 C 408 378 418 364 422 356 C 424 366 432 362 438 352 C 422 384 402 414 388 434 C 406 410 432 378 452 348 C 462 340 474 340 468 354 C 460 366 446 368 446 354 C 452 340 488 316 516 282 C 504 310 484 342 484 352 C 492 356 506 340 514 328 C 506 322 496 342 508 346 C 520 348 534 332 542 320 C 534 314 524 334 536 336 C 554 336 576 308 594 286 C 604 276 618 282 612 302 C 606 320 578 338 562 338 C 546 366 526 396 512 412"
        stroke="currentColor"
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 458 426 Q 638 318 864 214"
        stroke="currentColor"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 437 332 L 440 329"
        stroke="currentColor"
        strokeWidth="13.5"
        strokeLinecap="round"
      />
      <path
        d="M 294 200 C 286 172 280 142 276 116 C 290 140 304 160 318 160 C 326 160 330 148 336 146 C 342 146 346 160 352 158 C 360 152 368 116 374 84 C 376 118 384 154 396 176"
        stroke="currentColor"
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 264 236 L 496 164 M 332 232 L 502 180"
        stroke="currentColor"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * CHAPTER 1 (Scene 02 · #signature-marquee)
 * Layered in the shared <main> stacking context around the zooming Hero speaker (z-20):
 * - z-10: Subtle counter-scrolling horizontal marquees & topographic contours behind the speaker
 * - z-30: Exact pen-order pure white handwritten "Rajdeep" + "M" crown + upward slashes over the speaker
 */
export function SignatureMarqueeChapter({
  timelinePos,
  sceneIndex,
  isVisible,
  isInteractive,
}: ChapterVisibilityProps) {
  if (!isVisible) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const state = getSignatureRevealState(timelinePos, sceneIndex);
  const sig = getCustomSignatureProgress(timelinePos, prefersReducedMotion);

  const normLen = 1000;
  const dashFor = (p: number) => Math.max(0, normLen * (1 - p));

  return (
    <section
      id="signature-marquee"
      aria-label="Chapter One: Speaker Zoom and Handwritten Signature"
      data-testid="scene-two-stage"
      className={`inset-0 overflow-hidden ${
        isInteractive ? '' : 'pointer-events-none'
      }`}
      style={{
        position: 'absolute',
      }}
    >
      {/* z-10 Backdrop: Subtle acoustic contours + counter-scrolling marquees BEHIND zooming Hero speaker */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
        style={{ opacity: state.maskOpacity }}
      >
        <ChapterTopographicBackdrop
          tone="dark-cobalt"
          scrollTimelinePos={timelinePos}
        />

        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 sm:gap-7 select-none overflow-hidden">
          <div
            data-testid="bg-marquee-top"
            className="whitespace-nowrap font-serif italic tracking-[-0.03em] text-white/[0.11] uppercase leading-none will-change-transform"
            style={{
              fontSize: 'clamp(3.2rem, min(8.2vw, 13vh), 9.4rem)',
              transform: `translate3d(${state.marqueeTopOffsetPx}px, 0, 0)`,
            }}
          >
            <div className="inline-flex w-max animate-bg-marquee-left will-change-transform">
              <span className="shrink-0 pr-12 sm:pr-16">
                HAND-BUILT STEREO &nbsp;·&nbsp; DIY PARTY BOX &nbsp;·&nbsp; HAND-BUILT STEREO &nbsp;·&nbsp; DIY PARTY BOX &nbsp;·&nbsp;
              </span>
              <span aria-hidden="true" className="shrink-0 pr-12 sm:pr-16">
                HAND-BUILT STEREO &nbsp;·&nbsp; DIY PARTY BOX &nbsp;·&nbsp; HAND-BUILT STEREO &nbsp;·&nbsp; DIY PARTY BOX &nbsp;·&nbsp;
              </span>
              <span aria-hidden="true" className="shrink-0 pr-12 sm:pr-16">
                HAND-BUILT STEREO &nbsp;·&nbsp; DIY PARTY BOX &nbsp;·&nbsp; HAND-BUILT STEREO &nbsp;·&nbsp; DIY PARTY BOX &nbsp;·&nbsp;
              </span>
            </div>
          </div>

          <div
            data-testid="bg-marquee-bottom"
            className="whitespace-nowrap font-display font-extrabold tracking-[-0.02em] text-[#93C5FD]/[0.14] uppercase leading-none will-change-transform"
            style={{
              fontSize: 'clamp(3rem, min(7.6vw, 12vh), 8.6rem)',
              transform: `translate3d(${state.marqueeBottomOffsetPx}px, 0, 0)`,
            }}
          >
            <div className="inline-flex w-max animate-bg-marquee-right will-change-transform">
              <span className="shrink-0 pr-12 sm:pr-16">
                ESP32 + WLED &nbsp;·&nbsp; PASSIVE RADIATORS &nbsp;·&nbsp; 6000 MAH BATTERY &nbsp;·&nbsp;
              </span>
              <span aria-hidden="true" className="shrink-0 pr-12 sm:pr-16">
                ESP32 + WLED &nbsp;·&nbsp; PASSIVE RADIATORS &nbsp;·&nbsp; 6000 MAH BATTERY &nbsp;·&nbsp;
              </span>
              <span aria-hidden="true" className="shrink-0 pr-12 sm:pr-16">
                ESP32 + WLED &nbsp;·&nbsp; PASSIVE RADIATORS &nbsp;·&nbsp; 6000 MAH BATTERY &nbsp;·&nbsp;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* z-30 Foreground: Pure White Upward-Slanted Handwritten "Rajdeep" Signature + Crown Overlapping Speaker */}
      {sig.isVisible && (
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          style={{ opacity: sig.opacity }}
        >
          <svg
            aria-hidden="true"
            data-testid="cobalt-signature-path"
            viewBox="0 0 1000 620"
            fill="none"
            className="pointer-events-none w-[min(86vw,960px)] max-h-[78vh] h-auto overflow-visible"
          >
            {/* 1. Diagonal cross-loop underline (enters upper-right, sweeps down-left around tip, slashes up-right) */}
            <path
              data-testid="sig-stroke-loop-slash"
              d="M 742 268 Q 450 342 156 422 C 138 427 140 436 164 432 Q 492 374 876 284"
              pathLength={normLen}
              stroke="#FFFFFF"
              strokeWidth="4.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={normLen}
              strokeDashoffset={dashFor(sig.loopSlash)}
              opacity={sig.loopSlash > 0.002 ? 0.96 : 0}
            />

            {/* 2. Tall upward-slanted R spine + bowl + legible cursive a-j-d-e-e-p + downward p stem */}
            <path
              data-testid="sig-stroke-rajdeep-main"
              d="M 168 560 C 220 480 282 374 336 260 C 362 246 404 246 400 278 C 396 312 356 340 312 354 C 324 380 350 398 384 380 C 398 370 410 356 398 354 C 386 352 382 378 396 378 C 408 378 418 364 422 356 C 424 366 432 362 438 352 C 422 384 402 414 388 434 C 406 410 432 378 452 348 C 462 340 474 340 468 354 C 460 366 446 368 446 354 C 452 340 488 316 516 282 C 504 310 484 342 484 352 C 492 356 506 340 514 328 C 506 322 496 342 508 346 C 520 348 534 332 542 320 C 534 314 524 334 536 336 C 554 336 576 308 594 286 C 604 276 618 282 612 302 C 606 320 578 338 562 338 C 546 366 526 396 512 412"
              pathLength={normLen}
              stroke="#FFFFFF"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={normLen}
              strokeDashoffset={dashFor(sig.rajdeepMain)}
              opacity={sig.rajdeepMain > 0.002 ? 1 : 0}
            />

            {/* 3. Dramatic upward-right return slash cutting cleanly across p toward upper-right */}
            <path
              data-testid="sig-stroke-flourish-tail"
              d="M 458 426 Q 638 318 864 214"
              pathLength={normLen}
              stroke="#FFFFFF"
              strokeWidth="4.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={normLen}
              strokeDashoffset={dashFor(sig.flourishTail)}
              opacity={sig.flourishTail > 0.002 ? 0.98 : 0}
            />

            {/* 4. Crisp pen dot over cursive j */}
            <path
              data-testid="sig-stroke-j-dot"
              d="M 437 332 L 440 329"
              pathLength={normLen}
              stroke="#FFFFFF"
              strokeWidth="6.2"
              strokeLinecap="round"
              strokeDasharray={normLen}
              strokeDashoffset={dashFor(sig.jDot)}
              opacity={sig.jDot > 0.002 ? 1 : 0}
            />

            {/* 5. Iconic M-shaped crown centered above Raj */}
            <path
              data-testid="sig-stroke-crown-m"
              d="M 294 200 C 286 172 280 142 276 116 C 290 140 304 160 318 160 C 326 160 330 148 336 146 C 342 146 346 160 352 158 C 360 152 368 116 374 84 C 376 118 384 154 396 176"
              pathLength={normLen}
              stroke="#FFFFFF"
              strokeWidth="5.0"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={normLen}
              strokeDashoffset={dashFor(sig.crownM)}
              opacity={sig.crownM > 0.002 ? 1 : 0}
            />

            {/* 6. Twin short parallel angled underlines beneath the M crown */}
            <path
              data-testid="sig-stroke-crown-underlines"
              d="M 264 236 L 496 164 M 332 232 L 502 180"
              pathLength={normLen}
              stroke="#FFFFFF"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={normLen}
              strokeDashoffset={dashFor(sig.crownUnderlines)}
              opacity={sig.crownUnderlines > 0.002 ? 0.96 : 0}
            />
          </svg>
        </div>
      )}
    </section>
  );
}

/**
 * FLOATING EDITORIAL COLLAGE (#part-collage)
 * Continuous non-grid horizontal editorial canvas inspired by landonorris.com:
 * - Multiple asymmetric multi-size photographs visible simultaneously, overlapping gently in depth
 * - Enters diagonally from the bottom-right corner as the Hero speaker shrinks & exits upper-left
 * - Pans smoothly right-to-left under vertical scroll with per-item X/Y speeds, scales, and Cobalt block text reveals
 * - Rises cleanly upward (-Y) as Inside CAD or Live WLED enters from the bottom edge
 */
export function FloatingPartCollageChapter({
  timelinePos,
  viewportSize,
  onModalOpenChange,
  onContinueToSplit,
}: Omit<ChapterVisibilityProps, 'sceneIndex' | 'isVisible' | 'isInteractive'> & {
  onModalOpenChange?: (isOpen: boolean) => void;
  onContinueToSplit?: () => void;
}) {
  const [selectedPart, setSelectedPart] = useState<CollagePartItem | null>(null);
  const [activeMobileIdx, setActiveMobileIdx] = useState<number>(0);
  const mobileDeckRef = useRef<HTMLDivElement | null>(null);
  const mobileCardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const scrollMobileCardIntoView = useCallback((index: number) => {
    const clampedIdx = Math.max(0, Math.min(COLLAGE_PART_ITEMS.length - 1, index));
    setActiveMobileIdx(clampedIdx);
    const cardEl = mobileCardRefs.current[clampedIdx];
    const deckEl = mobileDeckRef.current;
    if (!cardEl || !deckEl) return;
    const targetLeft =
      cardEl.offsetLeft - (deckEl.clientWidth - cardEl.clientWidth) * 0.5;
    deckEl.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, []);

  const handleMobileDeckScroll = useCallback(() => {
    const deckEl = mobileDeckRef.current;
    if (!deckEl) return;
    const deckCenter = deckEl.scrollLeft + deckEl.clientWidth * 0.5;
    let closestIdx = 0;
    let minDistance = Infinity;
    mobileCardRefs.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      const cardCenter = cardEl.offsetLeft + cardEl.clientWidth * 0.5;
      const dist = Math.abs(cardCenter - deckCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });
    setActiveMobileIdx(closestIdx);
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const canvasState = getCollageCanvasContainerState(
    timelinePos,
    viewportSize.height,
    prefersReducedMotion
  );
  const bgStyle = getChapterBackgroundStyle(timelinePos);
  const closingStatementState = getCollageClosingStatementState(
    timelinePos,
    viewportSize.width,
    viewportSize.height,
    prefersReducedMotion
  );

  useEffect(() => {
    onModalOpenChange?.(Boolean(selectedPart));
    return () => {
      onModalOpenChange?.(false);
    };
  }, [selectedPart, onModalOpenChange]);

  useEffect(() => {
    if (!canvasState.isInteractive && selectedPart) {
      setSelectedPart(null);
    }
  }, [canvasState.isInteractive, selectedPart]);

  useEffect(() => {
    if (!selectedPart) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSelectedPart(null);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [selectedPart]);

  if (!canvasState.isVisible) return null;

  return (
    <section
      id="part-collage"
      aria-label="Speaker Parts and Controls Guide"
      data-testid="scene-four-stage"
      className={`inset-0 overflow-hidden ${
        canvasState.isInteractive ? '' : 'pointer-events-none'
      }`}
      style={{
        position: 'absolute',
        opacity: canvasState.containerOpacity,
        transform: `translate3d(0px, ${canvasState.containerTranslateYPx}px, 0px)`,
      }}
    >
      <ChapterTopographicBackdrop
        tone={bgStyle.isLightSurface ? 'light-ice' : 'dark-cobalt'}
        lightSurfaceBlend={bgStyle.lightSurfaceBlend}
        scrollTimelinePos={timelinePos}
      />

      {/* Variable Background Field Architectural Typography ("Made it with MDF board" & "6000 mAh battery") */}
      <div
        aria-hidden="true"
        data-testid="collage-background-statements"
        className="hidden lg:block pointer-events-none select-none absolute inset-0 z-[4] overflow-hidden"
      >
        {COLLAGE_BACKGROUND_NOTES.map((note) => {
          const noteTf = getCollageBackgroundNoteTransform(
            note,
            timelinePos,
            viewportSize.width,
            viewportSize.height,
            prefersReducedMotion
          );
          if (
            !noteTf.isMounted ||
            noteTf.opacity <= 0.02 ||
            noteTf.xPx >= viewportSize.width - 8 ||
            noteTf.xPx < -viewportSize.width * 0.35
          ) {
            return null;
          }

          const headlineColor = bgStyle.isLightSurface
            ? 'rgba(44, 52, 128, 0.27)'
            : 'rgba(147, 197, 253, 0.28)';
          const eyebrowColor = bgStyle.isLightSurface
            ? 'rgba(9, 13, 31, 0.62)'
            : 'rgba(147, 197, 253, 0.78)';
          const subColor = bgStyle.isLightSurface
            ? 'rgba(44, 52, 128, 0.64)'
            : 'rgba(255, 255, 255, 0.62)';
          const ruleColor = bgStyle.isLightSurface
            ? 'rgba(44, 52, 128, 0.28)'
            : 'rgba(147, 197, 253, 0.34)';

          return (
            <div
              key={note.id}
              data-testid={note.id}
              className="absolute left-0 top-0 whitespace-nowrap"
              style={{
                opacity: noteTf.opacity,
                transform: `translate(${noteTf.xPx}px, ${noteTf.yPx}px)`,
              }}
            >
              <div
                className="font-mono text-[10px] tracking-[0.26em] uppercase mb-1.5"
                style={{ color: eyebrowColor }}
              >
                {note.eyebrow}
              </div>
              <div
                className="font-display font-extrabold leading-[0.94] tracking-[-0.035em]"
                style={{
                  fontSize: 'clamp(2.35rem, 3.8vw, 4.1rem)',
                  color: headlineColor,
                }}
              >
                {note.headline}
              </div>
              <div
                className="mt-2 pt-1.5 border-t font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: subColor, borderColor: ruleColor }}
              >
                {note.subSpec}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Continuous Horizontal Asymmetric Editorial Canvas */}
      <div
        data-testid="editorial-horizontal-canvas"
        className="hidden lg:block relative z-10 w-full h-full"
      >
        {COLLAGE_PART_ITEMS.map((item, idx) => {
          const tf = getEditorialCollageItemTransform(
            item,
            timelinePos,
            viewportSize.width,
            viewportSize.height,
            prefersReducedMotion
          );

          if (
            !tf.isMounted ||
            tf.opacity <= 0.01 ||
            tf.xPx >= viewportSize.width - 8 ||
            tf.xPx < -viewportSize.width * 0.42
          ) {
            return null;
          }

          const widthClass =
            item.sizeVariant === 'hero'
              ? 'w-[clamp(320px,25vw,470px)]'
              : item.sizeVariant === 'lg'
              ? 'w-[clamp(315px,25.5vw,465px)]'
              : item.sizeVariant === 'md'
              ? 'w-[clamp(245px,19.5vw,370px)]'
              : 'w-[clamp(195px,15.5vw,300px)]';

          const zOrderClass =
            item.parallaxSpeed > 1.15
              ? 'z-30'
              : item.parallaxSpeed > 1.0
              ? 'z-20'
              : 'z-10';

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`collage-part-${item.id}`}
              data-parallax-speed={item.parallaxSpeed}
              onClick={() => setSelectedPart(item)}
              aria-label={`Inspect ${item.partName}: ${item.featureSummary}`}
              className={`group absolute left-0 top-0 text-left focus-visible:outline-2 focus-visible:outline-[#3B5BFF] cursor-pointer ${widthClass} ${zOrderClass}`}
              style={{
                opacity: tf.opacity,
                transform: `translate(${tf.xPx}px, ${tf.yPx}px) scale(${tf.scale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Electric Cobalt Block-Chase Monospace Kicker Above Frame */}
              <div
                className="mb-2 text-[11px] font-mono uppercase tracking-[0.2em]"
                style={{ color: bgStyle.accentColor }}
              >
                <CobaltBlockRevealText
                  text={item.roleLabel}
                  progress={tf.textRevealProgress}
                />
              </div>

              {/* Studio / Blueprint / CAD Diagram Frame */}
              <div className="w-full [&>div]:max-h-[46vh]">
                <CollagePlateMedia
                  item={item}
                  isLightSurface={bgStyle.isLightSurface}
                  interactiveHover={true}
                  showExtendedAnnotations={true}
                />
              </div>

              {/* Independent Caption Placement: Closing Builder Quote + Signature vs Standard Component Note */}
              {item.isClosingStory ? (
                <div className="mt-4 pr-2">
                  <p
                    className="font-serif text-[clamp(1.05rem,1.45vw,1.5rem)] leading-[1.32] tracking-[-0.01em]"
                    style={{ color: bgStyle.inkColor }}
                  >
                    “{item.featureSummary}”
                  </p>
                  <div
                    className="mt-3 flex items-center justify-between gap-4"
                    style={{ color: bgStyle.inkColor }}
                  >
                    <MiniRajdeepSignature
                      className="w-[144px] h-auto"
                    />
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.16em] opacity-75 group-hover:opacity-100 transition-opacity"
                      style={{ color: bgStyle.accentColor }}
                    >
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`mt-2.5 flex items-start justify-between gap-3 ${
                    idx % 2 === 1 ? 'pl-1' : ''
                  }`}
                >
                  <div>
                    <div
                      className="text-sm xl:text-base font-semibold leading-tight group-hover:text-[#2C3480] transition-colors"
                      style={{ color: bgStyle.inkColor }}
                    >
                      <CobaltBlockRevealText
                        text={item.partName}
                        progress={tf.textRevealProgress}
                      />
                    </div>
                    <p
                      className="text-xs leading-snug mt-1 max-w-[38ch]"
                      style={{ color: bgStyle.mutedInkColor }}
                    >
                      {item.featureSummary}
                    </p>
                    {item.dimensionsSpec && (
                      <div
                        className="mt-1.5 text-[10px] font-mono uppercase tracking-[0.12em] tabular-nums"
                        style={{ color: bgStyle.accentColor }}
                      >
                        {item.dimensionsSpec}
                      </div>
                    )}
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100"
                    style={{ color: bgStyle.accentColor }}
                  />
                </div>
              )}
            </button>
          );
        })}

        {/* Closing 360° Home-Theater Stereo Statement in the Trailing Blank Canvas Section */}
        {closingStatementState.isMounted &&
          closingStatementState.opacity > 0.01 &&
          closingStatementState.xPx < viewportSize.width - 8 && (
            <div
              data-testid={COLLAGE_CLOSING_STATEMENT.id}
              data-reveal-progress={closingStatementState.revealProgress}
              className="pointer-events-none select-none absolute left-0 top-0 z-20 w-[clamp(360px,52vw,760px)]"
              style={{
                opacity: closingStatementState.opacity,
                transform: `translate(${closingStatementState.xPx}px, ${closingStatementState.yPx}px)`,
              }}
            >
              {/* Eyebrow Kicker with Electric Cobalt Block-Wipe Reveal */}
              <div
                className="mb-3.5 text-[11px] font-mono uppercase tracking-[0.22em]"
                style={{ color: bgStyle.accentColor }}
              >
                <CobaltBlockRevealText
                  text={COLLAGE_CLOSING_STATEMENT.eyebrow}
                  progress={closingStatementState.eyebrowRevealProgress}
                />
              </div>

              {/* Staggered Word-by-Word + Cobalt Sweep Bar Text Reveal Paragraph */}
              <p
                aria-label={COLLAGE_CLOSING_STATEMENT.text}
                data-testid="collage-closing-statement-text"
                className="font-serif font-normal text-[clamp(1.55rem,2.45vw,2.65rem)] leading-[1.24] tracking-[-0.015em] flex flex-wrap gap-x-[0.26em] gap-y-1.5"
              >
                {COLLAGE_CLOSING_STATEMENT.words.map((token) => {
                  const totalWords = COLLAGE_CLOSING_STATEMENT.words.length;
                  const wordStart = (token.index / totalWords) * 0.78;
                  const wordSpan = 0.22;
                  const rawWordT = Math.max(
                    0,
                    Math.min(1, (closingStatementState.revealProgress - wordStart) / wordSpan)
                  );
                  const wordT = rawWordT * rawWordT * (3 - 2 * rawWordT);
                  const liftY = Number(((1 - wordT) * 12).toFixed(1));
                  const wordOpacity = Number((0.12 + 0.88 * wordT).toFixed(3));
                  const showSweepBar = wordT > 0.04 && wordT < 0.92;
                  const sweepScaleX =
                    wordT < 0.45
                      ? wordT / 0.45
                      : (1 - wordT) / 0.55;

                  const revealedColor = token.isAccent
                    ? bgStyle.isLightSurface
                      ? '#2C3480'
                      : '#93C5FD'
                    : bgStyle.inkColor;

                  return (
                    <span
                      key={token.index}
                      data-testid={`closing-word-${token.index}`}
                      data-word-revealed={wordT >= 0.95 ? 'true' : 'false'}
                      className={`relative inline-block align-baseline pr-[0.06em] ${
                        token.isAccent ? 'italic font-medium' : ''
                      }`}
                      style={{
                        opacity: wordOpacity,
                        transform: `translateY(${liftY}px)`,
                        color: revealedColor,
                      }}
                    >
                      <span>{token.word}</span>
                      {showSweepBar && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-[#3B5BFF]/85"
                          style={{
                            transform: `scaleX(${Math.max(0, Math.min(1, sweepScaleX)).toFixed(3)})`,
                            transformOrigin:
                              wordT < 0.45 ? 'left center' : 'right center',
                          }}
                        />
                      )}
                    </span>
                  );
                })}
              </p>

              {/* Architectural Rule, Stereo Spec & Handwritten Rajdeep Signature */}
              <div
                className="mt-6 pt-4 border-t flex items-center justify-between gap-6"
                style={{
                  opacity: closingStatementState.footerRevealProgress,
                  transform: `translateY(${((1 - closingStatementState.footerRevealProgress) * 10).toFixed(1)}px)`,
                  borderColor: bgStyle.isLightSurface
                    ? 'rgba(44, 52, 128, 0.24)'
                    : 'rgba(147, 197, 253, 0.28)',
                  color: bgStyle.inkColor,
                }}
              >
                <span
                  className="font-mono text-[10.5px] tracking-[0.18em] uppercase"
                  style={{ color: bgStyle.accentColor }}
                >
                  {COLLAGE_CLOSING_STATEMENT.footerSpec}
                </span>
                <MiniRajdeepSignature className="w-[clamp(142px,12.5vw,178px)] h-auto shrink-0 opacity-95" />
              </div>
            </div>
          )}
      </div>

      {/* Tablet & Mobile Smooth Horizontal Snap-Swipe Parts Deck */}
      <div className="lg:hidden relative z-10 h-full flex flex-col justify-between pt-14 pb-4 overflow-hidden">
        {/* Clean Non-Wrapping Header & Compact Spec Line */}
        <div className="px-4 sm:px-6 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-[10px] font-mono uppercase tracking-[0.18em] truncate"
              style={{ color: bgStyle.accentColor }}
            >
              02 · PARTS &amp; CONTROLS
            </span>
            <span
              className="text-[11px] font-mono font-semibold tabular-nums shrink-0"
              style={{ color: bgStyle.accentColor }}
            >
              {String(activeMobileIdx + 1).padStart(2, '0')} /{' '}
              {String(COLLAGE_PART_ITEMS.length).padStart(2, '0')}
            </span>
          </div>
          <h2
            className="mt-1 font-display font-extrabold text-[1.4rem] sm:text-[1.75rem] leading-[1.08] tracking-[-0.03em]"
            style={{ color: bgStyle.inkColor }}
          >
            Inside the Build
          </h2>
          <p
            className="mt-1 font-mono text-[10.5px] tracking-[0.06em] uppercase truncate"
            style={{ color: bgStyle.mutedInkColor }}
          >
            15 × 14.7 × 27.5 cm MDF · 6000 mAh · Wireless L+R
          </p>
        </div>

        {/* Horizontal Snap-Swipe Card Deck */}
        <div className="flex-1 min-h-0 flex items-center py-2">
          <div
            ref={mobileDeckRef}
            onScroll={handleMobileDeckScroll}
            data-horizontal-swipe="true"
            data-testid="collage-mobile-scroll"
            className="no-scrollbar w-full flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-[7.5vw] sm:px-8 py-1.5 touch-pan-x"
          >
            {COLLAGE_PART_ITEMS.map((item, idx) => {
              const isCutout =
                item.diagramOverlay === 'three-quarter-dims' ||
                item.diagramOverlay === 'dual-passive-radiator';
              const isActive = idx === activeMobileIdx;

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    mobileCardRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => setSelectedPart(item)}
                  aria-label={`Inspect ${item.partName}: ${item.featureSummary}`}
                  className={`group snap-center shrink-0 w-[84vw] max-w-[340px] sm:w-[46vw] sm:max-w-[360px] rounded-2xl text-left overflow-hidden flex flex-col cursor-pointer transition-all duration-300 active:scale-[0.99] border ${
                    bgStyle.isLightSurface
                      ? 'bg-white/94 border-[#2C3480]/16 shadow-[0_14px_34px_rgba(9,13,31,0.09)]'
                      : 'bg-[#0C132C]/92 border-white/15 shadow-[0_16px_38px_rgba(0,0,0,0.45)]'
                  } ${isActive ? 'opacity-100 scale-100' : 'opacity-80 scale-[0.97]'}`}
                >
                  {/* Uniform Media Stage (preserves exact 4:3 alignment on CAD cutouts and prevents edge callout clipping) */}
                  <div
                    className={`relative w-full h-[28vh] min-h-[180px] max-h-[240px] shrink-0 overflow-hidden flex items-center justify-center ${
                      item.imageSurface === 'transparent'
                        ? 'bg-transparent p-2'
                        : isCutout
                        ? bgStyle.isLightSurface
                          ? 'bg-[#E8EEFE] p-2'
                          : 'bg-[#121B3D] p-2'
                        : item.imageSurface === 'paper'
                        ? 'bg-[#F4F7FF] p-1.5'
                        : 'bg-[#070B19]'
                    }`}
                  >
                    <CollagePlateMedia
                      item={item}
                      isLightSurface={bgStyle.isLightSurface}
                      interactiveHover={false}
                      showExtendedAnnotations={true}
                      borderless={true}
                      imageFit={
                        item.imageSurface === 'transparent' ||
                        item.id === 'rear-control-module' ||
                        item.id === 'touch-bluetooth-nfc'
                          ? 'contain'
                          : 'cover'
                      }
                      frameClassName={
                        isCutout
                          ? 'h-full aspect-[4/3] max-w-full'
                          : 'w-full h-full'
                      }
                    />
                  </div>

                  {/* Card Details */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <div
                        className="text-[9.5px] font-mono uppercase tracking-[0.16em] truncate"
                        style={{ color: bgStyle.accentColor }}
                      >
                        {item.roleLabel}
                      </div>
                      <div
                        className="mt-1 text-[15px] sm:text-base font-semibold leading-snug"
                        style={{ color: bgStyle.inkColor }}
                      >
                        {item.partName}
                      </div>
                      <p
                        className="mt-1 text-xs leading-relaxed line-clamp-2"
                        style={{ color: bgStyle.mutedInkColor }}
                      >
                        {item.featureSummary}
                      </p>
                    </div>

                    <div
                      className="pt-2 border-t flex items-center justify-between gap-2"
                      style={{
                        borderColor: bgStyle.isLightSurface
                          ? 'rgba(44, 52, 128, 0.12)'
                          : 'rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <span
                        className="text-[10px] font-mono uppercase tracking-[0.08em] truncate tabular-nums"
                        style={{ color: bgStyle.mutedInkColor }}
                      >
                        {item.dimensionsSpec ?? item.metric}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] shrink-0"
                        style={{ color: bgStyle.accentColor }}
                      >
                        <span>Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smooth Deck Controls + Continue Action */}
        <div className="px-4 sm:px-6 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Interactive Dot Indicators */}
            <div
              className="flex items-center gap-1"
              role="tablist"
              aria-label="Select speaker part card"
            >
              {COLLAGE_PART_ITEMS.map((item, idx) => {
                const selected = idx === activeMobileIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`Show ${item.partName}`}
                    onClick={() => scrollMobileCardIntoView(idx)}
                    className="h-7 px-1 flex items-center justify-center cursor-pointer"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        selected
                          ? bgStyle.isLightSurface
                            ? 'w-6 bg-[#2C3480]'
                            : 'w-6 bg-[#93C5FD]'
                          : bgStyle.isLightSurface
                          ? 'w-1.5 bg-[#2C3480]/25'
                          : 'w-1.5 bg-white/30'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Step Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollMobileCardIntoView(activeMobileIdx - 1)}
                disabled={activeMobileIdx === 0}
                aria-label="Previous part"
                data-testid="collage-mobile-prev-card"
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 active:scale-95 ${
                  bgStyle.isLightSurface
                    ? 'border-[#2C3480]/22 bg-white/85 text-[#090D1F]'
                    : 'border-white/20 bg-white/10 text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollMobileCardIntoView(activeMobileIdx + 1)}
                disabled={activeMobileIdx === COLLAGE_PART_ITEMS.length - 1}
                aria-label="Next part"
                data-testid="collage-mobile-next-card"
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 active:scale-95 ${
                  bgStyle.isLightSurface
                    ? 'border-[#2C3480]/22 bg-white/85 text-[#090D1F]'
                    : 'border-white/20 bg-white/10 text-white'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {onContinueToSplit && (
            <button
              type="button"
              onClick={onContinueToSplit}
              data-testid="collage-mobile-continue-btn"
              className="w-full py-2.5 px-4 rounded-xl border border-[#2C3480]/30 bg-[#2C3480] text-white font-mono text-[11px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
            >
              <span>Continue to 3D Drawings</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Accessible Part Detail & How-To-Use Modal */}
      {selectedPart && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedPart.partName} Details`}
          data-testid="collage-part-modal"
          className="fixed inset-0 z-50 bg-[#050816]/88 flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedPart(null)}
          onWheel={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-[820px] max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-none bg-[#F1F5FF] text-[#090D1F] border border-[#2C3480]/30 shadow-[0_36px_90px_rgba(5,8,22,0.5)] grid grid-cols-1 sm:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`sm:col-span-6 flex items-center justify-center p-3 sm:p-4 ${
                selectedPart.imageSurface === 'transparent'
                  ? 'bg-transparent border-b sm:border-b-0 sm:border-r border-[#090D1F]/12'
                  : 'bg-gradient-to-br from-[#5B6BA8] to-[#3B4A87]'
              }`}
            >
              <div className="w-full">
                <CollagePlateMedia
                  item={selectedPart}
                  isLightSurface={selectedPart.imageSurface === 'transparent'}
                  interactiveHover={false}
                  showExtendedAnnotations={true}
                />
              </div>
            </div>
            <div className="sm:col-span-6 p-4 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#2C3480]">
                    {selectedPart.roleLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPart(null)}
                    aria-label="Close part detail"
                    data-testid="close-collage-modal-btn"
                    className="w-8 h-8 flex items-center justify-center border border-[#090D1F]/20 hover:bg-[#2C3480] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl text-[#090D1F] mt-2 leading-tight">
                  {selectedPart.modalTitle ?? selectedPart.partName}
                </h3>

                <div className="mt-4 pt-4 border-t border-[#090D1F]/15 space-y-3 text-sm text-[#334155]">
                  {selectedPart.modalSections && selectedPart.modalSections.length > 0 ? (
                    selectedPart.modalSections.map((section) => (
                      <div key={section.heading}>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#2C3480] mb-1">
                          {section.heading}
                        </div>
                        {section.body && (
                          <p
                            className={
                              section.mono
                                ? 'font-mono text-xs text-[#090D1F] tabular-nums'
                                : 'leading-relaxed text-[#090D1F]'
                            }
                          >
                            {section.body}
                          </p>
                        )}
                        {section.bullets && section.bullets.length > 0 && (
                          <ul className="space-y-1.5 text-xs leading-relaxed text-[#090D1F]">
                            {section.bullets.map((bullet, bulletIdx) => (
                              <li key={bulletIdx} className="flex items-start gap-2">
                                <span
                                  aria-hidden="true"
                                  className="mt-1.5 w-1 h-1 rounded-full bg-[#3B5BFF] shrink-0"
                                />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#2C3480] mb-1">
                          Overview
                        </div>
                        <p className="leading-relaxed text-[#090D1F]">
                          {selectedPart.featureSummary}
                        </p>
                      </div>
                      {selectedPart.dimensionsSpec && (
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#2C3480] mb-1">
                            Dimensions
                          </div>
                          <p className="font-mono text-xs text-[#090D1F] tabular-nums">
                            {selectedPart.dimensionsSpec}
                          </p>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#2C3480] mb-1">
                          Details
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">
                          {selectedPart.functionNote}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#090D1F]/15 flex items-center justify-between gap-4 text-xs font-mono text-[#2C3480]">
                <span className="shrink-0">
                  {selectedPart.modalFooterLabel ?? 'NOTES'}
                </span>
                <span className="text-right">{selectedPart.metric}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface OpposingSplitChapterProps extends ChapterVisibilityProps {
  onOpen3DInspector: () => void;
  onOpenGallery?: () => void;
  onJumpToFinale: () => void;
  onRevealBalconyPhoto?: () => void;
  onBackToCadOutlines?: () => void;
}

/**
 * High-precision 3D-projected black technical outline drawing of the DIY Party Box Speaker
 * (15 × 14.7 × 27.5 cm MDF cabinet) angled at exact ±45° yaw so the Left and Right speakers
 * face at 45 degrees toward each other.
 * Preserves every real hardware detail:
 * - Upper Ø 7 cm Dynamic Driver with recessed MDF chamfer, rubber surround, 4 screw ears,
 *   conical diaphragm ribs, 3D protruding dust cap dome, and dual voice-coil lead glue prongs
 * - Middle 16-LED Addressable WLED Diffuser Ring with all 16 LED pixel cells & radial segments
 * - Lower Ø 5 cm Sub-Bass Woofer with deep 3D MDF bore recess, surround, cone & concave dust cap
 * - Side-wall Passive Radiator with recessed MDF port bore, 8 mounting screws, surround & flat plate
 * - Top recessed control/carry trench, L/R channel badge, rear protruding electronics module,
 *   and internal horizontal MDF baffle bracing ribs
 */
const Facing45SpeakerOutline = React.memo(function Facing45SpeakerOutline({
  side,
  className = '',
}: {
  side: 'left' | 'right';
  className?: string;
}) {
  const hw = 14.2; // 15.0 cm proportional half-width
  const hh = 27.0; // 27.5 cm proportional half-height
  const hd = 13.5; // 14.7 cm proportional half-depth
  const zFront = hd;
  const zBack = -hd;

  // Left speaker rotates +45° around Y (front baffle faces inward-right toward Right speaker)
  // Right speaker rotates -45° around Y (front baffle faces inward-left toward Left speaker)
  const yawDeg = side === 'left' ? 45 : -45;
  const yawRad = (yawDeg * Math.PI) / 180;
  const pitchRad = 0.18; // ~10.3° downward architectural elevation viewing top face, front baffle, and side wall

  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const cosX = Math.cos(pitchRad);
  const sinX = Math.sin(pitchRad);

  const cx = 160;
  const cy = 222;
  const scale = 6.0;
  const fov = 175;

  const p = (x: number, y: number, z: number): [number, number] => {
    const rx = x * cosY + z * sinY;
    const rz = -x * sinY + z * cosY;
    const ry = y * cosX + rz * sinX;
    const rz2 = -y * sinX + rz * cosX;
    const persp = fov / (fov - rz2);
    return [
      Number((cx + rx * scale * persp).toFixed(2)),
      Number((cy + ry * scale * persp).toFixed(2)),
    ];
  };

  const linePath = (
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
  ): string => {
    const [px1, py1] = p(x1, y1, z1);
    const [px2, py2] = p(x2, y2, z2);
    return `M ${px1} ${py1} L ${px2} ${py2}`;
  };

  const polyPath = (pts: Array<[number, number, number]>, close = true): string => {
    return (
      pts
        .map(([x, y, z], idx) => {
          const [px, py] = p(x, y, z);
          return `${idx === 0 ? 'M' : 'L'} ${px} ${py}`;
        })
        .join(' ') + (close ? ' Z' : '')
    );
  };

  const circleZPath = (
    cx3d: number,
    cy3d: number,
    cz3d: number,
    r: number,
    segments = 48,
    startAngle = 0,
    endAngle = Math.PI * 2
  ): string => {
    const parts: string[] = [];
    const fullCircle = Math.abs(endAngle - startAngle - Math.PI * 2) < 0.001;
    for (let i = 0; i <= segments; i++) {
      const theta = startAngle + (i / segments) * (endAngle - startAngle);
      const x = cx3d + Math.cos(theta) * r;
      const y = cy3d + Math.sin(theta) * r;
      const [px, py] = p(x, y, cz3d);
      parts.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
    }
    if (fullCircle) parts.push('Z');
    return parts.join(' ');
  };

  const circleXPath = (
    cx3d: number,
    cy3d: number,
    cz3d: number,
    r: number,
    segments = 40
  ): string => {
    const parts: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const y = cy3d + Math.sin(theta) * r;
      const z = cz3d + Math.cos(theta) * r;
      const [px, py] = p(cx3d, y, z);
      parts.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
    }
    parts.push('Z');
    return parts.join(' ');
  };

  // Visible outer side wall is x = -hw for Left speaker (+45° yaw) and x = +hw for Right speaker (-45° yaw)
  const visSideX = side === 'left' ? -hw : hw;
  const hiddenSideX = side === 'left' ? hw : -hw;
  const sideInwardSign = side === 'left' ? 1 : -1; // points from visSideX inward toward center of cabinet

  // Front driver coordinates (matching exact DIY Party Box proportions)
  const yUpper = -14.2;
  const rUpperCutout = 8.25;
  const rUpperSurroundOut = 7.75;
  const rUpperSurroundIn = 6.45;
  const rUpperDustCap = 2.85;

  const yRing = 2.3;
  const rRingOut = 7.15;
  const rRingIn = 4.65;
  const rRingMid = (rRingOut + rRingIn) * 0.5;

  const yLower = 16.8;
  const rLowerCutout = 6.1;
  const rLowerSurroundOut = 5.55;
  const rLowerSurroundIn = 4.45;
  const rLowerDustCap = 2.05;

  // Side passive radiator coordinates
  const yPassive = 10.2;
  const rPassiveCutout = 4.45;
  const rPassiveRing = 3.95;
  const rPassiveDiaphragm = 3.05;

  // Inner MDF wall inset
  const iw = hw - 1.65;
  const ih = hh - 1.65;
  const id = hd - 1.55;

  // Upper driver bore depth hatch ticks (along the visible outer-side arc of the MDF cutout)
  const upperHatchAngles: number[] = [];
  for (let i = 0; i < 11; i++) {
    const baseAngle = side === 'left' ? Math.PI : 0;
    const spread = ((i - 5) / 5) * (Math.PI * 0.48);
    upperHatchAngles.push(baseAngle + spread);
  }

  // Lower woofer deep bore hatch ticks
  const lowerHatchAngles: number[] = [];
  for (let i = 0; i < 9; i++) {
    const baseAngle = side === 'left' ? Math.PI : 0;
    const spread = ((i - 4) / 4) * (Math.PI * 0.48);
    lowerHatchAngles.push(baseAngle + spread);
  }

  // 16 WLED pixel cells & radial dividers
  const wledIndices = Array.from({ length: 16 }, (_, i) => i);

  // Conical diaphragm radial ribs for upper & lower drivers
  const upperConeAngles = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  const lowerConeAngles = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

  // 8 mounting screws around the side passive radiator bezel
  const passiveScrewAngles = Array.from(
    { length: 8 },
    (_, i) => (i / 8) * Math.PI * 2 + Math.PI / 8
  );

  // Rear upper protruding electronics module (peeking behind upper-back corner)
  const modX1 = side === 'left' ? -hw + 1.2 : hw - 8.2;
  const modX2 = side === 'left' ? -hw + 8.2 : hw - 1.2;
  const modY1 = -hh + 0.6;
  const modY2 = -hh + 9.2;
  const modZBack = zBack - 3.1;

  // 45° Toe-in reference baseline under the front baffle bottom edge
  const [frontBotInnerX, frontBotInnerY] = p(hiddenSideX, hh, zFront);
  const [frontBotOuterX, frontBotOuterY] = p(visSideX, hh, zFront);

  return (
    <svg
      viewBox="0 0 320 465"
      fill="none"
      role="img"
      aria-label={`${
        side === 'left' ? 'Left' : 'Right'
      } speaker technical drawing angled at 45 degrees`}
      data-testid={`speaker-outline-45-${side}`}
      data-yaw-deg={yawDeg}
      className={`w-full h-auto overflow-visible select-none ${className}`}
    >
      {/* Subtle Ground Contact Shadow Ellipse */}
      <ellipse
        cx="160"
        cy="420"
        rx="94"
        ry="14"
        fill="rgba(9, 13, 31, 0.05)"
      />

      {/* =====================================================================
          1. HIDDEN REAR CABINET EDGES & INTERNAL BRACING (Fine Dashed CAD Lines)
         ===================================================================== */}
      <g
        stroke="#090D1F"
        strokeOpacity="0.22"
        strokeWidth="0.9"
        strokeDasharray="3.5 3.2"
        strokeLinecap="round"
      >
        {/* Hidden vertical back-inner edge & 2 bottom back edges */}
        <path d={linePath(hiddenSideX, -hh, zBack, hiddenSideX, hh, zBack)} />
        <path d={linePath(visSideX, hh, zBack, hiddenSideX, hh, zBack)} />
        <path d={linePath(hiddenSideX, hh, zFront, hiddenSideX, hh, zBack)} />

        {/* Hidden opposite-wall passive radiator wireframe ghost */}
        <path d={circleXPath(hiddenSideX, yPassive, 0, rPassiveCutout, 28)} />

        {/* 2 Internal Horizontal MDF Baffle Bracing Ribs (between drivers & WLED ring) */}
        <path d={linePath(-iw, -4.8, zFront, iw, -4.8, zFront)} />
        <path d={linePath(-iw, -3.6, zFront, iw, -3.6, zFront)} />
        <path d={linePath(-iw, 8.9, zFront, iw, 8.9, zFront)} />
        <path d={linePath(-iw, 10.1, zFront, iw, 10.1, zFront)} />
      </g>

      {/* 8 Internal Baffle Corner & Bracing Mounting Bosses */}
      <g stroke="#090D1F" strokeOpacity="0.32" strokeWidth="0.85">
        {[-ih + 1.3, -4.2, 9.5, ih - 1.3].map((by, idx) => (
          <React.Fragment key={idx}>
            <path d={circleZPath(-hw + 1.15, by, zFront, 0.72, 12)} />
            <path d={circleZPath(hw - 1.15, by, zFront, 0.72, 12)} />
          </React.Fragment>
        ))}
      </g>

      {/* =====================================================================
          2. PROTRUDING REAR ELECTRONICS MODULE (Upper-Back Corner Silhouette)
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        <path
          d={polyPath([
            [modX1, modY1, zBack],
            [modX1, modY1, modZBack],
            [modX1, modY2, modZBack],
            [modX1, modY2, zBack],
          ])}
          fill="rgba(241, 245, 255, 0.75)"
          strokeWidth="1.25"
        />
        <path
          d={polyPath([
            [modX1, modY1, modZBack],
            [modX2, modY1, modZBack],
            [modX2, modY1, zBack],
            [modX1, modY1, zBack],
          ])}
          fill="rgba(241, 245, 255, 0.85)"
          strokeWidth="1.25"
        />
      </g>

      {/* =====================================================================
          3. VISIBLE 3D CABINET FACES (Top Wall, Visible Side Wall, Front Baffle)
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        {/* Top Face (y = -hh) */}
        <path
          d={polyPath([
            [-hw, -hh, zFront],
            [hw, -hh, zFront],
            [hw, -hh, zBack],
            [-hw, -hh, zBack],
          ])}
          fill="#F1F5FF"
          strokeWidth="2.15"
        />
        {/* Top Face MDF Wall Thickness Chamfer Inset */}
        <path
          d={polyPath([
            [-iw, -hh, id],
            [iw, -hh, id],
            [iw, -hh, -id],
            [-iw, -hh, -id],
          ])}
          strokeWidth="0.9"
          strokeOpacity="0.55"
        />

        {/* Top Recessed Handle / Access Trench (Top_Recessed_Panel) */}
        <path
          d={polyPath([
            [-5.6, -hh, -3.0],
            [5.6, -hh, -3.0],
            [5.6, -hh, 3.6],
            [-5.6, -hh, 3.6],
          ])}
          fill="rgba(9, 13, 31, 0.03)"
          strokeWidth="1.4"
        />
        <path
          d={polyPath([
            [-4.9, -hh + 0.65, -2.4],
            [4.9, -hh + 0.65, -2.4],
            [4.9, -hh + 0.65, 3.0],
            [-4.9, -hh + 0.65, 3.0],
          ])}
          strokeWidth="0.95"
          strokeOpacity="0.8"
        />
        {/* Capacitive Touch / NFC Sensor Target on Top Plate */}
        <path
          d={polyPath([
            [-1.8, -hh + 0.65, -0.8],
            [1.8, -hh + 0.65, -0.8],
            [1.8, -hh + 0.65, 1.4],
            [-1.8, -hh + 0.65, 1.4],
          ])}
          strokeWidth="0.85"
          strokeOpacity="0.6"
        />

        {/* Visible Outer Side Wall (x = visSideX) */}
        <path
          d={polyPath([
            [visSideX, -hh, zFront],
            [visSideX, -hh, zBack],
            [visSideX, hh, zBack],
            [visSideX, hh, zFront],
          ])}
          fill="#E8EEFF"
          strokeWidth="2.15"
        />
        {/* Side Wall Inner MDF Seam Inset */}
        <path
          d={polyPath([
            [visSideX, -ih, id],
            [visSideX, -ih, -id],
            [visSideX, ih, -id],
            [visSideX, ih, id],
          ])}
          strokeWidth="0.9"
          strokeOpacity="0.48"
        />

        {/* Front Baffle Face (z = zFront, angled at 45° facing opposite speaker) */}
        <path
          d={polyPath([
            [-hw, -hh, zFront],
            [hw, -hh, zFront],
            [hw, hh, zFront],
            [-hw, hh, zFront],
          ])}
          fill="#F1F5FF"
          strokeWidth="2.3"
        />
        {/* Front Baffle Inner MDF Wall Inset */}
        <path
          d={polyPath([
            [-iw, -ih, zFront],
            [iw, -ih, zFront],
            [iw, ih, zFront],
            [-iw, ih, zFront],
          ])}
          strokeWidth="1.05"
          strokeOpacity="0.62"
        />
        {/* Subtle Internal MDF Baffle Bracing Ribs & Mounting Bosses on Front Baffle */}
        <g strokeOpacity="0.28" strokeWidth="0.85" strokeDasharray="3.2 2.8">
          <path d={linePath(-iw, -4.8, zFront, iw, -4.8, zFront)} />
          <path d={linePath(-iw, -3.6, zFront, iw, -3.6, zFront)} />
          <path d={linePath(-iw, 8.9, zFront, iw, 8.9, zFront)} />
          <path d={linePath(-iw, 10.1, zFront, iw, 10.1, zFront)} />
        </g>
        <g strokeOpacity="0.38" strokeWidth="0.85">
          {[-ih + 1.3, -4.2, 9.5, ih - 1.3].map((by, idx) => (
            <React.Fragment key={idx}>
              <path d={circleZPath(-hw + 1.15, by, zFront, 0.72, 12)} />
              <path d={circleZPath(hw - 1.15, by, zFront, 0.72, 12)} />
            </React.Fragment>
          ))}
        </g>
      </g>

      {/* =====================================================================
          4. SIDE-WALL PASSIVE RADIATOR (Lower-Middle Section of Visible Side Wall)
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer MDF Side Cutout Bore */}
        <path
          d={circleXPath(visSideX, yPassive, 0, rPassiveCutout, 40)}
          fill="rgba(9, 13, 31, 0.03)"
          strokeWidth="1.8"
        />
        {/* 3D Recessed MDF Bore Inner Edge */}
        <path
          d={circleXPath(
            visSideX + sideInwardSign * 1.15,
            yPassive,
            0,
            rPassiveCutout,
            36
          )}
          strokeWidth="1.05"
          strokeOpacity="0.65"
        />
        {/* Passive Radiator Rubber Surround Ring */}
        <path
          d={circleXPath(
            visSideX + sideInwardSign * 0.55,
            yPassive,
            0,
            rPassiveRing,
            36
          )}
          strokeWidth="1.35"
        />
        {/* Flat Weighted Passive Diaphragm & Center Mass Ring */}
        <path
          d={circleXPath(
            visSideX + sideInwardSign * 0.85,
            yPassive,
            0,
            rPassiveDiaphragm,
            36
          )}
          fill="rgba(9, 13, 31, 0.04)"
          strokeWidth="1.45"
        />
        <path
          d={circleXPath(
            visSideX + sideInwardSign * 0.85,
            yPassive,
            0,
            rPassiveDiaphragm * 0.48,
            24
          )}
          strokeWidth="0.9"
          strokeOpacity="0.62"
        />
        {/* 8 Perimeter Mounting Screw Points on Passive Radiator Frame */}
        {passiveScrewAngles.map((theta, idx) => {
          const sy = yPassive + Math.sin(theta) * (rPassiveCutout - 0.28);
          const sz = Math.cos(theta) * (rPassiveCutout - 0.28);
          const [spx, spy] = p(visSideX + sideInwardSign * 0.2, sy, sz);
          return (
            <circle
              key={idx}
              cx={spx}
              cy={spy}
              r="1.35"
              fill="#090D1F"
            />
          );
        })}
      </g>

      {/* =====================================================================
          5. FRONT UPPER DYNAMIC DRIVER (Ø 7 cm Cutout, Cone, 3D Dome & Glue Leads)
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer MDF Cutout Bore (z = zFront) */}
        <path
          d={circleZPath(0, yUpper, zFront, rUpperCutout, 52)}
          fill="rgba(9, 13, 31, 0.03)"
          strokeWidth="2.0"
        />

        {/* Recessed MDF Cutout Chamfer Wall (z = zFront - 1.45) + 3D Depth Hatch Ticks */}
        <path
          d={circleZPath(0, yUpper, zFront - 1.45, rUpperCutout, 48)}
          strokeWidth="1.15"
          strokeOpacity="0.72"
        />
        {upperHatchAngles.map((theta, idx) => {
          const hx = Math.cos(theta) * rUpperCutout;
          const hy = yUpper + Math.sin(theta) * rUpperCutout;
          return (
            <path
              key={idx}
              d={linePath(hx, hy, zFront, hx, hy, zFront - 1.45)}
              strokeWidth="0.85"
              strokeOpacity="0.55"
            />
          );
        })}

        {/* 4 Diagonal Driver Mounting Ears + Screw Heads */}
        {[45, 135, 225, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const ex = Math.cos(rad) * (rUpperCutout + 1.05);
          const ey = yUpper + Math.sin(rad) * (rUpperCutout + 1.05);
          const [epx, epy] = p(ex, ey, zFront);
          return (
            <React.Fragment key={deg}>
              <path
                d={circleZPath(ex, ey, zFront, 0.85, 14)}
                strokeWidth="1.05"
              />
              <circle cx={epx} cy={epy} r="1.1" fill="#090D1F" />
            </React.Fragment>
          );
        })}

        {/* Upper Driver Rubber Half-Roll Surround (Outer & Inner Torus Rings) */}
        <path
          d={circleZPath(0, yUpper, zFront - 0.95, rUpperSurroundOut, 48)}
          strokeWidth="1.5"
        />
        <path
          d={circleZPath(0, yUpper, zFront - 1.15, rUpperSurroundIn, 48)}
          strokeWidth="1.45"
        />

        {/* Conical Paper Diaphragm Radial Ribs sloping inward to voice-coil neck */}
        {upperConeAngles.map((theta, idx) => {
          const xOut = Math.cos(theta) * rUpperSurroundIn;
          const yOut = yUpper + Math.sin(theta) * rUpperSurroundIn;
          const xIn = Math.cos(theta) * rUpperDustCap;
          const yIn = yUpper + Math.sin(theta) * rUpperDustCap;
          return (
            <path
              key={idx}
              d={linePath(
                xOut,
                yOut,
                zFront - 1.15,
                xIn,
                yIn,
                zFront - 2.65
              )}
              strokeWidth="0.75"
              strokeOpacity="0.34"
            />
          );
        })}
        {/* Mid-cone concentric acoustic ring */}
        <path
          d={circleZPath(0, yUpper, zFront - 1.9, (rUpperSurroundIn + rUpperDustCap) * 0.5, 40)}
          strokeWidth="0.8"
          strokeOpacity="0.38"
          strokeDasharray="2.5 2.5"
        />

        {/* 3D Protruding Spherical Center Dust Cap Dome */}
        <path
          d={circleZPath(0, yUpper, zFront - 2.6, rUpperDustCap, 36)}
          fill="rgba(241, 245, 255, 0.82)"
          strokeWidth="1.65"
        />
        <path
          d={circleZPath(0, yUpper, zFront - 1.5, rUpperDustCap * 0.72, 32)}
          strokeWidth="1.1"
          strokeOpacity="0.75"
        />
        <path
          d={circleZPath(0, yUpper, zFront - 0.85, rUpperDustCap * 0.36, 24)}
          strokeWidth="1.0"
          strokeOpacity="0.85"
        />

        {/* Signature Dual Voice-Coil Lead Glue Prongs below Upper Dust Cap */}
        <path
          d={polyPath([
            [-0.65, yUpper + 2.1, zFront - 1.7],
            [-1.25, yUpper + 2.1, zFront - 1.7],
            [-1.85, yUpper + 4.15, zFront - 1.95],
            [-1.15, yUpper + 4.15, zFront - 1.95],
          ])}
          fill="#090D1F"
          strokeWidth="1.1"
        />
        <path
          d={polyPath([
            [0.65, yUpper + 2.1, zFront - 1.7],
            [1.25, yUpper + 2.1, zFront - 1.7],
            [1.85, yUpper + 4.15, zFront - 1.95],
            [1.15, yUpper + 4.15, zFront - 1.95],
          ])}
          fill="#090D1F"
          strokeWidth="1.1"
        />
      </g>

      {/* =====================================================================
          6. MIDDLE ADDRESSABLE 16-LED WLED RING LIGHT (y = +2.3)
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        {/* Base Baffle Cutout Ring (z = zFront) */}
        <path
          d={circleZPath(0, yRing, zFront, rRingOut, 48)}
          strokeWidth="1.2"
          strokeOpacity="0.55"
        />
        {/* Raised Diffuser Outer & Inner Annular Rings (z = zFront + 0.35) */}
        <path
          d={circleZPath(0, yRing, zFront + 0.35, rRingOut, 52)}
          strokeWidth="2.0"
        />
        <path
          d={circleZPath(0, yRing, zFront + 0.35, rRingIn, 48)}
          strokeWidth="1.9"
        />
        <path
          d={circleZPath(0, yRing, zFront, rRingIn, 44)}
          strokeWidth="1.0"
          strokeOpacity="0.5"
        />

        {/* 16 Radial Pixel Cell Dividers & 16 Addressable SMD LED Outlines */}
        {wledIndices.map((idx) => {
          const segAngle = ((idx + 0.5) / 16) * Math.PI * 2;
          const ledAngle = (idx / 16) * Math.PI * 2;
          const sx1 = Math.cos(segAngle) * rRingIn;
          const sy1 = yRing + Math.sin(segAngle) * rRingIn;
          const sx2 = Math.cos(segAngle) * rRingOut;
          const sy2 = yRing + Math.sin(segAngle) * rRingOut;

          const lx = Math.cos(ledAngle) * rRingMid;
          const ly = yRing + Math.sin(ledAngle) * rRingMid;

          return (
            <React.Fragment key={idx}>
              <path
                d={linePath(sx1, sy1, zFront + 0.35, sx2, sy2, zFront + 0.35)}
                strokeWidth="0.75"
                strokeOpacity="0.45"
              />
              <path
                d={circleZPath(lx, ly, zFront + 0.38, 0.58, 12)}
                fill="rgba(9, 13, 31, 0.12)"
                strokeWidth="1.05"
              />
            </React.Fragment>
          );
        })}
      </g>

      {/* =====================================================================
          7. LOWER SUB-BASS WOOFER (Ø 5 cm Deeply Recessed Cutout, y = +16.8)
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer MDF Cutout Bore (z = zFront) */}
        <path
          d={circleZPath(0, yLower, zFront, rLowerCutout, 48)}
          fill="rgba(9, 13, 31, 0.03)"
          strokeWidth="1.95"
        />

        {/* Deeply Recessed MDF Bore Wall (z = zFront - 2.15) + 3D Depth Hatch Lines */}
        <path
          d={circleZPath(0, yLower, zFront - 2.15, rLowerCutout, 44)}
          strokeWidth="1.25"
          strokeOpacity="0.78"
        />
        {lowerHatchAngles.map((theta, idx) => {
          const hx = Math.cos(theta) * rLowerCutout;
          const hy = yLower + Math.sin(theta) * rLowerCutout;
          return (
            <path
              key={idx}
              d={linePath(hx, hy, zFront, hx, hy, zFront - 2.15)}
              strokeWidth="0.85"
              strokeOpacity="0.58"
            />
          );
        })}

        {/* 4 Diagonal Mounting Ears on Lower Woofer */}
        {[45, 135, 225, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const ex = Math.cos(rad) * (rLowerCutout + 0.88);
          const ey = yLower + Math.sin(rad) * (rLowerCutout + 0.88);
          return (
            <path
              key={deg}
              d={circleZPath(ex, ey, zFront, 0.68, 12)}
              strokeWidth="0.95"
            />
          );
        })}

        {/* Lower Woofer Rubber Surround Rings */}
        <path
          d={circleZPath(0, yLower, zFront - 1.75, rLowerSurroundOut, 44)}
          strokeWidth="1.4"
        />
        <path
          d={circleZPath(0, yLower, zFront - 1.95, rLowerSurroundIn, 40)}
          strokeWidth="1.35"
        />

        {/* Lower Conical Diaphragm Radial Lines */}
        {lowerConeAngles.map((theta, idx) => {
          const xOut = Math.cos(theta) * rLowerSurroundIn;
          const yOut = yLower + Math.sin(theta) * rLowerSurroundIn;
          const xIn = Math.cos(theta) * rLowerDustCap;
          const yIn = yLower + Math.sin(theta) * rLowerDustCap;
          return (
            <path
              key={idx}
              d={linePath(
                xOut,
                yOut,
                zFront - 1.95,
                xIn,
                yIn,
                zFront - 3.15
              )}
              strokeWidth="0.75"
              strokeOpacity="0.36"
            />
          );
        })}

        {/* Concave Molded Center Dust Cap with Raised Rim */}
        <path
          d={circleZPath(0, yLower, zFront - 2.95, rLowerDustCap, 32)}
          fill="rgba(241, 245, 255, 0.8)"
          strokeWidth="1.5"
        />
        <path
          d={circleZPath(0, yLower, zFront - 3.25, rLowerDustCap * 0.68, 28)}
          strokeWidth="1.05"
          strokeOpacity="0.78"
        />
      </g>

      {/* =====================================================================
          8. ARCHITECTURAL 45° AXIS VECTOR & CHANNEL DESIGNATION CALLOUTS
         ===================================================================== */}
      <g stroke="#090D1F" strokeLinecap="round" strokeLinejoin="round">
        {/* Horizontal ground reference dashed line & 45° toe-in baseline */}
        <line
          x1={frontBotOuterX}
          y1={frontBotOuterY + 14}
          x2={side === 'left' ? frontBotOuterX + 96 : frontBotOuterX - 96}
          y2={frontBotOuterY + 14}
          stroke="#090D1F"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <line
          x1={frontBotOuterX}
          y1={frontBotOuterY + 14}
          x2={frontBotInnerX}
          y2={frontBotInnerY + 14}
          stroke="#090D1F"
          strokeWidth="1.25"
        />
        <text
          x={side === 'left' ? frontBotOuterX + 42 : frontBotOuterX - 42}
          y={frontBotOuterY + 29}
          textAnchor="middle"
          fill="#090D1F"
          className="font-mono text-[10px] font-semibold tracking-[0.14em]"
        >
          45° {side === 'left' ? 'L →' : '← R'}
        </text>
      </g>
    </svg>
  );
});

interface SplitShearCopyLayerProps {
  kickerLines: string[];
  titleTop: string;
  titleBottomSerif: string;
  statusLine: string;
  clipHalf: 'left' | 'right';
  shearYPercent: number;
  ariaHidden?: boolean;
}

function SplitShearCopyLayer({
  kickerLines,
  titleTop,
  titleBottomSerif,
  statusLine,
  clipHalf,
  shearYPercent,
  ariaHidden = false,
}: SplitShearCopyLayerProps) {
  const clipClass =
    clipHalf === 'left'
      ? '[clip-path:inset(0_calc(50%_-_0.5px)_0_0)]'
      : '[clip-path:inset(0_0_0_50%)]';

  return (
    <div
      aria-hidden={ariaHidden ? 'true' : undefined}
      data-testid={`split-copy-${clipHalf}`}
      data-shear-y={shearYPercent}
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center -translate-y-10 sm:-translate-y-16 px-6 sm:px-12 text-center select-none [text-shadow:0_4px_20px_rgba(0,0,0,0.88)] ${clipClass}`}
      style={{
        transform: `translate3d(0px, ${shearYPercent}%, 0px)`,
      }}
    >
      <div className="flex flex-col gap-1 font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#93C5FD]">
        {kickerLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>

      <div className="my-3 sm:my-5 flex flex-col items-center leading-[0.88]">
        <span
          className="block whitespace-nowrap font-display font-extrabold uppercase tracking-[-0.035em] text-white"
          style={{
            fontSize: 'clamp(2.75rem, min(8.6vw, 13vh), 7.6rem)',
          }}
        >
          {titleTop}
        </span>
        <span
          className="block whitespace-nowrap font-serif italic font-normal tracking-[-0.025em] text-[#93C5FD] -mt-1 sm:-mt-2"
          style={{
            fontSize: 'clamp(3.0rem, min(9.4vw, 14vh), 8.2rem)',
          }}
        >
          {titleBottomSerif}
        </span>
      </div>

      <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/85">
        {statusLine}
      </div>
    </div>
  );
}

const DESIGNED_3D_HEADLINE_TOKENS: Array<{
  word: string;
  accent?: boolean;
}> = [
  { word: 'Designed' },
  { word: 'in' },
  { word: '3D.' },
  { word: 'Built', accent: true },
  { word: 'by', accent: true },
  { word: 'Hand.', accent: true },
];

function renderSlideCenterLockup({
  revealState,
  onOpen3DInspector,
  onOpenGallery,
  onRevealBalconyPhoto,
  onJumpToFinale,
  interactive,
}: {
  strokeTotal: number;
  strokeOffset: number;
  revealState: DesignedIn3DRevealState;
  onOpen3DInspector: () => void;
  onOpenGallery?: () => void;
  onRevealBalconyPhoto?: () => void;
  onJumpToFinale: () => void;
  interactive: boolean;
}) {
  const [col1Reveal, col2Reveal, col3Reveal] = revealState.columnReveals;
  const colBodyStyle = (t: number): React.CSSProperties => ({
    opacity: Number(Math.max(0.08, Math.min(1, (t - 0.12) / 0.72)).toFixed(3)),
    transform: `translate3d(0px, ${((1 - Math.max(0, Math.min(1, t))) * 10).toFixed(1)}px, 0px)`,
  });

  return (
      <div className="flex flex-col items-center text-center py-1.5 sm:py-6">
        <div
          data-testid={interactive ? 'designed-3d-eyebrow' : undefined}
          className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.22em] sm:tracking-[0.26em] text-[#2C3480] mb-1.5 sm:mb-3"
        >
          <CobaltBlockRevealText
            text="CABINET LAYOUT · 3D MODEL, WLED & FINISHED BUILD"
            progress={revealState.eyebrowReveal}
          />
        </div>

        <div className="relative w-full max-w-[680px]">
          <h2
            aria-label="Designed in 3D. Built by Hand."
            data-testid={interactive ? 'designed-3d-headline' : undefined}
            className="relative z-10 font-serif font-normal text-[#090D1F] leading-[0.98] tracking-[-0.03em] flex flex-wrap items-baseline justify-center gap-x-[0.22em]"
            style={{
              fontSize: 'clamp(2.0rem, min(3.7vw, 6.4vh), 4.4rem)',
            }}
          >
            {DESIGNED_3D_HEADLINE_TOKENS.map((tok, idx) => {
              const total = DESIGNED_3D_HEADLINE_TOKENS.length;
              const wStart = (idx / total) * 0.56;
              const wSpan = 0.44;
              const rawT = Math.max(
                0,
                Math.min(1, (revealState.headlineReveal - wStart) / wSpan)
              );
              const wordT = rawT * rawT * (3 - 2 * rawT);
              const showBar = wordT > 0.04 && wordT < 0.92;
              const scaleX =
                wordT < 0.45 ? wordT / 0.45 : (1 - wordT) / 0.55;

              return (
                <span
                  key={idx}
                  data-word-revealed={wordT >= 0.95 ? 'true' : 'false'}
                  className={`relative inline-block ${
                    tok.accent ? 'italic font-normal text-[#2C3480]' : ''
                  }`}
                  style={{
                    opacity: Number((0.08 + 0.92 * wordT).toFixed(3)),
                    transform: `translate3d(0px, ${((1 - wordT) * 14).toFixed(1)}px, 0px)`,
                  }}
                >
                  <span>{tok.word}</span>
                  {showBar && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[#3B5BFF]/85"
                      style={{
                        transform: `scaleX(${Math.max(0, Math.min(1, scaleX)).toFixed(3)})`,
                        transformOrigin:
                          wordT < 0.45 ? 'left center' : 'right center',
                      }}
                    />
                  )}
                </span>
              );
            })}
          </h2>
        </div>

        <div
          className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-[940px] text-left border-t border-[#090D1F]/15 pt-4 sm:pt-6"
          style={{
            borderColor: `rgba(9, 13, 31, ${(0.15 * revealState.dividerProgress).toFixed(3)})`,
          }}
        >
          <div style={colBodyStyle(col1Reveal)}>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#2C3480]">
              01 · THE 3D MODEL
            </div>
            <h3 className="text-base font-semibold text-[#090D1F] mt-1">
              <CobaltBlockRevealText
                text="Inspect the Speaker Cabinet"
                progress={col1Reveal}
              />
            </h3>
            <p className="text-xs sm:text-[13px] text-[#334155] leading-relaxed mt-1.5">
              Rotate both Left and Right speaker models to check the cabinet proportions, driver cutouts, and rear layout.
            </p>
            <button
              type="button"
              tabIndex={interactive ? 0 : -1}
              onClick={onOpen3DInspector}
              data-testid={interactive ? 'split-open-3d-btn' : undefined}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2C3480] hover:text-[#3B5BFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>OPEN 3D MODEL VIEWER ↗</span>
            </button>
          </div>

          <div style={colBodyStyle(col2Reveal)}>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#2C3480]">
              02 · WLED RGB LIGHTING
            </div>
            <h3 className="text-base font-semibold text-[#090D1F] mt-1">
              <CobaltBlockRevealText
                text="Custom Ring Colors & Effects"
                progress={col2Reveal}
              />
            </h3>
            <p className="text-xs sm:text-[13px] text-[#334155] leading-relaxed mt-1.5">
              Each speaker has a 16-LED ring driven by an ESP32 running WLED. You can also test colors and effects in WLED Studio from the opening screen.
            </p>
            <p className="text-[11px] text-[#64748B] italic mt-1">
              WLED Studio is a browser simulation only—it does not connect to physical hardware.
            </p>
            <button
              type="button"
              tabIndex={interactive ? 0 : -1}
              onClick={onRevealBalconyPhoto ?? onJumpToFinale}
              data-testid={interactive ? 'split-jump-wled-btn' : undefined}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2C3480] hover:text-[#3B5BFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>SEE THE LIT-UP PAIR ↓</span>
            </button>
          </div>

          <div style={colBodyStyle(col3Reveal)}>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#2C3480]">
              03 · THE FINISHED PAIR
            </div>
            <h3 className="text-base font-semibold text-[#090D1F] mt-1">
              <CobaltBlockRevealText
                text="Two Matched Stereo Cabinets"
                progress={col3Reveal}
              />
            </h3>
            <p className="text-xs sm:text-[13px] text-[#334155] leading-relaxed mt-1.5">
              Finished in matte textured wrap with front RGB rings, Ø 7 cm and Ø 5 cm front drivers, and side passive radiators.
            </p>
            <button
              type="button"
              tabIndex={interactive ? 0 : -1}
              onClick={onOpenGallery ?? onJumpToFinale}
              data-testid={interactive ? 'split-jump-finale-btn' : undefined}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2C3480] hover:text-[#3B5BFF] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>VISIT GALLERY ↗</span>
            </button>
          </div>
        </div>
    </div>
  );
}

function SplitComponentsUsedShearLayer({
  clipHalf,
  shearYPercent,
  ariaHidden = false,
}: {
  clipHalf: 'left' | 'right';
  shearYPercent: number;
  ariaHidden?: boolean;
}) {
  const clipClass =
    clipHalf === 'left'
      ? '[clip-path:inset(0_calc(50%_-_0.5px)_0_0)]'
      : '[clip-path:inset(0_0_0_50%)]';

  return (
    <div
      aria-hidden={ariaHidden ? 'true' : undefined}
      data-testid={`split-components-copy-${clipHalf}`}
      data-shear-y={shearYPercent}
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 sm:px-10 md:px-14 pt-9 pb-20 sm:py-14 select-none [text-shadow:0_2px_14px_rgba(0,0,0,0.9)] ${clipClass}`}
      style={{
        transform: `translate3d(0px, ${shearYPercent}%, 0px)`,
      }}
    >
      <div className="w-full max-w-[1440px] mx-auto flex flex-col items-center">
        {/* Top Engineering Eyebrow */}
        <div
          data-testid={!ariaHidden ? 'components-eyebrow' : undefined}
          className="font-mono text-[8.5px] sm:text-[11px] font-normal uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#93C5FD]/90 text-center"
        >
          03 / PARTS LIST · 16 HARDWARE COMPONENTS
        </div>

        {/* Center-Seam Split-Shear Engineering Heading */}
        <div
          data-testid={!ariaHidden ? 'components-heading' : undefined}
          className="mt-0.5 sm:mt-1.5 mb-1.5 sm:mb-5 flex flex-wrap items-baseline justify-center gap-x-2 sm:gap-x-3.5 leading-[0.94] text-center"
        >
          <span
            className="font-display font-extrabold tracking-[-0.03em] text-white"
            style={{
              fontSize: 'clamp(1.35rem, min(4.8vw, 6.8vh), 4.2rem)',
            }}
          >
            Inside
          </span>
          <span
            className="font-serif italic font-normal tracking-[-0.02em] text-[#93C5FD]"
            style={{
              fontSize: 'clamp(1.5rem, min(5.2vw, 7.4vh), 4.6rem)',
            }}
          >
            the Speaker
          </span>
        </div>

        {/* 16-Item Hardware Breakdown Grid */}
        <div
          data-testid={!ariaHidden ? 'components-used-grid' : undefined}
          className="w-full grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2.5 text-left"
        >
          {SPEAKER_COMPONENTS_USED.map((item) => (
            <div
              key={item.indexLabel}
              data-testid={!ariaHidden ? `component-item-${item.indexLabel}` : undefined}
              className="rounded-lg border border-[#93C5FD]/15 bg-[#080D22]/85 px-2 py-1.5 sm:px-3.5 sm:py-2.5 flex flex-col justify-start"
            >
              <div className="font-mono text-[7px] sm:text-[10px] font-normal uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#93C5FD]/85 tabular-nums truncate">
                {item.indexLabel} · {item.category}
              </div>
              <div className="mt-0.5 sm:mt-1 font-sans text-[10px] sm:text-[13.5px] font-semibold text-white leading-[1.15] sm:leading-snug tracking-[-0.01em] line-clamp-2 sm:line-clamp-none">
                {item.name}
              </div>
              <div className="mt-0.5 font-sans text-[8.5px] sm:text-[11.5px] font-normal text-slate-300/75 leading-[1.15] sm:leading-snug truncate sm:whitespace-normal">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SplitIncomingColumn({
  side,
  slide1,
  slide2,
  slide2VeilOpacity,
}: {
  side: 'left' | 'right';
  slide1: SplitSlideTransformState;
  slide2: SplitSlideTransformState;
  slide2VeilOpacity: number;
  slide2CenterCopyOpacity?: number;
  slide2CenterCopyLiftYPx?: number;
  slide2PhotoScale?: number;
}) {
  const isLeft = side === 'left';
  const s1MaskY = isLeft ? slide1.leftMaskYPercent : slide1.rightMaskYPercent;
  const s1InnerY = isLeft ? slide1.leftInnerYPercent : slide1.rightInnerYPercent;
  const s2MaskY = isLeft ? slide2.leftMaskYPercent : slide2.rightMaskYPercent;
  const s2InnerY = isLeft ? slide2.leftInnerYPercent : slide2.rightInnerYPercent;

  return (
    <div
      aria-hidden={!isLeft ? 'true' : undefined}
      data-testid={`split-column-${side}`}
      className={`pointer-events-none absolute top-0 h-full w-1/2 overflow-hidden ${
        isLeft ? 'left-0' : 'left-1/2'
      }`}
    >
      {/* 200%-wide inner stage pulled back on the right so both halves register pixel-for-pixel across the 50% cut */}
      <div
        className={`absolute top-0 h-full w-[200%] ${
          isLeft ? 'left-0' : '-left-full'
        }`}
      >
        {/* ===============================================================
            SLIDE 1: FESTIVE BALCONY RGB SPEAKER DUO
            (/assets/aistudio/RGB_Speaker_Duo_on_a_Festive_Balcony_Desk_016b6e98.png)
           =============================================================== */}
        {slide1.isVisible && (
          <article
            data-testid={`split-slide-1-mask-${side}`}
            data-mask-y={s1MaskY}
            className="absolute inset-0 m-0 overflow-hidden"
            style={{
              transform: `translate3d(0px, ${s1MaskY}%, 0px)`,
            }}
          >
            <div
              data-testid={`split-slide-1-inner-${side}`}
              data-inner-y={s1InnerY}
              className="absolute inset-0"
              style={{
                transform: `translate3d(0px, ${s1InnerY}%, 0px)`,
              }}
            >
              {/* Overscanned Full-Bleed Balcony Photograph */}
              <div className="absolute inset-0 overflow-hidden bg-[#050816]">
                <div
                  data-testid={`split-slide-1-photo-${side}`}
                  className="absolute inset-x-0 -inset-y-[16%] flex"
                  style={{
                    transform: `translate3d(0px, ${slide1.photoDriftYPercent}%, 0px)`,
                  }}
                >
                  <img
                    src={SPLIT_REVEAL_PHOTO_SRC}
                    alt={
                      isLeft
                        ? 'Matched Left and Right DIY Party Box RGB speakers angled at 45 degrees on a festive balcony desk at night'
                        : ''
                    }
                    decoding="async"
                    loading="lazy"
                    draggable={false}
                    data-testid={isLeft ? 'revealed-balcony-duo-photo' : undefined}
                    className="h-full w-full object-cover object-center select-none"
                  />
                </div>
              </div>

              {/* Balanced Scrim keeping RGB rings & warm balcony lights vivid behind LIVING LIGHT / Balcony Duo */}
              <div
                data-testid={isLeft ? 'split-slide-1-veil' : undefined}
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(120% 90% at 50% 50%, rgba(0, 0, 0, 0.14) 30%, rgba(5, 8, 22, 0.56) 100%), rgba(5, 8, 22, ${slide2VeilOpacity})`,
                }}
              />

              {/* Subtle Top & Bottom Edge Protection Gradient for Edge Metadata */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(5,8,22,0.68) 0%, rgba(5,8,22,0) 16%, rgba(5,8,22,0) 80%, rgba(5,8,22,0.82) 100%)',
                }}
              />

              {/* Split-Shear Copy Block ("LIVING LIGHT / Balcony Duo"):
                  Shears into alignment during Wipe 1, then shears apart during Wipe 2 */}
              <div
                data-testid={isLeft ? 'split-slide-1-center-copy' : undefined}
                className="absolute inset-0"
                style={{
                  transform: `translate3d(0px, ${slide1.textDriftYPercent}%, 0px)`,
                }}
              >
                <SplitShearCopyLayer
                  kickerLines={[
                    'WIRELESS RGB STEREO',
                    '16-LED RING PER SPEAKER',
                  ]}
                  titleTop="NIGHT LIGHT"
                  titleBottomSerif="Balcony Setup"
                  statusLine="45° STEREO PLACEMENT · FINISHED PAIR"
                  clipHalf="left"
                  shearYPercent={slide1.textLeftShearYPercent}
                  ariaHidden={!isLeft}
                />
                <SplitShearCopyLayer
                  kickerLines={[
                    'WIRELESS RGB STEREO',
                    '16-LED RING PER SPEAKER',
                  ]}
                  titleTop="NIGHT LIGHT"
                  titleBottomSerif="Balcony Setup"
                  statusLine="45° STEREO PLACEMENT · FINISHED PAIR"
                  clipHalf="right"
                  shearYPercent={slide1.textRightShearYPercent}
                  ariaHidden={true}
                />
              </div>
            </div>
          </article>
        )}

        {/* ===============================================================
            SLIDE 2: SECOND SPLIT-SCREEN ANIMATION — "COMPONENTS USED"
            (16 Internal Hardware, Power, Wireless & Acoustic Parts)
           =============================================================== */}
        {slide2.isVisible && (
          <article
            data-testid={`split-slide-2-mask-${side}`}
            data-mask-y={s2MaskY}
            className="absolute inset-0 m-0 overflow-hidden"
            style={{
              transform: `translate3d(0px, ${s2MaskY}%, 0px)`,
            }}
          >
            <div
              data-testid={`split-slide-2-inner-${side}`}
              data-inner-y={s2InnerY}
              className="absolute inset-0"
              style={{
                transform: `translate3d(0px, ${s2InnerY}%, 0px)`,
              }}
            >
              {/* Overscanned Internal Components Hardware Backdrop */}
              <div className="absolute inset-0 overflow-hidden bg-[#050816]">
                <div
                  data-testid={`split-slide-2-photo-${side}`}
                  className="absolute inset-x-0 -inset-y-[16%] flex"
                  style={{
                    transform: `translate3d(0px, ${slide2.photoDriftYPercent}%, 0px)`,
                  }}
                >
                  <img
                    src={SPLIT_COMPONENTS_BG_SRC}
                    alt={
                      isLeft
                        ? 'Internal DIY Party Box speaker electronics, wiring harness, amplifier, and battery pack'
                        : ''
                    }
                    decoding="async"
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover object-center opacity-35 select-none"
                  />
                </div>
              </div>

              {/* Architectural Deep Cobalt-Obsidian Blueprint Scrim */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(110% 90% at 50% 50%, rgba(12, 20, 52, 0.78) 0%, rgba(5, 8, 22, 0.94) 100%)',
                }}
              />

              {/* Split-Shear "COMPONENTS / Used Inside" + 16-Item Bill of Materials Grid */}
              <div
                data-testid={isLeft ? 'split-slide-2-components-stage' : undefined}
                className="absolute inset-0"
                style={{
                  transform: `translate3d(0px, ${slide2.textDriftYPercent}%, 0px)`,
                }}
              >
                <SplitComponentsUsedShearLayer
                  clipHalf="left"
                  shearYPercent={slide2.textLeftShearYPercent}
                  ariaHidden={!isLeft}
                />
                <SplitComponentsUsedShearLayer
                  clipHalf="right"
                  shearYPercent={slide2.textRightShearYPercent}
                  ariaHidden={true}
                />
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

/**
 * CHAPTER 4 / 5 (Scene 05 · #opposing-split -> #stereo-reveal)
 * Starts with the Left (+45°) and Right (-45°) Black Outline Speakers Facing Each Other
 * on Cool Architectural Ice (#F1F5FF), then drives a 3-slide Split-Screen Counter-Wipe &
 * Center-Seam Typography Shear animation (Left column wiping UP from below, Right column
 * wiping DOWN from above, center headlines shearing along the 50% vertical seam) that
 * culminates in the full, unobstructed reveal of the Festive Balcony RGB Speaker Duo photo.
 */
export function OpposingSplitChapter({
  timelinePos,
  sceneIndex,
  isVisible,
  isInteractive,
  viewportSize,
  onOpen3DInspector,
  onOpenGallery,
  onJumpToFinale,
  onRevealBalconyPhoto,
  onBackToCadOutlines,
}: OpposingSplitChapterProps) {
  if (!isVisible) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const state = getOpposingSplitState(
    timelinePos,
    sceneIndex,
    viewportSize.width,
    viewportSize.height
  );
  const splitState = getSplitScreenStageState(timelinePos, prefersReducedMotion);
  const revealState = getDesignedIn3DRevealState(
    timelinePos,
    prefersReducedMotion
  );

  const strokeTotal = 680;
  const strokeOffset = Math.max(
    0,
    strokeTotal * (1 - state.brushStrokeProgress)
  );
  const isBaseCadInteractive = isInteractive && splitState.wipe1Progress < 0.12;
  const isBalconyRevealInteractive =
    isInteractive && splitState.wipe2Progress > 0.65;

  return (
    <section
      id="opposing-split"
      aria-label="Chapter Four: Technical Drawings, Finished Pair, and Parts List"
      data-testid="scene-five-stage"
      data-split-overall-progress={splitState.overallProgress}
      data-split-wipe1={splitState.wipe1Progress}
      data-split-wipe2={splitState.wipe2Progress}
      data-photo-reveal={splitState.photoRevealProgress}
      className={`inset-0 flex items-center justify-center overflow-hidden ${
        isInteractive ? '' : 'pointer-events-none'
      }`}
      style={{
        position: 'absolute',
        opacity: state.centerOpacity,
        transform: `translate3d(0px, ${state.containerTranslateY}px, 0px)`,
      }}
    >
      {/* =====================================================================
          SLIDE 0 (BASE STAGE): TWO 45° BLACK OUTLINE SPEAKERS FACING EACH OTHER
          ON COOL ARCHITECTURAL ICE (#F1F5FF)
         ===================================================================== */}
      {splitState.slide0.isVisible && (
        <div
          data-testid="split-slide-0-stage"
          data-mobile-scroll-region={isBaseCadInteractive ? 'true' : undefined}
          className={`absolute inset-0 bg-[#F1F5FF] flex items-start lg:items-center justify-center max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:touch-pan-y px-4 py-5 sm:px-10 lg:px-12 lg:py-0 ${
            isBaseCadInteractive ? '' : 'pointer-events-none'
          }`}
        >
          <ChapterTopographicBackdrop
            tone="light-ice"
            scrollTimelinePos={timelinePos}
          />

          {/* 45° Left & Right Black Outline Speakers (drifting together in Y during Wipe 1) */}
          <div
            className="relative z-10 w-full max-w-[1680px] mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-3 lg:gap-6"
            style={{
              transform: `translate3d(0px, ${splitState.slide0.photoDriftYPercent}%, 0px)`,
            }}
          >
            {/* LEFT SPEAKER: 45° CAD VIEW */}
            <div
              data-testid="opposing-split-left"
              className="hidden lg:flex lg:col-span-3 flex-col items-center justify-center gap-2"
              style={{
                transform: `translate3d(${state.leftX}px, 0, 0)`,
              }}
            >
              <div className="w-[clamp(220px,22vw,340px)] max-h-[70vh] flex items-center justify-center">
                <Facing45SpeakerOutline side="left" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#090D1F]/80">
                LEFT SPEAKER · 45° VIEW
              </div>
            </div>

            {/* Spacer for Center Column when shearing copy is active */}
            <div className="lg:col-span-6">
              {/* Mobile / Tablet Compact 45° Facing Outline Pair */}
              <div className="flex lg:hidden items-center justify-center gap-3 w-full max-w-[240px] sm:max-w-[340px] mx-auto mb-1 sm:mb-3">
                <div className="w-1/2">
                  <Facing45SpeakerOutline side="left" />
                </div>
                <div className="w-1/2">
                  <Facing45SpeakerOutline side="right" />
                </div>
              </div>

              {/* When at rest (wipe1Progress <= 0.001), render single unclipped accessible center lockup */}
              {splitState.wipe1Progress <= 0.001 ? (
                renderSlideCenterLockup({
                  strokeTotal,
                  strokeOffset,
                  revealState,
                  onOpen3DInspector,
                  onOpenGallery,
                  onRevealBalconyPhoto,
                  onJumpToFinale,
                  interactive: true,
                })
              ) : (
                <div className="invisible pointer-events-none" aria-hidden="true">
                  {renderSlideCenterLockup({
                    strokeTotal,
                    strokeOffset,
                    revealState,
                    onOpen3DInspector,
                    onOpenGallery,
                    onRevealBalconyPhoto,
                    onJumpToFinale,
                    interactive: false,
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SPEAKER: 45° CAD VIEW */}
            <div
              data-testid="opposing-split-right"
              className="hidden lg:flex lg:col-span-3 flex-col items-center justify-center gap-2"
              style={{
                transform: `translate3d(${state.rightX}px, 0, 0)`,
              }}
            >
              <div className="w-[clamp(220px,22vw,340px)] max-h-[70vh] flex items-center justify-center">
                <Facing45SpeakerOutline side="right" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#090D1F]/80">
                RIGHT SPEAKER · 45° VIEW
              </div>
            </div>
          </div>

          {/* When Wipe 1 is actively scrubbing (wipe1Progress > 0.001), split Slide 0's center copy
              along the exact 50% vertical midline so Left & Right halves shear in opposite directions */}
          {splitState.wipe1Progress > 0.001 && (
            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                transform: `translate3d(0px, ${splitState.slide0.textDriftYPercent}%, 0px)`,
              }}
            >
              <div
                data-testid="slide-0-shear-left"
                className="absolute inset-0 flex items-center justify-center px-4 sm:px-10 lg:px-12 [clip-path:inset(0_calc(50%_-_0.5px)_0_0)]"
                style={{
                  transform: `translate3d(0px, ${splitState.slide0.textLeftShearYPercent}%, 0px)`,
                }}
              >
                <div className="w-full max-w-[680px]">
                  {renderSlideCenterLockup({
                    strokeTotal,
                    strokeOffset,
                    revealState,
                    onOpen3DInspector,
                    onOpenGallery,
                    onRevealBalconyPhoto,
                    onJumpToFinale,
                    interactive: false,
                  })}
                </div>
              </div>
              <div
                aria-hidden="true"
                data-testid="slide-0-shear-right"
                className="absolute inset-0 flex items-center justify-center px-4 sm:px-10 lg:px-12 [clip-path:inset(0_0_0_50%)]"
                style={{
                  transform: `translate3d(0px, ${splitState.slide0.textRightShearYPercent}%, 0px)`,
                }}
              >
                <div className="w-full max-w-[680px]">
                  {renderSlideCenterLockup({
                    strokeTotal,
                    strokeOffset,
                    revealState,
                    onOpen3DInspector,
                    onOpenGallery,
                    onRevealBalconyPhoto,
                    onJumpToFinale,
                    interactive: false,
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          DUAL 50%-WIDE COUNTER-WIPING COLUMNS (SLIDE 1 & SLIDE 2 BALCONY REVEAL)
         ===================================================================== */}
      {(splitState.slide1.isVisible || splitState.slide2.isVisible) && (
        <div
          data-testid="split-screen-columns-stage"
          className="pointer-events-none absolute inset-0 z-30"
        >
          <SplitIncomingColumn
            side="left"
            slide1={splitState.slide1}
            slide2={splitState.slide2}
            slide2VeilOpacity={splitState.slide2VeilOpacity}
            slide2CenterCopyOpacity={splitState.slide2CenterCopyOpacity}
            slide2CenterCopyLiftYPx={splitState.slide2CenterCopyLiftYPx}
            slide2PhotoScale={splitState.slide2PhotoScale}
          />
          <SplitIncomingColumn
            side="right"
            slide1={splitState.slide1}
            slide2={splitState.slide2}
            slide2VeilOpacity={splitState.slide2VeilOpacity}
            slide2CenterCopyOpacity={splitState.slide2CenterCopyOpacity}
            slide2CenterCopyLiftYPx={splitState.slide2CenterCopyLiftYPx}
            slide2PhotoScale={splitState.slide2PhotoScale}
          />

          {/* Subtle Cobalt Vertical Center-Cut Hairline Visible Only While Halves Are Actively Shearing */}
          {splitState.centerSeamOpacity > 0.02 && (
            <div
              aria-hidden="true"
              data-testid="split-center-seam-line"
              className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-[#93C5FD] to-transparent"
              style={{ opacity: splitState.centerSeamOpacity }}
            />
          )}
        </div>
      )}

      {/* =====================================================================
          ARCHITECTURAL EDGE CHROME & REVEALED BALCONY PHOTO CONTROLS (z-40)
          Unclipped top & bottom bars framing the revealed Festive Balcony Duo
         ===================================================================== */}
      {splitState.edgeChromeOpacity > 0.02 && (
        <div
          data-testid="split-edge-chrome"
          className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between px-3.5 sm:px-10 md:px-14 py-2.5 sm:py-6"
          style={{ opacity: splitState.edgeChromeOpacity }}
        >
          {/* Top 3-Point Architectural Edge Bar */}
          <div className="w-full max-w-[1680px] mx-auto flex items-center justify-between gap-2 sm:gap-4 font-mono text-[8.5px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-white/90 [text-shadow:0_2px_8px_rgba(0,0,0,0.9)]">
            <span className="flex-1 text-left text-[#93C5FD] whitespace-nowrap">
              05 · BUILD OVERVIEW
            </span>
            <span className="hidden md:inline-block text-center text-white/80 whitespace-nowrap">
              45° DRAWINGS &nbsp;→&nbsp; FINISHED PAIR &nbsp;→&nbsp; 16 PARTS
            </span>
            <span className="flex-1 text-right tabular-nums text-white/80 whitespace-nowrap">
              15 × 14.7 × 27.5 CM · L + R
            </span>
          </div>

          {/* Bottom Revealed Photo / Components Caption & Quick Actions */}
          <div className="w-full max-w-[1680px] mx-auto flex flex-wrap items-end justify-between gap-1.5 sm:gap-4 border-t border-white/15 pt-1.5 sm:pt-3">
            <div className="space-y-0.5 [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">
              <div className="font-mono text-[8.5px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#93C5FD]/90">
                {splitState.wipe2Progress >= 0.5
                  ? 'PARTS LIST · DIY STEREO SPEAKER'
                  : 'FINISHED PAIR · 45° STEREO SETUP'}
              </div>
              <div
                data-testid="split-footer-summary"
                className="font-serif text-sm sm:text-2xl text-white tracking-tight leading-snug"
              >
                {splitState.wipe2Progress >= 0.5 ? (
                  <>
                    16 Parts.{' '}
                    <span className="italic text-[#93C5FD]">
                      Wired and Assembled by Hand.
                    </span>
                  </>
                ) : (
                  <>
                    Two Cabinets.{' '}
                    <span className="italic text-[#93C5FD]">
                      Separate Left &amp; Right Channels.
                    </span>
                  </>
                )}
              </div>
            </div>

            <div
              className={`flex flex-wrap items-center gap-2.5 sm:gap-5 ${
                isInteractive && splitState.wipe1Progress > 0.65
                  ? 'pointer-events-auto'
                  : 'pointer-events-none'
              }`}
            >
              {onBackToCadOutlines && (
                <button
                  type="button"
                  onClick={onBackToCadOutlines}
                  data-testid="split-back-to-cad-btn"
                  className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white/80 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#93C5FD]" />
                  <span>45° Drawings</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpen3DInspector}
                data-testid="split-reveal-open-3d-btn"
                className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white/85 hover:text-[#93C5FD] border-b border-white/30 hover:border-[#93C5FD] pb-0.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Open 3D Model</span>
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#93C5FD]" />
              </button>

              <button
                type="button"
                onClick={onJumpToFinale}
                data-testid="split-reveal-continue-gallery-btn"
                className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] text-[#93C5FD] hover:text-white border-b border-[#93C5FD] pb-0.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>
                  {splitState.wipe2Progress >= 0.5
                    ? 'Creator & Socials'
                    : 'Inside the Speaker'}
                </span>
                <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
