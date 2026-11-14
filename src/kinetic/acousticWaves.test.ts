import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ACOUSTIC_RIBBONS,
  DEFAULT_TOPO_LOOPS,
  applyCursorWaveForce,
  createInitialCursorWaveState,
  evaluateAcousticRibbonPoints,
  evaluateTopoLoopPoints,
  stepCursorWaveState,
} from './acousticWaves';

test('stepCursorWaveState smoothly tracks pointer targets and computes directional wake velocity', () => {
  let state = createInitialCursorWaveState(1920, 1080);
  assert.equal(state.energy, 0);

  state = { ...state, hasPointer: true, targetX: 980, targetY: 520 };
  for (let i = 0; i < 6; i++) {
    state = stepCursorWaveState(state, 0.016, true);
  }

  assert.ok(state.x > 960 && state.x < 980);
  assert.ok(state.y > 520 && state.y < 540);
  assert.ok(state.vx > 0);
  assert.ok(state.energy > 0.35);

  const idleAfter = stepCursorWaveState({ ...state, hasPointer: false }, 0.5, false);
  assert.ok(idleAfter.energy < state.energy);
});

test('applyCursorWaveForce radially repels nearby vertices away from cursor and leaves distant points untouched', () => {
  const activeCursor = {
    targetX: 700,
    targetY: 400,
    x: 700,
    y: 400,
    vx: 120,
    vy: -40,
    energy: 0.9,
    hasPointer: true,
  };

  // Point slightly right and below cursor should be pushed further right and down
  const near = applyCursorWaveForce(755, 445, activeCursor, 1.2, 260, 1.0);
  assert.ok(near.x > 755);
  assert.ok(near.y > 445);

  // Far corner point beyond influence radius stays unchanged
  const far = applyCursorWaveForce(50, 50, activeCursor, 1.2, 260, 1.0);
  assert.equal(far.x, 50);
  assert.equal(far.y, 50);
});

test('evaluateAcousticRibbonPoints & evaluateTopoLoopPoints produce organic time-varying curves sensitive to cursor motion', () => {
  const resting = createInitialCursorWaveState(1440, 900);
  const active = {
    ...resting,
    hasPointer: true,
    energy: 0.95,
    x: 720,
    y: 450,
    vx: 180,
    vy: 20,
  };

  const ribbonT0 = evaluateAcousticRibbonPoints(
    DEFAULT_ACOUSTIC_RIBBONS[2],
    1440,
    900,
    0.0,
    2.2,
    resting
  );
  const ribbonT2 = evaluateAcousticRibbonPoints(
    DEFAULT_ACOUSTIC_RIBBONS[2],
    1440,
    900,
    2.5,
    2.2,
    resting
  );
  const ribbonCursor = evaluateAcousticRibbonPoints(
    DEFAULT_ACOUSTIC_RIBBONS[2],
    1440,
    900,
    2.5,
    2.2,
    active
  );

  assert.equal(ribbonT0.length, 65);
  assert.notDeepEqual(ribbonT0[32], ribbonT2[32]);
  assert.notDeepEqual(ribbonT2[32], ribbonCursor[32]);

  const loopA = evaluateTopoLoopPoints(DEFAULT_TOPO_LOOPS[0], 1440, 900, 0.0, 2.0, resting);
  const loopB = evaluateTopoLoopPoints(DEFAULT_TOPO_LOOPS[0], 1440, 900, 3.0, 2.0, resting);
  assert.equal(loopA.length, 56);
  assert.notDeepEqual(loopA[10], loopB[10]);
});
