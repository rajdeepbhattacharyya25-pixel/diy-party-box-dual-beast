import * as THREE from 'three';
import { RgbColor, VirtualSpeakerId } from './wledTypes';

export const LED_RING_SLOT_COUNT = 16;
export const LED_RING_EMISSIVE_GAIN = 2.55;
export const LED_RING_BOUNCE_MAX_INTENSITY = 0.68;
export const LED_RING_BOUNCE_DISTANCE = 0.85;

let nextRingShaderId = 0;

export const LEFT_LED_RING_MESH_NAME = 'Front_Central_LED_Diffuser_Ring';
export const RIGHT_LED_RING_MESH_NAME = 'Front_Center_LED_Ring';
export const LED_DIFFUSER_MATERIAL_NAME = 'Mat_Front_White_LED_Diffuser_Ring';

export interface RingBounceLightState {
  r: number;
  g: number;
  b: number;
  intensity: number;
}

export interface WledRingShaderHandle {
  material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
  update: (
    frame: readonly RgbColor[],
    powered: boolean,
    brightnessPercent: number
  ) => void;
}

export interface StereoPreviewLayout {
  syncEnabled: boolean;
  leftX: number;
  rightX: number;
  singleX: number;
  fovDeg: number;
  cameraY: number;
  cameraDist: number;
  lookAtY: number;
}

export const STEREO_HALF_SPACING_X = 1.24;

/**
 * Computes equal-scale 3D placement and adaptive camera framing for both single-unit
 * and side-by-side Stereo SYNC dual-speaker views.
 */
export function getStereoPreviewLayout(
  syncEnabled: boolean,
  canvasWidth: number,
  canvasHeight: number
): StereoPreviewLayout {
  const safeW = Math.max(160, canvasWidth);
  const safeH = Math.max(160, canvasHeight);
  const aspect = Math.max(0.45, safeW / safeH);
  const fovDeg = syncEnabled ? 40 : 38;
  const tanV = Math.tan((fovDeg * Math.PI) / 360);
  const tanH = tanV * aspect;

  const reqHalfW = syncEnabled ? 2.55 : 1.32;
  const reqHalfH = syncEnabled ? 2.16 : 1.98;
  const cameraDist = Math.max(reqHalfH / tanV, reqHalfW / tanH);

  return {
    syncEnabled,
    leftX: -STEREO_HALF_SPACING_X,
    rightX: STEREO_HALF_SPACING_X,
    singleX: 0,
    fovDeg,
    cameraY: 0.32,
    cameraDist,
    lookAtY: -0.02,
  };
}

/**
 * Converts an 8-bit sRGB channel [0..255] into linear light intensity [0..1]
 * so Three.js ACESFilmic tone mapping + sRGB output reproduces true LED hue saturation.
 */
export function srgbChannelToLinear(channel255: number): number {
  const c = Math.max(0, Math.min(255, channel255)) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts linear intensity [0..1] back to clamped sRGB 0..1 scalar.
 */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Maps local XY ring coordinates into a clockwise 12-o'clock LED index in [0, count).
 */
export function computeRingAngleIndex(
  x: number,
  y: number,
  count: number = LED_RING_SLOT_COUNT
): number {
  const angleRad = Math.atan2(x, y); // 0 at +Y (12 o'clock), +PI/2 at +X (3 o'clock)
  const wrapped = ((angleRad / (Math.PI * 2)) % 1 + 1) % 1;
  return wrapped * count;
}

/**
 * Returns true if the GLB mesh name is the left or right front LED diffuser ring.
 */
export function isLedRingMeshName(
  meshName: string,
  speakerId?: VirtualSpeakerId
): boolean {
  if (speakerId === 'left') {
    return meshName === LEFT_LED_RING_MESH_NAME;
  }
  if (speakerId === 'right') {
    return meshName === RIGHT_LED_RING_MESH_NAME;
  }
  return (
    meshName === LEFT_LED_RING_MESH_NAME ||
    meshName === RIGHT_LED_RING_MESH_NAME
  );
}

/**
 * Calculates lit shader mix factor [0..1] from power and LED-only brightness.
 * At 0% or powered OFF, returns 0 so the frosted polycarbonate silicone appears unlit.
 */
export function getLedLitStrength(
  powered: boolean,
  brightnessPercent: number
): number {
  if (!powered || brightnessPercent <= 0) return 0;
  return clamp01(brightnessPercent / 6);
}

/**
 * Packs a 16-LED sRGB frame into pre-allocated THREE.Color linear uniforms.
 * Reuses `outColors` if provided to ensure zero GC allocations in the RAF loop.
 */
export function packLedColorsLinear(
  frame: readonly RgbColor[],
  powered: boolean,
  brightnessPercent: number,
  outColors?: THREE.Color[]
): THREE.Color[] {
  const target: THREE.Color[] =
    outColors && outColors.length === LED_RING_SLOT_COUNT
      ? outColors
      : Array.from({ length: LED_RING_SLOT_COUNT }, () => new THREE.Color(0, 0, 0));

  const isOff = !powered || brightnessPercent <= 0;
  for (let i = 0; i < LED_RING_SLOT_COUNT; i++) {
    if (isOff || i >= frame.length) {
      target[i].setRGB(0, 0, 0);
    } else {
      const px = frame[i];
      target[i].setRGB(
        srgbChannelToLinear(px.r),
        srgbChannelToLinear(px.g),
        srgbChannelToLinear(px.b)
      );
    }
  }
  return target;
}

/**
 * Computes a strictly range-clamped bezel rim bounce light from active LED colors.
 * Never produces ambient or cabinet-wide washes.
 */
export function computeRingBounceLight(
  frame: readonly RgbColor[],
  powered: boolean,
  brightnessPercent: number
): RingBounceLightState {
  if (!powered || brightnessPercent <= 0 || frame.length === 0) {
    return { r: 0, g: 0, b: 0, intensity: 0 };
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const count = Math.min(LED_RING_SLOT_COUNT, frame.length);

  for (let i = 0; i < count; i++) {
    sumR += srgbChannelToLinear(frame[i].r);
    sumG += srgbChannelToLinear(frame[i].g);
    sumB += srgbChannelToLinear(frame[i].b);
  }

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const maxChan = Math.max(avgR, avgG, avgB);

  if (maxChan <= 0.0005) {
    return { r: 0, g: 0, b: 0, intensity: 0 };
  }

  // Normalize chromatic tint while modulating physical intensity cleanly by brightness & energy
  const luma = 0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB;
  const energy = Math.max(maxChan * 0.72, luma);
  const intensity = clamp01(energy) * LED_RING_BOUNCE_MAX_INTENSITY;

  return {
    r: clamp01(avgR / maxChan),
    g: clamp01(avgG / maxChan),
    b: clamp01(avgB / maxChan),
    intensity,
  };
}

/**
 * Upgrades a cloned Mat_Front_White_LED_Diffuser_Ring material with a 16-LED
 * radial frosted diffuser shader via `onBeforeCompile`.
 * Preserves PBR specular/clearcoat/surface micro-texture when off, and blends
 * 16 discrete yet smoothly diffused LED zones when illuminated.
 */
export function applyWledRingShader(
  sourceMaterial: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial,
  ringCenter: THREE.Vector2 = new THREE.Vector2(0, 0)
): WledRingShaderHandle {
  const material = sourceMaterial.clone();
  material.name = `${sourceMaterial.name || LED_DIFFUSER_MATERIAL_NAME}_LiveWLED`;

  const ledColors = Array.from(
    { length: LED_RING_SLOT_COUNT },
    () => new THREE.Color(0, 0, 0)
  );
  const litStrengthUniform = { value: 0 };
  const emissiveBoostUniform = { value: LED_RING_EMISSIVE_GAIN };
  const ringCenterUniform = { value: ringCenter.clone() };

  const shaderInstanceKey = `wled-led-ring-v2-${++nextRingShaderId}`;
  material.customProgramCacheKey = () => shaderInstanceKey;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWledColors = { value: ledColors };
    shader.uniforms.uWledLitStrength = litStrengthUniform;
    shader.uniforms.uWledEmissiveBoost = emissiveBoostUniform;
    shader.uniforms.uWledRingCenter = ringCenterUniform;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec2 uWledRingCenter;
varying vec2 vWledRingXY;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vWledRingXY = position.xy - uWledRingCenter;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uWledColors[16];
uniform float uWledLitStrength;
uniform float uWledEmissiveBoost;
varying vec2 vWledRingXY;

vec3 sampleWledFrostedRing(vec2 xy) {
  float angle = atan(xy.x, xy.y);
  float norm = fract(angle / 6.28318530718);
  float fIdx = norm * 16.0;
  vec3 acc = vec3(0.0);
  float wSum = 0.0;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float d = abs(fIdx - fi);
    d = min(d, 16.0 - d);
    // Frosted silicone diffusion: crisp 16-zone core with smooth inter-LED halo bleed
    float w = exp(-d * d * 2.25);
    acc += uWledColors[i] * w;
    wSum += w;
  }
  return acc / max(wSum, 0.0001);
}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
if (uWledLitStrength > 0.001) {
  vec3 wledSample = sampleWledFrostedRing(vWledRingXY);
  float activeEnergy = clamp(max(wledSample.r, max(wledSample.g, wledSample.b)), 0.0, 1.0);
  // Smoked frosted diffuser substrate when powered ON so directional studio light never washes out unlit or saturated segments
  vec3 frostedBase = mix(vec3(0.024, 0.028, 0.038), wledSample * 0.22, activeEnergy);
  diffuseColor.rgb = mix(diffuseColor.rgb, frostedBase, uWledLitStrength * 0.96);
}`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
if (uWledLitStrength > 0.001) {
  vec3 wledGlow = sampleWledFrostedRing(vWledRingXY);
  float rDist = length(vWledRingXY);
  // Subtle silicone edge falloff between inner (0.212) and outer (0.325) radii
  float radialSoft = 0.88 + 0.12 * sin(clamp((rDist - 0.21) / 0.115, 0.0, 1.0) * 3.14159265);
  vec3 emitted = wledGlow * uWledEmissiveBoost * radialSoft;
  totalEmissiveRadiance = mix(totalEmissiveRadiance, emitted, uWledLitStrength);
}`
      )
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
if (uWledLitStrength > 0.001) {
  float studioDamp = 1.0 - uWledLitStrength * 0.58;
  reflectedLight.directDiffuse *= studioDamp;
  reflectedLight.indirectDiffuse *= studioDamp;
  reflectedLight.directSpecular *= studioDamp;
  reflectedLight.indirectSpecular *= studioDamp;
  #ifdef USE_CLEARCOAT
    material.clearcoat *= (1.0 - uWledLitStrength * 0.65);
  #endif
}`
      );
  };

  material.needsUpdate = true;

  return {
    material,
    update: (frame, powered, brightnessPercent) => {
      packLedColorsLinear(frame, powered, brightnessPercent, ledColors);
      litStrengthUniform.value = getLedLitStrength(powered, brightnessPercent);
    },
  };
}
