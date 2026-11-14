import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  DIY_PARTY_BOX_SCENES,
  tokenizeHeadline,
  computeLetterScatterSpec,
  getMultiSceneLetterTransform,
  LetterScatterSpec,
  WordToken,
} from '../kinetic/scatterEngine';
import {
  ObsidianAcousticWaves,
  VisualRenderMode,
} from './ZeninSpeakerVisuals';
import LandoCursorRevealHero from './LandoCursorRevealHero';
import RotatingSpeakerWireframeIcon from './RotatingSpeakerWireframeIcon';
import CobaltPreloaderCurtain, {
  warmupAllSceneImages,
} from './CobaltPreloaderCurtain';
import { Camera } from 'lucide-react';

const SpeakerViewport3D = React.lazy(() => import('./SpeakerViewport3D'));
const WledStudioModal = React.lazy(() => import('./WledStudioModal'));
const FocusSpeakerCarousel = React.lazy(() => import('./FocusSpeakerCarousel'));
const SocialFanShowcaseSection = React.lazy(() => import('./SocialFanShowcaseSection'));
import {
  SignatureMarqueeChapter,
  FloatingPartCollageChapter,
  OpposingSplitChapter,
} from './EditorialScrollChapters';
import {
  getChapterBackgroundStyle,
  getContinuousSpeakerZoomState,
  getMobilePerformanceProfile,
  shouldInnerScrollConsumeSwipe,
  computeTouchReleaseMomentumTarget,
  getAdjacentMobileWaypoint,
  getMobileChapterIndex,
  MOBILE_CHAPTER_WAYPOINTS,
  TouchVelocitySample,
} from '../kinetic/editorialStages';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PrecomputedHeadline {
  headline: string;
  words: WordToken[];
  specs: Map<number, LetterScatterSpec>;
}

function buildHeadlineData(headline: string): PrecomputedHeadline {
  const tokenized = tokenizeHeadline(headline);
  const specs = new Map<number, LetterScatterSpec>();
  for (const word of tokenized.words) {
    for (const letter of word.letters) {
      specs.set(letter.globalIndex, computeLetterScatterSpec(letter));
    }
  }
  return { headline, words: tokenized.words, specs };
}

interface ScatteringHeadlineProps {
  data: PrecomputedHeadline;
  sceneIndex: number;
  timelinePos: number;
  as?: 'h1' | 'h2';
  testIdPrefix: string;
  className?: string;
  letterClassName?: string;
  showTrails?: boolean;
  disableBlur?: boolean;
}

/**
 * Renders a headline whose individual characters detach, fan out laterally,
 * rotate, and fly upward (`translateY < 0`) as `timelinePos` scrolls past `sceneIndex`,
 * and rise into lockup as `timelinePos` approaches `sceneIndex`.
 */
function ScatteringHeadline({
  data,
  sceneIndex,
  timelinePos,
  as: Tag = 'h2',
  testIdPrefix,
  className = '',
  letterClassName = '',
  showTrails = true,
  disableBlur = false,
}: ScatteringHeadlineProps) {
  return (
    <Tag
      aria-label={data.headline}
      data-testid={`${testIdPrefix}-headline`}
      className={className}
    >
      {data.words.map((wordObj) => (
        <span
          key={`${testIdPrefix}-word-${wordObj.wordIndex}`}
          className="inline-flex whitespace-nowrap"
        >
          {wordObj.letters.map((letterObj) => {
            const spec = data.specs.get(letterObj.globalIndex)!;
            const tf = getMultiSceneLetterTransform(
              spec,
              sceneIndex,
              timelinePos
            );
            return (
              <span
                key={`${testIdPrefix}-char-${letterObj.globalIndex}`}
                data-testid={`${testIdPrefix}-letter-${letterObj.globalIndex}`}
                data-char={letterObj.char}
                data-ty={tf.y}
                data-tx={tf.x}
                className={`relative inline-block will-change-transform ${letterClassName}`}
                style={{
                  opacity: tf.opacity,
                  transform: `translate3d(${tf.x}px, ${tf.y}px, 0px) rotate(${tf.rotateDeg}deg) scale(${tf.scale})`,
                  filter: !disableBlur && tf.blurPx > 0.25 ? `blur(${tf.blurPx}px)` : undefined,
                }}
              >
                {letterObj.char}
                {showTrails && tf.trailIntensity > 0.08 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-[#93C5FD]/80 via-[#2C3480]/60 to-transparent rounded-full"
                    style={{
                      height: `${Math.round(tf.trailIntensity * 46)}px`,
                      opacity: tf.trailIntensity * 0.85,
                    }}
                  />
                )}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

const SECTION_HASH_BY_SCENE_INDEX: Record<number, string> = {
  0: 'the-story',
  1: 'signature-marquee',
  2: 'part-collage',
  3: 'part-collage',
  4: 'opposing-split',
  5: 'stereo-reveal',
  6: 'creator-socials',
  7: 'creator-socials',
  8: 'creator-socials',
};

const SCENE_INDEX_BY_HASH: Record<string, number> = {
  'the-story': 0,
  'signature-marquee': 1,
  'part-collage': 2.15,
  craftsmanship: 1,
  anatomy: 2.15,
  'unique-features': 4,
  'opposing-split': 4,
  'stereo-reveal': 5,
  'creator-socials': 6,
  socials: 6,
  '3d-model': 6,
  'speaker-gallery': 6,
  'media-gallery': 6,
  footer: 8.1,
};

function getInitialTimelinePosFromHash(): number {
  if (typeof window === 'undefined') return 0;
  const posParam = new URLSearchParams(window.location.search).get('pos');
  if (posParam !== null) {
    const parsed = Number(posParam);
    if (!Number.isNaN(parsed)) {
      return Math.max(0, Math.min(8.1, parsed));
    }
  }
  const rawHash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
  if (rawHash && rawHash in SCENE_INDEX_BY_HASH) {
    return SCENE_INDEX_BY_HASH[rawHash];
  }
  return 0;
}

export default function PinnedKineticStage() {
  const maxTimelinePos = 8.1; // 0..3 = Hero/Marquee/Collage, 4..5 = Split-Screen Slider & Balcony Reveal, 6..6.75 = 3D Card Fan-Out, 6.75..7.5 = FOLLOW MY JOURNEY, 7.5..8.1 = Compact Footer

  const [preloaderReady, setPreloaderReady] = useState<boolean>(false);
  const [preloaderZooming, setPreloaderZooming] = useState<boolean>(false);

  useEffect(() => {
    if (preloaderReady) {
      warmupAllSceneImages();
    }
  }, [preloaderReady]);

  // Continuous timeline position in [0, 6] where 4..5 = Split-Screen Slider -> Balcony Reveal, 6 = Focus Carousel
  const initialPos = useMemo(() => getInitialTimelinePosFromHash(), []);
  const [timelinePos, setTimelinePos] = useState<number>(initialPos);
  const targetTimelineRef = useRef<number>(initialPos);
  const currentTimelineRef = useRef<number>(initialPos);
  const rafIdRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchGestureAxisRef = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided');
  const touchInHorizontalDeckRef = useRef<boolean>(false);
  const touchSamplesRef = useRef<TouchVelocitySample[]>([]);
  const touchScrollRegionRef = useRef<HTMLElement | null>(null);
  const touchLockedToInnerScrollRef = useRef<boolean>(false);
  const lastScrollDirRef = useRef<number>(1);
  const endSnapTimerRef = useRef<number | null>(null);

  const [viewportSize, setViewportSize] = useState<{
    width: number;
    height: number;
  }>(() =>
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 1920, height: 1080 }
  );

  const [isCoarsePointer, setIsCoarsePointer] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(pointer: coarse)').matches)
  );

  // Interactive UI states within the pinned scenes
  const [visualMode] = useState<VisualRenderMode>('render');
  const [show3DModal, setShow3DModal] = useState<boolean>(false);
  const [showWledModal, setShowWledModal] = useState<boolean>(false);
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);
  const [showCollageModal, setShowCollageModal] = useState<boolean>(false);

  // Precompute word & character scatter specs for all 6 scene headlines
  const sceneHeadlines = useMemo(
    () => DIY_PARTY_BOX_SCENES.map((s) => buildHeadlineData(s.headline)),
    []
  );

  const startSmoothingLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;
    let lastMs = performance.now();

    const tick = (nowMs: number) => {
      const dtSec = Math.min(0.06, Math.max(0.004, (nowMs - lastMs) / 1000));
      lastMs = nowMs;
      const target = targetTimelineRef.current;
      const current = currentTimelineRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0035) {
        currentTimelineRef.current = target;
        setTimelinePos(target);
        rafIdRef.current = null;
        return;
      }

      const stepFactor = 1 - Math.exp(-dtSec * 12.5);
      const next = current + diff * Math.max(0.16, stepFactor);
      currentTimelineRef.current = next;
      setTimelinePos(Number(next.toFixed(4)));
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const animateToTimeline = useCallback(
    (nextTarget: number, immediate = false) => {
      if (endSnapTimerRef.current !== null) {
        window.clearTimeout(endSnapTimerRef.current);
        endSnapTimerRef.current = null;
      }
      const clamped = Math.max(
        0,
        Math.min(maxTimelinePos, Number(nextTarget.toFixed(4)))
      );
      targetTimelineRef.current = clamped;
      const targetSceneIdx = Math.round(clamped);
      const targetHash = SECTION_HASH_BY_SCENE_INDEX[targetSceneIdx];
      if (targetHash && typeof window !== 'undefined') {
        window.history.replaceState(
          null,
          '',
          `/dualbeast${window.location.search}#${targetHash}`
        );
      }
      if (immediate) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        currentTimelineRef.current = clamped;
        setTimelinePos(clamped);
      } else {
        startSmoothingLoop();
      }
    },
    [maxTimelinePos, startSmoothingLoop]
  );

  const scheduleEndCorridorSnap = useCallback(() => {
    if (endSnapTimerRef.current !== null) {
      window.clearTimeout(endSnapTimerRef.current);
      endSnapTimerRef.current = null;
    }
    const target = targetTimelineRef.current;
    // Note: [4.00 .. 5.00] is 100% freely scrubbable for the Split-Screen Slider!
    // If scrolling pauses in the transition corridor (5.02..5.98) between the settled Balcony Photo (5) and FocusCarousel (6),
    // automatically finish settling to 6 or 5 so the page never lingers in a half-faded twilight state.
    if (target > 5.02 && target < 5.98) {
      endSnapTimerRef.current = window.setTimeout(() => {
        endSnapTimerRef.current = null;
        const currTarget = targetTimelineRef.current;
        if (currTarget > 5.02 && currTarget < 5.98) {
          const snapDest =
            lastScrollDirRef.current > 0
              ? currTarget >= 5.06
                ? 6
                : 5
              : currTarget <= 5.94
              ? 5
              : 6;
          targetTimelineRef.current = snapDest;
          startSmoothingLoop();
        }
      }, 90);
    }
  }, [startSmoothingLoop]);

  // Support URL hashchange events for smooth scroll anchoring + viewport resize
  useEffect(() => {
    const onHashChange = () => {
      const rawHash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
      if (rawHash && rawHash in SCENE_INDEX_BY_HASH) {
        animateToTimeline(SCENE_INDEX_BY_HASH[rawHash], false);
      }
    };
    const onResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    (window as unknown as { __setTimelinePos?: (pos: number) => void }).__setTimelinePos = (
      pos: number
    ) => {
      animateToTimeline(pos, true);
    };
    const coarseQuery = window.matchMedia?.('(pointer: coarse)');
    const onPointerChange = () => {
      setIsCoarsePointer(Boolean(coarseQuery?.matches));
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('resize', onResize);
    coarseQuery?.addEventListener?.('change', onPointerChange);
    return () => {
      delete (window as unknown as { __setTimelinePos?: (pos: number) => void }).__setTimelinePos;
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('resize', onResize);
      coarseQuery?.removeEventListener?.('change', onPointerChange);
    };
  }, [animateToTimeline]);

  // Intercept wheel, keyboard, and touch events globally on the pinned viewport
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (
        !preloaderReady ||
        show3DModal ||
        showWledModal ||
        showGalleryModal ||
        showCollageModal
      )
        return;

      const targetEl = e.target as HTMLElement | null;
      const horizontalDeck = targetEl?.closest<HTMLElement>(
        '[data-horizontal-swipe="true"]'
      );
      if (horizontalDeck && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      const scrollRegion = targetEl?.closest<HTMLElement>(
        '[data-mobile-scroll-region="true"]'
      );
      if (
        scrollRegion &&
        shouldInnerScrollConsumeSwipe(
          scrollRegion.scrollTop,
          scrollRegion.scrollHeight,
          scrollRegion.clientHeight,
          e.deltaY
        )
      ) {
        return;
      }

      e.preventDefault();
      if (Math.abs(e.deltaY) > 0.1) {
        lastScrollDirRef.current = e.deltaY > 0 ? 1 : -1;
      }
      // Smooth scrubbing across [0..5.00] and [6.00..7.00] 3D Fan-Out;
      // slightly brisker step across the 5 <-> 6 chapter transition corridor
      const inTransitionCorridor =
        targetTimelineRef.current > 5.0 && targetTimelineRef.current < 5.98;
      const sensitivity = inTransitionCorridor ? 0.00155 : 0.00105;
      const next = Math.max(
        0,
        Math.min(maxTimelinePos, targetTimelineRef.current + e.deltaY * sensitivity)
      );
      targetTimelineRef.current = Number(next.toFixed(4));
      startSmoothingLoop();
      scheduleEndCorridorSnap();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preloaderReady) return;
      if (show3DModal) {
        if (e.key === 'Escape') setShow3DModal(false);
        return;
      }
      if (showWledModal) {
        if (e.key === 'Escape') setShowWledModal(false);
        return;
      }
      if (showGalleryModal) {
        if (e.key === 'Escape') setShowGalleryModal(false);
        return;
      }
      if (showCollageModal) {
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (
        e.key === ' ' &&
        (e.target instanceof HTMLButtonElement ||
          e.target instanceof HTMLAnchorElement ||
          e.target instanceof HTMLVideoElement)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        lastScrollDirRef.current = 1;
        const step =
          targetTimelineRef.current >= 4.98 && targetTimelineRef.current < 5.95
            ? 1
            : 0.25;
        animateToTimeline(targetTimelineRef.current + step);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        lastScrollDirRef.current = -1;
        const step =
          targetTimelineRef.current > 5.05 && targetTimelineRef.current <= 6.02
            ? 1
            : 0.25;
        animateToTimeline(targetTimelineRef.current - step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        animateToTimeline(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        animateToTimeline(maxTimelinePos);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (endSnapTimerRef.current !== null) {
        window.clearTimeout(endSnapTimerRef.current);
        endSnapTimerRef.current = null;
      }
    };
  }, [
    preloaderReady,
    show3DModal,
    showWledModal,
    showGalleryModal,
    showCollageModal,
    maxTimelinePos,
    animateToTimeline,
    startSmoothingLoop,
    scheduleEndCorridorSnap,
  ]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      !preloaderReady ||
      show3DModal ||
      showWledModal ||
      showGalleryModal ||
      showCollageModal ||
      e.touches.length === 0
    )
      return;

    const targetEl = e.target as HTMLElement | null;
    touchScrollRegionRef.current =
      targetEl?.closest<HTMLElement>('[data-mobile-scroll-region="true"]') ?? null;
    touchInHorizontalDeckRef.current = Boolean(
      targetEl?.closest<HTMLElement>('[data-horizontal-swipe="true"]')
    );
    touchGestureAxisRef.current = 'undecided';
    touchLockedToInnerScrollRef.current = false;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    touchStartXRef.current = x;
    touchStartYRef.current = y;
    touchSamplesRef.current = [{ y, t: performance.now() }];
    targetTimelineRef.current = currentTimelineRef.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      !preloaderReady ||
      show3DModal ||
      showWledModal ||
      showGalleryModal ||
      showCollageModal ||
      touchStartYRef.current === null ||
      e.touches.length === 0
    )
      return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = (touchStartXRef.current ?? currentX) - currentX;
    const deltaY = touchStartYRef.current - currentY;

    if (touchGestureAxisRef.current === 'undecided') {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        touchGestureAxisRef.current =
          touchInHorizontalDeckRef.current && Math.abs(deltaX) >= Math.abs(deltaY)
            ? 'horizontal'
            : 'vertical';
      }
    }

    if (touchGestureAxisRef.current === 'horizontal') {
      return;
    }

    touchStartXRef.current = currentX;
    touchStartYRef.current = currentY;

    const now = performance.now();
    const samples = touchSamplesRef.current;
    samples.push({ y: currentY, t: now });
    if (samples.length > 12) {
      samples.shift();
    }

    const scrollRegion = touchScrollRegionRef.current;
    if (
      scrollRegion &&
      shouldInnerScrollConsumeSwipe(
        scrollRegion.scrollTop,
        scrollRegion.scrollHeight,
        scrollRegion.clientHeight,
        deltaY
      )
    ) {
      touchLockedToInnerScrollRef.current = true;
      return;
    }

    touchLockedToInnerScrollRef.current = false;
    if (Math.abs(deltaY) > 0.5) {
      lastScrollDirRef.current = deltaY > 0 ? 1 : -1;
    }
    const next = Math.max(
      0,
      Math.min(maxTimelinePos, targetTimelineRef.current + deltaY * 0.0038)
    );
    targetTimelineRef.current = Number(next.toFixed(4));
    startSmoothingLoop();
    scheduleEndCorridorSnap();
  };

  const handleTouchEnd = () => {
    if (
      touchGestureAxisRef.current !== 'horizontal' &&
      !touchLockedToInnerScrollRef.current &&
      touchSamplesRef.current.length >= 2 &&
      preloaderReady &&
      !show3DModal &&
      !showWledModal &&
      !showGalleryModal &&
      !showCollageModal
    ) {
      const momentumTarget = computeTouchReleaseMomentumTarget(
        targetTimelineRef.current,
        touchSamplesRef.current,
        maxTimelinePos
      );
      if (Math.abs(momentumTarget - targetTimelineRef.current) > 0.01) {
        lastScrollDirRef.current = momentumTarget > targetTimelineRef.current ? 1 : -1;
        targetTimelineRef.current = momentumTarget;
        startSmoothingLoop();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchGestureAxisRef.current = 'undecided';
    touchInHorizontalDeckRef.current = false;
    touchSamplesRef.current = [];
    touchScrollRegionRef.current = null;
    touchLockedToInnerScrollRef.current = false;
    scheduleEndCorridorSnap();
  };

  // Helper to compute each scene's overall container envelope (opacity, vertical parallax, pointer events)
  const getSceneEnvelope = (sceneIndex: number) => {
    const rel = timelinePos - sceneIndex;
    const absRel = Math.abs(rel);
    const isVisible = absRel < 0.78;
    const isInteractive = absRel < 0.45;

    let translateY = 0;
    let opacity = 1;
    let scale = 1;

    if (rel > 0) {
      const t = Math.min(1, rel / 0.76);
      translateY = -t * 150;
      opacity = Math.max(0, 1 - Math.pow(t * 1.08, 1.5));
      scale = 1 - t * 0.04;
    } else if (rel < 0) {
      const t = Math.min(1, -rel / 0.76);
      translateY = t * 140;
      opacity = Math.max(0, 1 - Math.pow(t * 1.12, 1.5));
      scale = 1 - t * 0.05;
    }

    return {
      rel,
      isVisible,
      isInteractive,
      translateY: Number(translateY.toFixed(1)),
      opacity: Number(opacity.toFixed(3)),
      scale: Number(scale.toFixed(3)),
    };
  };

  const nearestSceneIdx = Math.round(timelinePos);
  const activeAnchorId = SECTION_HASH_BY_SCENE_INDEX[nearestSceneIdx] || 'the-story';
  const scene1To2Percent = Math.round(Math.min(1, timelinePos) * 100);
  const activeSceneObj =
    DIY_PARTY_BOX_SCENES[nearestSceneIdx >= 6 ? 5 : Math.min(4, nearestSceneIdx)];

  // Keep URL path (/dualbeast) and hash synchronized as wheel/touch scrolling moves between pinned sections
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expectedHash = `#${activeAnchorId}`;
      const expectedPath = '/dualbeast';
      if (
        window.location.pathname !== expectedPath ||
        window.location.hash !== expectedHash
      ) {
        window.history.replaceState(
          null,
          '',
          `${expectedPath}${window.location.search}${expectedHash}`
        );
      }
    }
  }, [activeAnchorId]);

  const env0 = getSceneEnvelope(0);
  const env1 = getSceneEnvelope(1);

  // Dedicated non-overlapping envelope for Scene 06 (FocusSpeakerCarousel at timelinePos = 6):
  // Enters ONLY after OpposingSplitChapter (and its Split-Screen Balcony Reveal) has completely exited at timelinePos >= 5.42,
  // and only intercepts wheel/pointer events once settled at timelinePos >= 5.92.
  const galleryRawT = Math.max(0, Math.min(1, (timelinePos - 5.42) / 0.48));
  const gallerySmoothT = galleryRawT * galleryRawT * (3 - 2 * galleryRawT);
  const env5 = {
    isVisible: timelinePos >= 5.42,
    isInteractive: timelinePos >= 5.92 && targetTimelineRef.current >= 5.92,
    opacity: Number(gallerySmoothT.toFixed(3)),
    translateY: Number(((1 - gallerySmoothT) * 76).toFixed(1)),
  };

  const chapterBg = getChapterBackgroundStyle(timelinePos);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const zoomState = getContinuousSpeakerZoomState(
    timelinePos,
    viewportSize.width,
    viewportSize.height,
    prefersReducedMotion
  );

  const perfProfile = useMemo(
    () => getMobilePerformanceProfile(viewportSize.width, isCoarsePointer),
    [viewportSize.width, isCoarsePointer]
  );
  const mobileChapterIdx = getMobileChapterIndex(timelinePos);
  const mobileActiveWaypoint = MOBILE_CHAPTER_WAYPOINTS[mobileChapterIdx] ?? MOBILE_CHAPTER_WAYPOINTS[0];
  const mobileProgressPct = Math.round((timelinePos / maxTimelinePos) * 100);

  return (
    <div
      data-testid="pinned-kinetic-stage"
      className="fixed inset-0 w-screen h-screen overflow-clip overscroll-none select-none flex flex-col justify-between font-sans"
      style={{
        backgroundColor: chapterBg.backgroundColor,
        color: chapterBg.inkColor,
      }}
      data-active-scene={activeSceneObj?.id}
      data-timeline-pos={timelinePos.toFixed(2)}
      data-scroll-progress={scene1To2Percent}
      data-preloader-ready={preloaderReady ? 'true' : 'false'}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-Screen Cobalt Blue Deep Asset Preloader Curtain */}
      {!preloaderReady && (
        <CobaltPreloaderCurtain
          bypass={preloaderReady}
          onZoomStart={() => setPreloaderZooming(true)}
          onComplete={() => {
            setPreloaderZooming(false);
            setPreloaderReady(true);
          }}
        />
      )}

      {/* Subtle Architectural Dot-Matrix Backdrop Adapting Smoothly Between Dark & Light Chapters */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity:
            timelinePos > 0.35 && !chapterBg.isLightSurface
              ? 0.34
              : chapterBg.isLightSurface
              ? 0.25
              : 0.16,
          backgroundImage: chapterBg.isLightSurface
            ? 'radial-gradient(rgba(44, 52, 128, 0.22) 1px, transparent 1px)'
            : 'radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Scene 01 Top Cobalt Blue Deep (#2C3480) Atmospheric Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: zoomState.heroChromeOpacity,
          background:
            'radial-gradient(ellipse 85% 50% at 50% -4%, rgba(44, 52, 128, 0.72) 0%, rgba(44, 52, 128, 0.28) 48%, rgba(0, 0, 0, 0) 78%)',
        }}
      />

      {/* =====================================================================
          CENTRAL PINNED VIEWPORT STAGE (Full-Bleed 100vh Stage, 6 Choreographed Scenes)
         ===================================================================== */}
      <main
        className="relative z-10 flex-1 w-full h-full overflow-clip flex items-center justify-center"
        aria-label="DIY Party Box Speaker Showcase"
        aria-hidden={show3DModal || showWledModal || showGalleryModal}
        style={{
          visibility:
            show3DModal || showWledModal || showGalleryModal
              ? 'hidden'
              : 'visible',
          ...(preloaderReady ||
          (typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
            ? {}
            : {
                transform: preloaderZooming
                  ? 'scale3d(1, 1, 1)'
                  : 'scale3d(0.91, 0.91, 1)',
                transition: 'transform 780ms cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }),
        }}
      >
        {/* ===================================================================
            SCENE 01: THE STORY (Full-Bleed Minimal Hero: Giant Headline + Massive Glowing Speaker + Fluid Reveal + Bottom Corner Rotating Speaker Tabs)
           =================================================================== */}
        <section
          id="the-story"
          aria-label="Hero: DIY Party Box Stereo Speaker"
          data-testid="scene-one-stage"
          className={`inset-0 flex flex-col items-center justify-center ${
            env0.isInteractive ? '' : 'pointer-events-none'
          }`}
          style={{
            position: 'absolute',
            visibility: zoomState.isMounted ? 'visible' : 'hidden',
          }}
        >
          <LandoCursorRevealHero
            visualMode={visualMode}
            envOpacity={zoomState.heroChromeOpacity}
            envTranslateY={env0.translateY}
            envScale={env0.scale}
            speakerScale={zoomState.scale}
            speakerTranslateX={zoomState.translateXPx}
            speakerTranslateY={zoomState.translateYPx}
            speakerOpacity={zoomState.speakerOpacity}
            heroChromeOpacity={zoomState.heroChromeOpacity}
            cobaltWledIntensity={zoomState.cobaltWledIntensity}
            disableXRaySweep={!perfProfile.enableHeroXRaySweep}
            useLightweightEffects={perfProfile.isMobileViewport}
            active={
              preloaderReady &&
              zoomState.allowXRaySweep &&
              !show3DModal &&
              !showWledModal &&
              !showGalleryModal
            }
            renderBaseHeadline={() => (
              <ScatteringHeadline
                as="h1"
                data={sceneHeadlines[0]}
                sceneIndex={0}
                timelinePos={timelinePos}
                testIdPrefix="scene-one"
                showTrails={!perfProfile.isMobileViewport}
                disableBlur={!perfProfile.useHeavyBlurFilters}
                className="font-serif font-normal text-[clamp(2.65rem,11.6vw,4.4rem)] md:text-[clamp(4.4rem,14.5vw,12.4rem)] leading-[0.95] md:leading-[0.9] tracking-[-0.025em] text-white flex flex-wrap justify-center gap-x-[0.22em] md:drop-shadow-[0_18px_46px_rgba(0,0,0,0.92)]"
              />
            )}
            renderRevealHeadline={() =>
              perfProfile.enableHeroXRaySweep ? (
                <ScatteringHeadline
                  as="h2"
                  data={sceneHeadlines[0]}
                  sceneIndex={0}
                  timelinePos={timelinePos}
                  testIdPrefix="scene-one-reveal"
                  className="font-serif font-normal text-[clamp(2.65rem,11.6vw,4.8rem)] md:text-[clamp(4.8rem,14.5vw,12.4rem)] leading-[0.95] md:leading-[0.9] tracking-[-0.025em] text-[#3B5BFF]/30 [-webkit-text-stroke:1.5px_rgba(255,255,255,0.75)] flex flex-wrap justify-center gap-x-[0.22em] drop-shadow-[0_0_24px_rgba(59,91,255,0.65)]"
                />
              ) : null
            }
          />

          {/* Dark Sculpted Cobalt-Obsidian Acoustic Waves Across Bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] md:h-[280px] z-10"
            style={{
              opacity: zoomState.heroChromeOpacity,
              transform: `translate3d(0px, ${Math.max(0, -env0.translateY * 0.45)}px, 0px)`,
            }}
          >
            <ObsidianAcousticWaves className="w-full h-full" />
          </div>

          {/* =================================================================
              HERO BOTTOM CONTROLS:
              - Bottom-Left: Inspect 3D Model
              - Bottom-Center (right below speaker): Visit Gallery (white -> Cobalt hover)
              - Bottom-Right: Open WLED Studio
             ================================================================= */}
          <aside
            aria-label="3D Model Viewer, Build Gallery, and WLED Preview Shortcuts"
            data-testid="bottom-left-speaker-dock"
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-40 ${
              env0.isInteractive ? '' : 'pointer-events-none'
            }`}
            style={{
              opacity: zoomState.heroChromeOpacity,
              visibility:
                zoomState.heroChromeOpacity > 0.01 ? 'visible' : 'hidden',
              transform: `translate3d(0px, ${env0.translateY}px, 0px) scale(${env0.scale})`,
            }}
          >
            {/* Bottom-Left Corner: Inspect 3D GLB (Small Pure White Rotating Speaker Outline Above Text) */}
            <button
              type="button"
              onClick={() => setShow3DModal(true)}
              data-testid="open-3d-inspector-btn"
              className="pointer-events-auto absolute bottom-3 left-3 sm:bottom-6 sm:left-7 group flex flex-col items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border border-white/15 hover:border-white/40 bg-black/85 md:bg-black/65 hover:bg-[#0B1024]/85 md:backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.85)] transition-all cursor-pointer"
            >
              <RotatingSpeakerWireframeIcon
                variant="pure-white"
                initialPhase={0.35}
                active={
                  preloaderReady &&
                  env0.isVisible &&
                  zoomState.heroChromeOpacity > 0.7 &&
                  !show3DModal &&
                  !showWledModal &&
                  !showGalleryModal
                }
                className="w-[32px] h-[42px] sm:w-[40px] sm:h-[50px] transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-white/95 group-hover:text-white whitespace-nowrap leading-tight">
                Inspect 3D Model
              </span>
              <span className="text-[7px] sm:text-[7.5px] font-mono tracking-widest uppercase text-white/50 whitespace-nowrap leading-none">
                3D Cabinet View
              </span>
            </button>

            {/* Bottom-Center Below Speaker: Minimal Editorial Visit Gallery Label */}
            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              data-testid="open-gallery-modal-btn"
              aria-label="Visit Build Photo and Video Gallery"
              className="pointer-events-auto absolute bottom-[6.75rem] sm:bottom-7 left-1/2 -translate-x-1/2 group inline-flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white hover:text-[#3B5BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BFF] rounded-md transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current transition-transform duration-200 group-hover:scale-110" />
              <span className="relative">
                Visit Gallery
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 -bottom-1 h-[1.5px] w-full bg-[#3B5BFF] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                />
              </span>
            </button>

            {/* Bottom-Right Corner: Open WLED Studio */}
            <button
              type="button"
              onClick={() => setShowWledModal(true)}
              data-testid="explore-wled-app-btn"
              aria-label="Open WLED Lighting Preview"
              className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-6 sm:right-7 group flex flex-col items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border border-[#3B5BFF]/30 hover:border-[#3B5BFF]/65 bg-black/85 md:bg-black/65 hover:bg-[#0B1024]/85 md:backdrop-blur-md shadow-[0_8px_24px_rgba(24,34,94,0.42)] transition-all cursor-pointer"
            >
              <RotatingSpeakerWireframeIcon
                variant="cobalt-wled"
                initialPhase={1.95}
                active={
                  preloaderReady &&
                  env0.isVisible &&
                  zoomState.heroChromeOpacity > 0.7 &&
                  !show3DModal &&
                  !showWledModal &&
                  !showGalleryModal
                }
                className="w-[32px] h-[42px] sm:w-[40px] sm:h-[50px] transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-white/95 group-hover:text-[#93C5FD] whitespace-nowrap leading-tight">
                Open WLED Studio
              </span>
              <span className="text-[7px] sm:text-[7.5px] font-mono tracking-widest uppercase text-[#93C5FD]/75 whitespace-nowrap leading-none">
                Lighting Simulation
              </span>
            </button>
          </aside>
        </section>

        {/* ===================================================================
            CHAPTER 1 (SCENE 02): ANIMATED SIGNATURE & HORIZONTAL MARQUEE
           =================================================================== */}
        <SignatureMarqueeChapter
          timelinePos={timelinePos}
          sceneIndex={1}
          isVisible={env1.isVisible}
          isInteractive={env1.isInteractive}
          viewportSize={viewportSize}
        />

        {/* ===================================================================
            FLOATING EDITORIAL COLLAGE (#part-collage):
            Continuous horizontal right-to-left architectural canvas with staggered
            multi-size cards, Cobalt reveal blocks, and closing story + signature
           =================================================================== */}
        <FloatingPartCollageChapter
          timelinePos={timelinePos}
          viewportSize={viewportSize}
          onModalOpenChange={setShowCollageModal}
          onContinueToSplit={() => animateToTimeline(4)}
        />

        {/* ===================================================================
            CHAPTER 4 (SCENE 05): OPPOSING DIRECTIONAL SPLIT (CAD vs WLED)
            & SPLIT-SCREEN COUNTER-WIPE SLIDER [4.00 .. 5.00]
           =================================================================== */}
        <OpposingSplitChapter
          timelinePos={timelinePos}
          sceneIndex={4}
          isVisible={timelinePos >= 3.45 && timelinePos < 5.42}
          isInteractive={timelinePos >= 3.78 && timelinePos < 5.35}
          viewportSize={viewportSize}
          onOpen3DInspector={() => setShow3DModal(true)}
          onOpenGallery={() => setShowGalleryModal(true)}
          onRevealBalconyPhoto={() => animateToTimeline(5)}
          onBackToCadOutlines={() => animateToTimeline(4)}
          onJumpToFinale={() => animateToTimeline(6)}
        />

        {/* ===================================================================
            SCENE 06: FINAL SECTION — CREATOR & SOCIAL 5-CARD SHOWCASE
            Placed right after "Inside the Speaker" (timelinePos = 5.00 -> 6.00)
           =================================================================== */}
        <section
          id="creator-socials"
          aria-label="Creator Profile and Social Links"
          data-testid="scene-six-stage"
          className={`inset-0 flex flex-col justify-between ${
            env5.isInteractive ? '' : 'pointer-events-none'
          }`}
          style={{
            position: 'absolute',
            opacity: env5.isVisible ? env5.opacity : 0,
            visibility: env5.isVisible ? 'visible' : 'hidden',
            transform:
              env5.translateY === 0
                ? undefined
                : `translate3d(0px, ${env5.translateY}px, 0px)`,
          }}
        >
          {env5.isVisible && (
            <React.Suspense fallback={null}>
              <SocialFanShowcaseSection
                timelinePos={timelinePos}
                viewportSize={viewportSize}
                prefersReducedMotion={prefersReducedMotion}
                onBackToPartsList={() => animateToTimeline(5)}
                onJumpToTop={() => animateToTimeline(0)}
                onJumpToBuildOverview={() => animateToTimeline(4)}
                onJumpToFooter={() => animateToTimeline(8.1)}
                onOpenGallery={() => setShowGalleryModal(true)}
                onOpen3DInspector={() => setShow3DModal(true)}
                onOpenWledStudio={() => setShowWledModal(true)}
              />
            </React.Suspense>
          )}
        </section>
      </main>

      {/* Mobile-Only (< 768px) Top Progress Hairline & Non-Intrusive Chapter Stepper */}
      {preloaderReady &&
        !show3DModal &&
        !showWledModal &&
        !showGalleryModal &&
        !showCollageModal && (
          <>
            <div
              aria-hidden="true"
              className="md:hidden pointer-events-none fixed top-0 inset-x-0 z-40 h-[2px] bg-white/10"
            >
              <div
                className="h-full bg-[#3B5BFF] transition-[width] duration-150"
                style={{ width: `${mobileProgressPct}%` }}
              />
            </div>

            {timelinePos < 3.65 && (
              <nav
                aria-label="Mobile chapter navigation"
                data-testid="mobile-chapter-stepper"
                className={`md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] shadow-lg ${
                  chapterBg.isLightSurface
                    ? 'border-[#2C3480]/25 bg-[#F1F5FF]/92 text-[#090D1F]'
                    : 'border-white/15 bg-[#070B19]/90 text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    animateToTimeline(getAdjacentMobileWaypoint(timelinePos, -1).pos)
                  }
                  disabled={timelinePos <= 0.05}
                  aria-label="Previous chapter"
                  data-testid="mobile-prev-chapter-btn"
                  className="p-1 rounded-full disabled:opacity-30 active:scale-95 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 whitespace-nowrap">
                  {mobileActiveWaypoint.label} · {mobileChapterIdx + 1}/{MOBILE_CHAPTER_WAYPOINTS.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    animateToTimeline(getAdjacentMobileWaypoint(timelinePos, 1).pos)
                  }
                  aria-label="Next chapter"
                  data-testid="mobile-next-chapter-btn"
                  className="p-1 rounded-full disabled:opacity-30 active:scale-95 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </nav>
            )}
          </>
        )}

      {/* =====================================================================
          INTERACTIVE 3D GLB SPEAKER INSPECTOR OVERLAY (Unified Theme, Zero Header Collision)
         ===================================================================== */}
      {show3DModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="DIY Party Box 3D Model Viewer"
          className="fixed inset-0 z-50 bg-black/95 md:backdrop-blur-xl flex flex-col p-2 sm:p-6"
        >
          <div className="flex-1 w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 bg-black shadow-[0_0_90px_rgba(44,52,128,0.45)]">
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-white/50 font-mono text-xs">
                  Loading 3D Engine...
                </div>
              }
            >
              <SpeakerViewport3D onClose={() => setShow3DModal(false)} />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* =====================================================================
          WLED STUDIO — VIRTUAL DUAL-SPEAKER CONTROL & LIVE 3D SIMULATION
         ===================================================================== */}
      {showWledModal && (
        <React.Suspense fallback={null}>
          <WledStudioModal onClose={() => setShowWledModal(false)} />
        </React.Suspense>
      )}

      {/* =====================================================================
          PHOTO & VIDEO GALLERY MODAL (Accessible from Hero Shortcut)
         ===================================================================== */}
      {showGalleryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Build Photo and Video Gallery"
          className="fixed inset-0 z-50 bg-[#0B0D10]"
        >
          <React.Suspense fallback={null}>
            <FocusSpeakerCarousel
              active={true}
              onCloseModal={() => setShowGalleryModal(false)}
            />
          </React.Suspense>
        </div>
      )}
    </div>
  );
}
