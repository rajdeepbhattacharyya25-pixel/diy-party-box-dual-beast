import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { encodeRawToPng } from '../src/model/refineSpeakerGlb';

function encodeRgbaToPng(pixels: Uint8Array, width: number, height: number): Uint8Array {
  return encodeRawToPng(width, height, pixels, 4);
}

/**
 * Uses ImageMagick `convert` to decode a cropped/resized region of a reference JPEG
 * directly into raw RGBA8 bytes.
 */
function loadPhotoRegionRgba(
  jpegRelPath: string,
  cropArg: string,
  outW: number,
  outH: number
): Uint8Array {
  const fullPath = path.resolve(process.cwd(), jpegRelPath);
  const buf = execFileSync(
    'convert',
    [
      fullPath,
      '-crop',
      cropArg,
      '+repage',
      '-resize',
      `${outW}x${outH}!`,
      '-depth',
      '8',
      'rgba:-',
    ],
    { maxBuffer: 32 * 1024 * 1024 }
  );
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/**
 * Separable 2D box blur on a Float32Array single-channel buffer (toroidal wrap or clamp).
 */
function boxBlurFloat(
  src: Float32Array,
  w: number,
  h: number,
  radius: number
): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);
  const diam = radius * 2 + 1;

  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const xk = Math.min(w - 1, Math.max(0, k));
      sum += src[y * w + xk];
    }
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / diam;
      const xOut = Math.max(0, x - radius);
      const xIn = Math.min(w - 1, x + radius + 1);
      sum += src[y * w + xIn] - src[y * w + xOut];
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const yk = Math.min(h - 1, Math.max(0, k));
      sum += tmp[yk * w + x];
    }
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum / diam;
      const yOut = Math.max(0, y - radius);
      const yIn = Math.min(h - 1, y + radius + 1);
      sum += tmp[yIn * w + x] - tmp[yOut * w + x];
    }
  }
  return dst;
}

/**
 * Builds a delighted, high-definition, seamlessly tileable 1024x1024 enclosure texture set
 * (albedo, tangent-space normal, roughness, and glTF ORM) directly from the real
 * reference photographs (`R_right`, `R_front`, `R_top`).
 */
export function buildExactEnclosureTextures(size = 1024): {
  albedoRgba: Uint8Array;
  normalRgba: Uint8Array;
  roughnessRgba: Uint8Array;
  ormRgba: Uint8Array;
  heightField: Uint8Array;
} {
  // 1. Load clean, sharp planar regions of the cross-hatched black surface from R_right and R_front
  const patchRight = loadPhotoRegionRgba(
    'public/assets/aistudio/R_right_d4808093.jpeg',
    '520x520+245+175',
    size,
    size
  );
  const patchFront = loadPhotoRegionRgba(
    'public/assets/aistudio/R_front_ac80fc12.jpeg',
    '220x440+175+380',
    size,
    size
  );
  const patchTop = loadPhotoRegionRgba(
    'public/assets/aistudio/R_top_3874159d.jpeg',
    '540x540+265+660',
    size,
    size
  );

  // Extract luminance for each patch and remove any tiny isolated dust speck
  const extractDelightedDetail = (rgba: Uint8Array): Float32Array => {
    const lum = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const r = rgba[i * 4];
      const g = rgba[i * 4 + 1];
      const b = rgba[i * 4 + 2];
      lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    // Despeckle isolated bright pinholes (> local mean + 55)
    const blurSmall = boxBlurFloat(lum, size, size, 4);
    for (let i = 0; i < size * size; i++) {
      if (lum[i] - blurSmall[i] > 52) {
        lum[i] = blurSmall[i] + 12;
      }
    }
    // Remove macro room illumination gradient (radius 32 blur)
    const macroIllum = boxBlurFloat(lum, size, size, 32);
    const detail = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const m = Math.max(18, macroIllum[i]);
      // Normalized high-pass fiber & scratch structure around 0.0
      detail[i] = (lum[i] - m) / Math.pow(m, 0.72);
    }
    return detail;
  };

  const detRight = extractDelightedDetail(patchRight);
  const detFront = extractDelightedDetail(patchFront);
  const detTop = extractDelightedDetail(patchTop);

  // Make each detail field seamlessly tileable by blending with its half-shifted self
  const makeSeamless = (field: Float32Array): Float32Array => {
    const out = new Float32Array(size * size);
    const half = size >> 1;
    for (let y = 0; y < size; y++) {
      const wy = 0.5 - 0.5 * Math.cos((2 * Math.PI * y) / size);
      const ys = (y + half) % size;
      for (let x = 0; x < size; x++) {
        const wx = 0.5 - 0.5 * Math.cos((2 * Math.PI * x) / size);
        const xs = (x + half) % size;

        const w00 = wx * wy;
        const w10 = (1 - wx) * wy;
        const w01 = wx * (1 - wy);
        const w11 = (1 - wx) * (1 - wy);

        out[y * size + x] =
          field[y * size + x] * w00 +
          field[y * size + xs] * w10 +
          field[ys * size + x] * w01 +
          field[ys * size + xs] * w11;
      }
    }
    return out;
  };

  const seamRight = makeSeamless(detRight);
  const seamFront = makeSeamless(detFront);
  const seamTop = makeSeamless(detTop);

  const albedoRgba = new Uint8Array(size * size * 4);
  const roughnessRgba = new Uint8Array(size * size * 4);
  const ormRgba = new Uint8Array(size * size * 4);
  const heightField = new Uint8Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      // Combine the crisp cross-hatching from R_right & R_front with the fine scratch lines from R_top
      const d =
        seamRight[idx] * 0.52 +
        seamFront[idx] * 0.30 +
        seamTop[idx] * 0.18;

      // S-curve contrast enhancement so the dark valleys are deep jet-black (#0E0F12)
      // and the fine intersecting fiber ridges catch crisp charcoal-silver highlights (#36383E - #54575F)
      const scaled = d * 18.5;
      let val: number;
      if (scaled >= 0) {
        // Ridges & fine white/grey micro-scratches seen in R_front and R_top
        val = 21 + Math.min(48, Math.pow(scaled, 1.08) * 2.35);
      } else {
        // Deep charcoal-black impressed valleys
        val = Math.max(10, 21 + scaled * 1.15);
      }

      const r = Math.min(255, Math.max(0, Math.round(val * 0.98)));
      const g = Math.min(255, Math.max(0, Math.round(val * 0.99)));
      const b = Math.min(255, Math.max(0, Math.round(val * 1.03)));

      const p = idx * 4;
      albedoRgba[p] = r;
      albedoRgba[p + 1] = g;
      albedoRgba[p + 2] = b;
      albedoRgba[p + 3] = 255;

      // Heightfield: 0..255 centered around 128
      const hByte = Math.min(255, Math.max(0, Math.round(128 + scaled * 7.2)));
      heightField[idx] = hByte;

      // Roughness: deep valleys are matte (0.89 -> 227), raised ridges are slightly satin (0.68 -> 173)
      const roughNorm = Math.min(
        0.90,
        Math.max(0.66, 0.83 - (hByte - 128) / 255 * 0.28)
      );
      const roughByte = Math.round(roughNorm * 255);
      roughnessRgba[p] = roughByte;
      roughnessRgba[p + 1] = roughByte;
      roughnessRgba[p + 2] = roughByte;
      roughnessRgba[p + 3] = 255;

      // glTF ORM: R = Occlusion, G = Roughness, B = Metalness
      const aoByte = Math.min(255, Math.max(150, Math.round(215 + (hByte - 128) * 0.55)));
      ormRgba[p] = aoByte;
      ormRgba[p + 1] = roughByte;
      ormRgba[p + 2] = 6; // metalness ~0.02
      ormRgba[p + 3] = 255;
    }
  }

  // Compute tangent-space normal map from heightField
  const normalRgba = new Uint8Array(size * size * 4);
  const strength = 2.6;
  for (let y = 0; y < size; y++) {
    const ym1 = (y - 1 + size) % size;
    const yp1 = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm1 = (x - 1 + size) % size;
      const xp1 = (x + 1) % size;

      const hL = heightField[y * size + xm1] / 255;
      const hR = heightField[y * size + xp1] / 255;
      const hU = heightField[ym1 * size + x] / 255;
      const hD = heightField[yp1 * size + x] / 255;

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1.0;
      const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);

      const p = (y * size + x) * 4;
      normalRgba[p] = Math.min(255, Math.max(0, Math.round((dx * invLen * 0.5 + 0.5) * 255)));
      normalRgba[p + 1] = Math.min(255, Math.max(0, Math.round((dy * invLen * 0.5 + 0.5) * 255)));
      normalRgba[p + 2] = Math.min(255, Math.max(0, Math.round((dz * invLen * 0.5 + 0.5) * 255)));
      normalRgba[p + 3] = 255;
    }
  }

  return { albedoRgba, normalRgba, roughnessRgba, ormRgba, heightField };
}

function main() {
  const outDir = path.resolve(process.cwd(), 'public/assets/textures');
  fs.mkdirSync(outDir, { recursive: true });

  const size = 1024;
  const enc = buildExactEnclosureTextures(size);

  fs.writeFileSync(
    path.join(outDir, 'enclosure_albedo.png'),
    encodeRgbaToPng(enc.albedoRgba, size, size)
  );
  fs.writeFileSync(
    path.join(outDir, 'enclosure_normal.png'),
    encodeRgbaToPng(enc.normalRgba, size, size)
  );
  fs.writeFileSync(
    path.join(outDir, 'enclosure_roughness.png'),
    encodeRgbaToPng(enc.roughnessRgba, size, size)
  );
  fs.writeFileSync(
    path.join(outDir, 'enclosure_orm.png'),
    encodeRgbaToPng(enc.ormRgba, size, size)
  );

  // Also generate ORM maps for module_back_albedo.png and module_top_albedo.png
  const modBackRgba = loadPhotoRegionRgba(
    'public/assets/aistudio/R_back_e6fd42f6.jpeg',
    '340x186+228+238',
    512,
    256
  );
  const modBackOrm = new Uint8Array(512 * 256 * 4);
  for (let i = 0; i < 512 * 256; i++) {
    const r = modBackRgba[i * 4];
    const g = modBackRgba[i * 4 + 1];
    const b = modBackRgba[i * 4 + 2];
    const isGold = r > 110 && g > 70 && r > b * 1.3;
    modBackOrm[i * 4] = 230;
    modBackOrm[i * 4 + 1] = isGold ? 132 : 178; // roughness 0.52 on gold, 0.70 on black tape
    modBackOrm[i * 4 + 2] = isGold ? 128 : 15;  // metalness 0.50 on gold, 0.06 on black tape
    modBackOrm[i * 4 + 3] = 255;
  }
  fs.writeFileSync(
    path.join(outDir, 'module_back_albedo.png'),
    encodeRgbaToPng(modBackRgba, 512, 256)
  );
  fs.writeFileSync(
    path.join(outDir, 'module_back_orm.png'),
    encodeRgbaToPng(modBackOrm, 512, 256)
  );

  const modTopRgba = loadPhotoRegionRgba(
    'public/assets/aistudio/R_top_3874159d.jpeg',
    '282x70+650+494',
    512,
    256
  );
  const modTopOrm = new Uint8Array(512 * 256 * 4);
  for (let i = 0; i < 512 * 256; i++) {
    const r = modTopRgba[i * 4];
    const g = modTopRgba[i * 4 + 1];
    const b = modTopRgba[i * 4 + 2];
    const isGold = r > 110 && g > 70 && r > b * 1.25;
    modTopOrm[i * 4] = 230;
    modTopOrm[i * 4 + 1] = isGold ? 135 : 180;
    modTopOrm[i * 4 + 2] = isGold ? 122 : 15;
    modTopOrm[i * 4 + 3] = 255;
  }
  fs.writeFileSync(
    path.join(outDir, 'module_top_albedo.png'),
    encodeRgbaToPng(modTopRgba, 512, 256)
  );
  fs.writeFileSync(
    path.join(outDir, 'module_top_orm.png'),
    encodeRgbaToPng(modTopOrm, 512, 256)
  );

  console.log('Successfully generated exact reference textures in public/assets/textures/');
}

main();
