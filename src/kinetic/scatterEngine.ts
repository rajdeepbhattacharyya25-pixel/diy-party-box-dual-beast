export interface LetterToken {
  char: string;
  globalIndex: number;
  wordIndex: number;
  charIndexInWord: number;
  totalChars: number;
  /** Normalized horizontal position within the headline in [-1, 1] */
  normalizedX: number;
}

export interface WordToken {
  word: string;
  wordIndex: number;
  letters: LetterToken[];
}

export interface LetterScatterSpec {
  globalIndex: number;
  /** Upward vertical flight target in pixels (always strongly negative, e.g. -460 to -740) */
  targetY: number;
  /** Horizontal scatter dispersion in pixels (-360 to +360) */
  targetX: number;
  /** Rotational spin in degrees (-58 to +58) */
  targetRotateDeg: number;
  /** Peak scale factor during upward launch */
  peakScale: number;
  /** Normalized scroll progress [0..0.26] at which this letter begins lifting off */
  startProgress: number;
  /** Normalized scroll progress [0.55..0.95] at which this letter completes its upward exit */
  endProgress: number;
  /** Staggered entry start for incoming scene [0.22..0.54] */
  sceneTwoStart: number;
  /** Staggered entry lock for incoming scene [0.72..0.98] */
  sceneTwoEnd: number;
  /** Initial downward offset for incoming scene before rising into place (positive Y in px) */
  sceneTwoOriginY: number;
  /** Subtle horizontal convergence offset for incoming scene */
  sceneTwoOriginX: number;
  /** Subtle initial tilt for incoming scene before settling to 0deg */
  sceneTwoOriginRotateDeg: number;
}

export interface ComputedLetterTransform {
  x: number;
  y: number;
  rotateDeg: number;
  scale: number;
  opacity: number;
  blurPx: number;
  /** Upward motion-trail intensity [0..1] for visual lift-off feedback */
  trailIntensity: number;
}

export interface SceneHeadlinePreset {
  id: string;
  indexLabel: string;
  title: string;
  sceneOneKicker: string;
  sceneOneHeadline: string;
  sceneOneSubcopy: string;
  sceneTwoKicker: string;
  sceneTwoHeadline: string;
  sceneTwoSubcopy: string;
}

export interface ZeninSceneDefinition {
  index: number;
  id: string;
  shortLabel: string;
  navLabel: string;
  headline: string;
  subcopy: string;
  accentColor: string;
}

export const DIY_PARTY_BOX_SCENES: ZeninSceneDefinition[] = [
  {
    index: 0,
    id: 'scene-01-story',
    shortLabel: '01',
    navLabel: 'The Story',
    headline: 'DIY Party Box',
    subcopy:
      'Hand-built MDF stereo speakers with two front drivers, a 16-LED WLED ring, and a 6000 mAh battery.',
    accentColor: '#2C3480',
  },
  {
    index: 1,
    id: 'scene-02-craft',
    shortLabel: '02',
    navLabel: 'Craftsmanship',
    headline: 'A Story In Every Piece.',
    subcopy:
      'Textured MDF cabinets with custom driver cutouts, hand-wired internals, and all the small details of a garage build.',
    accentColor: '#2C3480',
  },
  {
    index: 2,
    id: 'scene-03-journey',
    shortLabel: '03',
    navLabel: 'Build Journey',
    headline: 'The Journey Behind Every Wire',
    subcopy:
      'From cutting the MDF panels and mounting the drivers to wiring the ESP32 and rear control plate.',
    accentColor: '#4F5BD5',
  },
  {
    index: 3,
    id: 'scene-04-party',
    shortLabel: '04',
    navLabel: 'Anatomy',
    headline: 'Amplified',
    subcopy:
      'Matched Left (L) and Right (R) stereo speakers with side passive radiators and front WLED rings.',
    accentColor: '#2C3480',
  },
  {
    index: 4,
    id: 'scene-05-features',
    shortLabel: '05',
    navLabel: 'Unique Features',
    headline: 'What Makes It Truly Unique',
    subcopy:
      'Each speaker packs front drivers, a side passive radiator, a rear control panel, and top touch controls.',
    accentColor: '#4F5BD5',
  },
  {
    index: 5,
    id: 'scene-06-gallery',
    shortLabel: '06',
    navLabel: 'Media Gallery',
    headline: 'In The Wild',
    subcopy:
      'Photos and test clips of the finished Left and Right speakers in action.',
    accentColor: '#3B5BFF',
  },
];

export const ZENIN_SCENES = DIY_PARTY_BOX_SCENES;

export const SCENE_PRESETS: SceneHeadlinePreset[] = [
  {
    id: 'diy-party-box',
    indexLabel: '01. DIY Party Box',
    title: 'DIY Party Box Speaker',
    sceneOneKicker: '01 · Hand-Built Stereo Speaker',
    sceneOneHeadline: 'DIY Party Box',
    sceneOneSubcopy:
      'Two MDF speaker cabinets wired with an ESP32, WLED RGB rings, and a 6000 mAh battery. Scroll to begin.',
    sceneTwoKicker: '02 · Built By Hand',
    sceneTwoHeadline: 'A Story In Every Piece.',
    sceneTwoSubcopy:
      'Textured MDF cabinets with custom driver cutouts, hand-wired internals, and all the small details of a garage build.',
  },
  {
    id: 'manifesto',
    indexLabel: '02. Kinetic Manifesto',
    title: 'Kinetic Manifesto',
    sceneOneKicker: '01. Scene One · Static Equilibrium',
    sceneOneHeadline: 'GRAVITY HOLDS EVERY LETTER STILL',
    sceneOneSubcopy:
      'Scroll downward to release the typographic lockup. Every glyph detaches on its own upward vector while the viewport remains pinned in place.',
    sceneTwoKicker: '02. Scene Two · Upward Ascent',
    sceneTwoHeadline: 'UNTIL MOTION SETS THEM FREE',
    sceneTwoSubcopy:
      'As the first headline scatters skyward, the second statement rises from beneath the stage and locks into precision alignment.',
  },
  {
    id: 'cinema',
    indexLabel: '03. Title Sequence',
    title: 'Title Sequence',
    sceneOneKicker: '01. Scene One · Opening Frame',
    sceneOneHeadline: 'SILENCE BEFORE THE FIRST SPARK',
    sceneOneSubcopy:
      'Designed as a zero-scroll stage: the document never moves, turning every wheel tick into pure choreographed frame progression.',
    sceneTwoKicker: '02. Scene Two · Final Act',
    sceneTwoHeadline: 'THUNDER ACROSS THE WIDE SCREEN',
    sceneTwoSubcopy:
      'Each letterform follows a deterministic ballistic curve with custom angular momentum and staggered launch timing.',
  },
];

/**
 * Deterministic seeded pseudo-random generator in [0, 1) for reproducible letter trajectories.
 */
function seededRandom(seed: number): () => number {
  let state = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Splits a headline string into words and character tokens with global indices
 * so words wrap cleanly while every individual letter is independently animated.
 */
export function tokenizeHeadline(headline: string): {
  words: WordToken[];
  totalChars: number;
} {
  const cleaned = headline.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { words: [], totalChars: 0 };
  }

  const rawWords = cleaned.split(' ');
  const totalChars = rawWords.reduce((sum, w) => sum + w.length, 0);
  let cursor = 0;

  const words: WordToken[] = rawWords.map((word, wordIndex) => {
    const letters: LetterToken[] = Array.from(word).map((char, charIndexInWord) => {
      const globalIndex = cursor++;
      const normalizedX =
        totalChars > 1 ? (globalIndex / (totalChars - 1)) * 2 - 1 : 0;
      return {
        char,
        globalIndex,
        wordIndex,
        charIndexInWord,
        totalChars,
        normalizedX,
      };
    });
    return {
      word,
      wordIndex,
      letters,
    };
  });

  return { words, totalChars };
}

/**
 * Computes deterministic upward-scatter physics parameters for a single letter.
 * Guarantees every letter flies upward (targetY <= -460) and scatters laterally.
 */
export function computeLetterScatterSpec(
  token: LetterToken
): LetterScatterSpec {
  const rng = seededRandom(
    (token.globalIndex + 1) * 7919 + token.wordIndex * 104729
  );

  // Line-aware upward vertical displacement: first-half words launch higher so rows never collide
  const isUpperRow = token.normalizedX < 0;
  const baseUpward = isUpperRow ? 520 : 460;
  const targetY = -Math.round(baseUpward + rng() * 220);

  // Clean radial fan-out across the viewport width with controlled organic variance
  const radialFan = token.normalizedX * 360;
  const charSpread = ((token.globalIndex % 5) - 2) * 42;
  const jitterX = (rng() - 0.5) * 90;
  const targetX = Math.round(radialFan + charSpread + jitterX);

  // Rotational spin: deterministic angular velocity (-58deg to +58deg, never near 0)
  const spinSign = token.globalIndex % 2 === 0 ? 1 : -1;
  const targetRotateDeg = Math.round(
    spinSign * (15 + rng() * 38) + token.normalizedX * 12
  );

  const peakScale = Number((1.05 + rng() * 0.16).toFixed(3));

  // Staggered launch window so center/outer letters peel off in an organic wave
  const waveOffset = Math.abs(token.normalizedX) * 0.10 + rng() * 0.14;
  const startProgress = Number(Math.min(0.26, waveOffset).toFixed(4));
  const duration = 0.56 + rng() * 0.14;
  const endProgress = Number(
    Math.min(0.95, startProgress + duration).toFixed(4)
  );

  // Incoming scene staggered rise-from-below window
  const s2Delay =
    0.26 +
    (token.globalIndex / Math.max(1, token.totalChars)) * 0.20 +
    rng() * 0.08;
  const sceneTwoStart = Number(Math.min(0.54, s2Delay).toFixed(4));
  const sceneTwoEnd = Number(Math.min(0.98, sceneTwoStart + 0.38).toFixed(4));

  const sceneTwoOriginY = Math.round(160 + rng() * 120);
  const sceneTwoOriginX = Math.round((rng() - 0.5) * 80);
  const sceneTwoOriginRotateDeg = Math.round((rng() - 0.5) * 24);

  return {
    globalIndex: token.globalIndex,
    targetY,
    targetX,
    targetRotateDeg,
    peakScale,
    startProgress,
    endProgress,
    sceneTwoStart,
    sceneTwoEnd,
    sceneTwoOriginY,
    sceneTwoOriginX,
    sceneTwoOriginRotateDeg,
  };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Computes outgoing scene letter transform at a given normalized transition progress [0..1].
 * - At progress = 0: locked in place (x=0, y=0, rotate=0, scale=1, opacity=1).
 * - As progress increases: scatters outward and accelerates upward (y < 0).
 * - At progress = 1: completely flown upward off-stage (y = targetY, opacity = 0).
 */
export function getSceneOneLetterTransform(
  spec: LetterScatterSpec,
  rawProgress: number
): ComputedLetterTransform {
  const progress = clamp01(rawProgress);
  if (progress <= 0.0001) {
    return {
      x: 0,
      y: 0,
      rotateDeg: 0,
      scale: 1,
      opacity: 1,
      blurPx: 0,
      trailIntensity: 0,
    };
  }

  const localT = clamp01(
    (progress - spec.startProgress) /
      Math.max(0.05, spec.endProgress - spec.startProgress)
  );

  const upwardEase =
    0.12 * progress + 0.88 * Math.pow(localT, 1.55);
  const lateralEase = 0.14 * progress + 0.86 * (1 - Math.pow(1 - localT, 1.8));

  const x = Number((spec.targetX * lateralEase).toFixed(2));
  const y = Number((spec.targetY * upwardEase).toFixed(2));
  const rotateDeg = Number((spec.targetRotateDeg * lateralEase).toFixed(2));

  const sinArc = Math.sin(localT * Math.PI);
  const scale = Number(
    (1 + (spec.peakScale - 1) * sinArc - 0.14 * Math.pow(localT, 2)).toFixed(3)
  );

  const fadeT = clamp01((localT - 0.56) / 0.44);
  const opacity =
    progress >= 0.98 ? 0 : Number((1 - fadeT * fadeT).toFixed(3));

  const blurPx = Number((fadeT * 5).toFixed(2));
  const trailIntensity = Number((sinArc * (1 - fadeT * 0.5)).toFixed(3));

  return {
    x,
    y,
    rotateDeg,
    scale,
    opacity,
    blurPx,
    trailIntensity,
  };
}

/**
 * Computes incoming scene letter transform at a given normalized transition progress [0..1].
 * - At progress = 0: waiting below stage (y = sceneTwoOriginY, opacity = 0).
 * - As outgoing scene scatters upward: rises smoothly and settles into lockup.
 * - At progress = 1: locked at exact identity (x=0, y=0, rotate=0, scale=1, opacity=1).
 */
export function getSceneTwoLetterTransform(
  spec: LetterScatterSpec,
  rawProgress: number
): ComputedLetterTransform {
  const progress = clamp01(rawProgress);
  if (progress >= 0.999) {
    return {
      x: 0,
      y: 0,
      rotateDeg: 0,
      scale: 1,
      opacity: 1,
      blurPx: 0,
      trailIntensity: 0,
    };
  }

  const localT = clamp01(
    (progress - spec.sceneTwoStart) /
      Math.max(0.05, spec.sceneTwoEnd - spec.sceneTwoStart)
  );

  if (localT <= 0.0001) {
    return {
      x: spec.sceneTwoOriginX,
      y: spec.sceneTwoOriginY,
      rotateDeg: spec.sceneTwoOriginRotateDeg,
      scale: 0.88,
      opacity: 0,
      blurPx: 8,
      trailIntensity: 0,
    };
  }

  const easeOut = 1 - Math.pow(1 - localT, 3);
  const remaining = 1 - easeOut;

  const x = Number((spec.sceneTwoOriginX * remaining).toFixed(2));
  const y = Number((spec.sceneTwoOriginY * remaining).toFixed(2));
  const rotateDeg = Number(
    (spec.sceneTwoOriginRotateDeg * remaining).toFixed(2)
  );
  const scale = Number((0.88 + 0.12 * easeOut).toFixed(3));
  const opacity = Number(clamp01(localT * 1.45).toFixed(3));
  const blurPx = Number(((1 - easeOut) * 6).toFixed(2));

  return {
    x,
    y,
    rotateDeg,
    scale,
    opacity,
    blurPx,
    trailIntensity: 0,
  };
}

/**
 * Evaluates a letter's transform for `sceneIndex` along a continuous multi-scene timeline
 * `timelinePos` in `[0, maxSceneIndex]`.
 */
export function getMultiSceneLetterTransform(
  spec: LetterScatterSpec,
  sceneIndex: number,
  timelinePos: number
): ComputedLetterTransform {
  const rel = timelinePos - sceneIndex;

  if (Math.abs(rel) <= 0.0005) {
    return {
      x: 0,
      y: 0,
      rotateDeg: 0,
      scale: 1,
      opacity: 1,
      blurPx: 0,
      trailIntensity: 0,
    };
  }

  if (rel > 0) {
    if (rel >= 1) {
      return {
        x: spec.targetX,
        y: spec.targetY,
        rotateDeg: spec.targetRotateDeg,
        scale: 0.85,
        opacity: 0,
        blurPx: 6,
        trailIntensity: 0,
      };
    }
    return getSceneOneLetterTransform(spec, rel);
  }

  const incomingProgress = 1 + rel;
  if (incomingProgress <= 0) {
    return {
      x: spec.sceneTwoOriginX,
      y: spec.sceneTwoOriginY,
      rotateDeg: spec.sceneTwoOriginRotateDeg,
      scale: 0.88,
      opacity: 0,
      blurPx: 8,
      trailIntensity: 0,
    };
  }
  return getSceneTwoLetterTransform(spec, incomingProgress);
}

/**
 * Converts a wheel / touch vertical delta into a clamped scroll progress [0..1].
 */
export function applyScrollDelta(
  currentProgress: number,
  deltaY: number,
  sensitivity = 0.00085
): number {
  const next = currentProgress + deltaY * sensitivity;
  return Number(clamp01(next).toFixed(4));
}

export type ScenePhaseId = 'scene-1' | 'scattering' | 'scene-2';

export function getActiveScenePhase(progress: number): ScenePhaseId {
  const p = clamp01(progress);
  if (p <= 0.12) return 'scene-1';
  if (p >= 0.88) return 'scene-2';
  return 'scattering';
}
