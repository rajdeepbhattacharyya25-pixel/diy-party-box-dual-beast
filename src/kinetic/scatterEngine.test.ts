import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeHeadline,
  computeLetterScatterSpec,
  getSceneOneLetterTransform,
  getSceneTwoLetterTransform,
  applyScrollDelta,
  getActiveScenePhase,
  ZENIN_SCENES,
  getMultiSceneLetterTransform,
} from './scatterEngine';

test('tokenizeHeadline splits headline into words and sequential character tokens', () => {
  const { words, totalChars } = tokenizeHeadline('GRAVITY HOLDS');
  assert.equal(words.length, 2);
  assert.equal(totalChars, 12);
  assert.equal(words[0].word, 'GRAVITY');
  assert.equal(words[0].letters.length, 7);
  assert.equal(words[1].letters[0].char, 'H');
  assert.equal(words[1].letters[0].globalIndex, 7);
  assert.equal(words[0].letters[0].normalizedX, -1);
  assert.equal(words[1].letters[4].normalizedX, 1);
});

test('computeLetterScatterSpec guarantees every letter has a strong upward trajectory (targetY < -400)', () => {
  const { words } = tokenizeHeadline('GRAVITY HOLDS EVERY LETTER STILL');
  const allLetters = words.flatMap((w) => w.letters);
  assert.ok(allLetters.length > 15);

  for (const token of allLetters) {
    const spec = computeLetterScatterSpec(token);
    assert.ok(
      spec.targetY <= -460,
      `Expected letter ${token.char} at index ${token.globalIndex} to fly upward (targetY <= -460), got ${spec.targetY}`
    );
    assert.notEqual(
      spec.targetRotateDeg,
      0,
      'Expected non-zero rotational spin during scatter'
    );
    assert.ok(spec.endProgress > spec.startProgress);
  }
});

test('Scene One letters start locked at identity (progress=0), scatter upward mid-scroll (progress=0.45), and clear stage at progress=1', () => {
  const { words } = tokenizeHeadline('SILENCE BREAKS');
  const firstLetter = words[0].letters[0];
  const spec = computeLetterScatterSpec(firstLetter);

  const atZero = getSceneOneLetterTransform(spec, 0);
  assert.equal(atZero.x, 0);
  assert.equal(atZero.y, 0);
  assert.equal(atZero.rotateDeg, 0);
  assert.equal(atZero.scale, 1);
  assert.equal(atZero.opacity, 1);

  const atMid = getSceneOneLetterTransform(spec, 0.45);
  assert.ok(
    atMid.y < -100,
    `Expected Scene One letter to fly upward (y < -100) at mid-scroll, got y=${atMid.y}`
  );
  assert.ok(
    atMid.opacity > 0,
    'Expected letter to remain visible during mid-scroll scatter'
  );

  const atEnd = getSceneOneLetterTransform(spec, 1);
  assert.equal(atEnd.y, spec.targetY);
  assert.equal(atEnd.opacity, 0);
});

test('Scene Two letters start hidden below at progress=0 and lock into identity at progress=1', () => {
  const { words } = tokenizeHeadline('UNTIL MOTION SETS THEM FREE');
  const letter = words[1].letters[2];
  const spec = computeLetterScatterSpec(letter);

  const atZero = getSceneTwoLetterTransform(spec, 0);
  assert.equal(atZero.opacity, 0);
  assert.ok(atZero.y > 100);

  const atMid = getSceneTwoLetterTransform(spec, 0.65);
  assert.ok(atMid.y > 0 && atMid.y < atZero.y);
  assert.ok(atMid.opacity > 0);

  const atOne = getSceneTwoLetterTransform(spec, 1);
  assert.equal(atOne.x, 0);
  assert.equal(atOne.y, 0);
  assert.equal(atOne.rotateDeg, 0);
  assert.equal(atOne.scale, 1);
  assert.equal(atOne.opacity, 1);
});

test('applyScrollDelta and getActiveScenePhase clamp and classify scroll progress accurately', () => {
  assert.equal(applyScrollDelta(0, -500), 0);
  const mid = applyScrollDelta(0, 500);
  assert.ok(mid > 0.3 && mid < 0.6);
  assert.equal(getActiveScenePhase(0), 'scene-1');
  assert.equal(getActiveScenePhase(mid), 'scattering');
  assert.equal(applyScrollDelta(mid, 2000), 1);
  assert.equal(getActiveScenePhase(1), 'scene-2');
});

test('ZENIN_SCENES and getMultiSceneLetterTransform drive upward scatter from Scene 1 (DIY Party Box) to Scene 2 (A Story In Every Piece.)', () => {
  assert.equal(ZENIN_SCENES.length, 6);
  assert.equal(ZENIN_SCENES[0].headline, 'DIY Party Box');
  assert.equal(ZENIN_SCENES[1].headline, 'A Story In Every Piece.');
  assert.equal(ZENIN_SCENES[5].id, 'scene-06-gallery');

  const s1Tokens = tokenizeHeadline(ZENIN_SCENES[0].headline);
  const s1Spec = computeLetterScatterSpec(s1Tokens.words[0].letters[0]);

  const s2Tokens = tokenizeHeadline(ZENIN_SCENES[1].headline);
  const s2Spec = computeLetterScatterSpec(s2Tokens.words[0].letters[0]);

  // At timelinePos = 0 (Scene 1 locked)
  const s1At0 = getMultiSceneLetterTransform(s1Spec, 0, 0);
  assert.equal(s1At0.y, 0);
  assert.equal(s1At0.opacity, 1);

  // At timelinePos = 0.45 (scrolling from Scene 1 to Scene 2: Scene 1 letters scatter upward)
  const s1AtMid = getMultiSceneLetterTransform(s1Spec, 0, 0.45);
  assert.ok(s1AtMid.y < -100, 'Expected Scene 1 letter to scatter upward');

  // At timelinePos = 1.0 (Scene 2 locked)
  const s2At1 = getMultiSceneLetterTransform(s2Spec, 1, 1);
  assert.equal(s2At1.x, 0);
  assert.equal(s2At1.y, 0);
  assert.equal(s2At1.opacity, 1);
});


