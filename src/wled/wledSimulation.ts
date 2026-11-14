import {
  QuickColorSwatch,
  RgbColor,
  VirtualSpeakerId,
  VirtualSpeakerState,
  WledEffectDefinition,
  WledEffectId,
  WledPaletteDefinition,
  WledPaletteId,
  WledStudioState,
} from './wledTypes';

export const WLED_QUICK_COLORS: QuickColorSwatch[] = [
  { id: 'cobalt', label: 'Cobalt Blue', hex: '#3B5BFF', rgb: { r: 59, g: 91, b: 255 } },
  { id: 'electric', label: 'Electric Blue', hex: '#00A3FF', rgb: { r: 0, g: 163, b: 255 } },
  { id: 'white', label: 'White', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
  { id: 'red', label: 'Red', hex: '#FF2A3C', rgb: { r: 255, g: 42, b: 60 } },
  { id: 'green', label: 'Green', hex: '#10E868', rgb: { r: 16, g: 232, b: 104 } },
  { id: 'purple', label: 'Purple', hex: '#9B30FF', rgb: { r: 155, g: 48, b: 255 } },
  { id: 'cyan', label: 'Cyan', hex: '#00F0FF', rgb: { r: 0, g: 240, b: 255 } },
  { id: 'amber', label: 'Warm Amber', hex: '#FF9F1C', rgb: { r: 255, g: 159, b: 28 } },
];

export const WLED_PALETTES: WledPaletteDefinition[] = [
  {
    id: 'cobalt-dreams',
    name: 'Cobalt Dreams',
    stops: ['#18225E', '#2C3480', '#3B5BFF', '#93C5FD'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    stops: ['#021B79', '#0575E6', '#00D2FF', '#A1FFCE'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    stops: ['#0F2027', '#00E676', '#00B0FF', '#8E24AA'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    stops: ['#3A0CA3', '#F72585', '#FF6D00', '#FFD166'],
  },
  {
    id: 'fire',
    name: 'Fire',
    stops: ['#2B0000', '#B80C09', '#FF5400', '#FFDD00'],
  },
  {
    id: 'neon',
    name: 'Neon',
    stops: ['#3B5BFF', '#FF007F', '#00F5D4', '#FEE440'],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    stops: ['#262626', '#737373', '#D4D4D4', '#FFFFFF'],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    stops: ['#FF2A3C', '#FF9F1C', '#FFE600', '#10E868', '#00A3FF', '#9B30FF'],
  },
];

export const WLED_EFFECTS: WledEffectDefinition[] = [
  {
    id: 'solid',
    name: 'Solid',
    description: 'Steady solid color across all 16 LEDs',
    usesPalette: false,
  },
  {
    id: 'breathe',
    name: 'Breathe',
    description: 'Smooth fade in and fade out',
    usesPalette: true,
  },
  {
    id: 'blink',
    name: 'Blink',
    description: 'Steady on-and-off flash at your chosen speed',
    usesPalette: false,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Full color wheel rotating around the 16-LED ring',
    usesPalette: true,
  },
  {
    id: 'chase',
    name: 'Chase',
    description: 'Moving color dots chasing around the 16-LED ring',
    usesPalette: true,
  },
  {
    id: 'color-wipe',
    name: 'Color Wipe',
    description: 'Fills the ring step by step, then clears it',
    usesPalette: true,
  },
  {
    id: 'twinkle',
    name: 'Twinkle',
    description: 'Random LED sparkles behind the frosted ring',
    usesPalette: true,
  },
  {
    id: 'meteor',
    name: 'Meteor',
    description: 'Bright leading LED with a fading trail around the ring',
    usesPalette: true,
  },
  {
    id: 'fire',
    name: 'Fire',
    description: 'Warm flickering ember glow around the ring',
    usesPalette: true,
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Rhythmic color pulse around the LED ring',
    usesPalette: true,
  },
];

export function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (n: number) => clampByte(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function parseHexColor(input: string): RgbColor | null {
  const normalized = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function createInitialWledState(): WledStudioState {
  return {
    activeSpeakerId: 'left',
    syncEnabled: false,
    activeTab: 'colour',
    speakers: {
      left: {
        id: 'left',
        code: 'L',
        name: 'LEFT',
        powered: true,
        brightness: 82,
        colorHex: '#3B5BFF',
        rgb: { r: 59, g: 91, b: 255 },
        paletteId: 'cobalt-dreams',
        effectId: 'breathe',
        speed: 54,
        intensity: 64,
      },
      right: {
        id: 'right',
        code: 'R',
        name: 'RIGHT',
        powered: true,
        brightness: 74,
        colorHex: '#00A3FF',
        rgb: { r: 0, g: 163, b: 255 },
        paletteId: 'ocean',
        effectId: 'chase',
        speed: 62,
        intensity: 68,
      },
    },
  };
}

export type SpeakerPatch = Partial<
  Pick<
    VirtualSpeakerState,
    'powered' | 'brightness' | 'colorHex' | 'rgb' | 'paletteId' | 'effectId' | 'speed' | 'intensity'
  >
>;

/**
 * Pure immutable transition applying lighting edits either to the selected speaker
 * or to BOTH virtual speakers simultaneously when stereo SYNC is enabled.
 */
export function applySpeakerPatch(
  state: WledStudioState,
  targetId: VirtualSpeakerId,
  patch: SpeakerPatch
): WledStudioState {
  const normalizeForSpeaker = (base: VirtualSpeakerState): VirtualSpeakerState => {
    const nextRgb = patch.rgb
      ? {
          r: clampByte(patch.rgb.r),
          g: clampByte(patch.rgb.g),
          b: clampByte(patch.rgb.b),
        }
      : base.rgb;
    const nextHex = patch.rgb
      ? rgbToHex(nextRgb)
      : patch.colorHex
        ? patch.colorHex.toUpperCase()
        : base.colorHex;

    return {
      ...base,
      ...patch,
      rgb: nextRgb,
      colorHex: nextHex,
      brightness: patch.brightness !== undefined ? clampPercent(patch.brightness) : base.brightness,
      speed: patch.speed !== undefined ? clampPercent(patch.speed) : base.speed,
      intensity: patch.intensity !== undefined ? clampPercent(patch.intensity) : base.intensity,
    };
  };

  if (state.syncEnabled) {
    return {
      ...state,
      speakers: {
        left: normalizeForSpeaker(state.speakers.left),
        right: normalizeForSpeaker(state.speakers.right),
      },
    };
  }

  return {
    ...state,
    speakers: {
      ...state.speakers,
      [targetId]: normalizeForSpeaker(state.speakers[targetId]),
    },
  };
}

export function setSyncMode(state: WledStudioState, enabled: boolean): WledStudioState {
  if (!enabled) {
    return {
      ...state,
      syncEnabled: false,
    };
  }

  const source = state.speakers[state.activeSpeakerId];
  return {
    ...state,
    syncEnabled: true,
    speakers: {
      left: {
        ...source,
        id: 'left',
        code: 'L',
        name: 'LEFT',
        rgb: { ...source.rgb },
      },
      right: {
        ...source,
        id: 'right',
        code: 'R',
        name: 'RIGHT',
        rgb: { ...source.rgb },
      },
    },
  };
}

export function getPaletteById(id: WledPaletteId): WledPaletteDefinition {
  return WLED_PALETTES.find((p) => p.id === id) ?? WLED_PALETTES[0];
}

export function getEffectById(id: WledEffectId): WledEffectDefinition {
  return WLED_EFFECTS.find((e) => e.id === id) ?? WLED_EFFECTS[0];
}

export interface HsvColor {
  h: number; // 0..360 degrees
  s: number; // 0..1
  v: number; // 0..1
}

export function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, s));
  const val = Math.max(0, Math.min(1, v));

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hue < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: clampByte((rPrime + m) * 255),
    g: clampByte((gPrime + m) * 255),
    b: clampByte((bPrime + m) * 255),
  };
}

export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const rn = clampByte(r) / 255;
  const gn = clampByte(g) / 255;
  const bn = clampByte(b) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 0.00001) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max <= 0.00001 ? 0 : delta / max;
  return { h, s, v: max };
}

/**
 * Converts pointer offset (dx, dy) relative to wheel center into RGB using
 * polar Hue (0..360°) and Saturation (0..1 clamped to wheel radius), preserving value `v`.
 */
export function wheelOffsetToRgb(
  dx: number,
  dy: number,
  radius: number,
  value = 1
): RgbColor {
  const safeRadius = Math.max(1, radius);
  const dist = Math.hypot(dx, dy);
  const sat = Math.min(1, dist / safeRadius);
  const angleRad = Math.atan2(dy, dx);
  const hue = ((angleRad * 180) / Math.PI + 360) % 360;
  return hsvToRgb({ h: hue, s: sat, v: value });
}

/**
 * Returns normalized [-1, 1] wheel offset for placing the thumb marker cleanly on the spectrum disc.
 */
export function rgbToWheelOffset(rgb: RgbColor): { nx: number; ny: number } {
  const { h, s } = rgbToHsv(rgb);
  const rad = (h * Math.PI) / 180;
  return {
    nx: Math.cos(rad) * s,
    ny: Math.sin(rad) * s,
  };
}

