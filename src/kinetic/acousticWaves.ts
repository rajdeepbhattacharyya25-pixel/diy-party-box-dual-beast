export interface Point2D {
  x: number;
  y: number;
}

export interface CursorWaveState {
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** [0..1] ambient/active cursor influence weight */
  energy: number;
  hasPointer: boolean;
}

export interface AcousticRibbonSpec {
  id: string;
  baseYFraction: number;
  amplitudePx: number;
  freq1: number;
  freq2: number;
  freq3: number;
  speed1: number;
  speed2: number;
  phase: number;
  parallaxWeight: number;
  opacityScale: number;
}

export interface AcousticTopoLoopSpec {
  id: string;
  cxFraction: number;
  cyFraction: number;
  rxFraction: number;
  ryFraction: number;
  tiltRad: number;
  driftSpeed: number;
  morphSpeed: number;
  phase: number;
  harmonics: [number, number, number];
  hasInnerEcho: boolean;
  parallaxWeight: number;
  opacityScale: number;
}

export const DEFAULT_ACOUSTIC_RIBBONS: AcousticRibbonSpec[] = [
  {
    id: 'ribbon-upper-crest',
    baseYFraction: 0.14,
    amplitudePx: 44,
    freq1: 1.0,
    freq2: 1.73,
    freq3: 2.91,
    speed1: 0.31,
    speed2: -0.24,
    phase: 0.4,
    parallaxWeight: 0.18,
    opacityScale: 0.85,
  },
  {
    id: 'ribbon-upper-mid',
    baseYFraction: 0.31,
    amplitudePx: 54,
    freq1: 1.15,
    freq2: 1.92,
    freq3: 3.17,
    speed1: -0.27,
    speed2: 0.35,
    phase: 1.85,
    parallaxWeight: 0.28,
    opacityScale: 1.0,
  },
  {
    id: 'ribbon-horizon-core',
    baseYFraction: 0.49,
    amplitudePx: 62,
    freq1: 0.92,
    freq2: 1.618,
    freq3: 2.68,
    speed1: 0.22,
    speed2: 0.39,
    phase: 3.1,
    parallaxWeight: 0.36,
    opacityScale: 1.08,
  },
  {
    id: 'ribbon-lower-mid',
    baseYFraction: 0.67,
    amplitudePx: 52,
    freq1: 1.08,
    freq2: 1.84,
    freq3: 3.03,
    speed1: -0.34,
    speed2: -0.19,
    phase: 4.45,
    parallaxWeight: 0.25,
    opacityScale: 0.95,
  },
  {
    id: 'ribbon-lower-floor',
    baseYFraction: 0.85,
    amplitudePx: 46,
    freq1: 1.24,
    freq2: 2.09,
    freq3: 3.41,
    speed1: 0.29,
    speed2: -0.32,
    phase: 5.55,
    parallaxWeight: 0.16,
    opacityScale: 0.88,
  },
];

export const DEFAULT_TOPO_LOOPS: AcousticTopoLoopSpec[] = [
  {
    id: 'topo-northwest-island',
    cxFraction: 0.13,
    cyFraction: 0.24,
    rxFraction: 0.19,
    ryFraction: 0.25,
    tiltRad: -0.35,
    driftSpeed: 0.21,
    morphSpeed: 0.34,
    phase: 0.7,
    harmonics: [0.14, 0.08, 0.05],
    hasInnerEcho: true,
    parallaxWeight: 0.22,
    opacityScale: 0.92,
  },
  {
    id: 'topo-northeast-lobe',
    cxFraction: 0.86,
    cyFraction: 0.19,
    rxFraction: 0.21,
    ryFraction: 0.22,
    tiltRad: 0.48,
    driftSpeed: -0.17,
    morphSpeed: 0.29,
    phase: 2.35,
    harmonics: [0.12, 0.1, 0.04],
    hasInnerEcho: false,
    parallaxWeight: 0.31,
    opacityScale: 0.85,
  },
  {
    id: 'topo-south-ridge',
    cxFraction: 0.48,
    cyFraction: 0.87,
    rxFraction: 0.25,
    ryFraction: 0.19,
    tiltRad: 0.18,
    driftSpeed: 0.19,
    morphSpeed: -0.26,
    phase: 4.1,
    harmonics: [0.15, 0.07, 0.06],
    hasInnerEcho: true,
    parallaxWeight: 0.27,
    opacityScale: 0.95,
  },
  {
    id: 'topo-southeast-island',
    cxFraction: 0.91,
    cyFraction: 0.76,
    rxFraction: 0.16,
    ryFraction: 0.23,
    tiltRad: -0.52,
    driftSpeed: -0.23,
    morphSpeed: 0.31,
    phase: 5.4,
    harmonics: [0.11, 0.09, 0.05],
    hasInnerEcho: false,
    parallaxWeight: 0.34,
    opacityScale: 0.82,
  },
];

function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function createInitialCursorWaveState(width = 1440, height = 900): CursorWaveState {
  const cx = width * 0.5;
  const cy = height * 0.5;
  return {
    targetX: cx,
    targetY: cy,
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    energy: 0,
    hasPointer: false,
  };
}

/**
 * Advances cursor spring tracking and directional wake velocity smoothly without allocation.
 */
export function stepCursorWaveState(
  state: CursorWaveState,
  dtSec: number,
  pointerRecentlyMoved: boolean
): CursorWaveState {
  const safeDt = clamp(dtSec, 0.001, 0.06);
  const lerpFactor = 1 - Math.exp(-safeDt * 12);
  const prevX = state.x;
  const prevY = state.y;

  const nextX = prevX + (state.targetX - prevX) * lerpFactor;
  const nextY = prevY + (state.targetY - prevY) * lerpFactor;

  const instantVx = (nextX - prevX) / safeDt;
  const instantVy = (nextY - prevY) / safeDt;
  const velLerp = 1 - Math.exp(-safeDt * 9);
  const nextVx = clamp(state.vx + (instantVx - state.vx) * velLerp, -1400, 1400);
  const nextVy = clamp(state.vy + (instantVy - state.vy) * velLerp, -1400, 1400);

  const speed = Math.hypot(nextVx, nextVy);
  const targetEnergy = state.hasPointer
    ? clamp((pointerRecentlyMoved ? 0.72 : 0.38) + Math.min(0.45, speed / 1100), 0, 1)
    : 0;
  const energyRate = targetEnergy > state.energy ? 10 : 1.8;
  const energyLerp = 1 - Math.exp(-safeDt * energyRate);
  const nextEnergy = clamp(state.energy + (targetEnergy - state.energy) * energyLerp, 0, 1);

  return {
    ...state,
    x: nextX,
    y: nextY,
    vx: nextVx,
    vy: nextVy,
    energy: nextEnergy,
  };
}

/**
 * Applies smooth radial magnetic repulsion, subtle directional cursor wake,
 * and traveling acoustic micro-ripples around the pointer position.
 */
export function applyCursorWaveForce(
  px: number,
  py: number,
  cursor: CursorWaveState,
  timeSec: number,
  influenceRadiusPx: number,
  forceMultiplier = 1
): Point2D {
  if (!cursor.hasPointer || cursor.energy <= 0.005 || influenceRadiusPx <= 1) {
    return { x: px, y: py };
  }

  const dx = px - cursor.x;
  const dy = py - cursor.y;
  const distSq = dx * dx + dy * dy;
  const maxR = influenceRadiusPx * 1.45;
  if (distSq > maxR * maxR) {
    return { x: px, y: py };
  }

  const dist = Math.max(4, Math.sqrt(distSq));
  const sigma = influenceRadiusPx * 0.48;
  const falloff = Math.exp(-distSq / (2 * sigma * sigma));

  // Primary smooth bow radially away from cursor like acoustic dispersion pressure
  const nx = dx / dist;
  const ny = dy / dist;
  const ripple = Math.sin(dist * 0.048 - timeSec * 4.4) * 5.5;
  const pushPx = (42 + ripple) * falloff * cursor.energy * forceMultiplier;

  // Gentle velocity wake dragging lines softly behind fast pointer sweeps
  const wakeX = clamp(cursor.vx * 0.026, -24, 24) * falloff * cursor.energy * forceMultiplier;
  const wakeY = clamp(cursor.vy * 0.026, -24, 24) * falloff * cursor.energy * forceMultiplier;

  return {
    x: px + nx * pushPx + wakeX,
    y: py + ny * pushPx + wakeY,
  };
}

/**
 * Evaluates an open full-width organic multi-harmonic wave contour with scroll parallax & cursor reactivity.
 */
export function evaluateAcousticRibbonPoints(
  spec: AcousticRibbonSpec,
  width: number,
  height: number,
  timeSec: number,
  scrollTimelinePos: number,
  cursor: CursorWaveState,
  segments = 64
): Point2D[] {
  const safeW = Math.max(320, width);
  const safeH = Math.max(320, height);
  const marginX = safeW * 0.08;
  const spanW = safeW + marginX * 2;
  const influenceRadius = clamp(Math.min(safeW, safeH) * 0.3, 190, 340);
  const baseY = spec.baseYFraction * safeH;
  const scrollPhase = scrollTimelinePos * spec.parallaxWeight * 2.1;

  const pts: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const rawX = -marginX + u * spanW;
    const theta = u * Math.PI * 2 + scrollPhase;

    // 3 incommensurable harmonic traveling waves -> non-repeating organic drift
    const yWave =
      Math.sin(theta * spec.freq1 + timeSec * spec.speed1 + spec.phase) * spec.amplitudePx * 0.56 +
      Math.sin(theta * spec.freq2 + timeSec * spec.speed2 - spec.phase * 1.3) *
        spec.amplitudePx *
        0.3 +
      Math.cos(theta * spec.freq3 + timeSec * (spec.speed1 - spec.speed2) * 0.65) *
        spec.amplitudePx *
        0.16;

    const rawY = baseY + yWave;
    pts.push(applyCursorWaveForce(rawX, rawY, cursor, timeSec, influenceRadius, 1.0));
  }
  return pts;
}

/**
 * Evaluates a closed, slowly drifting & morphing topographic acoustic loop curve with cursor reactivity.
 */
export function evaluateTopoLoopPoints(
  spec: AcousticTopoLoopSpec,
  width: number,
  height: number,
  timeSec: number,
  scrollTimelinePos: number,
  cursor: CursorWaveState,
  segments = 56,
  radiusScale = 1.0
): Point2D[] {
  const safeW = Math.max(320, width);
  const safeH = Math.max(320, height);
  const influenceRadius = clamp(Math.min(safeW, safeH) * 0.3, 190, 340);

  // Subtle horizontal & vertical orbital wander + gentle scroll drift
  const scrollShiftX = -((scrollTimelinePos - 1.36) * spec.parallaxWeight * safeW * 0.16);
  const cx =
    spec.cxFraction * safeW +
    scrollShiftX +
    Math.sin(timeSec * spec.driftSpeed + spec.phase) * safeW * 0.025;
  const cy =
    spec.cyFraction * safeH +
    Math.cos(timeSec * spec.driftSpeed * 0.83 + spec.phase * 1.4) * safeH * 0.032;

  const rx = spec.rxFraction * safeW * radiusScale;
  const ry = spec.ryFraction * safeH * radiusScale;
  const cosTilt = Math.cos(spec.tiltRad + Math.sin(timeSec * 0.12 + spec.phase) * 0.08);
  const sinTilt = Math.sin(spec.tiltRad + Math.sin(timeSec * 0.12 + spec.phase) * 0.08);

  const [h2, h3, h4] = spec.harmonics;
  const pts: Point2D[] = [];

  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const mod =
      1 +
      h2 * Math.cos(2 * a + timeSec * spec.morphSpeed + spec.phase) +
      h3 * Math.sin(3 * a - timeSec * spec.morphSpeed * 1.37 + spec.phase * 1.7) +
      h4 * Math.cos(4 * a + timeSec * spec.morphSpeed * 0.71 - spec.phase);

    const lx = Math.cos(a) * rx * mod;
    const ly = Math.sin(a) * ry * mod;

    const rawX = cx + lx * cosTilt - ly * sinTilt;
    const rawY = cy + lx * sinTilt + ly * cosTilt;

    pts.push(applyCursorWaveForce(rawX, rawY, cursor, timeSec, influenceRadius, 1.05));
  }
  return pts;
}
