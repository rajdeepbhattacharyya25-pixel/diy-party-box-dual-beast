export type CollageSizeVariant = 'sm' | 'md' | 'lg' | 'hero';

export interface CollageCadAnnotation {
  id: string;
  label: string;
  sublabel?: string;
  /** Pinpoint dot on the image in % [0..100] */
  targetX: number;
  targetY: number;
  /** Label anchor in % [0..100] */
  labelX: number;
  labelY: number;
  align?: 'left' | 'right';
}

export interface CollageModalSection {
  heading: string;
  body?: string;
  bullets?: string[];
  mono?: boolean;
}

export interface CollagePartItem {
  id: string;
  partName: string;
  modalTitle?: string;
  roleLabel: string;
  featureSummary: string;
  functionNote: string;
  howToUseSteps: string[];
  modalSections?: CollageModalSection[];
  modalFooterLabel?: string;
  metric: string;
  imageSrc: string;
  aspectRatioClass: string;
  sizeVariant: CollageSizeVariant;
  /** Independent horizontal parallax speed multiplier (0.98..1.03 for clean non-overtaking glide) */
  parallaxSpeed: number;
  /** Independent horizontal anchor along the continuous right-to-left canvas */
  canvasXFraction: number;
  /** Asymmetric vertical baseline fraction within the desktop stage (0.10..0.50) */
  canvasYFraction: number;
  /** Gentle subtle vertical drift amplitude in px across horizontal travel */
  verticalDriftPx: number;
  /** Keep legacy percentage aliases cleanly aligned for existing diagnostics */
  desktopLeftPct: number;
  desktopTopPct: number;
  /** Subtle reveal stagger threshold [0..0.45] */
  revealStagger: number;
  /** Closing right-end feature story frame with quote & Rajdeep signature */
  isClosingStory?: boolean;
  /** Optional explicit physical dimensions summary displayed in blueprint plates & modal */
  dimensionsSpec?: string;
  /** Studio backdrop harmony ('dark' for black-void renders, 'paper' for white-cutout / drafting sheets, 'transparent' for unboxed PNG cutouts) */
  imageSurface?: 'dark' | 'paper' | 'transparent';
  /** Vector CAD leader callouts plotted over the plate */
  cadAnnotations?: CollageCadAnnotation[];
  /** Custom architectural CAD diagram overlay mode plotted over the studio photograph */
  diagramOverlay?: 'three-quarter-dims' | 'dual-passive-radiator';
}

export interface CollageBackgroundNote {
  id: string;
  eyebrow: string;
  headline: string;
  /** Horizontal anchor in viewport-width units along the collage canvas */
  anchorVw: number;
  /** Vertical band fraction of viewport height */
  topVh: number;
  /** Horizontal parallax multiplier */
  parallaxSpeed: number;
  /** Optional hairline spec line under headline */
  subSpec: string;
}

export const COLLAGE_TOTAL_PAN_VW = 3.18;

export const COLLAGE_BACKGROUND_NOTES: CollageBackgroundNote[] = [
  {
    id: 'bg-mdf-board',
    eyebrow: 'CABINET DIMENSIONS · 15 × 14.7 × 27.5 CM',
    headline: 'Made it with MDF board',
    anchorVw: 0.34,
    topVh: 0.14,
    parallaxSpeed: 1.0,
    subSpec: 'Ø 7 CM & Ø 5 CM CUTOUTS · TEXTURED MATTE FINISH',
  },
  {
    id: 'bg-6000mah-battery',
    eyebrow: 'INTERNAL PORTABLE BATTERY',
    headline: '6000 mAh battery',
    anchorVw: 1.24,
    topVh: 0.14,
    parallaxSpeed: 1.0,
    subSpec: 'USB-C CHARGING + 12V DC DIRECT POWER INPUT',
  },
];

export interface CollageClosingStatementWord {
  word: string;
  index: number;
  isAccent: boolean;
}

export interface CollageClosingStatementConfig {
  id: string;
  eyebrow: string;
  text: string;
  footerSpec: string;
  anchorVw: number;
  topVh: number;
  parallaxSpeed: number;
  words: CollageClosingStatementWord[];
}

export const COLLAGE_CLOSING_STATEMENT_TEXT =
  'What sets these speakers apart is that they pair wirelessly and work as separate Left and Right channels, giving you wider stereo sound across the room without a cable running between them.';

const ACCENT_WORD_INDICES = new Set([
  8, 9, // pair wirelessly
  13, 14, 15, 16, 17, // separate Left and Right channels,
  20, 21, 22, // wider stereo sound
]);

export const COLLAGE_CLOSING_STATEMENT: CollageClosingStatementConfig = {
  id: 'collage-closing-stereo-statement',
  eyebrow: '07 · WIRELESS STEREO PAIR',
  text: COLLAGE_CLOSING_STATEMENT_TEXT,
  footerSpec: 'SEPARATE LEFT & RIGHT CHANNELS · WIRELESS STEREO PAIRING',
  anchorVw: 2.38,
  topVh: 0.22,
  parallaxSpeed: 1.0,
  words: COLLAGE_CLOSING_STATEMENT_TEXT.split(' ').map((word, index) => ({
    word,
    index,
    isAccent: ACCENT_WORD_INDICES.has(index),
  })),
};

export const COLLAGE_PART_ITEMS: CollagePartItem[] = [
  {
    id: 'wled-halo-ring',
    partName: 'ESP32 RGB LED Ring',
    roleLabel: '01 · WLED LIGHTING & BATTERY INDICATOR',
    featureSummary: 'A 16-LED addressable RGB ring driven by an ESP32 running WLED. You can change colors, brightness, and effects, including sound-reactive modes.',
    functionNote: 'Connect to the speaker over local Wi-Fi to open WLED, pick colors, adjust brightness, switch effects, or turn on music-reactive lighting via the INMP441 microphone.',
    howToUseSteps: [],
    modalSections: [
      {
        heading: 'Overview',
        body: 'A 16-LED addressable RGB ring driven by an ESP32 running WLED, adding customizable lighting and battery status feedback to the front of each speaker.',
      },
      {
        heading: 'Hardware',
        body: '16-LED Ring · ESP32 · WLED (with INMP441 microphone)',
        mono: true,
      },
      {
        heading: 'Features',
        bullets: [
          'RGB effects — Pick colors, brightness levels, and built-in WLED presets.',
          'Sound reactivity — Music-reactive lighting driven by the INMP441 microphone.',
          'Battery indication — Shows charge level on startup (Green: full, Yellow: ~50%, Orange: ~25%, Red: under 20%) and flashes red below 15%, 10%, and 5%.',
        ],
      },
      {
        heading: 'Operation',
        body: 'Connect to the speaker over local Wi-Fi to open WLED and change colors, brightness, or effects. At power-on, the ring displays the battery level briefly before returning to your last preset, and puts the ESP32 into deep sleep after low-battery warnings to protect the cells.',
      },
    ],
    modalFooterLabel: 'SYSTEM',
    metric: '16-LED Ring · ESP32 · WLED',
    dimensionsSpec: '16-LED Ring · ESP32 · WLED',
    imageSrc: '/assets/aistudio/image_754baafc.webp',
    aspectRatioClass: 'aspect-[3/4]',
    sizeVariant: 'md',
    parallaxSpeed: 1.0,
    canvasXFraction: 0.03,
    canvasYFraction: 0.12,
    verticalDriftPx: 0,
    desktopLeftPct: 8,
    desktopTopPct: 12,
    revealStagger: 0.0,
    imageSurface: 'dark',
  },
  {
    id: 'mdf-chassis-dimensions',
    partName: 'MDF Speaker Cabinet',
    roleLabel: '02 · CABINET SIZE & DRIVER LAYOUT',
    featureSummary: 'Each cabinet is built from MDF and measures 15 × 14.7 × 27.5 cm, sized to fit the two front drivers, LED ring, electronics, and side passive radiator.',
    functionNote: 'The front baffle holds an upper 7 cm driver, the 16-LED ring in the middle, and a lower 5 cm driver, with a passive radiator mounted on the side panel.',
    howToUseSteps: [],
    modalSections: [
      {
        heading: 'Cabinet & Layout',
        body: 'Built from MDF and sized to house the two front drivers, LED ring, internal electronics, and side passive radiator. The front baffle holds a 7 cm upper driver, the 16-LED ring in the center, and a 5 cm lower driver.',
      },
      {
        heading: 'Dimensions',
        body: 'Width: 15 cm · Depth: 14.7 cm · Height: 27.5 cm · Front cutouts: Ø 7 cm & Ø 5 cm',
        mono: true,
      },
    ],
    modalFooterLabel: 'ENCLOSURE',
    metric: '15 × 14.7 × 27.5 cm · MDF Cabinet',
    dimensionsSpec: 'Width: 15 cm · Depth: 14.7 cm · Height: 27.5 cm · Ø 7 cm & Ø 5 cm',
    imageSrc: '/assets/aistudio/Black_Three-Quarter_Speaker_Cabinet_cd34b97a.webp',
    aspectRatioClass: 'aspect-[4/3]',
    sizeVariant: 'lg',
    parallaxSpeed: 1.01,
    canvasXFraction: 0.44,
    canvasYFraction: 0.42,
    verticalDriftPx: -4,
    desktopLeftPct: 28,
    desktopTopPct: 42,
    revealStagger: 0.08,
    imageSurface: 'paper',
    diagramOverlay: 'three-quarter-dims',
  },
  {
    id: 'dual-passive-radiators',
    partName: 'Side Passive Radiators',
    roleLabel: '03 · SIDE-MOUNTED BASS RADIATORS',
    featureSummary: 'Each speaker has a passive radiator mounted on its side wall. Internal air pressure moves the passive diaphragm to reinforce low frequencies.',
    functionNote: 'As the front drivers move, pressure changes inside the sealed MDF box drive the passive radiator on the side, adding bass output without an open port.',
    howToUseSteps: [],
    modalSections: [
      {
        heading: 'Acoustic Role',
        body: 'Each speaker has a passive radiator mounted on its side wall. As the front 7 cm and 5 cm drivers move, internal air pressure inside the sealed MDF box drives the passive diaphragm to reinforce low frequencies without an open port.',
      },
      {
        heading: 'Placement',
        body: 'Leave at least 5 cm of open space beside each speaker so the passive diaphragm can move freely.',
      },
    ],
    modalFooterLabel: 'ACOUSTICS',
    metric: '2 Passive Radiators · 1 Per Speaker',
    dimensionsSpec: '2 Passive Radiators · ~5 cm Side Clearance',
    imageSrc: '/assets/aistudio/Matte_Black_Speaker_Texture_Edit_10e0e5ac.webp',
    aspectRatioClass: 'aspect-[4/3]',
    sizeVariant: 'lg',
    parallaxSpeed: 0.99,
    canvasXFraction: 0.9,
    canvasYFraction: 0.11,
    verticalDriftPx: 4,
    desktopLeftPct: 50,
    desktopTopPct: 11,
    revealStagger: 0.14,
    imageSurface: 'dark',
    diagramOverlay: 'dual-passive-radiator',
  },
  {
    id: 'rear-control-module',
    partName: 'Rear Control Panel',
    roleLabel: '04 · POWER, CHARGING & BUTTONS',
    featureSummary: 'The rear panel groups the main power switch, two red push buttons, USB-C charging port, 12V DC input, and the ESP32 programming port.',
    functionNote: 'Rear panel power, charging, firmware port, and dual push-button controls.',
    howToUseSteps: [],
    modalSections: [
      {
        heading: 'Ports & Switches',
        bullets: [
          'Main Toggle Switch — Cuts or connects main power.',
          'USB-C Charging Port — Recharges the internal 6000 mAh battery.',
          '12V DC Input — Runs the speaker from an external 12V power supply.',
          'ESP32 USB Port — Connects to a computer to flash or update firmware.',
        ],
      },
      {
        heading: 'Push Buttons',
        bullets: [
          'Lighting Button — 1 press turns WLED on/off, 2 presses change color, 3 presses cycle effects.',
          'Power & Battery Button — 1 press shows battery %, 2 presses show power draw, hold 5 seconds for ESP32 deep sleep.',
        ],
      },
      {
        heading: 'Power',
        body: '6000 mAh Battery · USB-C · 12V DC · ESP32 Port',
        mono: true,
      },
    ],
    modalFooterLabel: 'REAR I/O',
    metric: '6000 mAh · USB-C · 12V DC · 2 Buttons',
    dimensionsSpec: '6000 mAh Battery · USB-C · 12V DC · ESP32 Port',
    imageSrc: '/assets/aistudio/image_3dcce302.webp',
    aspectRatioClass: 'aspect-[3/2]',
    sizeVariant: 'lg',
    parallaxSpeed: 1.01,
    canvasXFraction: 1.36,
    canvasYFraction: 0.42,
    verticalDriftPx: -4,
    desktopLeftPct: 70,
    desktopTopPct: 42,
    revealStagger: 0.18,
    imageSurface: 'paper',
  },
  {
    id: 'touch-bluetooth-nfc',
    partName: 'Top Touch Controls, Bluetooth & NFC',
    roleLabel: '05 · PLAYBACK & WIRELESS PAIRING',
    featureSummary: 'Capacitive touch pads on top of both cabinets handle playback and stereo pairing, alongside Bluetooth and tap-to-pair NFC.',
    functionNote: 'Top capacitive touch controls and NFC tap-to-pair wireless playback.',
    howToUseSteps: [],
    modalSections: [
      {
        heading: 'Wireless & Touch',
        body: 'Capacitive touch pads on top of both cabinets handle playback and wireless Left + Right stereo pairing, alongside Bluetooth and tap-to-pair NFC.',
      },
      {
        heading: 'Controls',
        bullets: [
          'Hold 3–5 seconds — Turn Left + Right stereo linking on or off.',
          'Single tap — Play or pause.',
          'Double tap — Skip to next or previous track.',
          'NFC pad — Tap an NFC-enabled phone on top for quick pairing.',
        ],
      },
    ],
    modalFooterLabel: 'CONTROLS',
    metric: 'Capacitive Touch · Bluetooth · NFC · L+R Pairing',
    dimensionsSpec: 'Touch Pads · Bluetooth · NFC · L+R Stereo Link',
    imageSrc: '/assets/aistudio/image_8ee5c56b.webp',
    aspectRatioClass: 'aspect-[4/3]',
    sizeVariant: 'md',
    parallaxSpeed: 1.0,
    canvasXFraction: 1.8,
    canvasYFraction: 0.13,
    verticalDriftPx: 4,
    desktopLeftPct: 90,
    desktopTopPct: 13,
    revealStagger: 0.22,
    imageSurface: 'dark',
  },
  {
    id: 'inmp441-microphone',
    partName: 'INMP441 (I2S MEMS Digital Microphone)',
    modalTitle: 'Music-Reactive Microphone',
    roleLabel: '06 · DIGITAL MICROPHONE · INMP441',
    featureSummary: 'Captures surrounding audio and sends it to the ESP32 over the I2S interface so WLED can sync lighting effects with music.',
    functionNote: 'INMP441 I2S digital MEMS microphone feeding audio into the ESP32 for music-reactive WLED lighting.',
    howToUseSteps: [],
    modalSections: [
      {
        heading: 'Overview',
        body: 'The INMP441 captures surrounding audio and sends it to the ESP32 through the I2S interface.',
      },
      {
        heading: 'How It Works',
        body: 'The ESP32 processes the incoming audio, allowing WLED to synchronize RGB lighting effects with the music. The LED ring pulses and reacts to beats and changes in sound.',
      },
      {
        heading: 'Hardware Role',
        body: "Enables sound-reactive RGB lighting without requiring a direct audio connection to the speaker's amplifier.",
      },
    ],
    modalFooterLabel: 'SPECIFICATION',
    metric: 'INMP441 · I2S Digital MEMS Microphone · ESP32 Audio Input',
    dimensionsSpec: 'INMP441 · I2S Digital MEMS Microphone · ESP32 Audio Input',
    imageSrc: '/assets/aistudio/Twisted_Wire_Microphone_Module_619dfaa8.webp',
    aspectRatioClass: 'aspect-[3/2]',
    sizeVariant: 'md',
    parallaxSpeed: 1.01,
    canvasXFraction: 2.08,
    canvasYFraction: 0.4,
    verticalDriftPx: -4,
    desktopLeftPct: 104,
    desktopTopPct: 40,
    revealStagger: 0.26,
    imageSurface: 'transparent',
  },
];

export const SPLIT_REVEAL_PHOTO_SRC =
  '/assets/aistudio/RGB_Speaker_Duo_on_a_Festive_Balcony_Desk_016b6e98.webp';

export const SPLIT_COMPONENTS_BG_SRC =
  '/assets/aistudio/L_back_components_b6c8f3c6.webp';

export interface SpeakerComponentSpecItem {
  indexLabel: string;
  category: string;
  name: string;
  detail: string;
}

export const SPEAKER_COMPONENTS_USED: readonly SpeakerComponentSpecItem[] = [
  {
    indexLabel: '01',
    category: 'Audio Input',
    name: 'Digital Microphone — INMP441',
    detail: 'I2S MEMS microphone used by WLED for sound-reactive lighting.',
  },
  {
    indexLabel: '02',
    category: 'Power Monitoring',
    name: 'Voltage & Current Sensor — INA219',
    detail: 'I2C sensor that measures battery voltage and current draw.',
  },
  {
    indexLabel: '03',
    category: 'Microcontroller',
    name: 'ESP32 Development Board',
    detail: 'Runs WLED lighting, reads sensors, and handles deep sleep.',
  },
  {
    indexLabel: '04',
    category: 'Lighting Control',
    name: 'WLED — Addressable RGB LED Control',
    detail: 'Drives the 16 addressable LEDs on the front ring over Wi-Fi.',
  },
  {
    indexLabel: '05',
    category: 'Audio Amplification',
    name: 'Amplifier',
    detail: 'Amplifier board powering the speaker drivers.',
  },
  {
    indexLabel: '06',
    category: 'Acoustic Drivers',
    name: 'Speakers',
    detail: '7 cm upper driver, 5 cm lower driver, and a side passive radiator.',
  },
  {
    indexLabel: '07',
    category: 'Electrical Connections',
    name: 'Internal Wiring',
    detail: 'Hand-soldered internal wiring between battery, amp, ESP32, and drivers.',
  },
  {
    indexLabel: '08',
    category: 'Power Control',
    name: 'Power Switch',
    detail: 'Rear toggle switch that disconnects the battery from the main circuit.',
  },
  {
    indexLabel: '09',
    category: 'Power Input',
    name: 'DC Power Socket',
    detail: 'Rear barrel jack for charging and external 12V DC power.',
  },
  {
    indexLabel: '10',
    category: 'Auxiliary Input',
    name: '3.5mm Female Audio Jack',
    detail: 'Rear 3.5mm jack for wired line-in audio.',
  },
  {
    indexLabel: '11',
    category: 'Battery Pack',
    name: '6000mAh Battery',
    detail: 'Internal 6000 mAh lithium battery pack for portable use.',
  },
  {
    indexLabel: '12',
    category: 'Battery Protection',
    name: 'BMS — Battery Management System',
    detail: 'Protection board for charging, cell balancing, and low-voltage cutoff.',
  },
  {
    indexLabel: '13',
    category: 'Crossover Filter',
    name: 'Polyester Film Capacitor',
    detail: 'Inline film capacitor used as a simple passive crossover filter.',
  },
  {
    indexLabel: '14',
    category: 'Wireless Audio',
    name: 'Bluetooth Audio Receiver — Salvaged from AirPods',
    detail: 'Salvaged Bluetooth audio receiver wired in for wireless playback.',
  },
  {
    indexLabel: '15',
    category: 'Cabinet Finish',
    name: 'Textured Cabinet Wallpaper',
    detail: 'Matte textured wrap covering the MDF cabinet.',
  },
  {
    indexLabel: '16',
    category: 'Internal Damping',
    name: 'Synthetic Cotton — Acoustic Damping',
    detail: 'Synthetic cotton fill inside the cabinet to damp internal reflections.',
  },
];

export const CORE_PRELOAD_IMAGES: string[] = [
  '/assets/renders/hero_speaker_default_white.webp',
  '/assets/renders/hero_speaker_xray_aligned.webp',
  '/assets/aistudio/image_754baafc.webp',
  '/assets/aistudio/Black_Three-Quarter_Speaker_Cabinet_cd34b97a.webp',
  '/assets/aistudio/Matte_Black_Speaker_Texture_Edit_10e0e5ac.webp',
  '/assets/aistudio/image_3dcce302.webp',
  '/assets/aistudio/image_8ee5c56b.webp',
  '/assets/aistudio/Twisted_Wire_Microphone_Module_619dfaa8.webp',
  SPLIT_REVEAL_PHOTO_SRC,
  SPLIT_COMPONENTS_BG_SRC,
  '/assets/aistudio/Thoughtful_Mirror_Selfie_on_a_Patterned_Bed_b6d8f347.webp',
  '/assets/renders/turntable/R_ring_16.webp',
  '/assets/renders/turntable/L_ring_16.webp',
];

export const SECONDARY_WARMUP_IMAGES: string[] = [
  '/speaker-gallery/poster-01.jpg',
  '/speaker-gallery/poster-02.jpg',
  '/speaker-gallery/poster-03.jpg',
  '/speaker-gallery/photo-01.jpeg',
  '/speaker-gallery/photo-02.jpeg',
  '/speaker-gallery/photo-03.jpeg',
  '/speaker-gallery/photo-04.jpeg',
  '/speaker-gallery/photo-05.jpeg',
  '/speaker-gallery/photo-06.jpeg',
  '/speaker-gallery/photo-07.jpeg',
];

export const KINETIC_STATEMENT_WORDS: Array<{
  text: string;
  accent?: boolean;
}> = [
  { text: 'BUILT' },
  { text: 'FROM' },
  { text: 'RAW' },
  { text: 'WOOD,' },
  { text: 'HAND-SOLDERED', accent: true },
  { text: 'COPPER,' },
  { text: 'AND' },
  { text: 'COBALT', accent: true },
  { text: 'LIGHT' },
  { text: 'SO' },
  { text: 'EVERY' },
  { text: 'BEAT' },
  { text: 'FEELS' },
  { text: 'PHYSICAL.', accent: true },
];

function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function clamp01(val: number): number {
  return clamp(val, 0, 1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function mixHexColor(hexA: string, hexB: string, t: number): string {
  const cleanA = hexA.replace('#', '');
  const cleanB = hexB.replace('#', '');
  const rA = parseInt(cleanA.slice(0, 2), 16);
  const gA = parseInt(cleanA.slice(2, 4), 16);
  const bA = parseInt(cleanA.slice(4, 6), 16);
  const rB = parseInt(cleanB.slice(0, 2), 16);
  const gB = parseInt(cleanB.slice(2, 4), 16);
  const bB = parseInt(cleanB.slice(4, 6), 16);
  const ratio = clamp01(t);
  const r = Math.round(lerp(rA, rB, ratio));
  const g = Math.round(lerp(gA, gB, ratio));
  const b = Math.round(lerp(bA, bB, ratio));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface PreloaderDisplayState {
  percent: number;
  formattedPercent: string;
  isComplete: boolean;
}

export function getPreloaderDisplayState(
  loaded: number,
  total: number,
  elapsedMs: number,
  minDisplayMs = 1150,
  safetyCapMs = 4500
): PreloaderDisplayState {
  const safeTotal = Math.max(1, total);
  const assetRatio = clamp01(loaded / safeTotal);
  const timeGate = clamp01(elapsedMs / Math.max(1, minDisplayMs));
  const safetyReached = elapsedMs >= safetyCapMs;

  const rawPercent = safetyReached
    ? 100
    : Math.min(100, Math.round(Math.min(assetRatio, timeGate) * 100));

  const isComplete = safetyReached || (loaded >= safeTotal && elapsedMs >= minDisplayMs);
  const percent = isComplete ? 100 : Math.min(99, rawPercent);

  return {
    percent,
    formattedPercent: `${String(percent).padStart(3, '0')}%`,
    isComplete,
  };
}

export interface ChapterBackgroundStyle {
  backgroundColor: string;
  isLightSurface: boolean;
  lightSurfaceBlend: number;
  inkColor: string;
  mutedInkColor: string;
  accentColor: string;
}

/**
 * Computes full-bleed background and text contrast tokens smoothly across scenes 0..5:
 * - Scene 0 (Hero): #000000
 * - Scene 1 (Signature & Marquee): #080C1E (Midnight Cobalt)
 * - Transition 1.36 -> 2.48: Gradual, cobalt-tinted ramp from Midnight Cobalt (#080C1E) -> Deep Indigo -> Periwinkle -> Architectural Ice (#F1F5FF)
 * - Scenes 2..4 (Floating Editorial Collage + Opposing Split): #F1F5FF (Cool Architectural Ice Paper)
 * - Scene 5 (Dual Stereo Finale): #050816 (Obsidian Midnight)
 */
export function getChapterBackgroundStyle(timelinePos: number): ChapterBackgroundStyle {
  const pos = clamp(timelinePos, 0, 6);

  let backgroundColor = '#000000';
  let lightSurfaceBlend = 0;

  if (pos <= 1) {
    backgroundColor = mixHexColor('#000000', '#080C1E', clamp01(pos));
  } else if (pos < 2.1) {
    // Stay rich blackish Cobalt Blue while signature fades and speaker starts upper-left exit,
    // then transition smoothly through twilight Cobalt Indigo into Cool Architectural Ice (#F1F5FF)
    const rawT = clamp01((pos - 1.36) / 0.74);
    if (rawT < 0.35) {
      backgroundColor = mixHexColor('#080C1E', '#131C42', smoothstep01(rawT / 0.35));
    } else if (rawT < 0.72) {
      backgroundColor = mixHexColor('#131C42', '#7082B8', smoothstep01((rawT - 0.35) / 0.37));
    } else {
      backgroundColor = mixHexColor('#7082B8', '#F1F5FF', smoothstep01((rawT - 0.72) / 0.28));
    }
    lightSurfaceBlend = smoothstep01((rawT - 0.66) / 0.26);
  } else if (pos <= 4.12) {
    backgroundColor = '#f1f5ff';
    lightSurfaceBlend = 1;
  } else {
    const t = smoothstep01((pos - 4.12) / 0.42);
    backgroundColor = mixHexColor('#F1F5FF', '#050816', t);
    lightSurfaceBlend = 1 - t;
  }

  const isLightSurface = lightSurfaceBlend >= 0.5;
  return {
    backgroundColor,
    isLightSurface,
    lightSurfaceBlend: Number(lightSurfaceBlend.toFixed(3)),
    inkColor: isLightSurface ? '#090D1F' : '#FFFFFF',
    mutedInkColor: isLightSurface ? '#334155' : 'rgba(255, 255, 255, 0.72)',
    accentColor: isLightSurface ? '#2C3480' : '#93C5FD',
  };
}

function smoothstep01(t: number): number {
  const s = clamp01(t);
  return s * s * (3 - 2 * s);
}

export interface ContinuousSpeakerZoomState {
  isMounted: boolean;
  scale: number;
  targetScale: number;
  translateXPx: number;
  translateYPx: number;
  speakerOpacity: number;
  heroChromeOpacity: number;
  cobaltWledIntensity: number;
  allowXRaySweep: boolean;
}

/**
 * Drives the continuous Hero -> Chapter 1 -> Floating Collage speaker trajectory across [0..1.76]:
 * - Preserves exact 781:1491 cabinet proportions using both viewport width and height.
 * - Exits Hero headlines, corner tabs, and fluid X-Ray early (< 0.45).
 * - Zooms centered speaker to 90% height by ~0.78, holds cleanly across [0.78..1.15],
 *   then shrinks isotropically and glides diagonally toward the upper-left corner & off-screen
 *   across [1.15..1.76] as the Floating Editorial Collage enters from the bottom-right.
 */
export function getContinuousSpeakerZoomState(
  timelinePos: number,
  viewportWidth = 1920,
  viewportHeight = 1080,
  prefersReducedMotion = false
): ContinuousSpeakerZoomState {
  const pos = Math.max(0, timelinePos);
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);

  // Mirrors Hero's h-[54vh] sm:h-[62vh] md:h-[68vh] max-h-[650px] aspect-[781/1491]
  const vhFactor = safeW >= 768 ? 0.68 : safeW >= 640 ? 0.62 : 0.54;
  const baseHeightPx = Math.max(220, Math.min(650, safeH * vhFactor));
  const baseWidthPx = baseHeightPx * (781 / 1491);

  const heightDrivenScale = (safeH * 0.9) / baseHeightPx;
  const widthSafetyCap = (safeW * 0.54) / baseWidthPx;
  const targetScale = Number(
    Math.max(1.18, Math.min(heightDrivenScale, widthSafetyCap)).toFixed(3)
  );

  const zoomT = prefersReducedMotion
    ? pos >= 0.35
      ? 1
      : 0
    : smoothstep01(pos / 0.78);

  // Upper-left diagonal exit begins ONLY after signature finishes fading away [1.36 -> 2.00]
  const exitRawT = pos <= 1.36 ? 0 : clamp01((pos - 1.36) / 0.64);
  const exitT = prefersReducedMotion ? exitRawT : smoothstep01(exitRawT);

  const scaleFactor = lerp(1, targetScale, zoomT);
  const exitShrinkMultiplier =
    exitT <= 0 ? 1 : lerp(1, Math.min(0.46, 0.42 / Math.max(0.5, targetScale)), exitT);

  // Glide seamlessly toward the upper-left corner and clear the viewport edge
  const exitTranslateX = prefersReducedMotion ? 0 : -safeW * 0.56 * exitT;
  const exitTranslateY = prefersReducedMotion ? 0 : -safeH * 0.62 * exitT;

  const heroChromeOpacity = Number((1 - smoothstep01(pos / 0.42)).toFixed(3));
  const cobaltRampIn = smoothstep01((pos - 0.18) / 0.56);
  const exitFade = exitT <= 0.62 ? 1 : 1 - smoothstep01((exitT - 0.62) / 0.38);
  const cobaltWledIntensity = Number(
    clamp01(cobaltRampIn * exitFade).toFixed(3)
  );
  const speakerOpacity = Number(clamp01(exitFade).toFixed(3));

  return {
    isMounted: pos < 2.04,
    scale: Number((scaleFactor * exitShrinkMultiplier).toFixed(3)),
    targetScale,
    translateXPx: Number(exitTranslateX.toFixed(1)),
    translateYPx: Number(exitTranslateY.toFixed(1)),
    speakerOpacity,
    heroChromeOpacity,
    cobaltWledIntensity,
    allowXRaySweep: pos < 0.08,
  };
}

export interface CustomSignatureProgress {
  isVisible: boolean;
  opacity: number;
  drawProgress: number;
  /** Stroke 1: Diagonal cross-loop entry/return underline */
  loopSlash: number;
  /** Stroke 2: Tall slanted R spine/bowl + cursive a-j-d-e-e-p */
  rajdeepMain: number;
  /** Stroke 3: Long upward-right trailing slash crossing p */
  flourishTail: number;
  /** Stroke 4: Crisp j dot */
  jDot: number;
  /** Stroke 5: M-shaped crown centered above Raj */
  crownM: number;
  /** Stroke 6: Twin short angled parallel crown underlines */
  crownUnderlines: number;
}

/**
 * Sequences the authentic handwritten Rajdeep + Crown signature in exact pen-video order.
 * Completes at ~78% of Chapter 1 (timelinePos = 0.78), holds cleanly across [0.78..1.15],
 * and fades out COMPLETELY FIRST across [1.15..1.36] before the speaker exits upper-left.
 */
export function getCustomSignatureProgress(
  timelinePos: number,
  prefersReducedMotion = false
): CustomSignatureProgress {
  const pos = Math.max(0, timelinePos);
  const fadeIn = smoothstep01((pos - 0.22) / 0.12);
  const fadeOut = pos <= 1.15 ? 1 : 1 - smoothstep01((pos - 1.15) / 0.21);
  const opacity = Number(clamp01(Math.min(fadeIn, fadeOut)).toFixed(3));

  const drawProgress = prefersReducedMotion
    ? pos >= 0.25
      ? 1
      : 0
    : clamp01((pos - 0.24) / 0.54); // 0.24 -> 0.78 = 100% complete by 78% of Chapter 1!

  return {
    isVisible: pos > 0.2 && pos < 1.38,
    opacity,
    drawProgress: Number(drawProgress.toFixed(3)),
    loopSlash: Number(clamp01(drawProgress / 0.22).toFixed(3)),
    rajdeepMain: Number(clamp01((drawProgress - 0.2) / 0.42).toFixed(3)),
    flourishTail: Number(clamp01((drawProgress - 0.6) / 0.14).toFixed(3)),
    jDot: Number(clamp01((drawProgress - 0.72) / 0.06).toFixed(3)),
    crownM: Number(clamp01((drawProgress - 0.77) / 0.14).toFixed(3)),
    crownUnderlines: Number(clamp01((drawProgress - 0.9) / 0.1).toFixed(3)),
  };
}

export interface SignatureRevealState {
  marqueeTopOffsetPx: number;
  marqueeBottomOffsetPx: number;
  maskScale: number;
  maskOpacity: number;
  /** [0..1] progress for SVG signature stroke-dashoffset drawing */
  strokeProgress: number;
}

export function getSignatureRevealState(
  timelinePos: number,
  sceneIndex = 1
): SignatureRevealState {
  const rel = timelinePos - sceneIndex;
  const marqueeDrift = rel * 420;
  // Subtle marquee backdrop fades in cleanly as Hero exits (0.28 -> 0.62), holds across [0.62..1.18], fades gently out by 1.62
  const enter = smoothstep01((timelinePos - 0.28) / 0.34);
  const exit = timelinePos <= 1.18 ? 1 : 1 - smoothstep01((timelinePos - 1.18) / 0.44);
  const maskOpacity = Number(clamp01(Math.min(enter, exit)).toFixed(3));
  const strokeProgress = getCustomSignatureProgress(timelinePos).drawProgress;

  return {
    marqueeTopOffsetPx: Number((-160 - marqueeDrift).toFixed(1)),
    marqueeBottomOffsetPx: Number((140 + marqueeDrift * 0.85).toFixed(1)),
    maskScale: Number((0.94 + 0.06 * Math.min(enter, exit)).toFixed(3)),
    maskOpacity,
    strokeProgress,
  };
}

export function getKineticStatementProgress(
  timelinePos: number,
  sceneIndex = 2
): number {
  const rel = timelinePos - sceneIndex;
  // Starts revealing early while entering from Scene 1 (rel = -0.65), reaches 1.0 near rel = +0.18
  return Number(clamp01((rel + 0.65) / 0.83).toFixed(3));
}

export interface CollageParallaxTransform {
  translateY: number;
  translateX: number;
  opacity: number;
  scale: number;
}

export interface EditorialCollageCanvasState {
  isVisible: boolean;
  isInteractive: boolean;
  containerTranslateYPx: number;
  containerOpacity: number;
  panProgress: number;
}

export interface EditorialCollageItemTransform {
  isMounted: boolean;
  xPx: number;
  yPx: number;
  scale: number;
  opacity: number;
  /** [0..1] Electric Cobalt block-chase character reveal progress driven by horizontal scroll */
  textRevealProgress: number;
}

/**
 * Computes top-level lifecycle and rising exit transition of the continuous Floating Editorial Canvas:
 * - Enters cleanly starting at timelinePos = 1.34 (immediately after white signature fades away)
 * - Sweeps right-to-left horizontally across [1.36..3.45]
 * - Glides smoothly upward (-Y) across [3.45..4.05] as Inside CAD or Live WLED rises from the bottom.
 */
export function getCollageCanvasContainerState(
  timelinePos: number,
  viewportHeight = 1080,
  prefersReducedMotion = false
): EditorialCollageCanvasState {
  const pos = clamp(timelinePos, 0, 5);
  const safeH = Math.max(480, viewportHeight);
  const isVisible = pos > 1.33 && pos < 4.08;
  const isInteractive = pos >= 1.48 && pos <= 3.78;
  const panProgress = clamp((pos - 1.36) / 2.09, -0.05, 1.35);

  const riseT = pos <= 3.45 ? 0 : smoothstep01((pos - 3.45) / 0.58);
  const containerTranslateYPx = prefersReducedMotion
    ? 0
    : Number((-riseT * safeH * 0.92).toFixed(1));
  const enterOpacity = smoothstep01((pos - 1.34) / 0.14);
  const exitOpacity = pos <= 3.56 ? 1 : 1 - smoothstep01((pos - 3.56) / 0.48);

  return {
    isVisible,
    isInteractive,
    containerTranslateYPx,
    containerOpacity: Number(clamp01(Math.min(enterOpacity, exitOpacity)).toFixed(3)),
    panProgress: Number(panProgress.toFixed(4)),
  };
}

/**
 * Computes independent per-image screen coordinates:
 * - Lead frame enters diagonally up-left from bottom-right corner across [1.36..1.90],
 *   then flattens smoothly onto a straight horizontal leftward track (-X, constant Y) to the left edge.
 * - Trailing items glide horizontally with subtle vertical parallax and Cobalt bar wipe text reveals.
 */
export function getEditorialCollageItemTransform(
  item: CollagePartItem,
  timelinePos: number,
  viewportWidth = 1920,
  viewportHeight = 1080,
  prefersReducedMotion = false
): EditorialCollageItemTransform {
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);
  const panProgress = clamp((timelinePos - 1.36) / 2.09, -0.05, 1.35);

  // Horizontal pan coordinate (measured in px relative to viewport left)
  const totalPanVw = COLLAGE_TOTAL_PAN_VW;
  const leftVw =
    1.02 + item.canvasXFraction - panProgress * totalPanVw * item.parallaxSpeed;
  const xPx = leftVw * safeW;

  // Base horizontal lane
  const baseYPx = item.canvasYFraction * safeH;
  const driftPhase = (leftVw - 0.42) * -1;
  const verticalDrift = prefersReducedMotion ? 0 : driftPhase * item.verticalDriftPx;

  // Bottom-right diagonal entry curve: rises smoothly from bottom-right (+0.68*safeH -> 0)
  // along a straight diagonal path toward the upper-left zone, then bends onto horizontal track at leftVw <= 0.46!
  const diagWindow = clamp01((2.05 - timelinePos) / 0.69);
  const rightEntryPhase = smoothstep01(clamp01((leftVw - 0.46) / 0.6));
  const diagonalLiftPx = prefersReducedMotion
    ? 0
    : diagWindow * rightEntryPhase * (safeH * 0.68);

  const yPx = baseYPx + verticalDrift + diagonalLiftPx;

  // Mount horizon generously outside viewport edges so frames glide in/out without popping
  const isMounted = leftVw > -0.68 && leftVw < 1.52;

  // Smooth fade-in from far right and graceful exit off far left
  const enterOpacity = smoothstep01((1.28 - leftVw) / 0.28);
  const exitOpacity = leftVw < -0.18 ? 1 - smoothstep01((-0.18 - leftVw) / 0.34) : 1;
  const opacity = Number(clamp01(Math.min(enterOpacity, exitOpacity)).toFixed(3));

  // Subtle spatial depth scale progression peaking near central focus zone (leftVw ≈ 0.42)
  const distFromFocus = Math.abs(leftVw - 0.42);
  const focusCurve = clamp01(1 - distFromFocus / 0.78);
  const scale = prefersReducedMotion
    ? 1
    : Number((0.92 + 0.1 * smoothstep01(focusCurve)).toFixed(3));

  // Bidirectional Cobalt block-wipe reveal calibrated for brisk center-arrival readability:
  // - leftVw ∈ [1.04 .. 0.88]: Solid Cobalt block covers text (0 -> 0.18) as card enters from right
  // - leftVw ∈ [0.88 .. 0.74]: Brief masked hold on the right margin before center approach
  // - leftVw ∈ [0.74 .. 0.48]: Snappy ease-out wipe uncovers text swiftly as card enters center (0.18 -> 1.00)
  let textRevealProgress = 1;
  if (!prefersReducedMotion) {
    if (leftVw >= 1.04) {
      textRevealProgress = 0;
    } else if (leftVw > 0.88) {
      textRevealProgress = Number((clamp01((1.04 - leftVw) / 0.16) * 0.18).toFixed(3));
    } else if (leftVw > 0.74) {
      textRevealProgress = 0.18;
    } else {
      const wipeT = clamp01((0.74 - leftVw) / 0.26);
      const fastEase = 1 - Math.pow(1 - wipeT, 1.35);
      textRevealProgress = Number((0.18 + fastEase * 0.82).toFixed(3));
    }
  }

  return {
    isMounted,
    xPx: Number(xPx.toFixed(1)),
    yPx: Number(yPx.toFixed(1)),
    scale,
    opacity,
    textRevealProgress,
  };
}

export interface CollageBackgroundNoteTransform {
  isMounted: boolean;
  xPx: number;
  yPx: number;
  opacity: number;
}

export function getCollageBackgroundNoteTransform(
  note: CollageBackgroundNote,
  timelinePos: number,
  viewportWidth = 1920,
  viewportHeight = 1080,
  prefersReducedMotion = false
): CollageBackgroundNoteTransform {
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);
  const panProgress = clamp((timelinePos - 1.36) / 2.09, -0.05, 1.35);
  const leftVw =
    1.04 + note.anchorVw - panProgress * COLLAGE_TOTAL_PAN_VW * note.parallaxSpeed;
  const xPx = leftVw * safeW;
  const yPx = note.topVh * safeH;
  const isMounted = leftVw > -0.95 && leftVw < 1.35;

  const enterOpacity = smoothstep01((1.2 - leftVw) / 0.35);
  const exitOpacity = leftVw < -0.22 ? 1 - smoothstep01((-0.22 - leftVw) / 0.42) : 1;
  const opacity = prefersReducedMotion
    ? 1
    : Number(clamp01(Math.min(enterOpacity, exitOpacity)).toFixed(3));

  return {
    isMounted,
    xPx: Number(xPx.toFixed(1)),
    yPx: Number(yPx.toFixed(1)),
    opacity,
  };
}

export interface CollageClosingStatementState {
  isMounted: boolean;
  xPx: number;
  yPx: number;
  opacity: number;
  /** Overall scroll-driven text reveal progress in [0..1] */
  revealProgress: number;
  /** Eyebrow Cobalt block-wipe progress in [0..1] */
  eyebrowRevealProgress: number;
  /** Footer rule & signature reveal progress in [0..1] */
  footerRevealProgress: number;
}

/**
 * Computes position and staggered text-reveal progress for the closing stereo statement
 * plotted in the blank canvas region right after the 5th collage plate (Touch, Bluetooth & NFC).
 */
export function getCollageClosingStatementState(
  timelinePos: number,
  viewportWidth = 1920,
  viewportHeight = 1080,
  prefersReducedMotion = false
): CollageClosingStatementState {
  const safeW = Math.max(320, viewportWidth);
  const safeH = Math.max(480, viewportHeight);
  const panProgress = clamp((timelinePos - 1.36) / 2.09, -0.05, 1.35);

  const leftVw =
    1.02 +
    COLLAGE_CLOSING_STATEMENT.anchorVw -
    panProgress * COLLAGE_TOTAL_PAN_VW * COLLAGE_CLOSING_STATEMENT.parallaxSpeed;

  const xPx = leftVw * safeW;
  const yPx = COLLAGE_CLOSING_STATEMENT.topVh * safeH;
  const isMounted = leftVw > -0.65 && leftVw < 1.22;

  const enterOpacity = smoothstep01((1.12 - leftVw) / 0.24);
  const exitOpacity = leftVw < -0.25 ? 1 - smoothstep01((-0.25 - leftVw) / 0.35) : 1;
  const opacity = prefersReducedMotion
    ? 1
    : Number(clamp01(Math.min(enterOpacity, exitOpacity)).toFixed(3));

  // Spread the closing statement word-by-word sweep smoothly across the full readable window
  // (leftVw = 0.92 entering right -> leftVw = 0.32 centered in focus) with gentle ease-in-out pacing
  // rather than rushing early words at the right screen edge.
  const rawReveal = clamp01((0.92 - leftVw) / 0.595);
  const easedReveal = 0.45 * rawReveal + 0.55 * smoothstep01(rawReveal);
  const revealProgress = prefersReducedMotion
    ? 1
    : Number(easedReveal.toFixed(3));

  const eyebrowRevealProgress = prefersReducedMotion
    ? 1
    : Number(clamp01((0.96 - leftVw) / 0.34).toFixed(3));

  const footerRevealProgress = prefersReducedMotion
    ? 1
    : Number(smoothstep01((revealProgress - 0.68) / 0.32).toFixed(3));

  return {
    isMounted,
    xPx: Number(xPx.toFixed(1)),
    yPx: Number(yPx.toFixed(1)),
    opacity,
    revealProgress,
    eyebrowRevealProgress,
    footerRevealProgress,
  };
}

export interface DesignedIn3DRevealState {
  eyebrowReveal: number;
  headlineReveal: number;
  dividerProgress: number;
  columnReveals: [number, number, number];
}

/**
 * Deterministic scroll-driven Electric Cobalt block-wipe & staggered word-sweep
 * reveal progress for Slide 0 ("Designed in 3D. Built by Hand." + 3 hardware columns)
 * as OpposingSplitChapter rises into rest across timelinePos ∈ [3.56 .. 4.00].
 * Fully settled (all 1) at timelinePos >= 4.00 and cleanly reversible on upward scroll.
 */
export function getDesignedIn3DRevealState(
  timelinePos: number,
  prefersReducedMotion = false
): DesignedIn3DRevealState {
  if (prefersReducedMotion) {
    return {
      eyebrowReveal: 1,
      headlineReveal: 1,
      dividerProgress: 1,
      columnReveals: [1, 1, 1],
    };
  }

  return {
    eyebrowReveal: Number(smoothstep01((timelinePos - 3.56) / 0.18).toFixed(3)),
    headlineReveal: Number(smoothstep01((timelinePos - 3.60) / 0.28).toFixed(3)),
    dividerProgress: Number(smoothstep01((timelinePos - 3.68) / 0.20).toFixed(3)),
    columnReveals: [
      Number(smoothstep01((timelinePos - 3.72) / 0.20).toFixed(3)),
      Number(smoothstep01((timelinePos - 3.77) / 0.19).toFixed(3)),
      Number(smoothstep01((timelinePos - 3.82) / 0.18).toFixed(3)),
    ],
  };
}

export function getCollageParallaxTransform(
  item: CollagePartItem,
  timelinePos: number,
  _sceneIndex = 3,
  viewportHeight = 1080,
  viewportWidth = 1920
): CollageParallaxTransform {
  const tf = getEditorialCollageItemTransform(
    item,
    timelinePos,
    viewportWidth,
    viewportHeight,
    false
  );
  return {
    translateX: tf.xPx,
    translateY: tf.yPx,
    opacity: tf.opacity,
    scale: tf.scale,
  };
}

export interface OpposingSplitState {
  leftX: number;
  rightX: number;
  containerTranslateY: number;
  centerOpacity: number;
  brushStrokeProgress: number;
}

export function getOpposingSplitState(
  timelinePos: number,
  sceneIndex = 4,
  viewportWidth = 1920,
  viewportHeight = 1080
): OpposingSplitState {
  const rel = timelinePos - sceneIndex;

  // Rise smoothly from the bottom (+Y -> 0) as the Floating Editorial Collage clears upward [3.45..4.00],
  // hold pinned at Y = 0 across the entire Split-Screen Slider & Balcony Photo Reveal [4.00..5.00],
  // then glide upward and fade out across [5.00..5.42] before Scene 6 (FocusSpeakerCarousel) enters.
  const safeH = Math.max(480, viewportHeight);
  const enterT = rel < 0 ? smoothstep01(clamp01((0.55 + rel) / 0.55)) : 1;
  const exitRel = Math.max(0, timelinePos - 5.0);

  const containerTranslateY =
    rel < 0
      ? Number(((1 - enterT) * safeH * 1.05).toFixed(1))
      : exitRel > 0
      ? Number((-Math.min(1, exitRel / 0.55) * 180).toFixed(1))
      : 0;

  // Lateral spread during entry [3.45 -> 4.00]; once >= 4.00, the Split-Screen Slider drives internal transforms
  const entrySettle = rel < 0 ? clamp01(1 - Math.abs(rel) * 1.18) : 1;
  const spreadDistance = Math.min(540, Math.max(220, viewportWidth * 0.24));
  const remainingTravel = (1 - entrySettle) * spreadDistance;

  const leftX = -remainingTravel;
  const rightX = remainingTravel;

  const brushStrokeProgress = clamp01((entrySettle - 0.12) / 0.78);
  const exitFade =
    exitRel > 0
      ? 1 - smoothstep01(exitRel / 0.4)
      : clamp01(entrySettle * 1.25);

  return {
    leftX: Number(leftX.toFixed(1)),
    rightX: Number(rightX.toFixed(1)),
    containerTranslateY,
    centerOpacity: Number(exitFade.toFixed(3)),
    brushStrokeProgress: Number(brushStrokeProgress.toFixed(3)),
  };
}

export interface SplitSlideTransformState {
  /** Left column mask yPercent: +100 (below) -> 0 (covered) */
  leftMaskYPercent: number;
  /** Left column inner counter-move yPercent: -100 -> 0 */
  leftInnerYPercent: number;
  /** Right column mask yPercent: -100 (above) -> 0 (covered) */
  rightMaskYPercent: number;
  /** Right column inner counter-move yPercent: +100 -> 0 */
  rightInnerYPercent: number;
  /** Synchronized vertical photo/stage drift yPercent in both columns (+parallax -> 0 -> -parallax) */
  photoDriftYPercent: number;
  /** Overall copy block vertical drift yPercent (+copyDrift -> 0 -> -copyDrift) */
  textDriftYPercent: number;
  /** Left half of headline ([clip-path:inset(0_calc(50%_-_0.5px)_0_0)]) vertical shear yPercent */
  textLeftShearYPercent: number;
  /** Right half of headline ([clip-path:inset(0_0_0_50%)]) vertical shear yPercent */
  textRightShearYPercent: number;
  /** Whether this slide is visible/mounted in the split stack */
  isVisible: boolean;
}

export interface SplitScreenStageState {
  /** Overall normalized progress across [4.00 .. 5.00] in [0..1] */
  overallProgress: number;
  /** Wipe 1 progress (Slide 0: 45° CAD Outlines -> Slide 1: Dual Studio Pair) across [4.00 .. 4.44] in [0..1] */
  wipe1Progress: number;
  /** Wipe 2 progress (Slide 1: Dual Studio Pair -> Slide 2: Festive Balcony Duo) across [4.44 .. 4.82] in [0..1] */
  wipe2Progress: number;
  /** Final unobstructed photo reveal progress across [4.80 .. 5.00] in [0..1] */
  photoRevealProgress: number;
  /** Scrim/veil darkness over Slide 2 photo (0.58 during wipe -> 0.05 when revealed at 5.0) */
  slide2VeilOpacity: number;
  /** Opacity of Slide 2's large center split-shear headline (1 during wipe -> 0 as photo reveals) */
  slide2CenterCopyOpacity: number;
  /** Upward lift in px of Slide 2's center headline as it gives way to the full photo reveal */
  slide2CenterCopyLiftYPx: number;
  /** Subtle scale settle on Slide 2's revealed photo (1.04 -> 1.00) */
  slide2PhotoScale: number;
  /** Active seam line opacity along x = 50% during active wipes */
  centerSeamOpacity: number;
  /** Top/bottom edge bar opacity once in the dark split/reveal stage */
  edgeChromeOpacity: number;
  slide0: SplitSlideTransformState;
  slide1: SplitSlideTransformState;
  slide2: SplitSlideTransformState;
}

const SPLIT_PARALLAX_PCT = 10;
const SPLIT_SHEAR_PCT = 10.5;
const SPLIT_TEXT_SPAN = 0.8;
const SPLIT_COPY_DRIFT_PCT = SPLIT_PARALLAX_PCT * 0.45;

function computeCenteredTextProgress(wipeProgress: number): number {
  const start = (1 - SPLIT_TEXT_SPAN) * 0.5;
  return clamp01((wipeProgress - start) / SPLIT_TEXT_SPAN);
}

/**
 * Computes the deterministic 3-Slide Split-Screen Counter-Wipe & Center-Seam Typography Shear state
 * across timelinePos ∈ [4.00 .. 5.00]:
 * - Slide 0 (pos = 4.00): Two 45° Black Outline Speakers Facing Each Other ("Inside CAD or Live WLED")
 * - Wipe 1 (4.00 -> 4.46): Left column wipes UP from bottom (+100% -> 0%), Right column wipes DOWN from top (-100% -> 0%),
 *   shearing "Inside CAD or Live WLED" into Slide 1 ("LIVING LIGHT / Balcony Duo") over RGB_Speaker_Duo_on_a_Festive_Balcony_Desk_016b6e98.png
 * - Wipe 2 (4.54 -> 5.00): Left column wipes UP from bottom (+100% -> 0%), Right column wipes DOWN from top (-100% -> 0%),
 *   shearing Slide 1 ("LIVING LIGHT / Balcony Duo") into Slide 2 ("COMPONENTS / Used Inside" + 16-item Bill of Materials)
 */
export function getSplitScreenStageState(
  timelinePos: number,
  prefersReducedMotion = false
): SplitScreenStageState {
  const overallProgress = Number(clamp01(timelinePos - 4.0).toFixed(4));

  const rawW1 = clamp01((timelinePos - 4.0) / 0.46);
  const rawW2 = clamp01((timelinePos - 4.54) / 0.46);

  const w1 = prefersReducedMotion ? (rawW1 >= 0.5 ? 1 : 0) : Number(rawW1.toFixed(4));
  const w2 = prefersReducedMotion ? (rawW2 >= 0.5 ? 1 : 0) : Number(rawW2.toFixed(4));
  const photoRevealProgress = w2;

  const parallax = prefersReducedMotion ? 0 : SPLIT_PARALLAX_PCT;
  const shear = prefersReducedMotion ? 0 : SPLIT_SHEAR_PCT;
  const copyDrift = prefersReducedMotion ? 0 : SPLIT_COPY_DRIFT_PCT;

  const tw1 = computeCenteredTextProgress(w1);
  const tw2 = computeCenteredTextProgress(w2);

  // Slide 0: 45° Black Outline Speakers on Cool Architectural Ice (#F1F5FF)
  const slide0: SplitSlideTransformState = {
    leftMaskYPercent: 0,
    leftInnerYPercent: 0,
    rightMaskYPercent: 0,
    rightInnerYPercent: 0,
    photoDriftYPercent: Number((-w1 * parallax).toFixed(3)),
    textDriftYPercent: Number((-tw1 * copyDrift).toFixed(3)),
    textLeftShearYPercent: Number((-tw1 * shear).toFixed(3)),
    textRightShearYPercent: Number((tw1 * shear).toFixed(3)),
    isVisible: w1 < 1,
  };

  // Slide 1: Festive Balcony Desk RGB Speaker Duo ("LIVING LIGHT / Balcony Duo")
  const s1LeftMask = (1 - w1) * 100;
  const s1RightMask = -(1 - w1) * 100;
  const slide1: SplitSlideTransformState = {
    leftMaskYPercent: Number(s1LeftMask.toFixed(3)),
    leftInnerYPercent: Number((-s1LeftMask).toFixed(3)),
    rightMaskYPercent: Number(s1RightMask.toFixed(3)),
    rightInnerYPercent: Number((-s1RightMask).toFixed(3)),
    photoDriftYPercent: Number(((1 - w1) * parallax - w2 * parallax).toFixed(3)),
    textDriftYPercent: Number(((1 - tw1) * copyDrift - tw2 * copyDrift).toFixed(3)),
    textLeftShearYPercent: Number(((1 - tw1) * shear - tw2 * shear).toFixed(3)),
    textRightShearYPercent: Number((-(1 - tw1) * shear + tw2 * shear).toFixed(3)),
    isVisible: w1 > 0 && w2 < 1,
  };

  // Slide 2: Complete 16-Item "COMPONENTS USED" Hardware & Acoustic Architecture
  const s2LeftMask = (1 - w2) * 100;
  const s2RightMask = -(1 - w2) * 100;
  const slide2: SplitSlideTransformState = {
    leftMaskYPercent: Number(s2LeftMask.toFixed(3)),
    leftInnerYPercent: Number((-s2LeftMask).toFixed(3)),
    rightMaskYPercent: Number(s2RightMask.toFixed(3)),
    rightInnerYPercent: Number((-s2RightMask).toFixed(3)),
    photoDriftYPercent: Number(((1 - w2) * parallax).toFixed(3)),
    textDriftYPercent: Number(((1 - tw2) * copyDrift).toFixed(3)),
    textLeftShearYPercent: Number(((1 - tw2) * shear).toFixed(3)),
    textRightShearYPercent: Number((-(1 - tw2) * shear).toFixed(3)),
    isVisible: w2 > 0,
  };

  const slide2VeilOpacity = 0.28;
  const slide2CenterCopyOpacity = 1;
  const slide2CenterCopyLiftYPx = 0;
  const slide2PhotoScale = 1;

  const w1Seam = Math.sin(w1 * Math.PI);
  const w2Seam = Math.sin(w2 * Math.PI);
  const centerSeamOpacity = Number(
    clamp01(Math.max(w1Seam, w2Seam) * 0.85).toFixed(3)
  );
  const edgeChromeOpacity = Number(smoothstep01((w1 - 0.55) / 0.4).toFixed(3));

  return {
    overallProgress,
    wipe1Progress: w1,
    wipe2Progress: w2,
    photoRevealProgress,
    slide2VeilOpacity,
    slide2CenterCopyOpacity,
    slide2CenterCopyLiftYPx,
    slide2PhotoScale,
    centerSeamOpacity,
    edgeChromeOpacity,
    slide0,
    slide1,
    slide2,
  };
}

export interface ProjectedSpeaker45Point {
  x: number;
  y: number;
  z: number;
  yawDeg: number;
}

/**
 * Projects a 3D speaker coordinate (in cm-scaled model units: hw=14.2, hh=27.0, hd=13.5)
 * into a 2D SVG canvas where the Left speaker is rotated at +45° yaw (facing right/inward)
 * and the Right speaker is rotated at -45° yaw (facing left/inward), so both speakers face
 * each other at an exact 45-degree stereo angle.
 */
export function projectSpeaker45OutlinePoint(
  x: number,
  y: number,
  z: number,
  side: 'left' | 'right',
  cx = 160,
  cy = 232,
  scale = 6.2
): ProjectedSpeaker45Point {
  const yawDeg = side === 'left' ? 45 : -45;
  const yawRad = (yawDeg * Math.PI) / 180;
  const pitchRad = 0.18; // ~10.3° downward architectural elevation viewing top face, front baffle, and side wall

  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const cosX = Math.cos(pitchRad);
  const sinX = Math.sin(pitchRad);

  const rx = x * cosY + z * sinY;
  const rz = -x * sinY + z * cosY;
  const ry = y * cosX + rz * sinX;
  const rz2 = -y * sinX + rz * cosX;

  const fov = 175;
  const persp = fov / (fov - rz2);

  return {
    x: Number((cx + rx * scale * persp).toFixed(2)),
    y: Number((cy + ry * scale * persp).toFixed(2)),
    z: Number(rz2.toFixed(2)),
    yawDeg,
  };
}

export interface Adaptive3DCameraConfig {
  fov: number;
  distanceMultiplier: number;
  minDistance: number;
  maxDistance: number;
}

/**
 * Dynamically adapts 3D perspective camera FOV & distance across laptop (1366x768),
 * standard widescreen (1920x1080, 2560x1440), and 21:9 ultrawide (3440x1440) viewports
 * so the speaker never clips vertically or appears tiny.
 */
export function getAdaptive3DCameraConfig(aspectRatio: number): Adaptive3DCameraConfig {
  const safeAspect = clamp(aspectRatio, 0.5, 3.2);

  if (safeAspect >= 2.1) {
    // 21:9 Ultrawide (e.g. 3440x1440): tighter vertical FOV & slight distance refinement for sculptural clarity
    return {
      fov: 35,
      distanceMultiplier: 0.94,
      minDistance: 2.0,
      maxDistance: 7.2,
    };
  }

  if (safeAspect <= 1.45) {
    // Narrower / square viewports: step back slightly to prevent horizontal clipping
    return {
      fov: 42,
      distanceMultiplier: 1.12,
      minDistance: 2.35,
      maxDistance: 8.2,
    };
  }

  // Standard 16:9 / 16:10 desktop viewports (1366x768, 1920x1080, 2560x1440)
  return {
    fov: 38,
    distanceMultiplier: 1.0,
    minDistance: 2.1,
    maxDistance: 7.5,
  };
}

export interface MobilePerformanceProfile {
  isMobileViewport: boolean;
  dprCap: number;
  canvasTargetFps: number;
  useHeavyBlurFilters: boolean;
  enableHeroXRaySweep: boolean;
  enableWebGLShadows: boolean;
  waveSegmentScale: number;
}

/**
 * Returns deterministic rendering budgets so desktop keeps 100% full visual fidelity
 * while phones/coarse-pointer devices avoid GPU-bound blur filters, high-DPR canvas
 * fills, shadow maps, and hidden mask-image RAF sweeps.
 */
export function getMobilePerformanceProfile(
  viewportWidth: number,
  isCoarsePointer = false
): MobilePerformanceProfile {
  const safeW = Math.max(320, viewportWidth || 1440);

  if (safeW < 768) {
    return {
      isMobileViewport: true,
      dprCap: 1.25,
      canvasTargetFps: 30,
      useHeavyBlurFilters: false,
      enableHeroXRaySweep: false,
      enableWebGLShadows: false,
      waveSegmentScale: 0.5,
    };
  }

  if (safeW < 1024 || isCoarsePointer) {
    return {
      isMobileViewport: isCoarsePointer,
      dprCap: 1.5,
      canvasTargetFps: isCoarsePointer ? 36 : 60,
      useHeavyBlurFilters: !isCoarsePointer,
      enableHeroXRaySweep: !isCoarsePointer,
      enableWebGLShadows: !isCoarsePointer,
      waveSegmentScale: isCoarsePointer ? 0.65 : 1,
    };
  }

  return {
    isMobileViewport: false,
    dprCap: 2,
    canvasTargetFps: 60,
    useHeavyBlurFilters: true,
    enableHeroXRaySweep: true,
    enableWebGLShadows: true,
    waveSegmentScale: 1,
  };
}

/**
 * Coordinates inner vertical scroll containers (e.g., mobile parts list) with the global
 * touch timeline so swiping inside an internal scroll box never skips scenes prematurely.
 * `deltaY > 0` indicates swiping finger UP (scrolling down).
 */
export function shouldInnerScrollConsumeSwipe(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  deltaY: number
): boolean {
  if (scrollHeight <= clientHeight + 4) return false;
  if (Math.abs(deltaY) < 0.25) return true;

  if (deltaY > 0) {
    return scrollTop + clientHeight < scrollHeight - 2;
  }
  return scrollTop > 2;
}

export interface TouchVelocitySample {
  y: number;
  t: number;
}

/**
 * Computes smooth inertial target timeline position from recent touch samples on finger release.
 */
export function computeTouchReleaseMomentumTarget(
  currentTargetPos: number,
  samples: TouchVelocitySample[],
  maxPos = 7.5
): number {
  if (samples.length < 2) return clamp(currentTargetPos, 0, maxPos);

  const last = samples[samples.length - 1];
  let anchor = samples[0];
  for (let i = samples.length - 2; i >= 0; i--) {
    if (last.t - samples[i].t <= 120) {
      anchor = samples[i];
    } else {
      break;
    }
  }

  const dtMs = last.t - anchor.t;
  if (dtMs < 12 || dtMs > 220) {
    return clamp(currentTargetPos, 0, maxPos);
  }

  // Positive finger movement deltaY (anchor.y - last.y) = swipe up = advance forward
  const pxPerMs = (anchor.y - last.y) / dtMs;
  if (Math.abs(pxPerMs) < 0.18) {
    return clamp(currentTargetPos, 0, maxPos);
  }

  const flingUnits = clamp(pxPerMs * 0.42, -1.1, 1.1);
  return clamp(Number((currentTargetPos + flingUnits).toFixed(4)), 0, maxPos);
}

export interface MobileChapterWaypoint {
  id: string;
  label: string;
  pos: number;
}

export const MOBILE_CHAPTER_WAYPOINTS: readonly MobileChapterWaypoint[] = [
  { id: 'hero', label: 'Hero', pos: 0 },
  { id: 'signature', label: 'Signature', pos: 1 },
  { id: 'collage', label: 'Parts Guide', pos: 2.15 },
  { id: 'cad', label: '3D & Specs', pos: 4 },
  { id: 'balcony', label: 'Balcony Pair', pos: 4.5 },
  { id: 'bom', label: '16 Parts', pos: 5 },
  { id: 'socials', label: 'Socials', pos: 7.5 },
];

export function getMobileChapterIndex(timelinePos: number): number {
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < MOBILE_CHAPTER_WAYPOINTS.length; i++) {
    const diff = Math.abs(timelinePos - MOBILE_CHAPTER_WAYPOINTS[i].pos);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  return closestIdx;
}

export function getAdjacentMobileWaypoint(
  timelinePos: number,
  direction: -1 | 1
): MobileChapterWaypoint {
  const epsilon = 0.08;
  if (direction > 0) {
    for (const wp of MOBILE_CHAPTER_WAYPOINTS) {
      if (wp.pos > timelinePos + epsilon) {
        return wp;
      }
    }
    return MOBILE_CHAPTER_WAYPOINTS[MOBILE_CHAPTER_WAYPOINTS.length - 1];
  }

  for (let i = MOBILE_CHAPTER_WAYPOINTS.length - 1; i >= 0; i--) {
    if (MOBILE_CHAPTER_WAYPOINTS[i].pos < timelinePos - epsilon) {
      return MOBILE_CHAPTER_WAYPOINTS[i];
    }
  }
  return MOBILE_CHAPTER_WAYPOINTS[0];
}

