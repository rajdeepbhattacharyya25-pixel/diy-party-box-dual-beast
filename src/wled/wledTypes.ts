export type VirtualSpeakerId = 'left' | 'right';

export type WledEffectId =
  | 'solid'
  | 'breathe'
  | 'blink'
  | 'rainbow'
  | 'chase'
  | 'color-wipe'
  | 'twinkle'
  | 'meteor'
  | 'fire'
  | 'pulse';

export type WledPaletteId =
  | 'cobalt-dreams'
  | 'ocean'
  | 'aurora'
  | 'sunset'
  | 'fire'
  | 'neon'
  | 'monochrome'
  | 'rainbow';

export type WledControlTab = 'colour' | 'palettes' | 'effects';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface QuickColorSwatch {
  id: string;
  label: string;
  hex: string;
  rgb: RgbColor;
}

export interface WledPaletteDefinition {
  id: WledPaletteId;
  name: string;
  stops: string[];
}

export interface WledEffectDefinition {
  id: WledEffectId;
  name: string;
  description: string;
  usesPalette: boolean;
}

export interface VirtualSpeakerState {
  id: VirtualSpeakerId;
  code: 'L' | 'R';
  name: 'LEFT' | 'RIGHT';
  powered: boolean;
  brightness: number; // 0..100 (LED illumination brightness only)
  colorHex: string;
  rgb: RgbColor;
  paletteId: WledPaletteId;
  effectId: WledEffectId;
  speed: number; // 0..100
  intensity: number; // 0..100
}

export interface WledStudioState {
  activeSpeakerId: VirtualSpeakerId;
  syncEnabled: boolean;
  activeTab: WledControlTab;
  speakers: Record<VirtualSpeakerId, VirtualSpeakerState>;
}
