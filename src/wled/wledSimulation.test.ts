import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WLED_EFFECTS,
  WLED_PALETTES,
  WLED_QUICK_COLORS,
  applySpeakerPatch,
  createInitialWledState,
  parseHexColor,
  rgbToHex,
  setSyncMode,
} from './wledSimulation';

test('catalog counts match simplified WLED specification', () => {
  assert.equal(WLED_QUICK_COLORS.length, 8);
  assert.equal(WLED_PALETTES.length, 8);
  assert.equal(WLED_EFFECTS.length, 10);
});

test('color helpers convert RGB and HEX deterministically', () => {
  assert.equal(rgbToHex({ r: 59, g: 91, b: 255 }), '#3B5BFF');
  assert.deepEqual(parseHexColor('#3b5bff'), { r: 59, g: 91, b: 255 });
  assert.deepEqual(parseHexColor('#0af'), { r: 0, g: 170, b: 255 });
  assert.equal(parseHexColor('invalid'), null);
});

test('individual edits only mutate target speaker when sync is disabled', () => {
  const initial = createInitialWledState();
  const updated = applySpeakerPatch(initial, 'left', {
    effectId: 'meteor',
    brightness: 45,
    rgb: { r: 255, g: 42, b: 60 },
  });

  assert.equal(updated.speakers.left.effectId, 'meteor');
  assert.equal(updated.speakers.left.brightness, 45);
  assert.equal(updated.speakers.left.colorHex, '#FF2A3C');

  assert.equal(updated.speakers.right.effectId, 'chase');
  assert.equal(updated.speakers.right.brightness, 74);
  assert.equal(updated.speakers.right.colorHex, '#00A3FF');
});

test('enabling SYNC copies active speaker lighting config to both L & R without changing speaker ids', () => {
  const initial = createInitialWledState();
  const edited = {
    ...applySpeakerPatch(initial, 'right', {
      effectId: 'rainbow',
      paletteId: 'neon',
      brightness: 91,
      rgb: { r: 155, g: 48, b: 255 },
    }),
    activeSpeakerId: 'right' as const,
  };

  const synced = setSyncMode(edited, true);
  assert.equal(synced.syncEnabled, true);
  assert.equal(synced.speakers.left.id, 'left');
  assert.equal(synced.speakers.left.code, 'L');
  assert.equal(synced.speakers.right.id, 'right');
  assert.equal(synced.speakers.right.code, 'R');
  assert.equal(synced.speakers.left.effectId, 'rainbow');
  assert.equal(synced.speakers.left.paletteId, 'neon');
  assert.equal(synced.speakers.left.brightness, 91);
  assert.equal(synced.speakers.left.colorHex, '#9B30FF');

  // When SYNC is turned OFF, both keep the shared settings until edited independently
  const unsynced = setSyncMode(synced, false);
  assert.equal(unsynced.syncEnabled, false);
  assert.equal(unsynced.speakers.left.effectId, 'rainbow');

  const diverged = applySpeakerPatch(unsynced, 'left', { effectId: 'solid' });
  assert.equal(diverged.speakers.left.effectId, 'solid');
  assert.equal(diverged.speakers.right.effectId, 'rainbow');
});

test('Stereo SYNC broadcasts edits to both L & R in frame lockstep and allows clean independent divergence when disabled', async () => {
  const { computeLedRingFrame } = await import('./ledEffectsEngine');

  const base = createInitialWledState();
  const synced = setSyncMode(base, true);

  // Edits applied while SYNC is ON update both L and R across every parameter
  const editedSynced = applySpeakerPatch(synced, 'left', {
    rgb: { r: 255, g: 159, b: 28 },
    paletteId: 'sunset',
    effectId: 'meteor',
    speed: 78,
    intensity: 88,
    brightness: 65,
  });

  assert.equal(editedSynced.speakers.left.colorHex, '#FF9F1C');
  assert.equal(editedSynced.speakers.right.colorHex, '#FF9F1C');
  assert.equal(editedSynced.speakers.left.effectId, 'meteor');
  assert.equal(editedSynced.speakers.right.effectId, 'meteor');
  assert.equal(editedSynced.speakers.left.brightness, 65);
  assert.equal(editedSynced.speakers.right.brightness, 65);

  // Both 16-LED frames evaluate identically at the same elapsed time
  const leftFrameSync = computeLedRingFrame(editedSynced.speakers.left, 1.25);
  const rightFrameSync = computeLedRingFrame(editedSynced.speakers.right, 1.25);
  assert.deepEqual(leftFrameSync, rightFrameSync);

  // Power toggle under SYNC updates both speakers together
  const poweredOffSync = applySpeakerPatch(editedSynced, 'right', { powered: false });
  assert.equal(poweredOffSync.speakers.left.powered, false);
  assert.equal(poweredOffSync.speakers.right.powered, false);

  const poweredBackOnSync = applySpeakerPatch(poweredOffSync, 'left', { powered: true });
  assert.equal(poweredBackOnSync.speakers.left.powered, true);
  assert.equal(poweredBackOnSync.speakers.right.powered, true);

  // Disabling SYNC retains last shared values, then allows RIGHT to diverge without affecting LEFT
  const unsynced = setSyncMode(poweredBackOnSync, false);
  assert.equal(unsynced.speakers.left.colorHex, '#FF9F1C');
  assert.equal(unsynced.speakers.right.colorHex, '#FF9F1C');

  const divergedRight = applySpeakerPatch(unsynced, 'right', {
    rgb: { r: 0, g: 240, b: 255 },
    effectId: 'chase',
    brightness: 40,
  });

  assert.equal(divergedRight.speakers.left.colorHex, '#FF9F1C');
  assert.equal(divergedRight.speakers.left.effectId, 'meteor');
  assert.equal(divergedRight.speakers.left.brightness, 65);

  assert.equal(divergedRight.speakers.right.colorHex, '#00F0FF');
  assert.equal(divergedRight.speakers.right.effectId, 'chase');
  assert.equal(divergedRight.speakers.right.brightness, 40);
});
