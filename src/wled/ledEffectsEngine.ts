import {
  clampByte,
  getPaletteById,
  hsvToRgb,
  parseHexColor,
} from './wledSimulation';
import { RgbColor, VirtualSpeakerState, WledPaletteId } from './wledTypes';

export const LED_RING_COUNT = 16;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(c1: RgbColor, c2: RgbColor, t: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: clampByte(lerp(c1.r, c2.r, clamped)),
    g: clampByte(lerp(c1.g, c2.g, clamped)),
    b: clampByte(lerp(c1.b, c2.b, clamped)),
  };
}

function scaleRgb(color: RgbColor, factor: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, factor));
  return {
    r: clampByte(color.r * clamped),
    g: clampByte(color.g * clamped),
    b: clampByte(color.b * clamped),
  };
}

const PARSED_PALETTE_CACHE = new Map<WledPaletteId, RgbColor[]>();

function getPaletteStopsRgb(paletteId: WledPaletteId): RgbColor[] {
  const cached = PARSED_PALETTE_CACHE.get(paletteId);
  if (cached) return cached;

  const def = getPaletteById(paletteId);
  const parsed = def.stops.map(
    (hex) => parseHexColor(hex) ?? { r: 59, g: 91, b: 255 }
  );
  PARSED_PALETTE_CACHE.set(paletteId, parsed);
  return parsed;
}

/**
 * Samples a continuous cyclic color from a curated WLED palette at normalized t in [0, 1).
 */
export function samplePaletteColor(paletteId: WledPaletteId, t: number): RgbColor {
  const stops = getPaletteStopsRgb(paletteId);
  if (stops.length === 0) return { r: 59, g: 91, b: 255 };
  if (stops.length === 1) return { ...stops[0] };

  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * stops.length;
  const idx0 = Math.floor(scaled) % stops.length;
  const idx1 = (idx0 + 1) % stops.length;
  const frac = scaled - Math.floor(scaled);

  return lerpRgb(stops[idx0], stops[idx1], frac);
}

/**
 * Computes shortest circular LED distance around the 16-LED ring.
 */
function circularDistance(a: number, b: number, count = LED_RING_COUNT): number {
  const d = Math.abs((((a - b) % count) + count) % count);
  return Math.min(d, count - d);
}

/**
 * Deterministic hash in [0, 1) for sparkle / fire procedural modulation.
 */
function hashFloat(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Generates an exact 16-LED RGB frame for the virtual speaker's front diffuser halo.
 * Respects virtual power and LED-only 0..100% brightness scaling.
 */
export function computeLedRingFrame(
  speaker: VirtualSpeakerState,
  timeSec: number
): RgbColor[] {
  const zeroFrame = (): RgbColor[] =>
    Array.from({ length: LED_RING_COUNT }, () => ({ r: 0, g: 0, b: 0 }));

  if (!speaker.powered || speaker.brightness <= 0) {
    return zeroFrame();
  }

  const brightnessScale = Math.max(0, Math.min(1, speaker.brightness / 100));
  const speedNorm = Math.max(0.15, 0.35 + (speaker.speed / 100) * 2.1);
  const intensityNorm = Math.max(0.15, speaker.intensity / 100);
  const t = Math.max(0, timeSec) * speedNorm;
  const baseRgb = speaker.rgb;

  const pixels: RgbColor[] = new Array(LED_RING_COUNT);

  for (let i = 0; i < LED_RING_COUNT; i++) {
    const frac = i / LED_RING_COUNT;
    let raw: RgbColor;

    switch (speaker.effectId) {
      case 'solid': {
        raw = baseRgb;
        break;
      }

      case 'breathe': {
        const breath = 0.16 + 0.84 * (0.5 + 0.5 * Math.sin(t * 2.2 + 0.65));
        const tint = lerpRgb(
          baseRgb,
          samplePaletteColor(speaker.paletteId, frac + t * 0.08),
          0.35 * intensityNorm
        );
        raw = scaleRgb(tint, breath);
        break;
      }

      case 'blink': {
        const cycle = (t * 1.15) % 1;
        // Crisp blink with subtle 4% edge ramp
        const level =
          cycle < 0.04
            ? cycle / 0.04
            : cycle < 0.48
              ? 1
              : cycle < 0.52
                ? 1 - (cycle - 0.48) / 0.04
                : 0.04;
        raw = scaleRgb(baseRgb, level);
        break;
      }

      case 'rainbow': {
        const hue = ((frac * 360 - t * 145) % 360 + 360) % 360;
        const rainbowRgb = hsvToRgb({ h: hue, s: 1, v: 1 });
        raw =
          speaker.paletteId === 'rainbow'
            ? rainbowRgb
            : lerpRgb(
                rainbowRgb,
                samplePaletteColor(speaker.paletteId, frac - t * 0.4),
                0.35
              );
        break;
      }

      case 'chase': {
        const headA = (t * 8.5) % LED_RING_COUNT;
        const headB = (headA + LED_RING_COUNT / 2) % LED_RING_COUNT;
        const dA = circularDistance(i, headA);
        const dB = circularDistance(i, headB);
        const glowA = Math.max(0, 1 - dA / (2.2 + intensityNorm * 1.8));
        const glowB = Math.max(0, 1 - dB / (2.2 + intensityNorm * 1.8));
        const peak = Math.max(glowA, glowB);
        const runnerColor = lerpRgb(
          baseRgb,
          samplePaletteColor(speaker.paletteId, frac + t * 0.2),
          0.65
        );
        raw = scaleRgb(runnerColor, 0.08 + 0.92 * Math.pow(peak, 1.4));
        break;
      }

      case 'color-wipe': {
        const phase = (t * 0.55) % 2;
        const wipeColor = lerpRgb(
          baseRgb,
          samplePaletteColor(speaker.paletteId, frac + Math.floor((t * 0.55) / 2) * 0.25),
          0.5
        );
        if (phase < 1) {
          const litCount = phase * LED_RING_COUNT;
          const level = i <= litCount ? 1 : Math.max(0.05, 1 - (i - litCount) * 1.2);
          raw = scaleRgb(wipeColor, level);
        } else {
          const cleared = (phase - 1) * LED_RING_COUNT;
          const level = i >= cleared ? 1 : 0.04;
          raw = scaleRgb(wipeColor, level);
        }
        break;
      }

      case 'twinkle': {
        const speedTick = t * 2.6;
        const epoch = Math.floor(speedTick + hashFloat(i * 19.3) * 3);
        const localPhase = (speedTick + hashFloat(i * 19.3) * 3) % 1;
        const sparkleMask = hashFloat(i * 41.7 + epoch * 7.1) < 0.28 + 0.42 * intensityNorm ? 1 : 0.14;
        const sparkleEnv = Math.sin(localPhase * Math.PI);
        const level = Math.max(0.08, sparkleMask * Math.pow(sparkleEnv, 1.5));
        const tint = lerpRgb(
          baseRgb,
          samplePaletteColor(speaker.paletteId, hashFloat(i + epoch * 0.17)),
          0.68
        );
        raw = scaleRgb(tint, level);
        break;
      }

      case 'meteor': {
        const head = (t * 11.0) % LED_RING_COUNT;
        const trailLen = 4.5 + intensityNorm * 4.5;
        // Distance behind the rotating meteor head (clockwise)
        const trailDist = (((head - i) % LED_RING_COUNT) + LED_RING_COUNT) % LED_RING_COUNT;
        let energy = 0.04;
        if (trailDist < 0.85) {
          energy = 1;
        } else if (trailDist < trailLen) {
          const decay = 1 - trailDist / trailLen;
          energy = Math.max(0.04, Math.pow(decay, 1.85));
        }
        const tailColor = lerpRgb(
          baseRgb,
          samplePaletteColor(speaker.paletteId, trailDist / trailLen + t * 0.15),
          0.35 * intensityNorm
        );
        const headColor = lerpRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.32);
        const mixed = trailDist < 0.85 ? headColor : tailColor;
        raw = scaleRgb(mixed, energy);
        break;
      }

      case 'fire': {
        // Symmetric warm ember flame gradient around upper/lower diffuser arcs
        const flameWave =
          0.45 +
          0.35 * Math.sin(t * 7.2 + i * 1.35) +
          0.2 * Math.cos(t * 11.4 - i * 2.1);
        const flicker = Math.max(
          0.18,
          Math.min(1, flameWave * (0.65 + 0.35 * hashFloat(i + Math.floor(t * 12) * 0.31)))
        );
        const heatPos = flicker * 0.88;
        const paletteBias =
          speaker.paletteId === 'cobalt-dreams' ? 'fire' : speaker.paletteId;
        const ember = lerpRgb(
          samplePaletteColor(paletteBias, heatPos),
          samplePaletteColor('fire', heatPos),
          0.55
        );
        raw = scaleRgb(ember, flicker);
        break;
      }

      case 'pulse': {
        const beat = (t * 1.45) % 1;
        // Sharp attack [0..0.14], exponential acoustic decay [0.14..1]
        const attack = beat < 0.14 ? beat / 0.14 : Math.exp(-(beat - 0.14) * 4.4);
        const spatialRipple =
          0.72 + 0.28 * Math.cos(frac * Math.PI * 2 - t * 3.0);
        const level = Math.max(0.08, Math.min(1, attack * spatialRipple));
        const pulseTint = lerpRgb(
          baseRgb,
          samplePaletteColor(speaker.paletteId, frac + t * 0.25),
          0.58 * intensityNorm
        );
        raw = scaleRgb(pulseTint, level);
        break;
      }
    }

    pixels[i] = scaleRgb(raw, brightnessScale);
  }

  return pixels;
}
