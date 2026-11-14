import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LED_RING_COUNT,
  computeLedRingFrame,
  samplePaletteColor,
} from './ledEffectsEngine';
import {
  WLED_EFFECTS,
  WLED_PALETTES,
  createInitialWledState,
  hsvToRgb,
  rgbToHsv,
  wheelOffsetToRgb,
} from './wledSimulation';

test('HSV/RGB conversions and wheel polar coordinates round-trip accurately', () => {
  const cobalt = { r: 59, g: 91, b: 255 };
  const hsv = rgbToHsv(cobalt);
  const back = hsvToRgb(hsv);
  assert.ok(Math.abs(back.r - cobalt.r) <= 1);
  assert.ok(Math.abs(back.g - cobalt.g) <= 1);
  assert.ok(Math.abs(back.b - cobalt.b) <= 1);

  const centerWhite = wheelOffsetToRgb(0, 0, 100, 1);
  assert.deepEqual(centerWhite, { r: 255, g: 255, b: 255 });

  const redRim = wheelOffsetToRgb(100, 0, 100, 1);
  assert.deepEqual(redRim, { r: 255, g: 0, b: 0 });
});

test('samplePaletteColor smoothly samples every curated palette', () => {
  for (const palette of WLED_PALETTES) {
    const start = samplePaletteColor(palette.id, 0);
    const mid = samplePaletteColor(palette.id, 0.5);
    assert.ok(start.r >= 0 && start.r <= 255);
    assert.ok(mid.g >= 0 && mid.g <= 255);
  }
});

test('computeLedRingFrame outputs 16 pixels and enforces power & LED brightness scaling', () => {
  const state = createInitialWledState();
  const baseSpeaker = state.speakers.left;

  const offFrame = computeLedRingFrame({ ...baseSpeaker, powered: false }, 1.2);
  assert.equal(offFrame.length, LED_RING_COUNT);
  assert.ok(offFrame.every((p) => p.r === 0 && p.g === 0 && p.b === 0));

  const zeroBright = computeLedRingFrame({ ...baseSpeaker, brightness: 0 }, 1.2);
  assert.ok(zeroBright.every((p) => p.r === 0 && p.g === 0 && p.b === 0));

  const halfSolid = computeLedRingFrame(
    { ...baseSpeaker, effectId: 'solid', brightness: 50, rgb: { r: 200, g: 100, b: 250 } },
    0.5
  );
  assert.deepEqual(halfSolid[0], { r: 100, g: 50, b: 125 });
  assert.deepEqual(halfSolid[15], { r: 100, g: 50, b: 125 });
});

test('all 10 effect modes evaluate without NaN and dynamic modes vary spatially/temporally', () => {
  const state = createInitialWledState();
  const speaker = state.speakers.left;

  for (const fx of WLED_EFFECTS) {
    const frameA = computeLedRingFrame({ ...speaker, effectId: fx.id }, 0.1);
    const frameB = computeLedRingFrame({ ...speaker, effectId: fx.id }, 0.55);
    const frameC = computeLedRingFrame({ ...speaker, effectId: fx.id }, 1.15);
    assert.equal(frameA.length, 16);
    assert.equal(frameB.length, 16);
    for (const px of [...frameA, ...frameB, ...frameC]) {
      assert.ok(Number.isFinite(px.r) && px.r >= 0 && px.r <= 255);
      assert.ok(Number.isFinite(px.g) && px.g >= 0 && px.g <= 255);
      assert.ok(Number.isFinite(px.b) && px.b >= 0 && px.b <= 255);
    }
    if (fx.id !== 'solid') {
      const diffAB = frameA.some(
        (px, i) =>
          px.r !== frameB[i].r || px.g !== frameB[i].g || px.b !== frameB[i].b
      );
      const diffAC = frameA.some(
        (px, i) =>
          px.r !== frameC[i].r || px.g !== frameC[i].g || px.b !== frameC[i].b
      );
      assert.equal(diffAB || diffAC, true, `Effect ${fx.id} should animate over time`);
    }
  }
});
