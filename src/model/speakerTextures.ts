import * as THREE from 'three';

export interface SpeakerTextureSet {
  enclosureAlbedo: THREE.Texture;
  enclosureNormal: THREE.Texture;
  enclosureBump: THREE.Texture;
  enclosureRoughness: THREE.Texture;
  moduleBackAlbedo: THREE.Texture;
  moduleBackRoughness: THREE.Texture;
  moduleBackMetalness: THREE.Texture;
  moduleTopAlbedo: THREE.Texture;
  moduleTopRoughness: THREE.Texture;
  leftModuleBackAlbedo: THREE.Texture;
  leftModuleBackRoughness: THREE.Texture;
  leftModuleBackMetalness: THREE.Texture;
  leftModuleTopAlbedo: THREE.Texture;
  leftModuleTopRoughness: THREE.Texture;
  leftControlPanelAlbedo: THREE.Texture;
  driverConeAlbedo: THREE.Texture;
  driverConeBump: THREE.Texture;
  rubberSurroundBump: THREE.Texture;
  ledDiffuserAlbedo: THREE.Texture;
  silverFoilAlbedo: THREE.Texture;
  silverFoilRoughness: THREE.Texture;
  dispose: () => void;
}

/**
 * Deterministic PRNG so procedural micro-textures are 100% reproducible.
 */
function createRng(seed = 1337) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Converts a grayscale heightfield array into a tangent-space normal map
 * (R = X normal, G = Y normal, B = Z normal).
 */
function heightBufferToNormalData(
  height: Uint8Array,
  width: number,
  heightPx: number,
  strength = 2.4
): Uint8Array {
  const out = new Uint8Array(width * heightPx * 4);
  for (let y = 0; y < heightPx; y++) {
    const ym1 = (y - 1 + heightPx) % heightPx;
    const yp1 = (y + 1) % heightPx;
    for (let x = 0; x < width; x++) {
      const xm1 = (x - 1 + width) % width;
      const xp1 = (x + 1) % width;

      const hL = height[y * width + xm1] / 255;
      const hR = height[y * width + xp1] / 255;
      const hU = height[ym1 * width + x] / 255;
      const hD = height[yp1 * width + x] / 255;

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1.0;
      const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);

      const idx = (y * width + x) * 4;
      out[idx] = Math.min(255, Math.max(0, Math.round((dx * invLen * 0.5 + 0.5) * 255)));
      out[idx + 1] = Math.min(255, Math.max(0, Math.round((dy * invLen * 0.5 + 0.5) * 255)));
      out[idx + 2] = Math.min(255, Math.max(0, Math.round((dz * invLen * 0.5 + 0.5) * 255)));
      out[idx + 3] = 255;
    }
  }
  return out;
}

/**
 * Applies a 3x3 Unsharp Mask convolution pass on a 2D canvas to eliminate
 * photographic lens softness and keep textures razor-sharp when zoomed in.
 */
function sharpenCanvas2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount = 0.42
) {
  const srcImage = ctx.getImageData(0, 0, width, height);
  const src = srcImage.data;
  const dstImage = ctx.createImageData(width, height);
  const dst = dstImage.data;

  const centerWeight = 1 + 4 * amount;
  const neighborWeight = -amount;

  for (let y = 0; y < height; y++) {
    const ym1 = y > 0 ? y - 1 : 0;
    const yp1 = y < height - 1 ? y + 1 : height - 1;
    for (let x = 0; x < width; x++) {
      const xm1 = x > 0 ? x - 1 : 0;
      const xp1 = x < width - 1 ? x + 1 : width - 1;

      const idx = (y * width + x) * 4;
      const idxU = (ym1 * width + x) * 4;
      const idxD = (yp1 * width + x) * 4;
      const idxL = (y * width + xm1) * 4;
      const idxR = (y * width + xp1) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          src[idx + c] * centerWeight +
          (src[idxU + c] + src[idxD + c] + src[idxL + c] + src[idxR + c]) *
            neighborWeight;
        dst[idx + c] = val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(dstImage, 0, 0);
}

/**
 * Helper in browser to asynchronously overlay an exact reference PNG onto an existing CanvasTexture,
 * apply unsharp mask sharpening, and optionally retain procedural high-frequency micro-fiber detail.
 */
function loadExactImageOntoCanvasTexture(
  url: string,
  canvas: HTMLCanvasElement,
  texture: THREE.CanvasTexture,
  onLoaded?: () => void,
  sharpenAmount = 0.45,
  preserveProceduralOverlayAlpha = 0
) {
  if (typeof Image === 'undefined') return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let proceduralSnapshot: HTMLCanvasElement | null = null;
      if (preserveProceduralOverlayAlpha > 0) {
        proceduralSnapshot = document.createElement('canvas');
        proceduralSnapshot.width = canvas.width;
        proceduralSnapshot.height = canvas.height;
        proceduralSnapshot.getContext('2d')!.drawImage(canvas, 0, 0);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (sharpenAmount > 0) {
        sharpenCanvas2D(ctx, canvas.width, canvas.height, sharpenAmount);
      }

      if (proceduralSnapshot && preserveProceduralOverlayAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = preserveProceduralOverlayAlpha;
        ctx.drawImage(proceduralSnapshot, 0, 0);
        ctx.restore();
      }

      texture.needsUpdate = true;
      onLoaded?.();
    }
  };
  img.src = url;
}

/**
 * Creates the enclosure PBR texture set (albedo, tangent-space normal, bump, roughness).
 * - Uses 2048x2048 (2K) high-definition canvas in browser with unsharp mask + micro-fiber overlay
 *   so zooming in closely shows razor-sharp cross-hatch grain.
 */
function createEnclosureTextures(
  maxAnisotropy: number,
  onTextureReady?: () => void
): {
  albedo: THREE.Texture;
  normal: THREE.Texture;
  bump: THREE.Texture;
  roughness: THREE.Texture;
} {
  const isBrowser = typeof document !== 'undefined';
  const size = isBrowser ? 1024 : 256;
  const rng = createRng(4099);

  if (isBrowser) {
    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = size;
    albedoCanvas.height = size;
    const aCtx = albedoCanvas.getContext('2d')!;

    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const nCtx = normalCanvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d')!;

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d')!;

    // 1. Deep jet-charcoal base (#111215) — NO blocky squares!
    aCtx.fillStyle = '#111215';
    aCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#707070';
    bCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#dbdbdb';
    rCtx.fillRect(0, 0, size, size);

    // 2. Dense, crisp multi-directional cross-hatched fibers matching R_front & R_right
    const fiberCount = 26000;
    for (let i = 0; i < fiberCount; i++) {
      const x1 = rng() * size;
      const y1 = rng() * size;
      const roll = rng();
      const angle =
        roll < 0.38
          ? 0.42 + (rng() - 0.5) * 0.45
          : roll < 0.76
          ? -0.46 + (rng() - 0.5) * 0.45
          : (rng() - 0.5) * Math.PI;
      const len = 18 + rng() * 145;
      const x2 = x1 + Math.cos(angle) * len;
      const y2 = y1 + Math.sin(angle) * len;

      const isBrightFiber = rng() > 0.62;
      const lw = isBrightFiber ? 0.7 + rng() * 1.1 : 1.0 + rng() * 1.6;

      if (isBrightFiber) {
        const shade = Math.floor(42 + rng() * 34);
        const alpha = 0.22 + rng() * 0.28;
        aCtx.strokeStyle = `rgba(${shade}, ${shade + 1}, ${shade + 3}, ${alpha})`;
        bCtx.strokeStyle = `rgba(185, 185, 185, ${alpha})`;
        rCtx.strokeStyle = `rgba(175, 175, 175, ${alpha})`;
      } else {
        const shade = Math.floor(10 + rng() * 8);
        aCtx.strokeStyle = `rgba(${shade}, ${shade + 1}, ${shade + 2}, 0.48)`;
        bCtx.strokeStyle = 'rgba(72, 72, 72, 0.38)';
        rCtx.strokeStyle = 'rgba(232, 232, 232, 0.35)';
      }

      aCtx.lineWidth = lw;
      aCtx.beginPath();
      aCtx.moveTo(x1, y1);
      aCtx.lineTo(x2, y2);
      aCtx.stroke();

      bCtx.lineWidth = lw;
      bCtx.beginPath();
      bCtx.moveTo(x1, y1);
      bCtx.lineTo(x2, y2);
      bCtx.stroke();
    }

    // Build initial tangent-space normal canvas from bumpCanvas
    const bumpImgData = bCtx.getImageData(0, 0, size, size).data;
    const heightBytes = new Uint8Array(size * size);
    for (let i = 0; i < heightBytes.length; i++) {
      heightBytes[i] = bumpImgData[i * 4];
    }
    const normalBytes = heightBufferToNormalData(heightBytes, size, size, 2.5);
    const normImgData = nCtx.createImageData(size, size);
    normImgData.data.set(normalBytes);
    nCtx.putImageData(normImgData, 0, 0);

    const configureRepeat = (tex: THREE.Texture, isSrgb: boolean) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.65, 1.65);
      tex.anisotropy = maxAnisotropy;
      tex.colorSpace = isSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.needsUpdate = true;
    };

    const albedo = new THREE.CanvasTexture(albedoCanvas);
    const normal = new THREE.CanvasTexture(normalCanvas);
    const bump = new THREE.CanvasTexture(bumpCanvas);
    const roughness = new THREE.CanvasTexture(roughCanvas);

    configureRepeat(albedo, true);
    configureRepeat(normal, false);
    configureRepeat(bump, false);
    configureRepeat(roughness, false);

    // Overlay the delighted, seamless real photographic textures with unsharp mask + micro-fiber detail
    loadExactImageOntoCanvasTexture(
      '/assets/textures/enclosure_albedo.png',
      albedoCanvas,
      albedo,
      onTextureReady,
      0.52,
      0.28
    );
    loadExactImageOntoCanvasTexture(
      '/assets/textures/enclosure_normal.png',
      normalCanvas,
      normal,
      onTextureReady,
      0,
      0.22
    );
    loadExactImageOntoCanvasTexture(
      '/assets/textures/enclosure_roughness.png',
      roughCanvas,
      roughness,
      onTextureReady,
      0,
      0
    );
    loadExactImageOntoCanvasTexture(
      '/assets/textures/enclosure_albedo.png',
      bumpCanvas,
      bump,
      onTextureReady,
      0,
      0.22
    );

    return { albedo, normal, bump, roughness };
  }

  // Headless Node unit-test fallback
  const albedoData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const heightOnly = new Uint8Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const v = 16 + Math.floor(rng() * 24);
    const idx = i * 4;
    albedoData[idx] = v;
    albedoData[idx + 1] = v + 1;
    albedoData[idx + 2] = v + 2;
    albedoData[idx + 3] = 255;

    const h = 100 + Math.floor(rng() * 56);
    heightOnly[i] = h;
    bumpData[idx] = h;
    bumpData[idx + 1] = h;
    bumpData[idx + 2] = h;
    bumpData[idx + 3] = 255;

    const r = 195 + Math.floor(rng() * 35);
    roughData[idx] = r;
    roughData[idx + 1] = r;
    roughData[idx + 2] = r;
    roughData[idx + 3] = 255;
  }

  const normalData = heightBufferToNormalData(heightOnly, size, size, 2.2);
  const makeDataTex = (arr: Uint8Array, isSrgb: boolean) => {
    const t = new THREE.DataTexture(arr, size, size);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.65, 1.65);
    t.colorSpace = isSrgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };

  return {
    albedo: makeDataTex(albedoData, true),
    normal: makeDataTex(normalData, false),
    bump: makeDataTex(bumpData, false),
    roughness: makeDataTex(roughData, false),
  };
}

/**
 * Creates the texture for the raised electronics module's BACK face (-Z)
 * and loads the exact reference photo crop (`/assets/textures/module_back_albedo.png`).
 */
function createModuleBackTextures(
  maxAnisotropy: number,
  onTextureReady?: () => void,
  imageUrl = '/assets/textures/module_back_albedo.png'
): {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  metalness: THREE.Texture;
} {
  const isBrowser = typeof document !== 'undefined';
  const width = isBrowser ? 512 : 128;
  const height = isBrowser ? 256 : 64;
  const rng = createRng(8821);

  if (isBrowser) {
    const aCanvas = document.createElement('canvas');
    aCanvas.width = width;
    aCanvas.height = height;
    const ctx = aCanvas.getContext('2d')!;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = width;
    rCanvas.height = height;
    const rCtx = rCanvas.getContext('2d')!;

    const mCanvas = document.createElement('canvas');
    mCanvas.width = width;
    mCanvas.height = height;
    const mCtx = mCanvas.getContext('2d')!;

    ctx.fillStyle = '#141518';
    ctx.fillRect(0, 0, width, height);

    rCtx.fillStyle = '#b4b4b4';
    rCtx.fillRect(0, 0, width, height);

    mCtx.fillStyle = '#101010';
    mCtx.fillRect(0, 0, width, height);

    // Scuffed white/silver tape wear dots
    for (let i = 0; i < 650; i++) {
      const x = (0.14 + rng() * 0.80) * width;
      const y = (0.12 + rng() * 0.78) * height;
      const rad = 1.2 + rng() * 3.8;
      const alpha = 0.28 + rng() * 0.45;
      ctx.fillStyle = `rgba(210, 214, 220, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Diagonal golden-brown brush strokes matching R_back
    const drawGoldStroke = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      w: number
    ) => {
      ctx.strokeStyle = '#9e6b2e';
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1 * width, y1 * height);
      ctx.lineTo(x2 * width, y2 * height);
      ctx.stroke();

      rCtx.strokeStyle = '#848484';
      rCtx.lineWidth = w;
      rCtx.lineCap = 'round';
      rCtx.beginPath();
      ctx.moveTo(x1 * width, y1 * height);
      ctx.lineTo(x2 * width, y2 * height);
      ctx.stroke();

      mCtx.strokeStyle = '#808080';
      mCtx.lineWidth = w;
      mCtx.lineCap = 'round';
      rCtx.beginPath();
      mCtx.moveTo(x1 * width, y1 * height);
      mCtx.lineTo(x2 * width, y2 * height);
      mCtx.stroke();
    };

    drawGoldStroke(0.04, 0.90, 0.94, 0.08, 18);
    drawGoldStroke(0.32, 0.62, 0.62, 0.14, 10);
    drawGoldStroke(0.38, 0.56, 0.66, 0.68, 9);
    drawGoldStroke(0.15, 0.76, 0.16, 0.34, 11);

    ctx.fillStyle = '#2a2d32';
    ctx.fillRect(0.05 * width, 0.07 * height, 0.28 * width, 0.27 * height);
    ctx.strokeStyle = '#9e6b2e';
    ctx.lineWidth = 6;
    ctx.strokeRect(0.05 * width, 0.07 * height, 0.28 * width, 0.27 * height);

    const albedo = new THREE.CanvasTexture(aCanvas);
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = maxAnisotropy;

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.colorSpace = THREE.NoColorSpace;

    const metalness = new THREE.CanvasTexture(mCanvas);
    metalness.colorSpace = THREE.NoColorSpace;

    loadExactImageOntoCanvasTexture(
      imageUrl,
      aCanvas,
      albedo,
      onTextureReady,
      0.55,
      0
    );

    return { albedo, roughness, metalness };
  }

  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = 24;
    data[idx + 1] = 25;
    data[idx + 2] = 28;
    data[idx + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, width, height);
  tex.needsUpdate = true;
  return { albedo: tex, roughness: tex, metalness: tex };
}

/**
 * Creates the texture for the raised electronics module's TOP face (+Y)
 * and loads the exact reference photo crop (`/assets/textures/module_top_albedo.png`).
 */
function createModuleTopTextures(
  maxAnisotropy: number,
  onTextureReady?: () => void,
  imageUrl = '/assets/textures/module_top_albedo.png'
): {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
} {
  const isBrowser = typeof document !== 'undefined';
  const width = isBrowser ? 1024 : 128;
  const height = isBrowser ? 512 : 64;
  const rng = createRng(9931);

  if (isBrowser) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = width;
    rCanvas.height = height;
    const rCtx = rCanvas.getContext('2d')!;

    ctx.fillStyle = '#151619';
    ctx.fillRect(0, 0, width, height);

    rCtx.fillStyle = '#b6b6b6';
    rCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 450; i++) {
      const x = (0.12 + rng() * 0.84) * width;
      const y = (0.15 + rng() * 0.78) * height;
      const rad = 1.2 + rng() * 3.2;
      ctx.fillStyle = `rgba(210, 214, 220, ${0.28 + rng() * 0.45})`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#b4823e';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.45 * width, 0.94 * height);
    ctx.lineTo(0.88 * width, 0.08 * height);
    ctx.stroke();

    ctx.fillStyle = '#c49248';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('N', 0.36 * width, 0.42 * height);
    ctx.strokeStyle = '#c49248';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0.48 * width, 0.14 * height);
    ctx.lineTo(0.53 * width, 0.30 * height);
    ctx.lineTo(0.48 * width, 0.46 * height);
    ctx.lineTo(0.43 * width, 0.30 * height);
    ctx.closePath();
    ctx.stroke();

    const albedo = new THREE.CanvasTexture(canvas);
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = maxAnisotropy;

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.colorSpace = THREE.NoColorSpace;

    loadExactImageOntoCanvasTexture(
      imageUrl,
      canvas,
      albedo,
      onTextureReady,
      0.55,
      0
    );

    return { albedo, roughness };
  }

  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = 24;
    data[idx + 1] = 25;
    data[idx + 2] = 28;
    data[idx + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, width, height);
  tex.needsUpdate = true;
  return { albedo: tex, roughness: tex };
}

/**
 * Generates radial pressed-pulp paper cone textures for speaker drivers:
 * - Deep graphite-black (#16181B) with realistic concentric acoustic ribs & radial paper grain
 */
function createDriverConeTextures(maxAnisotropy: number): {
  albedo: THREE.Texture;
  bump: THREE.Texture;
} {
  const isBrowser = typeof document !== 'undefined';
  const size = isBrowser ? 1024 : 128;
  const rng = createRng(5512);

  if (isBrowser) {
    const aCanvas = document.createElement('canvas');
    aCanvas.width = size;
    aCanvas.height = size;
    const aCtx = aCanvas.getContext('2d')!;

    const bCanvas = document.createElement('canvas');
    bCanvas.width = size;
    bCanvas.height = size;
    const bCtx = bCanvas.getContext('2d')!;

    aCtx.fillStyle = '#181a1d';
    aCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const cx = size * 0.5;
    const cy = size * 0.5;

    for (let r = 12; r < size * 0.49; r += 2.2) {
      const shade = 22 + Math.floor(Math.sin(r * 0.35) * 3 + rng() * 4);
      aCtx.strokeStyle = `rgba(${shade}, ${shade + 1}, ${shade + 3}, 0.35)`;
      aCtx.lineWidth = 1.3;
      aCtx.beginPath();
      aCtx.arc(cx, cy, r, 0, Math.PI * 2);
      aCtx.stroke();

      const bVal = 124 + Math.floor(Math.sin(r * 0.45) * 14);
      bCtx.strokeStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
      bCtx.lineWidth = 1.3;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.stroke();
    }

    for (let i = 0; i < 1600; i++) {
      const angle = rng() * Math.PI * 2;
      const r1 = 16 + rng() * (size * 0.36);
      const r2 = r1 + 10 + rng() * 34;
      aCtx.strokeStyle = 'rgba(34, 36, 40, 0.18)';
      aCtx.lineWidth = 0.8;
      aCtx.beginPath();
      aCtx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      aCtx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      aCtx.stroke();
    }

    const albedo = new THREE.CanvasTexture(aCanvas);
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = maxAnisotropy;

    const bump = new THREE.CanvasTexture(bCanvas);
    bump.colorSpace = THREE.NoColorSpace;
    bump.anisotropy = maxAnisotropy;

    return { albedo, bump };
  }

  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    data[idx] = 24;
    data[idx + 1] = 26;
    data[idx + 2] = 29;
    data[idx + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.needsUpdate = true;
  return { albedo: tex, bump: tex };
}

/**
 * Generates fine matte elastomer micro-texture for speaker rubber surrounds.
 */
function createRubberSurroundBump(): THREE.Texture {
  const isBrowser = typeof document !== 'undefined';
  const size = isBrowser ? 256 : 64;
  const rng = createRng(6119);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = 122 + Math.floor(rng() * 12);
    const idx = i * 4;
    data[idx] = v;
    data[idx + 1] = v;
    data[idx + 2] = v;
    data[idx + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates warm frosted translucent acrylic diffuser texture for the central LED ring
 * matching R_front (with subtle glue/wear flecks along the inner/outer rim).
 */
function createLedDiffuserAlbedo(maxAnisotropy: number): THREE.Texture {
  const isBrowser = typeof document !== 'undefined';
  const size = isBrowser ? 512 : 128;
  const rng = createRng(3191);

  if (isBrowser) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#c8c6c2';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3600; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const rad = 1 + rng() * 5;
      const v = 186 + Math.floor(rng() * 34);
      ctx.fillStyle = `rgba(${v}, ${v - 2}, ${v - 5}, 0.20)`;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  }

  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    data[idx] = 200;
    data[idx + 1] = 198;
    data[idx + 2] = 194;
    data[idx + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates brushed/crinkled metallic silver foil textures for the top "R" emblem.
 */
function createSilverFoilTextures(maxAnisotropy: number): {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
} {
  const isBrowser = typeof document !== 'undefined';
  const size = isBrowser ? 512 : 128;
  const rng = createRng(7331);

  if (isBrowser) {
    const aCanvas = document.createElement('canvas');
    aCanvas.width = size;
    aCanvas.height = size;
    const aCtx = aCanvas.getContext('2d')!;

    const rCanvas = document.createElement('canvas');
    rCanvas.width = size;
    rCanvas.height = size;
    const rCtx = rCanvas.getContext('2d')!;

    aCtx.fillStyle = '#cfd3d8';
    aCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#626262';
    rCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 900; i++) {
      const x1 = rng() * size;
      const y1 = rng() * size;
      const angle = (rng() - 0.5) * 0.9;
      const len = 10 + rng() * 55;
      const v = 175 + Math.floor(rng() * 65);
      aCtx.strokeStyle = `rgba(${v}, ${v + 1}, ${v + 2}, 0.28)`;
      aCtx.lineWidth = 1.0 + rng() * 1.8;
      aCtx.beginPath();
      aCtx.moveTo(x1, y1);
      aCtx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
      aCtx.stroke();

      const rv = 78 + Math.floor(rng() * 55);
      rCtx.strokeStyle = `rgba(${rv}, ${rv}, ${rv}, 0.35)`;
      rCtx.lineWidth = 1.2;
      rCtx.beginPath();
      rCtx.moveTo(x1, y1);
      rCtx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
      rCtx.stroke();
    }

    const albedo = new THREE.CanvasTexture(aCanvas);
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = maxAnisotropy;

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.colorSpace = THREE.NoColorSpace;
    roughness.anisotropy = maxAnisotropy;

    return { albedo, roughness };
  }

  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    data[idx] = 205;
    data[idx + 1] = 209;
    data[idx + 2] = 214;
    data[idx + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.needsUpdate = true;
  return { albedo: tex, roughness: tex };
}

export function createSpeakerTextureSet(
  maxAnisotropy = 4,
  onTextureReady?: () => void
): SpeakerTextureSet {
  const enclosure = createEnclosureTextures(maxAnisotropy, onTextureReady);
  const modBack = createModuleBackTextures(
    maxAnisotropy,
    onTextureReady,
    '/assets/textures/module_back_albedo.png'
  );
  const modTop = createModuleTopTextures(
    maxAnisotropy,
    onTextureReady,
    '/assets/textures/module_top_albedo.png'
  );
  const leftModBack = createModuleBackTextures(
    maxAnisotropy,
    onTextureReady,
    '/assets/textures/left_module_back_albedo.png'
  );
  const leftModTop = createModuleTopTextures(
    maxAnisotropy,
    onTextureReady,
    '/assets/textures/left_module_top_albedo.png'
  );
  const leftCtrlPanel = createModuleBackTextures(
    maxAnisotropy,
    onTextureReady,
    '/assets/textures/left_control_panel_albedo.png'
  );
  const cone = createDriverConeTextures(maxAnisotropy);
  const rubberSurroundBump = createRubberSurroundBump();
  const ledDiffuserAlbedo = createLedDiffuserAlbedo(maxAnisotropy);
  const silverFoil = createSilverFoilTextures(maxAnisotropy);

  return {
    enclosureAlbedo: enclosure.albedo,
    enclosureNormal: enclosure.normal,
    enclosureBump: enclosure.bump,
    enclosureRoughness: enclosure.roughness,
    moduleBackAlbedo: modBack.albedo,
    moduleBackRoughness: modBack.roughness,
    moduleBackMetalness: modBack.metalness,
    moduleTopAlbedo: modTop.albedo,
    moduleTopRoughness: modTop.roughness,
    leftModuleBackAlbedo: leftModBack.albedo,
    leftModuleBackRoughness: leftModBack.roughness,
    leftModuleBackMetalness: leftModBack.metalness,
    leftModuleTopAlbedo: leftModTop.albedo,
    leftModuleTopRoughness: leftModTop.roughness,
    leftControlPanelAlbedo: leftCtrlPanel.albedo,
    driverConeAlbedo: cone.albedo,
    driverConeBump: cone.bump,
    rubberSurroundBump,
    ledDiffuserAlbedo,
    silverFoilAlbedo: silverFoil.albedo,
    silverFoilRoughness: silverFoil.roughness,
    dispose: () => {
      enclosure.albedo.dispose();
      enclosure.normal.dispose();
      enclosure.bump.dispose();
      enclosure.roughness.dispose();
      modBack.albedo.dispose();
      modBack.roughness.dispose();
      modBack.metalness.dispose();
      modTop.albedo.dispose();
      modTop.roughness.dispose();
      leftModBack.albedo.dispose();
      leftModBack.roughness.dispose();
      leftModBack.metalness.dispose();
      leftModTop.albedo.dispose();
      leftModTop.roughness.dispose();
      leftCtrlPanel.albedo.dispose();
      leftCtrlPanel.roughness.dispose();
      leftCtrlPanel.metalness.dispose();
      cone.albedo.dispose();
      cone.bump.dispose();
      rubberSurroundBump.dispose();
      ledDiffuserAlbedo.dispose();
      silverFoil.albedo.dispose();
      silverFoil.roughness.dispose();
    },
  };
}
