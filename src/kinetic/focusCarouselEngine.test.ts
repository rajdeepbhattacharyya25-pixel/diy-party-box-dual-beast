import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEAKER_GALLERY_ITEMS,
  clampCarouselIndex,
  linearCarouselOffset,
  wrapCarouselIndex,
  circularCarouselOffset,
  computeCarouselSlot,
  computeCarouselFitScale,
  DEFAULT_FOCUS_CAROUSEL_CONFIG,
} from './focusCarouselEngine';

test('SPEAKER_GALLERY_ITEMS contains all 10 real speaker assets (7 images and 3 videos)', () => {
  assert.equal(SPEAKER_GALLERY_ITEMS.length, 10);
  const images = SPEAKER_GALLERY_ITEMS.filter((item) => item.kind === 'image');
  const videos = SPEAKER_GALLERY_ITEMS.filter((item) => item.kind === 'video');
  assert.equal(images.length, 7);
  assert.equal(videos.length, 3);

  const uniqueSources = new Set(SPEAKER_GALLERY_ITEMS.map((item) => item.src));
  assert.equal(uniqueSources.size, 10);

  for (const video of videos) {
    assert.ok(video.src.endsWith('.mp4'), `Expected mp4 video path, got ${video.src}`);
  }
});

test('wrapCarouselIndex and circularCarouselOffset support seamless infinite loop wrapping in both directions', () => {
  assert.equal(wrapCarouselIndex(0, 10), 0);
  assert.equal(wrapCarouselIndex(-1, 10), 9);
  assert.equal(wrapCarouselIndex(-11, 10), 9);
  assert.equal(wrapCarouselIndex(10, 10), 0);
  assert.equal(wrapCarouselIndex(23, 10), 3);

  // At pos=0, card 9 sits immediately to the left (-1) and card 1 sits to the right (+1)
  assert.equal(circularCarouselOffset(0, 0, 10), 0);
  assert.equal(circularCarouselOffset(1, 0, 10), 1);
  assert.equal(circularCarouselOffset(9, 0, 10), -1);
  assert.equal(circularCarouselOffset(8, 0, 10), -2);

  // At pos=9, card 0 sits immediately to the right (+1)
  assert.equal(circularCarouselOffset(0, 9, 10), 1);
  // Across multiple full revolutions (e.g. pos=-10.2 or pos=29.8), offsets remain continuous
  assert.equal(Number(circularCarouselOffset(0, 9.9, 10).toFixed(2)), 0.1);
  assert.equal(Number(circularCarouselOffset(9, -0.1, 10).toFixed(2)), -0.9);
  assert.equal(Number(circularCarouselOffset(2, 22, 10).toFixed(2)), 0);
});

test('clampCarouselIndex and linearCarouselOffset preserve bounded helpers when requested', () => {
  assert.equal(clampCarouselIndex(0, 10), 0);
  assert.equal(clampCarouselIndex(-1, 10), 0);
  assert.equal(clampCarouselIndex(-5, 10), 0);
  assert.equal(clampCarouselIndex(9, 10), 9);
  assert.equal(clampCarouselIndex(10, 10), 9);
  assert.equal(clampCarouselIndex(15, 10), 9);

  assert.equal(linearCarouselOffset(0, 0), 0);
  assert.equal(linearCarouselOffset(1, 0), 1);
  assert.equal(linearCarouselOffset(9, 0), 9);
  assert.equal(linearCarouselOffset(0, 9), -9);
});

test('computeCarouselSlot keeps focused card in full color (grey=0, blur=0) and applies grayscale=1 and blur>0 to side cards', () => {
  const center = computeCarouselSlot(0, DEFAULT_FOCUS_CAROUSEL_CONFIG);
  assert.equal(center.x, 0);
  assert.equal(center.size, 1);
  assert.equal(center.alpha, 1);
  assert.equal(center.grey, 0);
  assert.equal(center.blur, 0);

  const right1 = computeCarouselSlot(1, DEFAULT_FOCUS_CAROUSEL_CONFIG);
  const left1 = computeCarouselSlot(-1, DEFAULT_FOCUS_CAROUSEL_CONFIG);
  assert.equal(right1.size, DEFAULT_FOCUS_CAROUSEL_CONFIG.sideSize);
  assert.equal(left1.size, DEFAULT_FOCUS_CAROUSEL_CONFIG.sideSize);
  assert.equal(right1.x, -left1.x);
  assert.equal(right1.grey, 1);
  assert.equal(left1.grey, 1);
  assert.ok(right1.blur > 1.5, 'Expected side cards to be subtly blurred');

  const right2 = computeCarouselSlot(2, DEFAULT_FOCUS_CAROUSEL_CONFIG);
  assert.ok(right2.x > right1.x);
  assert.ok(right2.blur > right1.blur);
  assert.ok(right2.alpha < right1.alpha);

  const far = computeCarouselSlot(6, DEFAULT_FOCUS_CAROUSEL_CONFIG);
  assert.equal(far.alpha, 0);
});

test('computeCarouselFitScale scales down smoothly on narrow or short viewports and caps at 1 on desktop', () => {
  assert.equal(computeCarouselFitScale(1440, 320, 720, 0.75), 1);
  const shortLaptopScale = computeCarouselFitScale(1280, 320, 420, 0.75);
  assert.ok(shortLaptopScale < 0.85 && shortLaptopScale >= 0.42);
  const mobileScale = computeCarouselFitScale(390, 320, 680, 0.75);
  assert.ok(mobileScale >= 0.42 && mobileScale < 0.65);
});
