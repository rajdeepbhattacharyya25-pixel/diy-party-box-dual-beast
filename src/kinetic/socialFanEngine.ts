export type SocialCardId =
  | 'profile'
  | 'instagram'
  | 'github'
  | 'linkedin'
  | 'buy-me-a-coffee';

export type SocialCardRole = 'photography' | 'social' | 'support';

export interface SocialFanCardConfig {
  id: SocialCardId;
  indexLabel: string;
  role: SocialCardRole;
  badgeLabel: string;
  platformName: string;
  title: string;
  handle?: string;
  description: string;
  ctaLabel?: string;
  href?: string;
  imageSrc?: string;
  imageAlt?: string;
  isExternal: boolean;
  isConfigured: boolean;
}

/**
 * Central social & creator configuration.
 */
export const BUY_ME_A_COFFEE_URL =
  'https://buymeacoffee.com/rajdeep.bhattacharyya';

export const SOCIAL_ACCOUNT_LINKS = {
  instagram: 'https://www.instagram.com/_rajdeep.007_/',
  github: 'https://github.com/rajdeepbhattacharyya25-pixel',
  linkedin: 'https://www.linkedin.com/in/rajdeep-bhattacharyya-497945371/',
  buyMeACoffee: BUY_ME_A_COFFEE_URL,
} as const;

export const CREATOR_PROFILE_IMAGE_SRC =
  '/assets/aistudio/Thoughtful_Mirror_Selfie_on_a_Patterned_Bed_b6d8f347.png';

export const SOCIAL_JOURNEY_CAPTION = {
  heading: 'FOLLOW MY JOURNEY.',
  subheading: "From experiments to finished creations. There's more to come.",
} as const;

/**
 * Exactly five cards in strict order:
 * 01 Personal Profile -> 02 Instagram -> 03 GitHub -> 04 LinkedIn -> 05 Buy Me a Coffee
 */
export const SOCIAL_FAN_CARDS: readonly SocialFanCardConfig[] = [
  {
    id: 'profile',
    indexLabel: '01',
    role: 'photography',
    badgeLabel: 'THE BUILDER',
    platformName: 'Profile',
    title: 'Rajdeep Bhattacharyya',
    handle: 'DIY Audio & Embedded Systems',
    description: 'Designed, wired, and built the Party Box stereo pair by hand.',
    imageSrc: CREATOR_PROFILE_IMAGE_SRC,
    imageAlt: 'Rajdeep Bhattacharyya, creator of the DIY Party Box speaker',
    isExternal: false,
    isConfigured: true,
  },
  {
    id: 'instagram',
    indexLabel: '02',
    role: 'social',
    badgeLabel: 'INSTAGRAM',
    platformName: 'Instagram',
    title: 'Instagram',
    handle: '@_rajdeep.007_',
    description: 'Build photos, speaker tests and workshop updates.',
    ctaLabel: 'Open Instagram',
    href: SOCIAL_ACCOUNT_LINKS.instagram,
    isExternal: true,
    isConfigured: true,
  },
  {
    id: 'github',
    indexLabel: '03',
    role: 'social',
    badgeLabel: 'GITHUB',
    platformName: 'GitHub',
    title: 'GitHub',
    handle: '@rajdeepbhattacharyya25-pixel',
    description: 'Explore the code, prototypes and experiments behind my projects.',
    ctaLabel: 'View GitHub',
    href: SOCIAL_ACCOUNT_LINKS.github,
    isExternal: true,
    isConfigured: true,
  },
  {
    id: 'linkedin',
    indexLabel: '04',
    role: 'social',
    badgeLabel: 'LINKEDIN',
    platformName: 'LinkedIn',
    title: 'LinkedIn',
    handle: 'Rajdeep Bhattacharyya',
    description: "Connect with me and see what I'm currently working on.",
    ctaLabel: 'Connect on LinkedIn',
    href: SOCIAL_ACCOUNT_LINKS.linkedin,
    isExternal: true,
    isConfigured: true,
  },
  {
    id: 'buy-me-a-coffee',
    indexLabel: '05',
    role: 'support',
    badgeLabel: 'SUPPORT THE BUILDER',
    platformName: 'Buy Me a Coffee',
    title: 'Buy me a coffee.',
    description: 'Your support helps me buy components, tools and materials for future builds.',
    ctaLabel: 'Support My Work',
    href: SOCIAL_ACCOUNT_LINKS.buyMeACoffee,
    isExternal: true,
    isConfigured: true,
  },
] as const;

export const SOCIAL_FAN_START_POS = 6;
export const SOCIAL_FAN_END_POS = 6.75;
export const SOCIAL_JOURNEY_END_POS = 7.5;
export const SOCIAL_FOOTER_START_POS = 7.5;
export const SOCIAL_FOOTER_END_POS = 8.1;

export type SocialFanStage = 'stacked' | 'separating' | 'fanning' | 'fanned';

export interface SocialFanLayoutMetrics {
  mode: 'desktop-fan' | 'tablet-fan' | 'mobile-fan';
  cardWidth: number;
  cardHeight: number;
  spreadStep: number;
  arcDropPx: number;
  perspectivePx: number;
}

export interface SocialFanCardTransform {
  id: SocialCardId;
  index: number;
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

export interface SocialFanStageState {
  fanProgress: number;
  journeyRevealProgress: number;
  footerScrollProgress: number;
  stage: SocialFanStage;
  metrics: SocialFanLayoutMetrics;
  cards: SocialFanCardTransform[];
  captionOpacity: number;
  captionTranslateY: number;
  captionHeadingReveal: number;
  captionSubReveal: number;
  supportEmphasis: number;
  footerOpacity: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep01(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function roundTo(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Normalizes timelinePos in [6.00 .. 6.75] to [0 .. 1] card fan-out progress.
 */
export function getSocialFanProgress(timelinePos: number): number {
  if (!Number.isFinite(timelinePos)) return 0;
  return clamp01(
    (timelinePos - SOCIAL_FAN_START_POS) /
      (SOCIAL_FAN_END_POS - SOCIAL_FAN_START_POS)
  );
}

/**
 * Normalizes post-fan timelinePos in [6.75 .. 7.50] to [0 .. 1] FOLLOW MY JOURNEY text reveal progress.
 */
export function getSocialJourneyRevealProgress(timelinePos: number): number {
  if (!Number.isFinite(timelinePos)) return 0;
  return clamp01(
    (timelinePos - SOCIAL_FAN_END_POS) /
      (SOCIAL_JOURNEY_END_POS - SOCIAL_FAN_END_POS)
  );
}

/**
 * Normalizes post-caption timelinePos in [7.50 .. 8.10] to [0 .. 1] compact footer scroll progress.
 */
export function getSocialFooterRevealProgress(timelinePos: number): number {
  if (!Number.isFinite(timelinePos)) return 0;
  return clamp01(
    (timelinePos - SOCIAL_FOOTER_START_POS) /
      (SOCIAL_FOOTER_END_POS - SOCIAL_FOOTER_START_POS)
  );
}

export function getSocialFanStage(fanProgress: number): SocialFanStage {
  const p = clamp01(fanProgress);
  if (p <= 0.04) return 'stacked';
  if (p < 0.36) return 'separating';
  if (p < 0.88) return 'fanning';
  return 'fanned';
}

/**
 * Computes responsive 3D card dimensions & arc spacing so all 5 fanned cards
 * sit inside the viewport cleanly across ultrawide, 1440p, 1080p, 1366px, tablet, and mobile.
 */
export function computeSocialFanLayoutMetrics(
  viewportWidth: number,
  viewportHeight: number
): SocialFanLayoutMetrics {
  const w = Math.max(320, viewportWidth || 1440);
  const h = Math.max(520, viewportHeight || 900);

  if (w < 640) {
    const cardWidth = Math.max(146, Math.min(176, Math.floor((w - 40) / 2.16)));
    const cardHeight = Math.max(150, Math.min(172, Math.floor((h - 300) * 0.31)));
    return {
      mode: 'mobile-fan',
      cardWidth,
      cardHeight,
      spreadStep: Math.round(cardWidth * 0.56 + 6),
      arcDropPx: Math.round(cardHeight + 18),
      perspectivePx: 1050,
    };
  }

  if (w < 1024) {
    const cardWidth = Math.max(176, Math.min(220, Math.floor((w - 88) / 3.42)));
    const cardHeight = Math.max(220, Math.min(274, Math.floor((h - 320) * 0.44)));
    return {
      mode: 'tablet-fan',
      cardWidth,
      cardHeight,
      spreadStep: Math.round(cardWidth * 1.09),
      arcDropPx: Math.round(cardHeight + 30),
      perspectivePx: 1200,
    };
  }

  // Desktop & Ultrawide: fits 5 fanned cards side-by-side along the 3D arc with zero overlap,
  // scaling up gracefully on 2560x1440 and 3440x1440 while leaving caption headroom below.
  const maxWidthByViewport = Math.floor((w - 110) / 5.36);
  const maxWidthByHeight = Math.floor((h - 300) * 0.72);
  const cardWidth = Math.max(176, Math.min(296, maxWidthByViewport, maxWidthByHeight));
  const cardHeight = Math.round(cardWidth * 1.34);
  const spreadStep = Math.round(cardWidth * 1.07);
  const arcDropPx = Math.round(Math.max(22, Math.min(52, cardHeight * 0.125)));

  return {
    mode: 'desktop-fan',
    cardWidth,
    cardHeight,
    spreadStep,
    arcDropPx,
    perspectivePx: w >= 1280 ? 1500 : 1300,
  };
}

/**
 * Deterministic pure CSS 3D transform calculation for one card at a given fanProgress [0..1].
 * Guaranteed 100% reversible when scrolling up.
 */
export function computeSocialFanCardTransform(
  cardIndex: number,
  fanProgress: number,
  metrics: SocialFanLayoutMetrics,
  prefersReducedMotion = false
): SocialFanCardTransform {
  const card = SOCIAL_FAN_CARDS[cardIndex] ?? SOCIAL_FAN_CARDS[0];
  const slot = cardIndex - 2; // -2, -1, 0, +1, +2
  const absSlot = Math.abs(slot);
  const p = clamp01(fanProgress);

  // Subtle organic unfurl stagger from Card 01 outward while keeping Card 01 responsive immediately
  const staggerDelay = cardIndex * 0.025;
  const localP = clamp01((p - staggerDelay) / (1 - staggerDelay));

  const sepT = smoothstep01(localP / 0.44);
  const fanT = smoothstep01((localP - 0.12) / 0.76);

  // Stage 01 initial compact stacked deck (strictly positive +Z >= 24px so hit-testing never drops behind z=0):
  const stackedByIndex: Array<{
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
    scale: number;
    opacity: number;
  }> = [
    { x: 0, y: 0, z: 120, rx: 0, ry: 0, rz: 0, scale: 1.02, opacity: 1 },
    { x: 18, y: 6, z: 92, rx: 1.8, ry: -3.5, rz: 3.1, scale: 0.96, opacity: 0.96 },
    { x: -18, y: 10, z: 68, rx: 2.6, ry: 3.5, rz: -3.3, scale: 0.93, opacity: 0.92 },
    { x: 30, y: 14, z: 44, rx: 3.4, ry: -5.2, rz: 5.2, scale: 0.9, opacity: 0.88 },
    { x: -30, y: 18, z: 20, rx: 4.2, ry: 5.2, rz: -5.4, scale: 0.87, opacity: 0.85 },
  ];
  const stacked = stackedByIndex[cardIndex] ?? stackedByIndex[0];

  // Stage 04 settled 5-card 3D arc for desktop & ultrawide (all Z strictly >= +24px above z=0)
  const desktopFanned = {
    x: slot * metrics.spreadStep,
    y: Math.pow(absSlot / 2, 1.65) * metrics.arcDropPx - metrics.arcDropPx * 0.25,
    z: 72 - absSlot * 24,
    rx: prefersReducedMotion ? 0 : absSlot * 1.4,
    ry: prefersReducedMotion ? 0 : -slot * 5.2,
    rz: prefersReducedMotion ? slot * 2.2 : slot * 5.6,
    scale: 1 - absSlot * 0.018,
    opacity: 1,
  };

  // Tablet 3-over-2 curved 3D arc (Cards 01-03 upper arc, Cards 04-05 lower arc)
  const tabletTargets = [
    { x: -metrics.spreadStep, y: -metrics.arcDropPx * 0.45, z: 20, rx: 1.5, ry: 4.5, rz: -5.2, scale: 0.98 },
    { x: 0, y: -metrics.arcDropPx * 0.51, z: 38, rx: 0, ry: 0, rz: 0, scale: 1 },
    { x: metrics.spreadStep, y: -metrics.arcDropPx * 0.45, z: 20, rx: 1.5, ry: -4.5, rz: 5.2, scale: 0.98 },
    { x: -metrics.spreadStep * 0.56, y: metrics.arcDropPx * 0.53, z: 28, rx: -1.2, ry: 3.5, rz: -3.2, scale: 0.99 },
    { x: metrics.spreadStep * 0.56, y: metrics.arcDropPx * 0.53, z: 28, rx: -1.2, ry: -3.5, rz: 3.2, scale: 0.99 },
  ];
  const tabletFannedRaw = tabletTargets[cardIndex] ?? tabletTargets[0];
  const tabletFanned = {
    x: tabletFannedRaw.x,
    y: tabletFannedRaw.y,
    z: tabletFannedRaw.z,
    rx: prefersReducedMotion ? 0 : tabletFannedRaw.rx,
    ry: prefersReducedMotion ? 0 : tabletFannedRaw.ry,
    rz: prefersReducedMotion ? tabletFannedRaw.rz * 0.4 : tabletFannedRaw.rz,
    scale: tabletFannedRaw.scale,
    opacity: 1,
  };

  // Mobile 1 + 2 + 2 fanned 3D composition keeping all 5 cards readable with zero overlap
  const mobileTargets = [
    { x: 0, y: -metrics.arcDropPx * 0.96, z: 40, rx: 0, ry: 0, rz: -1.2, scale: 0.98 },
    { x: -metrics.spreadStep, y: 0, z: 28, rx: 1.2, ry: 3.6, rz: -2.8, scale: 0.98 },
    { x: metrics.spreadStep, y: 0, z: 28, rx: 1.2, ry: -3.6, rz: 2.8, scale: 0.98 },
    { x: -metrics.spreadStep, y: metrics.arcDropPx * 0.96, z: 18, rx: -1.2, ry: 3.2, rz: 2.2, scale: 0.98 },
    { x: metrics.spreadStep, y: metrics.arcDropPx * 0.96, z: 18, rx: -1.2, ry: -3.2, rz: -2.2, scale: 0.98 },
  ];
  const mobileFannedRaw = mobileTargets[cardIndex] ?? mobileTargets[0];
  const mobileFanned = {
    x: mobileFannedRaw.x,
    y: mobileFannedRaw.y,
    z: mobileFannedRaw.z,
    rx: prefersReducedMotion ? 0 : mobileFannedRaw.rx,
    ry: prefersReducedMotion ? 0 : mobileFannedRaw.ry,
    rz: prefersReducedMotion ? 0 : mobileFannedRaw.rz,
    scale: mobileFannedRaw.scale,
    opacity: 1,
  };

  const target =
    metrics.mode === 'mobile-fan'
      ? mobileFanned
      : metrics.mode === 'tablet-fan'
      ? tabletFanned
      : desktopFanned;

  // Motion blend: early separation peels cards outward before full arc tilt settles
  const spreadBlend = 0.34 * sepT + 0.66 * fanT;
  const arcBlend = fanT;

  return {
    id: card.id,
    index: cardIndex,
    x: roundTo(lerp(stacked.x, target.x, spreadBlend), 2),
    y: roundTo(lerp(stacked.y, target.y, arcBlend), 2),
    z: roundTo(lerp(stacked.z, target.z, arcBlend), 2),
    rotateX: roundTo(lerp(prefersReducedMotion ? 0 : stacked.rx, target.rx, arcBlend), 2),
    rotateY: roundTo(lerp(prefersReducedMotion ? 0 : stacked.ry, target.ry, arcBlend), 2),
    rotateZ: roundTo(lerp(prefersReducedMotion ? 0 : stacked.rz, target.rz, arcBlend), 2),
    scale: roundTo(lerp(stacked.scale, target.scale, arcBlend), 4),
    opacity: roundTo(lerp(stacked.opacity, target.opacity, sepT), 3),
    zIndex: 50 - cardIndex * 10,
  };
}

/**
 * Evaluates full 5-card fan stage state + post-fan delayed FOLLOW MY JOURNEY text reveal
 * from global timelinePos (6.00-6.75 fan-out -> 6.75-7.50 Cobalt text reveal) & viewport metrics.
 */
export function computeSocialFanState(
  timelinePos: number,
  viewportWidth: number,
  viewportHeight: number,
  prefersReducedMotion = false
): SocialFanStageState {
  const fanProgress = getSocialFanProgress(timelinePos);
  const journeyRevealProgress = getSocialJourneyRevealProgress(timelinePos);
  const rawFooterProgress = getSocialFooterRevealProgress(timelinePos);
  const footerScrollProgress = prefersReducedMotion
    ? rawFooterProgress >= 0.5
      ? 1
      : 0
    : roundTo(smoothstep01(rawFooterProgress), 4);
  const stage = getSocialFanStage(fanProgress);
  const metrics = computeSocialFanLayoutMetrics(viewportWidth, viewportHeight);
  const cards = SOCIAL_FAN_CARDS.map((_, index) =>
    computeSocialFanCardTransform(index, fanProgress, metrics, prefersReducedMotion)
  );

  // Post-fan caption reveal (timelinePos 6.75 -> 7.50):
  // Appears cleanly ONLY after the 5-card fan opens, sweeping in via crisp Cobalt shutter + baseline glide.
  const captionRevealGate = prefersReducedMotion
    ? timelinePos >= SOCIAL_FAN_END_POS
      ? 1
      : 0
    : smoothstep01(journeyRevealProgress / 0.06);

  const captionHeadingReveal = prefersReducedMotion
    ? captionRevealGate
    : Number(smoothstep01((journeyRevealProgress - 0.03) / 0.72).toFixed(3));

  const captionSubReveal = prefersReducedMotion
    ? captionRevealGate
    : Number(smoothstep01((journeyRevealProgress - 0.4) / 0.6).toFixed(3));

  const supportEmphasis = smoothstep01((fanProgress - 0.66) / 0.34);
  const footerRevealT = smoothstep01((journeyRevealProgress - 0.18) / 0.7);

  return {
    fanProgress: roundTo(fanProgress, 4),
    journeyRevealProgress: roundTo(journeyRevealProgress, 4),
    footerScrollProgress,
    stage,
    metrics,
    cards,
    captionOpacity: roundTo(captionRevealGate, 3),
    captionTranslateY: prefersReducedMotion
      ? 0
      : roundTo((1 - smoothstep01(journeyRevealProgress / 0.18)) * 8, 2),
    captionHeadingReveal,
    captionSubReveal,
    supportEmphasis: roundTo(supportEmphasis, 3),
    footerOpacity: roundTo(0.45 + 0.55 * footerRevealT, 3),
  };
}

export interface CobaltShutterState {
  isComplete: boolean;
  showBar: boolean;
  barScaleX: number;
  barOrigin: 'left center' | 'right center';
  clipRightPercent: number;
  textOpacity: number;
  liftYPx: number;
}

/**
 * Seam-to-seam Electric Cobalt block shutter reveal for display words:
 * - [0.00..0.30]: Solid Cobalt beam wipes across (scaleX 0->1, left origin) while text stays 100% clipped (no ghosting).
 * - [0.30..1.00]: Beam peels off right (scaleX 1->0, right origin) in 1:1 lockstep with left-to-right text unclip.
 */
export function computeCobaltShutterState(
  localProgress: number,
  prefersReducedMotion = false
): CobaltShutterState {
  const t = clamp01(localProgress);
  if (prefersReducedMotion) {
    const visible = t >= 0.5;
    return {
      isComplete: visible,
      showBar: false,
      barScaleX: 0,
      barOrigin: 'right center',
      clipRightPercent: visible ? 0 : 100,
      textOpacity: visible ? 1 : 0,
      liftYPx: 0,
    };
  }

  if (t <= 0.005) {
    return {
      isComplete: false,
      showBar: false,
      barScaleX: 0,
      barOrigin: 'left center',
      clipRightPercent: 100,
      textOpacity: 0,
      liftYPx: 8,
    };
  }

  if (t >= 0.995) {
    return {
      isComplete: true,
      showBar: false,
      barScaleX: 0,
      barOrigin: 'right center',
      clipRightPercent: 0,
      textOpacity: 1,
      liftYPx: 0,
    };
  }

  const phaseAEnd = 0.3;
  if (t < phaseAEnd) {
    const pA = smoothstep01(t / phaseAEnd);
    return {
      isComplete: false,
      showBar: pA > 0.01,
      barScaleX: roundTo(pA, 4),
      barOrigin: 'left center',
      clipRightPercent: 100,
      textOpacity: 0,
      liftYPx: 8,
    };
  }

  const pB = smoothstep01((t - phaseAEnd) / (1 - phaseAEnd));
  const remaining = Math.max(0, 1 - pB);
  return {
    isComplete: false,
    showBar: remaining > 0.008,
    barScaleX: roundTo(remaining, 4),
    barOrigin: 'right center',
    clipRightPercent: roundTo(remaining * 100, 2),
    textOpacity: 1,
    liftYPx: roundTo((1 - pB) * 6, 2),
  };
}

export interface SocialCardHoverTransform {
  isActive: boolean;
  liftY: number;
  liftZ: number;
  tiltX: number;
  tiltY: number;
  scale: number;
  sheenXPercent: number;
  sheenYPercent: number;
}

/**
 * Pure hover lift and subtle pointer-driven 3D perspective tilt.
 * Applied to the inner card surface so it never conflicts with scroll-driven fan transforms.
 */
export function computeSocialCardHoverTransform(
  pointerXNorm: number,
  pointerYNorm: number,
  isHovered: boolean,
  fanProgress: number,
  prefersReducedMotion = false
): SocialCardHoverTransform {
  const clampedX = Math.max(-0.5, Math.min(0.5, pointerXNorm || 0));
  const clampedY = Math.max(-0.5, Math.min(0.5, pointerYNorm || 0));
  const canHoverLift = isHovered && fanProgress >= 0.25 && !prefersReducedMotion;

  if (!canHoverLift) {
    return {
      isActive: false,
      liftY: 0,
      liftZ: 0,
      tiltX: 0,
      tiltY: 0,
      scale: 1,
      sheenXPercent: 50,
      sheenYPercent: 50,
    };
  }

  return {
    isActive: true,
    liftY: -10,
    liftZ: 22,
    tiltX: roundTo(-clampedY * 7, 2),
    tiltY: roundTo(clampedX * 8, 2),
    scale: 1.025,
    sheenXPercent: roundTo((clampedX + 0.5) * 100, 1),
    sheenYPercent: roundTo((clampedY + 0.5) * 100, 1),
  };
}
