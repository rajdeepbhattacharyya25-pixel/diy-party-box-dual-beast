import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  LED_RING_BOUNCE_MAX_INTENSITY,
  LED_RING_SLOT_COUNT,
  LEFT_LED_RING_MESH_NAME,
  RIGHT_LED_RING_MESH_NAME,
  STEREO_HALF_SPACING_X,
  computeRingAngleIndex,
  computeRingBounceLight,
  getLedLitStrength,
  getStereoPreviewLayout,
  isLedRingMeshName,
  packLedColorsLinear,
  srgbChannelToLinear,
} from './ledRingShader';
import { RgbColor } from './wledTypes';

test('getStereoPreviewLayout positions L/R symmetrically and pulls camera back cleanly in Sync mode', () => {
  const single = getStereoPreviewLayout(false, 640, 560);
  const stereo = getStereoPreviewLayout(true, 640, 560);
  const narrowStereo = getStereoPreviewLayout(true, 360, 560);

  assert.equal(single.singleX, 0);
  assert.equal(stereo.leftX, -STEREO_HALF_SPACING_X);
  assert.equal(stereo.rightX, STEREO_HALF_SPACING_X);
  assert.ok(Math.abs(stereo.leftX) === Math.abs(stereo.rightX));
  assert.ok(stereo.cameraDist > single.cameraDist);
  assert.ok(narrowStereo.cameraDist > stereo.cameraDist);
});

test('srgbChannelToLinear converts black, midtone, and full white accurately', () => {
  assert.equal(srgbChannelToLinear(0), 0);
  assert.equal(srgbChannelToLinear(-15), 0);
  assert.equal(srgbChannelToLinear(300), 1);
  assert.ok(Math.abs(srgbChannelToLinear(255) - 1) < 1e-6);
  // sRGB 128 linear value ~ 0.21586
  assert.ok(Math.abs(srgbChannelToLinear(128) - 0.21586) < 0.002);
});

test('computeRingAngleIndex maps 12/3/6/9 oclock clockwise cleanly', () => {
  assert.ok(Math.abs(computeRingAngleIndex(0, 0.27) - 0) < 1e-6);
  assert.ok(Math.abs(computeRingAngleIndex(0.27, 0) - 4) < 1e-6);
  assert.ok(Math.abs(computeRingAngleIndex(0, -0.27) - 8) < 1e-6);
  assert.ok(Math.abs(computeRingAngleIndex(-0.27, 0) - 12) < 1e-6);
});

test('isLedRingMeshName accurately identifies Left and Right GLB ring meshes', () => {
  assert.equal(isLedRingMeshName(LEFT_LED_RING_MESH_NAME, 'left'), true);
  assert.equal(isLedRingMeshName(RIGHT_LED_RING_MESH_NAME, 'left'), false);
  assert.equal(isLedRingMeshName(RIGHT_LED_RING_MESH_NAME, 'right'), true);
  assert.equal(isLedRingMeshName(LEFT_LED_RING_MESH_NAME, 'right'), false);
  assert.equal(isLedRingMeshName('Mat_Enclosure_Textured_Black'), false);
});

test('getLedLitStrength turns strictly off at 0% or powered=false', () => {
  assert.equal(getLedLitStrength(false, 100), 0);
  assert.equal(getLedLitStrength(true, 0), 0);
  assert.ok(getLedLitStrength(true, 3) > 0 && getLedLitStrength(true, 3) < 1);
  assert.equal(getLedLitStrength(true, 85), 1);
});

test('packLedColorsLinear reuses pre-allocated array and zeroes when off', () => {
  const frame: RgbColor[] = Array.from({ length: LED_RING_SLOT_COUNT }, (_, idx) =>
    idx % 2 === 0 ? { r: 255, g: 0, b: 0 } : { r: 0, g: 128, b: 255 }
  );
  const preallocated = Array.from(
    { length: LED_RING_SLOT_COUNT },
    () => new THREE.Color(0, 0, 0)
  );

  const out = packLedColorsLinear(frame, true, 100, preallocated);
  assert.equal(out, preallocated);
  assert.ok(out[0].r > 0.99 && out[0].g === 0 && out[0].b === 0);
  assert.ok(out[1].b > 0.99 && out[1].g > 0.2 && out[1].g < 0.25);

  packLedColorsLinear(frame, false, 100, preallocated);
  for (const c of preallocated) {
    assert.equal(c.r, 0);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
  }
});

test('computeRingBounceLight clamps bezel rim bounce and tracks chromatic tint', () => {
  const cobaltFrame: RgbColor[] = Array.from({ length: LED_RING_SLOT_COUNT }, () => ({
    r: 59,
    g: 91,
    b: 255,
  }));

  const offLight = computeRingBounceLight(cobaltFrame, false, 85);
  assert.equal(offLight.intensity, 0);

  const zeroBright = computeRingBounceLight(cobaltFrame, true, 0);
  assert.equal(zeroBright.intensity, 0);

  const lit = computeRingBounceLight(cobaltFrame, true, 100);
  assert.ok(lit.intensity > 0 && lit.intensity <= LED_RING_BOUNCE_MAX_INTENSITY);
  assert.ok(lit.b > lit.g && lit.g > lit.r);
  assert.equal(lit.b, 1);
});
