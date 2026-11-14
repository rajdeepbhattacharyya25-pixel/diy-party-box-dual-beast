import React, { useEffect, useRef } from 'react';
import { VisualRenderMode } from './ZeninSpeakerVisuals';

interface TrailNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const TRAIL_COUNT = 16;

/**
 * Animated Topographic Soundwave Contour Lines (Inspired by landonorris.com)
 * - Base mode: subtle dark Cobalt Blue Deep (#2C3480) acoustic elevation contours.
 * - Reveal mode: bright electric Cobalt & White topographic soundwaves inside the thick fluid mask.
 */
function TopographicSoundContours({ mode }: { mode: 'base' | 'reveal' }) {
  const isReveal = mode === 'reveal';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 w-full h-full"
    >
      <defs>
        <radialGradient
          id={isReveal ? 'topo-glow-reveal' : 'topo-glow-base'}
          cx="50%"
          cy="52%"
          r="54%"
        >
          <stop
            offset="0%"
            stopColor={isReveal ? '#2563EB' : '#2C3480'}
            stopOpacity={isReveal ? '0.42' : '0.16'}
          />
          <stop
            offset="55%"
            stopColor="#1E296B"
            stopOpacity={isReveal ? '0.22' : '0.05'}
          />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        width="1440"
        height="900"
        fill={`url(#${isReveal ? 'topo-glow-reveal' : 'topo-glow-base'})`}
      />

      {/* Organic Topographic Soundwave Isolines */}
      <g
        fill="none"
        stroke={
          isReveal ? 'rgba(96, 165, 250, 0.48)' : 'rgba(79, 91, 213, 0.13)'
        }
        strokeWidth={isReveal ? '1.4' : '1'}
      >
        <path d="M-120,140 C240,40 480,260 760,130 C1040,0 1240,220 1560,110" />
        <path d="M-120,230 C210,120 490,340 750,210 C1010,80 1250,310 1560,190" />
        <path d="M-120,330 C180,220 470,430 740,300 C1010,170 1260,390 1560,280" />
        <path d="M-120,440 C190,340 460,540 730,410 C1000,280 1240,490 1560,390" />
        <path d="M-120,550 C220,450 480,650 740,520 C1000,390 1230,600 1560,500" />
        <path d="M-120,660 C250,560 510,750 760,630 C1010,510 1240,710 1560,610" />
        <path d="M-120,760 C280,670 530,840 780,730 C1030,620 1260,800 1560,720" />
      </g>

      {/* Concentric Acoustic Pressure Rings Centered Behind the Speaker */}
      <g
        fill="none"
        stroke={
          isReveal ? 'rgba(255, 255, 255, 0.32)' : 'rgba(44, 52, 128, 0.18)'
        }
        strokeWidth={isReveal ? '1.2' : '0.9'}
        strokeDasharray={isReveal ? '8 6' : undefined}
      >
        <ellipse cx="720" cy="470" rx="220" ry="310" />
        <ellipse cx="720" cy="470" rx="310" ry="395" />
        <ellipse cx="720" cy="470" rx="420" ry="485" />
      </g>
    </svg>
  );
}

/**
 * Speaker Anatomy Leveling & Callout Cards from the user's reference design
 * (/public/assets/aistudio/310ca6f3-27ed-4dfc-8caf-96652746b90a_0fc0dd61.png).
 * Rendered exclusively inside the Revealed Layer so they appear only when the cursor
 * moves above them or when the dynamic fluid effect sweeps across the screen.
 */
function SpeakerAnatomyLevelingOverlay() {
  return (
    <>
      {/* LEFT SIDE: "// SPEAKER ANATOMY — Inside the Box" Editorial Block */}
      <div
        data-testid="anatomy-leveling-left"
        className="hidden lg:flex flex-col items-start justify-center absolute right-[calc(100%+2.5rem)] xl:right-[calc(100%+4rem)] top-[32%] w-[270px] xl:w-[325px] text-left pointer-events-none select-none z-30"
      >
        <div className="flex items-center gap-2 text-xs xl:text-sm font-mono tracking-[0.22em] text-white/90 uppercase mb-2.5">
          <span className="text-[#3B82F6] font-bold">//</span>
          <span>FRONT LAYOUT</span>
        </div>
        <h3 className="text-3xl xl:text-[2.75rem] font-bold tracking-tight text-white leading-[1.06] mb-3.5 drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)]">
          Inside the Speaker
        </h3>
        <p className="text-xs xl:text-[15px] text-white/80 leading-relaxed mb-5">
          Two front drivers and an addressable RGB ring mounted in a hand-built
          MDF cabinet.
        </p>
        <div className="w-14 h-[3px] rounded-full bg-[#3B82F6] shadow-[0_0_14px_#3B82F6]" />
      </div>

      {/* SVG ANGLED LEADER LINES & GLOWING DOTS IN EXACT 781x1491 SPEAKER PIXEL SPACE */}
      <svg
        aria-hidden="true"
        viewBox="0 0 781 1491"
        fill="none"
        className="hidden md:block pointer-events-none absolute inset-0 w-full h-full z-30 overflow-visible"
      >
        {/* 1. DYNAMIC SPEAKER LEADER LINE (Upper Driver: dot at 465,385 -> elbow 555,320 -> card edge 865,320) */}
        <polyline
          points="465,385 555,320 865,320"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="465" cy="385" r="16" fill="rgba(59, 130, 246, 0.35)" />
        <circle cx="465" cy="385" r="10.5" fill="rgba(59, 130, 246, 0.78)" />
        <circle cx="465" cy="385" r="6" fill="#FFFFFF" />

        {/* 2. WLED RING LIGHT LEADER LINE (Middle WLED Ring: dot at 535,810 -> elbow 605,760 -> card edge 865,760) */}
        <polyline
          points="535,810 605,760 865,760"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="535" cy="810" r="16" fill="rgba(59, 130, 246, 0.35)" />
        <circle cx="535" cy="810" r="10.5" fill="rgba(59, 130, 246, 0.78)" />
        <circle cx="535" cy="810" r="6" fill="#FFFFFF" />

        {/* 3. WOOFER LEADER LINE (Lower Woofer: dot at 445,1245 -> elbow 535,1180 -> card edge 865,1180) */}
        <polyline
          points="445,1245 535,1180 865,1180"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="445" cy="1245" r="16" fill="rgba(59, 130, 246, 0.35)" />
        <circle cx="445" cy="1245" r="10.5" fill="rgba(59, 130, 246, 0.78)" />
        <circle cx="445" cy="1245" r="6" fill="#FFFFFF" />
      </svg>

      {/* RIGHT SIDE: 3 LEVELING CALLOUT CARDS (DYNAMIC SPEAKER, WLED RING LIGHT, WOOFER) */}
      {/* Card 1: DYNAMIC SPEAKER */}
      <div
        data-testid="leveling-card-dynamic-speaker"
        className="hidden md:flex items-center gap-3.5 absolute left-[calc(100%+2.6rem)] xl:left-[calc(100%+3.4rem)] top-[16.5%] w-[285px] xl:w-[335px] rounded-2xl border border-[#3B82F6]/65 bg-[#060A17]/95 px-4 py-3.5 shadow-[0_0_32px_rgba(59,130,246,0.3)] z-30"
      >
        <div className="w-12 h-12 rounded-xl border border-white/20 bg-[#0B1228] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7">
            <circle
              cx="18"
              cy="18"
              r="13"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle
              cx="18"
              cy="18"
              r="10"
              stroke="rgba(147,197,253,0.75)"
              strokeWidth="1.1"
            />
            <circle
              cx="18"
              cy="18"
              r="4.2"
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
          </svg>
        </div>
        <div className="w-px h-10 bg-white/15 shrink-0" />
        <div className="text-left">
          <div className="text-xs xl:text-sm font-bold tracking-wider text-[#38BDF8] uppercase">
            UPPER SPEAKER (7 CM)
          </div>
          <p className="text-[11px] xl:text-xs text-white/85 leading-snug mt-0.5">
            Handles mid and high frequencies on the upper front panel.
          </p>
        </div>
      </div>

      {/* Card 2: WLED RING LIGHT */}
      <div
        data-testid="leveling-card-wled-ring"
        className="hidden md:flex items-center gap-3.5 absolute left-[calc(100%+2.6rem)] xl:left-[calc(100%+3.4rem)] top-[45.5%] w-[285px] xl:w-[335px] rounded-2xl border border-[#3B82F6]/65 bg-[#060A17]/95 px-4 py-3.5 shadow-[0_0_32px_rgba(59,130,246,0.3)] z-30"
      >
        <div className="w-12 h-12 rounded-xl border border-white/20 bg-[#0B1228] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7">
            <circle
              cx="18"
              cy="18"
              r="11"
              stroke="#3B82F6"
              strokeWidth="4"
              className="drop-shadow-[0_0_8px_#3B82F6]"
            />
            <circle
              cx="18"
              cy="18"
              r="11"
              stroke="#93C5FD"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
        <div className="w-px h-10 bg-white/15 shrink-0" />
        <div className="text-left">
          <div className="text-xs xl:text-sm font-bold tracking-wider text-[#38BDF8] uppercase">
            16-LED RGB RING
          </div>
          <p className="text-[11px] xl:text-xs text-white/85 leading-snug mt-0.5">
            16 addressable LEDs behind a frosted ring, controlled by an ESP32
            running WLED.
          </p>
        </div>
      </div>

      {/* Card 3: WOOFER */}
      <div
        data-testid="leveling-card-woofer"
        className="hidden md:flex items-center gap-3.5 absolute left-[calc(100%+2.6rem)] xl:left-[calc(100%+3.4rem)] top-[73%] w-[285px] xl:w-[335px] rounded-2xl border border-[#3B82F6]/65 bg-[#060A17]/95 px-4 py-3.5 shadow-[0_0_32px_rgba(59,130,246,0.3)] z-30"
      >
        <div className="w-12 h-12 rounded-xl border border-white/20 bg-[#0B1228] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7">
            <circle
              cx="18"
              cy="18"
              r="12.5"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle
              cx="18"
              cy="18"
              r="4.5"
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
          </svg>
        </div>
        <div className="w-px h-10 bg-white/15 shrink-0" />
        <div className="text-left">
          <div className="text-xs xl:text-sm font-bold tracking-wider text-[#38BDF8] uppercase">
            LOWER WOOFER (5 CM)
          </div>
          <p className="text-[11px] xl:text-xs text-white/85 leading-snug mt-0.5">
            Handles low frequencies together with the side-mounted passive
            radiator.
          </p>
        </div>
      </div>
    </>
  );
}

interface RandomSweepTrajectory {
  active: boolean;
  startTime: number;
  duration: number;
  nextLaunchTime: number;
  p0x: number;
  p0y: number;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

/**
 * Generates a random screen-to-screen Bézier trajectory starting from a random edge/point
 * of the viewport and sweeping across the speaker & leveling zone to another random point,
 * matching the McLaren F1 Lando Norris website hero behavior.
 */
function createRandomSweep(
  w: number,
  h: number,
  now: number,
  sweepIndex: number
): RandomSweepTrajectory {
  const mode = sweepIndex % 4;
  let p0x = 0;
  let p0y = 0;
  let p2x = 0;
  let p2y = 0;

  if (mode === 0) {
    // Left side -> Right side across speaker & callouts
    p0x = w * (0.04 + Math.random() * 0.14);
    p0y = h * (0.2 + Math.random() * 0.6);
    p2x = w * (0.78 + Math.random() * 0.18);
    p2y = h * (0.2 + Math.random() * 0.6);
  } else if (mode === 1) {
    // Right side -> Left side across callouts & speaker
    p0x = w * (0.82 + Math.random() * 0.14);
    p0y = h * (0.18 + Math.random() * 0.64);
    p2x = w * (0.06 + Math.random() * 0.16);
    p2y = h * (0.22 + Math.random() * 0.56);
  } else if (mode === 2) {
    // Top-Left / Top -> Bottom-Right across speaker
    p0x = w * (0.18 + Math.random() * 0.35);
    p0y = h * (0.08 + Math.random() * 0.14);
    p2x = w * (0.55 + Math.random() * 0.32);
    p2y = h * (0.76 + Math.random() * 0.16);
  } else {
    // Bottom-Left / Bottom -> Top-Right across speaker & callouts
    p0x = w * (0.15 + Math.random() * 0.32);
    p0y = h * (0.78 + Math.random() * 0.14);
    p2x = w * (0.58 + Math.random() * 0.3);
    p2y = h * (0.14 + Math.random() * 0.22);
  }

  // Control point passes near the central speaker / anatomy callout zone
  const p1x = w * (0.46 + (Math.random() - 0.5) * 0.24);
  const p1y = h * (0.48 + (Math.random() - 0.5) * 0.26);

  const duration = 2350 + Math.random() * 450;

  return {
    active: true,
    startTime: now,
    duration,
    nextLaunchTime: now + duration + 1650,
    p0x,
    p0y,
    p1x,
    p1y,
    p2x,
    p2y,
  };
}

interface LandoCursorRevealHeroProps {
  visualMode: VisualRenderMode;
  envOpacity: number;
  envTranslateY: number;
  envScale: number;
  speakerScale?: number;
  speakerTranslateX?: number;
  speakerTranslateY?: number;
  speakerOpacity?: number;
  heroChromeOpacity?: number;
  cobaltWledIntensity?: number;
  active?: boolean;
  disableXRaySweep?: boolean;
  useLightweightEffects?: boolean;
  renderBaseHeadline: () => React.ReactNode;
  renderRevealHeadline: () => React.ReactNode;
}

export default function LandoCursorRevealHero({
  visualMode,
  envOpacity,
  envTranslateY,
  envScale,
  speakerScale,
  speakerTranslateX = 0,
  speakerTranslateY,
  speakerOpacity,
  heroChromeOpacity = 1,
  cobaltWledIntensity = 0,
  active = true,
  disableXRaySweep = false,
  useLightweightEffects = false,
  renderBaseHeadline,
  renderRevealHeadline,
}: LandoCursorRevealHeroProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const revealedLayerRef = useRef<HTMLDivElement | null>(null);

  const pointerRef = useRef({
    x: 720,
    y: 450,
    lastMoveTime: -99999,
    isInside: false,
    presence: 0,
  });

  const sweepCountRef = useRef<number>(0);
  const sweepRef = useRef<RandomSweepTrajectory>({
    active: false,
    startTime: 0,
    duration: 1950,
    nextLaunchTime: 1800, // First show normal default white speaker cleanly, then launch random fluid sweep
    p0x: 160,
    p0y: 450,
    p1x: 720,
    p1y: 440,
    p2x: 1260,
    p2y: 480,
  });

  const nodesRef = useRef<TrailNode[]>(
    Array.from({ length: TRAIL_COUNT }, () => ({
      x: 720,
      y: 450,
      vx: 0,
      vy: 0,
      r: 0,
    }))
  );
  const lastDomRef = useRef<{
    opacity: string;
    maskImage: string;
  }>({
    opacity: '0',
    maskImage: 'none',
  });

  useEffect(() => {
    if (disableXRaySweep) return;
    const updateFromClientXY = (clientX: number, clientY: number) => {
      const stageEl = stageRef.current;
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      const newX = clientX - rect.left;
      const newY = clientY - rect.top;

      // Snap trail nodes near pointer if waking from complete idle
      if (pointerRef.current.presence < 0.04) {
        for (const n of nodesRef.current) {
          n.x = newX;
          n.y = newY;
          n.r = 140;
        }
      }

      pointerRef.current.x = newX;
      pointerRef.current.y = newY;
      pointerRef.current.lastMoveTime = performance.now();
      pointerRef.current.isInside = true;
      // Pause autonomous sweep while user is actively moving the mouse
      sweepRef.current.active = false;
      sweepRef.current.nextLaunchTime = performance.now() + 3000;
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      updateFromClientXY(e.clientX, e.clientY);
    };
    const onWindowPointerMove = (e: PointerEvent) => {
      updateFromClientXY(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', onWindowMouseMove, { passive: true });
    window.addEventListener('pointermove', onWindowPointerMove, {
      passive: true,
    });
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('pointermove', onWindowPointerMove);
    };
  }, [disableXRaySweep]);

  useEffect(() => {
    if (!active || disableXRaySweep) {
      pointerRef.current.presence = 0;
      lastDomRef.current.opacity = '0';
      if (revealedLayerRef.current) {
        revealedLayerRef.current.style.opacity = '0';
      }
      return;
    }
    // Start the autonomous sweep cleanly AFTER the preloader zoom-in settles
    sweepRef.current.active = false;
    sweepRef.current.nextLaunchTime = performance.now() + 1400;

    let rafId = 0;

    const tick = (now: number) => {
      const stageEl = stageRef.current;
      const revealedEl = revealedLayerRef.current;
      const w = stageEl ? stageEl.clientWidth || 1440 : 1440;
      const h = stageEl ? stageEl.clientHeight || 900 : 900;

      const timeSinceUserMove = now - pointerRef.current.lastMoveTime;
      const isUserControlling =
        pointerRef.current.isInside && timeSinceUserMove < 1800;

      let targetX = pointerRef.current.x;
      let targetY = pointerRef.current.y;
      let targetPresence = 0;

      if (isUserControlling) {
        targetPresence = 1;
        targetX = pointerRef.current.x;
        targetY = pointerRef.current.y;
      } else {
        // Autonomous McLaren F1 / Lando Norris style periodic random screen sweep
        const sweep = sweepRef.current;
        if (!sweep.active && now >= sweep.nextLaunchTime) {
          const nextSweep = createRandomSweep(
            w,
            h,
            now,
            sweepCountRef.current++
          );
          sweepRef.current = nextSweep;
          for (const n of nodesRef.current) {
            n.x = nextSweep.p0x;
            n.y = nextSweep.p0y;
            n.vx = 0;
            n.vy = 0;
            n.r = 65;
          }
        }

        if (sweepRef.current.active) {
          const s = sweepRef.current;
          const rawT = (now - s.startTime) / s.duration;
          if (rawT >= 1) {
            s.active = false;
            targetPresence = 0;
          } else {
            const t =
              rawT < 0.5
                ? 2 * rawT * rawT
                : 1 - Math.pow(-2 * rawT + 2, 2) / 2;
            const inv = 1 - t;
            targetX =
              inv * inv * s.p0x + 2 * inv * t * s.p1x + t * t * s.p2x;
            targetY =
              inv * inv * s.p0y + 2 * inv * t * s.p1y + t * t * s.p2y;

            if (rawT < 0.12) {
              targetPresence = rawT / 0.12;
            } else if (rawT > 0.85) {
              targetPresence = (1 - rawT) / 0.15;
            } else {
              targetPresence = 1;
            }
          }
        }
      }

      const diffP = targetPresence - pointerRef.current.presence;
      if (Math.abs(diffP) < 0.004) {
        pointerRef.current.presence = targetPresence;
      } else {
        pointerRef.current.presence +=
          diffP * (targetPresence > pointerRef.current.presence ? 0.28 : 0.14);
      }

      const presence = pointerRef.current.presence;
      const nodes = nodesRef.current;
      const gradientParts: string[] = [];

      for (let i = 0; i < TRAIL_COUNT; i++) {
        const node = nodes[i];
        const leaderX = i === 0 ? targetX : nodes[i - 1].x;
        const leaderY = i === 0 ? targetY : nodes[i - 1].y;

        const spring = i === 0 ? 0.38 : Math.max(0.16, 0.38 - i * 0.013);
        const dx = leaderX - node.x;
        const dy = leaderY - node.y;

        if (Math.hypot(dx, dy) < 0.25) {
          node.x = leaderX;
          node.y = leaderY;
          node.vx = 0;
          node.vy = 0;
        } else {
          node.vx = dx * spring;
          node.vy = dy * spring;
          node.x += node.vx;
          node.y += node.vy;
        }

        const speed = Math.hypot(node.vx, node.vy);
        // Thick, strong fluid taper so the liquid stream is bold and wide across the speaker
        const taper = 1 - (i / TRAIL_COUNT) * 0.46;
        const targetRadius =
          presence > 0.01
            ? Math.min(255, 175 + speed * 2.5) * taper * (0.72 + 0.28 * presence)
            : 0;

        if (Math.abs(targetRadius - node.r) < 0.3) {
          node.r = targetRadius;
        } else {
          node.r += (targetRadius - node.r) * 0.28;
        }

        const rPx = Math.round(node.r);
        if (rPx > 8 && presence > 0.01) {
          const xPx = Math.round(node.x);
          const yPx = Math.round(node.y);
          // 100% solid thick core (0% -> 65%) with smooth feathered outer rim (65% -> 100%)
          gradientParts.push(
            `radial-gradient(circle ${rPx}px at ${xPx}px ${yPx}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 64%, rgba(0,0,0,0.82) 78%, rgba(0,0,0,0.34) 90%, rgba(0,0,0,0) 100%)`
          );
        }
      }

      if (revealedEl) {
        const strongOpacity =
          presence < 0.01 || gradientParts.length === 0
            ? '0'
            : Math.min(1, presence * 1.05).toFixed(2);
        const nextMask =
          gradientParts.length > 0 ? gradientParts.join(', ') : 'none';

        if (lastDomRef.current.opacity !== strongOpacity) {
          revealedEl.style.opacity = strongOpacity;
          lastDomRef.current.opacity = strongOpacity;
        }
        if (lastDomRef.current.maskImage !== nextMask) {
          revealedEl.style.maskImage = nextMask;
          revealedEl.style.webkitMaskImage = nextMask;
          lastDomRef.current.maskImage = nextMask;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, disableXRaySweep]);

  const handleMouseLeave = () => {
    pointerRef.current.isInside = false;
  };

  // Shared exact unwarped speaker dimensions (781:1491 aspect ratio) for 100% circular drivers & end-to-end alignment
  const speakerBoxClasses =
    'relative h-[48vh] sm:h-[58vh] md:h-[68vh] max-h-[650px] aspect-[781/1491] flex items-center justify-center';

  const effectiveSpeakerScale = speakerScale ?? envScale;
  const effectiveSpeakerTranslateX = speakerTranslateX;
  const effectiveSpeakerTranslateY = speakerTranslateY ?? envTranslateY;
  const effectiveSpeakerOpacity = speakerOpacity ?? envOpacity;
  const showCobaltRing = cobaltWledIntensity > 0.005;

  return (
    <div
      ref={stageRef}
      onMouseLeave={handleMouseLeave}
      onPointerLeave={handleMouseLeave}
      data-testid="lando-cursor-reveal-hero"
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
    >
      {/* ===================================================================
          BASE LAYER (Normal Speaker With Default White WLED Ring + Monumental Headline)
         =================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: heroChromeOpacity }}
      >
        <TopographicSoundContours mode="base" />
      </div>

      {/* Monumental Crisp White Serif "DIY Party Box" Headline */}
      <div
        className="relative z-10 -mt-6 sm:-mt-12 md:-mt-20 select-none pointer-events-none px-4"
        style={{ opacity: heroChromeOpacity }}
      >
        {renderBaseHeadline()}
      </div>

      {/* Center Hero Speaker: Continuous Centerpiece (Default White WLED Ring -> Zoomed Cobalt WLED -> Upper-Left Exit) */}
      <div
        className="relative z-20 mt-2 sm:-mt-10 md:-mt-24 flex flex-col items-center justify-center w-full pointer-events-none"
        style={{
          opacity: effectiveSpeakerOpacity,
          transform: `translate3d(${effectiveSpeakerTranslateX}px, ${effectiveSpeakerTranslateY}px, 0px) scale3d(${effectiveSpeakerScale}, ${effectiveSpeakerScale}, 1)`,
          willChange: 'transform, opacity',
        }}
      >
        <div className={speakerBoxClasses}>
          {/* Subtle atmospheric backlight behind the normal speaker (fades gently into Chapter 1 marquee) */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -inset-8 rounded-full ${
              useLightweightEffects ? '' : 'blur-3xl'
            }`}
            style={{
              opacity: 0.75 * heroChromeOpacity,
              background: useLightweightEffects
                ? 'radial-gradient(circle, rgba(44, 52, 128, 0.48) 0%, rgba(44, 52, 128, 0.18) 45%, rgba(0, 0, 0, 0) 76%)'
                : 'radial-gradient(circle, rgba(44, 52, 128, 0.55) 0%, rgba(44, 52, 128, 0.25) 55%, rgba(0, 0, 0, 0) 80%)',
            }}
          />
          <picture className="relative z-10 w-full h-full block">
            <source
              type="image/webp"
              srcSet={
                visualMode === 'photo'
                  ? '/assets/aistudio/R_front_ac80fc12.webp'
                  : '/assets/renders/hero_speaker_default_white.webp'
              }
            />
            <img
              src={
                visualMode === 'photo'
                  ? '/assets/aistudio/R_front_ac80fc12.jpeg'
                  : '/assets/renders/hero_speaker_default_white.png'
              }
              width={781}
              height={1491}
              alt="DIY Party Box speaker front view with white LED ring"
              decoding="async"
              fetchPriority="high"
              data-testid="hero-base-speaker-img"
              className={`w-full h-full object-fill rounded-[10px] ${
                useLightweightEffects
                  ? 'shadow-[0_18px_36px_rgba(0,0,0,0.88)]'
                  : 'drop-shadow-[0_26px_50px_rgba(0,0,0,0.96)]'
              }`}
            />
          </picture>

          {/* Localized Soft Cobalt Blue WLED Ring Shift (Aligned 1:1 with cx=390, cy=798, rInner=132, rOuter=198 in 781x1491 space) */}
          {showCobaltRing && (
            <svg
              aria-hidden="true"
              data-testid="cobalt-wled-ring-overlay"
              viewBox="0 0 781 1491"
              fill="none"
              className="pointer-events-none absolute inset-0 z-20 w-full h-full rounded-[10px]"
            >
              <defs>
                {/* Radial diffuser tint mapped across exact inner (r=132) -> core (r=165) -> outer (r=198) bezel */}
                <radialGradient
                  id="cobalt-wled-diffuser-tint"
                  cx="390"
                  cy="798"
                  r="205"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.62" stopColor="#1B2E8A" stopOpacity="0" />
                  <stop offset="0.67" stopColor="#2643D6" stopOpacity="0.88" />
                  <stop offset="0.81" stopColor="#3B5BFF" stopOpacity="0.96" />
                  <stop offset="0.93" stopColor="#2643D6" stopOpacity="0.88" />
                  <stop offset="0.98" stopColor="#1B2E8A" stopOpacity="0" />
                </radialGradient>

                {/* Faint soft radial light spill localized around the ring bezel */}
                <radialGradient
                  id="cobalt-wled-localized-spill"
                  cx="390"
                  cy="798"
                  r="272"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.41" stopColor="#3B5BFF" stopOpacity="0" />
                  <stop offset="0.50" stopColor="#4F70FF" stopOpacity="0.18" />
                  <stop offset="0.61" stopColor="#5D82FF" stopOpacity="0.28" />
                  <stop offset="0.72" stopColor="#3B5BFF" stopOpacity="0.16" />
                  <stop offset="0.85" stopColor="#24358A" stopOpacity="0.06" />
                  <stop offset="1" stopColor="#1B2666" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Soft radial light spill localized strictly around the ring — preserves matte black fabric */}
              <circle
                cx="390"
                cy="798"
                r="272"
                fill="url(#cobalt-wled-localized-spill)"
                style={{
                  opacity: cobaltWledIntensity * 0.78,
                  mixBlendMode: 'screen',
                }}
              />

              {/* Direct diffuser hue + tonal shift keeping realistic frosted acrylic curvature & grain */}
              <circle
                cx="390"
                cy="798"
                r="165"
                stroke="url(#cobalt-wled-diffuser-tint)"
                strokeWidth="66"
                style={{
                  opacity: cobaltWledIntensity * 0.92,
                  mixBlendMode: 'color',
                }}
              />

              {/* Gentle tonal deepening along ring edges so Cobalt reads luminous yet physical */}
              <circle
                cx="390"
                cy="798"
                r="165"
                stroke="#3353EB"
                strokeWidth="56"
                style={{
                  opacity: cobaltWledIntensity * 0.24,
                  mixBlendMode: 'multiply',
                }}
              />
            </svg>
          )}
        </div>
      </div>

      {/* ===================================================================
          THICK FLUID REVEALED LAYER (Active on Cursor Move OR Periodic Random Sweep)
         =================================================================== */}
      {!disableXRaySweep && (
        <div
          ref={revealedLayerRef}
          aria-hidden="true"
          data-testid="lando-revealed-layer"
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden"
          style={{
            opacity: 0,
          }}
        >
          {/* 1. Illuminated Cobalt & White Topographic Soundwave Contours */}
          <TopographicSoundContours mode="reveal" />

          {/* 2. Revealed Cobalt-Outline "DIY Party Box" Headline */}
          <div className="relative z-10 -mt-12 sm:-mt-16 md:-mt-20 select-none pointer-events-none px-4">
            {renderRevealHeadline()}
          </div>

          {/* 3. End-to-End Aligned Circular X-Ray Speaker + Anatomy Leveling Callouts */}
          <div
            className="relative z-20 -mt-14 sm:-mt-20 md:-mt-24 flex flex-col items-center justify-center w-full"
            style={{
              opacity: envOpacity,
              transform: `translate3d(0px, ${envTranslateY}px, 0px) scale(${envScale})`,
            }}
          >
            <div className={speakerBoxClasses}>
              {/* Electric Blue X-Ray Backlight Bloom */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10 rounded-full blur-3xl opacity-90"
                style={{
                  background:
                    'radial-gradient(circle, rgba(59, 130, 246, 0.55) 0%, rgba(37, 99, 235, 0.28) 55%, rgba(0, 0, 0, 0) 82%)',
                }}
              />

              {/* Unwarped 1:1 Circular X-Ray Speaker Image (781x1491, matches hero_speaker_default_white.png 100% end-to-end) */}
              <picture className="relative z-20 w-full h-full block">
                <source
                  type="image/webp"
                  srcSet="/assets/renders/hero_speaker_xray_aligned.webp"
                />
                <img
                  src="/assets/renders/hero_speaker_xray_aligned.png"
                  width={781}
                  height={1491}
                  alt="Cutaway view showing the speaker drivers and LED ring layout"
                  decoding="async"
                  loading="lazy"
                  data-testid="hero-xray-speaker-img"
                  className="w-full h-full object-fill rounded-[10px] shadow-[0_0_40px_rgba(59,130,246,0.45)]"
                />
              </picture>

              {/* Speaker Anatomy Leveling Callouts (Left "Inside the Box" + Right 3 Driver Cards & Leader Lines) */}
              <SpeakerAnatomyLevelingOverlay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
