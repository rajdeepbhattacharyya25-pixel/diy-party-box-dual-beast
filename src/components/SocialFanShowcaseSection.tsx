import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  INSTAGRAM_JOURNEY_HIGHLIGHT_URL,
  SOCIAL_ACCOUNT_LINKS,
  SOCIAL_FAN_CARDS,
  SOCIAL_JOURNEY_CAPTION,
  SocialCardId,
  SocialFanCardConfig,
  computeCobaltShutterState,
  computeSocialCardHoverTransform,
  computeSocialFanState,
} from '../kinetic/socialFanEngine';
import { ArrowUpRight, Coffee, ArrowUp, ChevronDown } from 'lucide-react';

export interface SocialFanShowcaseSectionProps {
  timelinePos: number;
  viewportSize: { width: number; height: number };
  prefersReducedMotion?: boolean;
  onBackToPartsList?: () => void;
  onJumpToTop?: () => void;
  onJumpToBuildOverview?: () => void;
  onJumpToFooter?: () => void;
  onOpenGallery?: () => void;
  onOpen3DInspector?: () => void;
  onOpenWledStudio?: () => void;
}

function InstagramMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function GitHubMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function LinkedInMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function PlatformIcon({
  card,
  compact,
  isHovered,
}: {
  card: SocialFanCardConfig;
  compact: boolean;
  isHovered: boolean;
}) {
  const boxCls =
    compact ? 'w-7 h-7 sm:w-9 sm:h-9 rounded-lg' : 'w-11 h-11 rounded-xl';
  const iconCls = compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-5 h-5';
  const scaleCls = isHovered ? 'scale-105' : 'scale-100';

  if (card.id === 'instagram') {
    return (
      <div
        className={`${boxCls} ${scaleCls} transition-transform duration-300 bg-gradient-to-br from-[#F58529]/25 via-[#DD2A7B]/25 to-[#8134AF]/30 border border-white/20 flex items-center justify-center text-white`}
      >
        <InstagramMark className={iconCls} />
      </div>
    );
  }
  if (card.id === 'github') {
    return (
      <div
        className={`${boxCls} ${scaleCls} transition-transform duration-300 bg-white/[0.1] border border-white/20 flex items-center justify-center text-white`}
      >
        <GitHubMark className={iconCls} />
      </div>
    );
  }
  if (card.id === 'linkedin') {
    return (
      <div
        className={`${boxCls} ${scaleCls} transition-transform duration-300 bg-[#0A66C2]/30 border border-[#93C5FD]/40 flex items-center justify-center text-[#93C5FD]`}
      >
        <LinkedInMark className={iconCls} />
      </div>
    );
  }
  return (
    <div
      className={`${boxCls} ${scaleCls} transition-transform duration-300 bg-[#FFDD00]/20 border border-[#FFDD00]/55 flex items-center justify-center text-[#FFDD00]`}
    >
      <Coffee className={iconCls} />
    </div>
  );
}

/**
 * Cursor-Triggered Split-Text Glitch Hover Label:
 * Splits text into 3 horizontal clip-path slices on hover/focus (~380ms one-shot),
 * briefly displaces layers horizontally, and snaps cleanly back to original readable text
 * with zero layout shift and full prefers-reduced-motion respect.
 */
function GlitchSplitText({
  text,
  glitchActive,
  glitchTriggerKey,
  reducedMotion,
  tone = 'cobalt',
  className = '',
}: {
  text: string;
  glitchActive: boolean;
  glitchTriggerKey: number;
  reducedMotion: boolean;
  tone?: 'cobalt' | 'dark-on-gold';
  className?: string;
}) {
  const isGlitching = glitchActive && !reducedMotion;

  return (
    <span
      className={`glitch-split-root ${isGlitching ? 'is-glitching' : ''} ${className}`}
      data-glitch-active={isGlitching ? 'true' : 'false'}
      data-glitch-tone={tone}
    >
      <span className="glitch-split-base relative z-10 inline-block">{text}</span>
      {isGlitching && (
        <React.Fragment key={glitchTriggerKey}>
          <span
            aria-hidden="true"
            className="glitch-split-layer glitch-slice-top"
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className="glitch-split-layer glitch-slice-mid"
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className="glitch-split-layer glitch-slice-bot"
          >
            {text}
          </span>
        </React.Fragment>
      )}
    </span>
  );
}

/**
 * PHASE 4: Full Interactive Card Experience, Safe External Links, Hover Lift/Tilt,
 * Cursor-Triggered Split-Text Glitch Hover Effect (~380ms), and Keyboard Accessibility.
 */
export default function SocialFanShowcaseSection({
  timelinePos,
  viewportSize,
  prefersReducedMotion = false,
  onBackToPartsList,
  onJumpToTop,
  onJumpToBuildOverview,
  onJumpToFooter,
  onOpenGallery,
  onOpen3DInspector,
  onOpenWledStudio,
}: SocialFanShowcaseSectionProps) {
  const fanState = computeSocialFanState(
    timelinePos,
    viewportSize.width,
    viewportSize.height,
    prefersReducedMotion
  );
  const {
    metrics,
    fanProgress,
    journeyRevealProgress,
    footerScrollProgress,
    stage,
    cards,
    captionOpacity,
    captionTranslateY,
    captionHeadingReveal,
    captionSubReveal,
    supportEmphasis,
    footerOpacity,
  } = fanState;

  const footerRef = useRef<HTMLElement | null>(null);
  const [footerHeight, setFooterHeight] = useState<number>(210);

  useLayoutEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const measure = () => {
      const next = Math.ceil(el.getBoundingClientRect().height);
      if (next > 0) {
        setFooterHeight(next);
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportSize.width, viewportSize.height]);

  const [hoveredCardId, setHoveredCardId] = useState<SocialCardId | null>(null);
  const [pointerNorm, setPointerNorm] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [glitchCardId, setGlitchCardId] = useState<SocialCardId | null>(null);
  const [glitchKey, setGlitchKey] = useState<number>(0);
  const glitchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (glitchTimerRef.current !== null) {
        window.clearTimeout(glitchTimerRef.current);
      }
    };
  }, []);

  const triggerCardGlitch = (cardId: SocialCardId) => {
    if (prefersReducedMotion) return;
    if (glitchTimerRef.current !== null) {
      window.clearTimeout(glitchTimerRef.current);
    }
    setGlitchCardId(cardId);
    setGlitchKey((prev) => prev + 1);
    glitchTimerRef.current = window.setTimeout(() => {
      setGlitchCardId((curr) => (curr === cardId ? null : curr));
      glitchTimerRef.current = null;
    }, 410);
  };

  const handleCardEnter = (cardId: SocialCardId) => {
    setHoveredCardId(cardId);
    setPointerNorm({ x: 0, y: 0 });
    triggerCardGlitch(cardId);
  };

  const handleCardMove = (
    cardId: SocialCardId,
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (prefersReducedMotion || fanProgress < 0.25) return;
    if (hoveredCardId !== cardId) {
      setHoveredCardId(cardId);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setPointerNorm({ x: nx, y: ny });
  };

  const handleCardLeave = (cardId: SocialCardId) => {
    setHoveredCardId((curr) => (curr === cardId ? null : curr));
    setPointerNorm({ x: 0, y: 0 });
    if (glitchTimerRef.current !== null) {
      window.clearTimeout(glitchTimerRef.current);
      glitchTimerRef.current = null;
    }
    setGlitchCardId((curr) => (curr === cardId ? null : curr));
  };

  const isMobileFan = metrics.mode === 'mobile-fan';
  const compact = metrics.cardWidth < 210;
  const deckTopPercent =
    metrics.mode === 'mobile-fan'
      ? '40%'
      : metrics.mode === 'tablet-fan'
      ? '42%'
      : '43.5%';
  const linksInteractive = fanProgress >= 0.25;
  const footerOffsetPx = footerScrollProgress * footerHeight;
  const footerInteractive = footerScrollProgress >= 0.45;
  const stageHeightPx = viewportSize.height > 0 ? viewportSize.height : 900;
  const promptBarOpacity = Math.max(0, 1 - footerScrollProgress * 4);

  return (
    <div
      data-testid="social-fan-showcase"
      data-fan-stage={stage}
      data-fan-progress={fanProgress.toFixed(3)}
      data-footer-progress={footerScrollProgress.toFixed(3)}
      className="relative w-full h-full bg-[#050816] text-white select-none overflow-hidden"
    >
      {/* Subtle Cobalt Ambient Field Matching the Site Palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 54% at 50% 45%, rgba(44, 52, 128, 0.36) 0%, rgba(59, 91, 255, 0.09) 46%, rgba(0, 0, 0, 0) 76%)',
        }}
      />

      {/* Continuous Scroll Sheet: 100vh Social Fan + FOLLOW MY JOURNEY Stage followed directly by Compact Footer */}
      <div
        data-testid="social-showcase-scroll-sheet"
        className="relative z-10 w-full flex flex-col will-change-transform"
        style={{
          transform: `translate3d(0px, -${footerOffsetPx.toFixed(1)}px, 0px)`,
        }}
      >
        <div
          className="relative w-full flex flex-col justify-between shrink-0"
          style={{ height: `${stageHeightPx}px` }}
        >
          {/* Minimal Top Bar (Zero Telemetry) */}
          <header className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-10 md:px-14 pt-3 sm:pt-5 flex items-center justify-between gap-2 sm:gap-3 border-b border-white/12 pb-2.5 sm:pb-3 shrink-0">
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#93C5FD] truncate">
              06 · CREATOR &amp; SOCIALS
            </div>

            {onBackToPartsList && (
              <button
                type="button"
                onClick={onBackToPartsList}
                data-testid="social-back-to-parts-btn"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-[#2C3480]/70 hover:border-[#93C5FD]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] text-[11px] sm:text-xs font-mono text-white/85 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#93C5FD]" />
                <span>Back to Parts List</span>
              </button>
            )}
          </header>

          {/* Center Stage: CSS 3D Perspective Fan-Out + Post-Fan Cobalt Text Reveal */}
      <div
        className="pointer-events-none relative z-10 flex-1 min-h-0 w-full flex flex-col justify-end overflow-visible"
        style={{
          perspective: `${metrics.perspectivePx}px`,
          perspectiveOrigin: '50% 41%',
        }}
      >
        <div
          data-testid="social-fan-3d-deck"
          className="pointer-events-none absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {SOCIAL_FAN_CARDS.map((card, index) => {
            const tf = cards[index];
            const isHovered = hoveredCardId === card.id;
            const isGlitching = glitchCardId === card.id;
            const hoverTf = computeSocialCardHoverTransform(
              isHovered ? pointerNorm.x : 0,
              isHovered ? pointerNorm.y : 0,
              isHovered,
              fanProgress,
              prefersReducedMotion
            );

            const outerStyle: React.CSSProperties = {
              position: 'absolute',
              left: '50%',
              top: deckTopPercent,
              width: `${metrics.cardWidth}px`,
              height: `${metrics.cardHeight}px`,
              marginLeft: `${-metrics.cardWidth / 2}px`,
              marginTop: `${-metrics.cardHeight / 2}px`,
              transform: `translate3d(${tf.x}px, ${tf.y}px, ${tf.z}px) rotateX(${tf.rotateX}deg) rotateY(${tf.rotateY}deg) rotateZ(${tf.rotateZ}deg) scale(${tf.scale})`,
              opacity: tf.opacity,
              zIndex: hoverTf.isActive ? 75 : tf.zIndex,
              transformStyle: 'preserve-3d',
              willChange: 'transform, opacity',
            };

            const innerSurfaceTransform = hoverTf.isActive
              ? `translate3d(0px, ${hoverTf.liftY}px, ${hoverTf.liftZ}px) rotateX(${hoverTf.tiltX}deg) rotateY(${hoverTf.tiltY}deg) scale(${hoverTf.scale})`
              : 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1)';

            if (card.role === 'photography') {
              return (
                <div
                  key={card.id}
                  data-card-x={tf.x}
                  data-card-rz={tf.rotateZ}
                  style={outerStyle}
                >
                  <article
                    data-testid={`social-card-${card.id}`}
                    aria-label={`${card.title} — ${card.badgeLabel}`}
                    onPointerEnter={(e) => {
                      if (e.pointerType !== 'touch') handleCardEnter(card.id);
                    }}
                    onPointerMove={(e) => {
                      if (e.pointerType !== 'touch') handleCardMove(card.id, e);
                    }}
                    onPointerLeave={() => handleCardLeave(card.id)}
                    style={{
                      transform: innerSurfaceTransform,
                      backfaceVisibility: 'hidden',
                    }}
                    className={`pointer-events-auto relative w-full h-full flex flex-col justify-end rounded-2xl overflow-hidden border bg-[#0B1024] transition-[transform,border-color,box-shadow] duration-300 ease-out ${
                      hoverTf.isActive
                        ? 'border-[#93C5FD]/65 shadow-[0_36px_78px_rgba(0,0,0,0.92),0_0_30px_rgba(59,91,255,0.22)]'
                        : isMobileFan
                        ? 'border-white/25 shadow-[0_12px_28px_rgba(0,0,0,0.78)]'
                        : 'border-white/25 shadow-[0_28px_64px_rgba(0,0,0,0.86)]'
                    }`}
                  >
                    <img
                      src={card.imageSrc}
                      alt={card.imageAlt || card.title}
                      decoding="async"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent"
                    />
                    {hoverTf.isActive && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at ${hoverTf.sheenXPercent}% ${hoverTf.sheenYPercent}%, rgba(147, 197, 253, 0.16), transparent 58%)`,
                        }}
                      />
                    )}
                    <div
                      className={`relative z-10 ${
                        isMobileFan
                          ? 'p-2.5 space-y-0.5'
                          : compact
                          ? 'p-3.5 space-y-1'
                          : 'p-4 xl:p-5 space-y-1.5'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between font-mono uppercase tracking-[0.2em] text-[#93C5FD] ${
                          isMobileFan ? 'text-[8.5px]' : 'text-[10px]'
                        }`}
                      >
                        <GlitchSplitText
                          text={card.badgeLabel}
                          glitchActive={isGlitching}
                          glitchTriggerKey={glitchKey}
                          reducedMotion={prefersReducedMotion}
                        />
                        <span className="text-white/60 tabular-nums">
                          {card.indexLabel}
                        </span>
                      </div>
                      <h3
                        className={`font-serif text-white leading-tight tracking-tight ${
                          isMobileFan
                            ? 'text-base'
                            : compact
                            ? 'text-lg'
                            : 'text-xl xl:text-2xl'
                        }`}
                      >
                        <GlitchSplitText
                          text={card.title}
                          glitchActive={isGlitching}
                          glitchTriggerKey={glitchKey}
                          reducedMotion={prefersReducedMotion}
                        />
                      </h3>
                      <p
                        className={`text-white/75 ${
                          isMobileFan
                            ? 'text-[9px] leading-[1.3]'
                            : compact
                            ? 'text-[11px] leading-snug'
                            : 'text-xs leading-relaxed'
                        }`}
                      >
                        {card.description}
                      </p>
                    </div>
                  </article>
                </div>
              );
            }

            if (card.role === 'support') {
              const glowBlur = Math.round(
                (hoverTf.isActive ? 44 : 14) + 28 * supportEmphasis
              );
              const glowAlpha = (
                (hoverTf.isActive ? 0.24 : 0.06) +
                0.2 * supportEmphasis
              ).toFixed(3);
              const borderAlpha = (
                (hoverTf.isActive ? 0.85 : 0.34) +
                0.36 * supportEmphasis
              ).toFixed(2);

              return (
                <div
                  key={card.id}
                  data-card-x={tf.x}
                  data-card-rz={tf.rotateZ}
                  style={outerStyle}
                >
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={linksInteractive ? 0 : -1}
                    aria-label={`${card.platformName} — ${card.ctaLabel} (opens in new tab)`}
                    data-testid={`social-card-${card.id}`}
                    data-support-emphasis={supportEmphasis.toFixed(2)}
                    onPointerEnter={(e) => {
                      if (e.pointerType !== 'touch') handleCardEnter(card.id);
                    }}
                    onPointerMove={(e) => {
                      if (e.pointerType !== 'touch') handleCardMove(card.id, e);
                    }}
                    onPointerLeave={() => handleCardLeave(card.id)}
                    onFocus={() => handleCardEnter(card.id)}
                    onBlur={() => handleCardLeave(card.id)}
                    style={{
                      transform: innerSurfaceTransform,
                      backfaceVisibility: 'hidden',
                      boxShadow: isMobileFan
                        ? `0 12px 26px rgba(0,0,0,0.8), 0 0 ${Math.round(glowBlur * 0.5)}px rgba(255, 221, 0, ${glowAlpha})`
                        : `0 28px 64px rgba(0,0,0,0.88), 0 0 ${glowBlur}px rgba(255, 221, 0, ${glowAlpha})`,
                      borderColor: `rgba(255, 221, 0, ${Math.min(1, Number(borderAlpha))})`,
                    }}
                    className={`pointer-events-auto group relative w-full h-full flex flex-col justify-between rounded-2xl overflow-hidden border bg-gradient-to-b from-[#171717] via-[#121214] to-[#09090B] transition-[transform,border-color,box-shadow] duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDD00] ${
                      isMobileFan ? 'p-2.5' : compact ? 'p-3.5' : 'p-4 xl:p-5'
                    }`}
                  >
                    {hoverTf.isActive && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at ${hoverTf.sheenXPercent}% ${hoverTf.sheenYPercent}%, rgba(255, 221, 0, 0.14), transparent 60%)`,
                        }}
                      />
                    )}
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <PlatformIcon
                        card={card}
                        compact={compact}
                        isHovered={isHovered}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FFDD00]/85 tabular-nums">
                        {card.indexLabel}
                      </span>
                    </div>

                    <div
                      className={`relative z-10 my-auto ${
                        isMobileFan ? 'space-y-0.5 pt-1' : 'space-y-2 pt-2'
                      }`}
                    >
                      <div
                        className={`font-mono uppercase tracking-[0.2em] text-[#FFDD00] ${
                          isMobileFan ? 'text-[8.5px]' : 'text-[10px]'
                        }`}
                      >
                        {card.badgeLabel}
                      </div>
                      <h3
                        className={`font-serif text-white leading-tight tracking-tight ${
                          isMobileFan
                            ? 'text-[15px]'
                            : compact
                            ? 'text-xl'
                            : 'text-2xl xl:text-[26px]'
                        }`}
                      >
                        <GlitchSplitText
                          text={card.title}
                          glitchActive={isGlitching}
                          glitchTriggerKey={glitchKey}
                          reducedMotion={prefersReducedMotion}
                        />
                      </h3>
                      <p
                        className={`text-white/75 ${
                          isMobileFan
                            ? 'text-[9px] leading-[1.3]'
                            : compact
                            ? 'text-[11px] leading-snug'
                            : 'text-xs xl:text-[13px] leading-relaxed'
                        }`}
                      >
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`relative z-10 border-t border-white/10 ${
                        isMobileFan ? 'pt-1.5' : 'pt-2.5'
                      }`}
                    >
                      <span
                        onMouseEnter={() => triggerCardGlitch(card.id)}
                        className={`w-full inline-flex items-center justify-between rounded-xl bg-[#FFDD00] group-hover:bg-[#FFE642] text-[#09090B] font-semibold tracking-wide transition-colors ${
                          isMobileFan
                            ? 'px-2.5 py-1.5 text-[10px]'
                            : compact
                            ? 'px-3 py-2 text-[11px]'
                            : 'px-3.5 py-2.5 text-xs'
                        }`}
                      >
                        <GlitchSplitText
                          text={card.ctaLabel || 'Support My Work'}
                          glitchActive={isGlitching}
                          glitchTriggerKey={glitchKey}
                          reducedMotion={prefersReducedMotion}
                          tone="dark-on-gold"
                        />
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </a>
                </div>
              );
            }

            // Interactive Social Platform Cards (02 Instagram, 03 GitHub, 04 LinkedIn)
            return (
              <div
                key={card.id}
                data-card-x={tf.x}
                data-card-rz={tf.rotateZ}
                style={outerStyle}
              >
                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={linksInteractive ? 0 : -1}
                  aria-label={`${card.platformName} (${card.handle || card.title}) — ${card.ctaLabel} (opens in new tab)`}
                  data-testid={`social-card-${card.id}`}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== 'touch') handleCardEnter(card.id);
                  }}
                  onPointerMove={(e) => {
                    if (e.pointerType !== 'touch') handleCardMove(card.id, e);
                  }}
                  onPointerLeave={() => handleCardLeave(card.id)}
                  onFocus={() => handleCardEnter(card.id)}
                  onBlur={() => handleCardLeave(card.id)}
                  style={{
                    transform: innerSurfaceTransform,
                    backfaceVisibility: 'hidden',
                  }}
                  className={`pointer-events-auto group relative w-full h-full flex flex-col justify-between rounded-2xl overflow-hidden border bg-gradient-to-b from-[#171717] via-[#0F1322] to-[#080B14] transition-[transform,border-color,box-shadow] duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                    hoverTf.isActive
                      ? 'border-[#93C5FD]/65 shadow-[0_36px_78px_rgba(0,0,0,0.92),0_0_32px_rgba(59,91,255,0.24)]'
                      : isMobileFan
                      ? 'border-white/18 shadow-[0_12px_28px_rgba(0,0,0,0.78)]'
                      : 'border-white/18 shadow-[0_28px_64px_rgba(0,0,0,0.86)]'
                  } ${isMobileFan ? 'p-2.5' : compact ? 'p-3.5' : 'p-4 xl:p-5'}`}
                >
                  {hoverTf.isActive && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at ${hoverTf.sheenXPercent}% ${hoverTf.sheenYPercent}%, rgba(147, 197, 253, 0.14), transparent 60%)`,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <PlatformIcon
                      card={card}
                      compact={compact}
                      isHovered={isHovered}
                    />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#93C5FD]/80 tabular-nums">
                      {card.indexLabel}
                    </span>
                  </div>

                  <div
                    className={`relative z-10 my-auto ${
                      isMobileFan ? 'space-y-0.5 pt-1' : 'space-y-1.5 pt-2'
                    }`}
                  >
                    <div
                      className={`font-mono uppercase tracking-[0.2em] text-[#93C5FD] ${
                        isMobileFan ? 'text-[8.5px]' : 'text-[10px]'
                      }`}
                    >
                      {card.badgeLabel}
                    </div>
                    <h3
                      onMouseEnter={() => triggerCardGlitch(card.id)}
                      className={`font-display font-bold text-white tracking-tight leading-none ${
                        isMobileFan
                          ? 'text-base'
                          : compact
                          ? 'text-lg'
                          : 'text-xl xl:text-2xl'
                      }`}
                    >
                      <GlitchSplitText
                        text={card.platformName}
                        glitchActive={isGlitching}
                        glitchTriggerKey={glitchKey}
                        reducedMotion={prefersReducedMotion}
                      />
                    </h3>
                    {card.handle && (
                      <div
                        className={`font-mono text-white/80 ${
                          isMobileFan
                            ? 'text-[8px] tracking-[-0.02em] leading-tight'
                            : metrics.cardWidth < 245
                            ? 'text-[10.5px] tracking-tight truncate'
                            : 'text-xs tracking-tight truncate'
                        }`}
                      >
                        {card.handle}
                      </div>
                    )}
                    <p
                      className={`text-white/70 pt-0.5 ${
                        isMobileFan
                          ? 'text-[9px] leading-[1.3]'
                          : compact
                          ? 'text-[11px] leading-snug'
                          : 'text-xs xl:text-[13px] leading-relaxed pt-1'
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>

                  <div
                    onMouseEnter={() => triggerCardGlitch(card.id)}
                    className={`relative z-10 border-t border-white/10 flex items-center justify-between font-medium text-white group-hover:text-[#93C5FD] transition-colors ${
                      isMobileFan ? 'pt-1.5 text-[10px]' : 'pt-2.5 text-xs'
                    }`}
                  >
                    <GlitchSplitText
                      text={card.ctaLabel || card.platformName}
                      glitchActive={isGlitching}
                      glitchTriggerKey={glitchKey}
                      reducedMotion={prefersReducedMotion}
                    />
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93C5FD] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        {/* Post-Fan Scroll-Driven FOLLOW MY JOURNEY Text Reveal */}
        <div
          data-testid="social-journey-caption"
          aria-hidden={captionOpacity <= 0.05}
          className="relative z-20 w-full max-w-2xl mx-auto px-4 sm:px-5 pb-3 sm:pb-6 text-center pointer-events-none"
          style={{
            opacity: captionOpacity,
            visibility: captionOpacity > 0.01 ? 'visible' : 'hidden',
            transform: `translate3d(0px, ${captionTranslateY}px, 0px)`,
          }}
        >
          {/* Center-expanding Electric Cobalt hairline rule anchoring Beat 2 reveal */}
          <div
            aria-hidden="true"
            className="mx-auto mb-2 sm:mb-2.5 h-px w-14 sm:w-20 bg-gradient-to-r from-transparent via-[#3B5BFF] to-transparent"
            style={{
              transform: `scaleX(${Math.max(
                0,
                Math.min(1, journeyRevealProgress / 0.28)
              ).toFixed(3)})`,
              opacity: Number(
                Math.max(0, Math.min(1, journeyRevealProgress / 0.16)).toFixed(3)
              ),
            }}
          />

          <h2
            aria-label={SOCIAL_JOURNEY_CAPTION.heading}
            className="font-display font-extrabold uppercase tracking-[-0.025em] text-[22px] sm:text-3xl xl:text-[40px] text-white leading-[1.06] flex flex-wrap items-baseline justify-center gap-x-[0.26em]"
          >
            {[
              { word: 'FOLLOW', start: 0.0, span: 0.44, cls: 'text-white' },
              { word: 'MY', start: 0.24, span: 0.44, cls: 'text-white' },
              {
                word: 'JOURNEY',
                start: 0.46,
                span: 0.54,
                cls: 'text-[#93C5FD]',
                dot: true,
              },
            ].map((tok, idx) => {
              const localProgress = Math.max(
                0,
                Math.min(1, (captionHeadingReveal - tok.start) / tok.span)
              );
              const shutter = computeCobaltShutterState(
                localProgress,
                prefersReducedMotion
              );

              return (
                <span
                  key={tok.word}
                  data-testid={`journey-heading-word-${idx}`}
                  data-word-revealed={shutter.isComplete ? 'true' : 'false'}
                  className={`relative inline-block overflow-hidden py-[0.04em] -my-[0.04em] ${tok.cls}`}
                  style={{
                    transform: `translate3d(0px, ${shutter.liftYPx}px, 0px)`,
                  }}
                >
                  <span
                    className="inline-block"
                    style={{
                      opacity: shutter.textOpacity,
                      clipPath: shutter.isComplete
                        ? undefined
                        : `inset(0 ${shutter.clipRightPercent}% 0 0)`,
                    }}
                  >
                    {tok.word}
                    {tok.dot && <span className="text-[#3B5BFF]">.</span>}
                  </span>
                  {shutter.showBar && (
                    <span
                      aria-hidden="true"
                      data-testid={`journey-heading-shutter-${idx}`}
                      className="pointer-events-none absolute inset-y-[0.06em] inset-x-0 rounded-[2px]"
                      style={{
                        background:
                          'linear-gradient(90deg, #2C3480 0%, #3B5BFF 70%, #93C5FD 100%)',
                        transform: `scaleX(${shutter.barScaleX})`,
                        transformOrigin: shutter.barOrigin,
                      }}
                    />
                  )}
                </span>
              );
            })}
          </h2>

          <p
            aria-label={SOCIAL_JOURNEY_CAPTION.subheading}
            className="mt-1.5 sm:mt-2.5 text-[11px] sm:text-sm xl:text-[15px] text-white/78 tracking-[0.01em] leading-snug sm:leading-relaxed flex flex-wrap justify-center gap-x-[0.35em] gap-y-0.5"
          >
            {[
              {
                text: 'From experiments to finished creations.',
                start: 0.0,
                span: 0.62,
                cls: 'text-white/75',
              },
              {
                text: "There's more to come.",
                start: 0.34,
                span: 0.66,
                cls: 'text-[#93C5FD]/95 font-medium',
              },
            ].map((clause, idx) => {
              const rawT = prefersReducedMotion
                ? journeyRevealProgress > 0.05
                  ? 1
                  : 0
                : Math.max(
                    0,
                    Math.min(1, (captionSubReveal - clause.start) / clause.span)
                  );
              const easedT = rawT * rawT * (3 - 2 * rawT);
              const translateY = ((1 - easedT) * 105).toFixed(1);
              const clauseOpacity = easedT <= 0.02 ? 0 : Math.min(1, easedT * 1.25);

              return (
                <span
                  key={idx}
                  data-testid={`journey-sub-clause-${idx}`}
                  data-word-revealed={easedT >= 0.95 ? 'true' : 'false'}
                  className="inline-block overflow-hidden align-bottom"
                >
                  <span
                    className={`inline-block ${clause.cls}`}
                    style={{
                      opacity: Number(clauseOpacity.toFixed(3)),
                      transform: `translate3d(0px, ${translateY}%, 0px)`,
                    }}
                  >
                    {clause.text}
                  </span>
                </span>
              );
            })}
          </p>
        </div>
      </div>

          {/* Pre-Footer Bottom Prompt Bar (fades cleanly as the compact footer scrolls up beneath) */}
          <div
            data-testid="closing-stage-prompt"
            aria-hidden={promptBarOpacity <= 0.05}
            className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-10 md:px-14 pb-3 sm:pb-5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-t border-white/12 pt-2.5 sm:pt-3 text-[10px] sm:text-[11px] font-mono text-white/60 shrink-0"
            style={{
              opacity: Number((footerOpacity * promptBarOpacity).toFixed(3)),
              visibility: promptBarOpacity > 0.02 ? 'visible' : 'hidden',
              pointerEvents: promptBarOpacity > 0.15 ? 'auto' : 'none',
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
              <span className="text-white/85">DIY Party Box Stereo Speaker</span>
              <span aria-hidden="true" className="hidden sm:inline text-white/30">
                ·
              </span>
              <span className="hidden sm:inline">Designed &amp; built by Rajdeep Bhattacharyya</span>
            </div>

            <div className="flex items-center gap-4">
              {fanProgress < 0.95 ? (
                <span className="inline-flex items-center gap-1.5 text-[#93C5FD]/90">
                  <span>Scroll to fan out cards</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              ) : journeyRevealProgress < 0.6 ? (
                <span className="inline-flex items-center gap-1.5 text-[#93C5FD]/90">
                  <span>Keep scrolling to reveal text</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              ) : (
                <>
                  {onJumpToFooter && (
                    <button
                      type="button"
                      onClick={onJumpToFooter}
                      data-testid="stage-scroll-to-footer-btn"
                      className="inline-flex items-center gap-1 text-[#93C5FD] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded px-1.5 py-0.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Project Links &amp; Footer</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onJumpToTop && (
                    <button
                      type="button"
                      onClick={onJumpToTop}
                      data-testid="stage-back-to-top-btn"
                      className="inline-flex items-center gap-1 text-white/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded px-1.5 py-0.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Back to Top</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compact Structured Site Footer Directly Beneath Social Cards */}
        <footer
          ref={footerRef}
          data-testid="closing-site-footer"
          aria-label="Site Footer"
          aria-hidden={!footerInteractive}
          className="relative z-20 w-full border-t border-white/15 bg-[#040713]/95 shrink-0"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B5BFF]/65 to-transparent"
          />

          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-10 md:px-14 pt-4 pb-3.5 sm:pt-5 sm:pb-3.5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start">
              {/* 1. Project Identity + Technical Note */}
              <div className="md:col-span-5 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 64 64"
                    className="w-5 h-7 shrink-0"
                  >
                    <rect
                      x="16.28"
                      y="2"
                      width="31.43"
                      height="60"
                      rx="3.8"
                      fill="#070B19"
                      stroke="#FFFFFF"
                      strokeWidth="2.8"
                    />
                    <circle cx="32" cy="18.3" r="6.8" fill="none" stroke="#FFFFFF" strokeWidth="2.1" />
                    <circle cx="32" cy="18.3" r="1.9" fill="#FFFFFF" />
                    <circle cx="32" cy="35.1" r="6.3" fill="none" stroke="#3B5BFF" strokeWidth="2.6" />
                    <circle cx="32" cy="50.7" r="5.3" fill="none" stroke="#FFFFFF" strokeWidth="2.1" />
                    <circle cx="32" cy="50.7" r="1.7" fill="#FFFFFF" />
                  </svg>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#93C5FD]">
                      DUALBEAST · DIY PARTY BOX
                    </div>
                    <h2 className="font-display font-bold text-base sm:text-lg tracking-[-0.01em] text-white">
                      Two Speakers. One Powerful Experience.
                    </h2>
                  </div>
                </div>
                <p className="text-xs sm:text-[13px] text-white/75 leading-relaxed max-w-md">
                  A hand-built wireless stereo speaker pair.
                </p>
                <p className="pt-1 text-[11px] text-white/50 leading-snug max-w-md">
                  WLED Studio is a browser-only simulation and does not control physical hardware.
                </p>
              </div>

              {/* 2. Quick Navigation */}
              <nav
                aria-label="Footer Quick Navigation"
                className="md:col-span-4"
              >
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#93C5FD]/90 mb-2">
                  EXPLORE
                </div>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-0.5">
                  {[
                    { label: 'Home', onClick: onJumpToTop, testId: 'footer-nav-home' },
                    { label: 'Build Gallery', onClick: onOpenGallery, testId: 'footer-nav-gallery' },
                    { label: '3D Model Viewer', onClick: onOpen3DInspector, testId: 'footer-nav-3d' },
                    { label: 'WLED Studio', onClick: onOpenWledStudio, testId: 'footer-nav-wled' },
                    { label: 'Build Overview', onClick: onJumpToBuildOverview, testId: 'footer-nav-overview' },
                    { label: 'Parts List', onClick: onBackToPartsList, testId: 'footer-nav-parts' },
                    {
                      label: 'Build Journey (Stories)',
                      href: INSTAGRAM_JOURNEY_HIGHLIGHT_URL,
                      testId: 'footer-nav-journey',
                    },
                  ].map((item) => (
                    <li key={item.testId}>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={footerInteractive ? 0 : -1}
                          data-testid={item.testId}
                          title="Click here to view the entire journey on Instagram"
                          className="group inline-flex items-center gap-1 py-1 max-md:min-h-[40px] text-left text-xs sm:text-[13px] text-white/80 hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded transition-colors whitespace-nowrap"
                        >
                          <span>{item.label}</span>
                          <ArrowUpRight className="w-3 h-3 text-[#93C5FD]/65 group-hover:text-[#93C5FD] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          tabIndex={footerInteractive ? 0 : -1}
                          onClick={item.onClick}
                          data-testid={item.testId}
                          className="inline-flex items-center py-1 max-md:min-h-[40px] text-left text-xs sm:text-[13px] text-white/80 hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              {/* 3. Connect (Reusing Existing Social Links) */}
              <div className="md:col-span-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#93C5FD]/90 mb-2">
                  CONNECT
                </div>
                <ul className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-0.5">
                  {[
                    {
                      label: 'Instagram',
                      href: SOCIAL_ACCOUNT_LINKS.instagram,
                      testId: 'footer-social-instagram',
                    },
                    {
                      label: 'Story Highlights',
                      href: INSTAGRAM_JOURNEY_HIGHLIGHT_URL,
                      testId: 'footer-social-stories',
                    },
                    {
                      label: 'GitHub',
                      href: SOCIAL_ACCOUNT_LINKS.github,
                      testId: 'footer-social-github',
                    },
                    {
                      label: 'LinkedIn',
                      href: SOCIAL_ACCOUNT_LINKS.linkedin,
                      testId: 'footer-social-linkedin',
                    },
                    {
                      label: 'Buy Me a Coffee',
                      href: SOCIAL_ACCOUNT_LINKS.buyMeACoffee,
                      testId: 'footer-social-coffee',
                    },
                  ].map((link) => (
                    <li key={link.testId}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={footerInteractive ? 0 : -1}
                        data-testid={link.testId}
                        className="group inline-flex items-center gap-1 py-1 max-md:min-h-[40px] text-xs sm:text-[13px] text-white/80 hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded transition-colors whitespace-nowrap"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-[#93C5FD]/65 group-hover:text-[#93C5FD] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Creator Attribution & Back to Top */}
            <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/60">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-white/85">© 2026</span>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <span className="text-white/80">
                  Designed &amp; built by Rajdeep Bhattacharyya
                </span>
                <span aria-hidden="true" className="hidden sm:inline text-white/30">
                  ·
                </span>
                <span className="hidden sm:inline text-white/45">
                  Wired and assembled by hand.
                </span>
              </div>

              {onJumpToTop && (
                <button
                  type="button"
                  tabIndex={footerInteractive ? 0 : -1}
                  onClick={onJumpToTop}
                  data-testid="footer-back-to-top-btn"
                  className="inline-flex items-center gap-1.5 text-[#93C5FD] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded px-1.5 py-1 max-md:min-h-[40px] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Back to top</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
