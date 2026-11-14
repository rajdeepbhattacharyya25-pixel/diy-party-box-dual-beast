import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FocusMediaItem,
  SPEAKER_GALLERY_ITEMS,
  DEFAULT_FOCUS_CAROUSEL_CONFIG,
  wrapCarouselIndex,
  circularCarouselOffset,
  computeCarouselSlot,
  computeCarouselFitScale,
} from '../kinetic/focusCarouselEngine';
import {
  Play,
  Pause,
  VolumeX,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  X,
} from 'lucide-react';

export interface FocusSpeakerCarouselProps {
  items?: FocusMediaItem[];
  cardWidth?: number;
  ratio?: number;
  sideSize?: number;
  gap?: number;
  sideCount?: number;
  blurStep?: number;
  sideGrey?: number;
  active?: boolean;
  onBackToArchive?: () => void;
  onCloseModal?: () => void;
  className?: string;
}

const SNAP = 6; // critically damped spring speed
const WHEEL_STEP = 110; // wheel distance per card, px
const THROW_CUTOFF = 70; // wheel delta threshold for throw vs single step
const DRAG_SPAN = 240; // drag distance per card, px (before fit scaling)

export default function FocusSpeakerCarousel({
  items = SPEAKER_GALLERY_ITEMS,
  cardWidth = DEFAULT_FOCUS_CAROUSEL_CONFIG.cardWidth,
  ratio = DEFAULT_FOCUS_CAROUSEL_CONFIG.ratio,
  sideSize = DEFAULT_FOCUS_CAROUSEL_CONFIG.sideSize,
  gap = DEFAULT_FOCUS_CAROUSEL_CONFIG.gap,
  sideCount = DEFAULT_FOCUS_CAROUSEL_CONFIG.sideCount,
  blurStep = DEFAULT_FOCUS_CAROUSEL_CONFIG.blurStep,
  sideGrey = DEFAULT_FOCUS_CAROUSEL_CONFIG.sideGrey,
  active = true,
  onBackToArchive,
  onCloseModal,
  className = '',
}: FocusSpeakerCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mediaWrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const captionRef = useRef<HTMLDivElement>(null);
  const stepByDeltaRef = useRef<(delta: number, customSnap?: number) => void>(() => {});
  const stepToNearestRef = useRef<(targetIndex: number, customSnap?: number) => void>(() => {});

  // Persistent physics refs so toggling mute, play/pause, or parent props never resets scroll position to 0
  const posRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const aimRef = useRef<number | null>(0);
  const shownRef = useRef<number>(0);
  const activeRef = useRef<boolean>(active);
  const itemsRef = useRef<FocusMediaItem[]>(items);

  activeRef.current = active;
  itemsRef.current = items;

  const [focus, setFocus] = useState<number>(0);
  const [fit, setFit] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const n = items.length;
  const cardHeight = cardWidth / ratio;
  const currentItem = items[focus] ?? items[0];

  // Keep all video elements synced with muted state (muted by default = true)
  useEffect(() => {
    for (const video of videoRefs.current) {
      if (video) {
        video.muted = isMuted;
      }
    }
  }, [isMuted]);

  // Pause any non-focused video when focus changes or section leaves view
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      video.muted = isMuted;
      if (!active || idx !== focus) {
        if (!video.paused) {
          video.pause();
        }
      }
    });
    setPlayingIndex((prev) => (prev !== null && prev === focus && active ? prev : null));
  }, [focus, active, isMuted]);

  const toggleVideoPlayPause = useCallback(
    (index: number, e?: React.MouseEvent | React.PointerEvent) => {
      if (e) {
        e.stopPropagation();
      }
      const video = videoRefs.current[index];
      if (!video) return;
      video.muted = isMuted;

      if (video.paused) {
        if (video.readyState === 0) {
          video.load();
        }
        const playPromise = video.play();
        setPlayingIndex(index);
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setPlayingIndex(video.paused ? null : index);
          });
        }
      } else {
        video.pause();
        setPlayingIndex(null);
      }
    },
    [isMuted]
  );

  const toggleVideoPlayPauseRef = useRef(toggleVideoPlayPause);
  toggleVideoPlayPauseRef.current = toggleVideoPlayPause;

  const toggleVideoMute = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsMuted((prev) => {
      const next = !prev;
      for (const video of videoRefs.current) {
        if (video) {
          video.muted = next;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !n) return;

    const cards = cardRefs.current.slice(0, n);
    const mediaWraps = mediaWrapRefs.current.slice(0, n);
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const state = {
      stiff: 0,
      held: false,
      moved: false,
      grabX: 0,
      grabPos: 0,
    };

    const trail: { x: number; t: number }[] = [];
    let scale = 1;
    let raf = 0;
    let last = 0;

    const paint = () => {
      const nextFocus = wrapCarouselIndex(Math.round(posRef.current), n);
      if (nextFocus !== shownRef.current) {
        shownRef.current = nextFocus;
        setFocus(nextFocus);
      }

      const cap = captionRef.current;
      if (cap) {
        const d = Math.min(
          1,
          Math.abs(circularCarouselOffset(shownRef.current, posRef.current, n)) * 2.5
        );
        cap.style.opacity = `${Number((1 - d).toFixed(3))}`;
      }

      for (let i = 0; i < n; i++) {
        const el = cards[i];
        if (!el) continue;
        const o = circularCarouselOffset(i, posRef.current, n);
        const s = computeCarouselSlot(o, {
          cardWidth,
          ratio,
          sideSize,
          gap,
          sideCount,
          blurStep,
          sideGrey,
        });

        const mediaWrap = mediaWraps[i];
        if (s.alpha <= 0.01) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
          if (mediaWrap) mediaWrap.style.filter = 'none';
          continue;
        }

        el.style.visibility = 'visible';
        el.style.transform = `translate3d(${(s.x * scale).toFixed(1)}px, 0px, 0px) scale(${(
          s.size * scale
        ).toFixed(4)})`;
        el.style.opacity = `${s.alpha}`;
        el.style.zIndex = `${s.zIndex}`;
        el.style.pointerEvents = s.alpha > 0.05 ? 'auto' : 'none';

        if (mediaWrap) {
          const isNarrowMobile =
            typeof window !== 'undefined' && window.innerWidth < 768;
          if (s.grey > 0.01 || s.blur > 0.05) {
            mediaWrap.style.filter = isNarrowMobile
              ? `grayscale(${s.grey}) brightness(${s.dim})`
              : `grayscale(${s.grey}) brightness(${s.dim}) blur(${s.blur}px)`;
          } else {
            mediaWrap.style.filter = 'none';
          }
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (aimRef.current !== null) {
        const w = state.stiff;
        const d = posRef.current - aimRef.current;
        velRef.current += (-w * w * d - 2 * w * velRef.current) * dt;
        posRef.current += velRef.current * dt;
        if (Math.abs(d) < 0.001 && Math.abs(velRef.current) < 0.01) {
          posRef.current = aimRef.current;
          velRef.current = 0;
          aimRef.current = null;
        }
      } else {
        posRef.current += velRef.current * dt;
        velRef.current *= Math.pow(0.18, dt);
        if (Math.abs(velRef.current) < 1.5) {
          aimRef.current = Math.round(posRef.current + velRef.current * 0.18);
          state.stiff = SNAP * 1.1;
        }
      }

      paint();
      if (aimRef.current !== null || velRef.current !== 0) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const stepTo = (to: number, snap = SNAP) => {
      if (still) {
        posRef.current = to;
        velRef.current = 0;
        aimRef.current = null;
        paint();
        return;
      }
      aimRef.current = to;
      state.stiff = snap * 1.4;
      wake();
    };

    stepByDeltaRef.current = (delta: number, customSnap = SNAP) => {
      const base = aimRef.current ?? Math.round(posRef.current);
      stepTo(base + delta, customSnap);
    };

    stepToNearestRef.current = (targetIndex: number, customSnap = SNAP) => {
      const normalized = wrapCarouselIndex(targetIndex, n);
      const base = posRef.current;
      const shortestDelta = circularCarouselOffset(normalized, base, n);
      stepTo(Math.round(base + shortestDelta), customSnap);
    };

    const throwWith = (v: number) => {
      if (still) {
        posRef.current = Math.round(posRef.current + Math.sign(v));
        paint();
        return;
      }
      velRef.current = Math.max(-18, Math.min(18, v));
      aimRef.current = null;
      wake();
    };

    const measure = () => {
      scale = computeCarouselFitScale(
        root.clientWidth,
        cardWidth,
        root.clientHeight,
        ratio
      );
      setFit(scale);
      paint();
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(root);

    let wheelCarry = 0;
    let wheelTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (!activeRef.current) return;

      const dx = e.deltaX;
      const dy = e.deltaY;
      const horizontalIntent = Math.abs(dx) >= Math.abs(dy);

      e.preventDefault();
      e.stopPropagation();

      const d =
        (horizontalIntent ? dx : dy) *
        (e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 300 : 1);

      if (Math.abs(d) > THROW_CUTOFF) {
        wheelCarry = 0;
        throwWith((aimRef.current === null ? velRef.current : 0) + d / 42);
      } else {
        wheelCarry += d;
        clearTimeout(wheelTimer);
        wheelTimer = window.setTimeout(() => {
          wheelCarry = 0;
        }, 180);
        const steps = Math.trunc(wheelCarry / WHEEL_STEP);
        if (steps) {
          wheelCarry -= steps * WHEEL_STEP;
          stepTo((aimRef.current ?? Math.round(posRef.current)) + steps);
        }
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button, a, input, [data-carousel-interactive="true"]')) {
        return;
      }

      state.held = true;
      state.moved = false;
      state.grabX = e.clientX;
      state.grabPos = posRef.current;
      velRef.current = 0;
      aimRef.current = null;
      trail.length = 0;
      trail.push({ x: e.clientX, t: e.timeStamp });
      root.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!state.held) return;
      const dx = e.clientX - state.grabX;
      if (Math.abs(dx) > 5) state.moved = true;
      const span = DRAG_SPAN * scale;
      posRef.current = state.grabPos - dx / span;
      paint();
      const now = e.timeStamp;
      trail.push({ x: e.clientX, t: now });
      while (trail.length > 2 && now - trail[0].t > 90) trail.shift();
    };

    const onUp = (e: PointerEvent) => {
      if (!state.held) return;
      state.held = false;

      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button, a, input, [data-carousel-interactive="true"]')) {
        return;
      }

      const span = DRAG_SPAN * scale;
      const firstSample = trail[0];
      const lastSample = trail[trail.length - 1];
      const dt =
        lastSample && firstSample && e.timeStamp - lastSample.t < 80
          ? (lastSample.t - firstSample.t) / 1000
          : 0;
      const v =
        dt > 0.008 ? -(lastSample.x - firstSample.x) / span / dt : 0;

      if (!state.moved) {
        const hit = targetEl?.closest<HTMLElement>('[data-card]');
        if (hit) {
          const clickedIndex = Number(hit.dataset.card);
          const o = circularCarouselOffset(clickedIndex, posRef.current, n);
          if (Math.abs(o) > 0.2) {
            stepTo(Math.round(posRef.current + o));
          } else if (itemsRef.current[clickedIndex]?.kind === 'video') {
            toggleVideoPlayPauseRef.current(clickedIndex);
          }
          return;
        }
      }

      if (Math.abs(v) > 1.2) {
        throwWith(v);
      } else {
        stepTo(Math.round(posRef.current), SNAP * 1.2);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!activeRef.current) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const d =
        e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      stepTo((aimRef.current ?? Math.round(posRef.current)) + d);
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wheelTimer);
      ro.disconnect();
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [n, cardWidth, ratio, sideSize, gap, sideCount, blurStep, sideGrey]);

  const handleStepDelta = (delta: number) => {
    stepByDeltaRef.current(delta, SNAP);
  };

  const isCurrentVideo = currentItem?.kind === 'video';
  const isCurrentVideoPlaying = isCurrentVideo && playingIndex === focus;

  return (
    <div
      data-testid="focus-speaker-carousel"
      data-focused-index={focus}
      data-focused-kind={currentItem?.kind}
      data-infinite-loop="true"
      className={`relative w-full h-full flex flex-col justify-between bg-[#0B0D10] text-zinc-100 px-3.5 sm:px-10 md:px-14 pt-3 sm:pt-4 pb-3 sm:pb-4 select-none overflow-clip ${className}`}
    >
      {/* Top Header Bar — Clean Developer Workbench Layout */}
      <header className="relative z-20 w-full max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-zinc-800 pb-2.5 sm:pb-3">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-wider text-zinc-400">
            <span>06 · BUILD PHOTOS &amp; VIDEOS</span>
            <span aria-hidden="true">/</span>
            <span className="tabular-nums text-zinc-200">
              {String(focus + 1).padStart(2, '0')} of {String(n).padStart(2, '0')}
            </span>
          </div>
          <h2 className="font-sans font-semibold text-lg sm:text-2xl md:text-[26px] text-zinc-100 tracking-tight leading-tight">
            Finished Build: Photos &amp; Test Videos
          </h2>
        </div>

        {/* Infinite Navigation & Close Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleStepDelta(-1)}
              aria-label="Previous media item"
              data-testid="carousel-prev-btn"
              className="p-2 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStepDelta(1)}
              aria-label="Next media item"
              data-testid="carousel-next-btn"
              className="p-2 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onBackToArchive && (
            <button
              type="button"
              onClick={onBackToArchive}
              data-testid="back-to-archive-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-xs font-mono text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Previous Chapter</span>
            </button>
          )}

          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              aria-label="Close photo and video gallery"
              data-testid="close-gallery-modal-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-100 hover:bg-white text-xs font-mono font-semibold text-zinc-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>
      </header>

      {/* Center Focus Carousel Stage */}
      <div
        ref={rootRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Finished Speaker Photos and Videos"
        data-carousel-wheel-zone="true"
        className="relative z-10 flex-1 min-h-0 w-full flex flex-col items-center justify-center outline-none cursor-grab active:cursor-grabbing touch-none"
      >
        <div
          className="relative flex w-full items-center justify-center"
          style={{ height: Math.round(cardHeight * fit) }}
        >
          {items.map((item, i) => {
            const isFocused = i === focus;
            const isVideo = item.kind === 'video';
            const isThisVideoPlaying = isVideo && playingIndex === i;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${item.title}`}
                data-card={i}
                data-testid={`focus-carousel-card-${i}`}
                data-media-kind={item.kind}
                data-is-focused={isFocused ? 'true' : 'false'}
                style={{ width: cardWidth, height: cardHeight }}
                className={`absolute overflow-hidden rounded-md border transition-colors duration-200 ${
                  isFocused
                    ? 'border-zinc-400/75 shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
                    : 'border-zinc-800 shadow-[0_10px_28px_rgba(0,0,0,0.6)]'
                } bg-[#12151B]`}
              >
                {/* Inner Media Wrapper — filter controlled directly by carousel paint() */}
                <div
                  ref={(el) => {
                    mediaWrapRefs.current[i] = el;
                  }}
                  data-testid={`focus-carousel-media-wrap-${i}`}
                  className="relative h-full w-full"
                >
                  {item.kind === 'image' ? (
                    <img
                      src={item.src}
                      alt={item.title}
                      decoding="async"
                      loading="lazy"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="pointer-events-none block h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el;
                        if (el) {
                          el.muted = isMuted;
                        }
                      }}
                      src={item.src}
                      poster={item.posterSrc}
                      muted={isMuted}
                      loop
                      playsInline
                      preload={
                        Math.abs(circularCarouselOffset(i, focus, n)) <= 1
                          ? 'auto'
                          : 'metadata'
                      }
                      data-testid={`focus-carousel-video-${i}`}
                      onLoadedMetadata={(e) => {
                        e.currentTarget.muted = isMuted;
                      }}
                      onPlay={() => setPlayingIndex(i)}
                      onPause={() =>
                        setPlayingIndex((prev) => (prev === i ? null : prev))
                      }
                      className="pointer-events-none block h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Top Subtle Media Type Readout on Video Card */}
                {isVideo && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 px-3 pt-2.5 pb-6 bg-gradient-to-b from-black/75 to-transparent flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-zinc-200">
                    <span>VIDEO</span>
                    <span className="text-zinc-300">
                      {isThisVideoPlaying ? 'PLAYING' : 'PAUSED'} · {isMuted ? 'MUTED' : 'SOUND ON'}
                    </span>
                  </div>
                )}

                {/* Interactive Video Controls Overlaid on Focused Video Card */}
                {isVideo && isFocused && (
                  <div
                    data-carousel-interactive="true"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute inset-x-0 bottom-0 z-20 p-3 bg-gradient-to-t from-black/95 via-black/65 to-transparent flex items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => toggleVideoPlayPause(i, e)}
                      data-testid="carousel-video-play-toggle"
                      aria-label={
                        isThisVideoPlaying
                          ? `Pause ${item.title}`
                          : `Play ${item.title}`
                      }
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-xs font-mono font-semibold text-zinc-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isThisVideoPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Video</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={toggleVideoMute}
                      data-testid="carousel-video-mute-toggle"
                      aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-zinc-700 bg-zinc-900/95 hover:bg-zinc-800 text-xs font-mono text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Muted</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-zinc-100" />
                          <span>Sound On</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Center Play Affordance Icon on Unfocused Video Cards */}
                {isVideo && !isFocused && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-md bg-black/75 border border-zinc-600/80 flex items-center justify-center text-zinc-100">
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Clean Technical Under-Card Caption Block */}
        <div
          ref={captionRef}
          data-testid="focus-carousel-caption-bar"
          style={{ maxWidth: Math.max(340, Math.min(560, cardWidth * fit + 210)) }}
          className="mt-3.5 w-full px-1 transition-opacity duration-150 shrink-0"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <span
              data-testid="focus-carousel-active-title"
              className="font-sans font-medium text-sm text-zinc-100"
            >
              {currentItem?.title}
            </span>
            <span
              data-testid="focus-carousel-active-caption"
              className="font-sans text-xs text-zinc-400"
            >
              {currentItem?.caption}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] font-mono text-zinc-500 whitespace-nowrap">
            <span>{currentItem?.metaSpec}</span>
            <span>
              {isCurrentVideo
                ? `${isCurrentVideoPlaying ? 'Playing' : 'Paused'} · ${
                    isMuted ? 'Muted' : 'Sound On'
                  }`
                : 'Build Photo'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Quick-Index Strip & Interaction Hint */}
      <footer className="relative z-20 w-full max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4 pt-2 sm:pt-2.5 border-t border-zinc-800 text-[10px] sm:text-[11px] text-zinc-500">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-zinc-200 font-medium whitespace-nowrap shrink-0">DIY Party Box</span>
          <span aria-hidden="true">/</span>
          <span className="sm:hidden">Swipe or tap card</span>
          <span className="hidden sm:inline">Drag, scroll, or click a card to focus</span>
        </div>

        {/* 10-Item Direct Index Selector */}
        <nav
          aria-label="Carousel slide selector"
          className="flex items-center gap-1.5"
        >
          {items.map((item, idx) => {
            const isSelected = idx === focus;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => stepToNearestRef.current(idx, SNAP)}
                aria-label={`Focus item ${idx + 1}: ${item.title}`}
                aria-current={isSelected ? 'true' : undefined}
                data-testid={`carousel-dot-${idx}`}
                className={`h-1.5 rounded-sm transition-all cursor-pointer ${
                  isSelected
                    ? 'w-6 bg-zinc-100'
                    : item.kind === 'video'
                    ? 'w-2.5 bg-zinc-500 hover:bg-zinc-300'
                    : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
