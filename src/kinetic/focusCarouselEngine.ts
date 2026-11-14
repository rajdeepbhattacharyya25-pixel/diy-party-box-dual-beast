export type FocusMediaKind = 'image' | 'video';

export interface FocusMediaItem {
  id: string;
  kind: FocusMediaKind;
  src: string;
  posterSrc?: string;
  title: string;
  caption: string;
  metaSpec: string;
}

export interface FocusCarouselLayoutConfig {
  cardWidth: number;
  ratio: number;
  sideSize: number;
  gap: number;
  sideCount: number;
  blurStep: number;
  sideGrey: number;
}

export interface ComputedCarouselSlot {
  x: number;
  size: number;
  alpha: number;
  grey: number;
  dim: number;
  blur: number;
  zIndex: number;
}

export const DEFAULT_FOCUS_CAROUSEL_CONFIG: FocusCarouselLayoutConfig = {
  cardWidth: 320,
  ratio: 0.75,
  sideSize: 0.54,
  gap: 24,
  sideCount: 4,
  blurStep: 2.2,
  sideGrey: 1,
};

const FADE_STEP = 0.86;
const BLUR_MAX = 10;
const DIM = 0.88;

export const SPEAKER_GALLERY_ITEMS: FocusMediaItem[] = [
  {
    id: 'gallery-photo-01',
    kind: 'image',
    src: '/speaker-gallery/photo-01.jpeg',
    title: 'Night Glow Test',
    caption: 'L & R speakers in cyan-white glow',
    metaSpec: '01 · L + R Night Test',
  },
  {
    id: 'gallery-video-01',
    kind: 'video',
    src: '/speaker-gallery/video-01.mp4',
    posterSrc: '/speaker-gallery/poster-01.jpg',
    title: 'Bass Excursion Test',
    caption: 'Front driver flexing on low bass',
    metaSpec: '02 · Bass Test Video',
  },
  {
    id: 'gallery-photo-03',
    kind: 'image',
    src: '/speaker-gallery/photo-03.jpeg',
    title: 'Three-Quarter Stereo Pair',
    caption: 'Front baffles & side passive radiators',
    metaSpec: '03 · 3/4 Stereo View',
  },
  {
    id: 'gallery-video-02',
    kind: 'video',
    src: '/speaker-gallery/video-02.mp4',
    posterSrc: '/speaker-gallery/poster-02.jpg',
    title: 'RGB Ring Color Chase',
    caption: '16-LED ring cycling WLED modes',
    metaSpec: '04 · WLED Test Video',
  },
  {
    id: 'gallery-photo-07',
    kind: 'image',
    src: '/speaker-gallery/photo-07.jpeg',
    title: 'Cabinet Cutouts in Daylight',
    caption: 'Daylight look at Ø 7 & Ø 5 cm cutouts',
    metaSpec: '05 · Daylight Photo',
  },
  {
    id: 'gallery-photo-05',
    kind: 'image',
    src: '/speaker-gallery/photo-05.jpeg',
    title: 'Workbench Setup',
    caption: 'Finished speaker beside Spider-Man',
    metaSpec: '06 · Workbench Photo',
  },
  {
    id: 'gallery-video-03',
    kind: 'video',
    src: '/speaker-gallery/video-03.mp4',
    posterSrc: '/speaker-gallery/poster-03.jpg',
    title: 'Warm Red & Amber Ring',
    caption: 'Warm red-amber WLED ring test',
    metaSpec: '07 · Lighting Test Video',
  },
  {
    id: 'gallery-photo-04',
    kind: 'image',
    src: '/speaker-gallery/photo-04.jpeg',
    title: 'Front Panel View',
    caption: '7 cm driver, WLED ring & 5 cm woofer',
    metaSpec: '08 · Front Elevation',
  },
  {
    id: 'gallery-photo-06',
    kind: 'image',
    src: '/speaker-gallery/photo-06.jpeg',
    title: 'Frosted Ring Diffuser',
    caption: 'Frosted magenta ring in darkness',
    metaSpec: '09 · Diffuser Photo',
  },
  {
    id: 'gallery-photo-02',
    kind: 'image',
    src: '/speaker-gallery/photo-02.jpeg',
    title: 'Warm Room Lighting',
    caption: 'Matched stereo pair indoors',
    metaSpec: '10 · Indoor Setup',
  },
];

/**
 * Wraps any integer carousel index cleanly into [0, n - 1] for infinite looping.
 */
export function wrapCarouselIndex(i: number, n: number): number {
  if (n <= 1) return 0;
  const mod = i % n;
  return mod < 0 ? mod + n : mod;
}

/**
 * Shortest wrapped signed distance in (-n/2, n/2] from continuous position `pos` to card `i`
 * for seamless infinite circular scrolling.
 */
export function circularCarouselOffset(
  i: number,
  pos: number,
  n: number
): number {
  if (n <= 1) return 0;
  const half = n / 2;
  let d = (i - pos) % n;
  if (d > half) d -= n;
  if (d <= -half) d += n;
  return d;
}

/**
 * Clamps a carousel index or continuous position to finite bounds [0, n - 1].
 */
export function clampCarouselIndex(i: number, n: number): number {
  if (n <= 1) return 0;
  return Math.max(0, Math.min(n - 1, i));
}

/**
 * Direct non-looping offset from continuous carousel position `pos` to card `i`.
 */
export function linearCarouselOffset(i: number, pos: number): number {
  return i - pos;
}

/**
 * Computes card slot geometry and visual attenuation (100% grayscale + progressive blur on side cards)
 * for a card `o` steps from focus.
 */
export function computeCarouselSlot(
  o: number,
  config: FocusCarouselLayoutConfig = DEFAULT_FOCUS_CAROUSEL_CONFIG
): ComputedCarouselSlot {
  const { cardWidth, sideSize: near, gap, sideCount, blurStep, sideGrey } = config;
  const first = (cardWidth * (1 + near)) / 2 + gap;
  const next = cardWidth * near + gap;
  const s = Math.abs(o);
  const size = s <= 1 ? 1 + (near - 1) * s : near;
  const x = (s <= 1 ? first * s : first + next * (s - 1)) * Math.sign(o);
  const reach = Math.min(1, Math.max(0, sideCount + 0.5 - s));
  const fade = s <= 1 ? 1 : FADE_STEP ** (s - 1);
  const side = Math.min(1, s);

  return {
    x: Number(x.toFixed(2)),
    size: Number(size.toFixed(4)),
    alpha: Number((fade * reach).toFixed(4)),
    grey: Number((side * sideGrey).toFixed(3)),
    dim: Number((1 - side * (1 - DIM)).toFixed(3)),
    blur: Number(Math.min(BLUR_MAX, s * blurStep).toFixed(2)),
    zIndex: Math.round((sideCount + 2 - s) * 10),
  };
}

/**
 * Computes responsive container fit scale in [0.42, 1] accounting for both width and vertical stage height
 * so the focused card and its caption bar never clip on shorter laptop screens.
 */
export function computeCarouselFitScale(
  containerWidth: number,
  cardWidth = DEFAULT_FOCUS_CAROUSEL_CONFIG.cardWidth,
  containerHeight = 720,
  ratio = DEFAULT_FOCUS_CAROUSEL_CONFIG.ratio
): number {
  if (containerWidth <= 0 || cardWidth <= 0) return 1;
  const cardHeight = cardWidth / ratio;
  const widthScale = (containerWidth * 0.42) / cardWidth;
  const availableCardHeight = Math.max(200, containerHeight - 78);
  const heightScale = availableCardHeight / cardHeight;
  return Number(
    Math.min(1, Math.max(0.42, Math.min(widthScale, heightScale))).toFixed(4)
  );
}
