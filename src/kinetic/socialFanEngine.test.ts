import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCIAL_FAN_CARDS,
  SOCIAL_ACCOUNT_LINKS,
  INSTAGRAM_JOURNEY_HIGHLIGHT_URL,
  CREATOR_PROFILE_IMAGE_SRC,
  BUY_ME_A_COFFEE_URL,
  SOCIAL_JOURNEY_CAPTION,
  SOCIAL_FOOTER_START_POS,
  SOCIAL_FOOTER_END_POS,
  getSocialFanProgress,
  getSocialJourneyRevealProgress,
  getSocialFooterRevealProgress,
  computeSocialFanLayoutMetrics,
  computeSocialFanState,
} from './socialFanEngine';

test('SOCIAL_FAN_CARDS contains exactly 5 cards in strict creator-social-support order', () => {
  assert.equal(SOCIAL_FAN_CARDS.length, 5);
  assert.deepEqual(
    SOCIAL_FAN_CARDS.map((card) => card.id),
    ['profile', 'instagram', 'github', 'linkedin', 'buy-me-a-coffee']
  );
  assert.deepEqual(
    SOCIAL_FAN_CARDS.map((card) => card.indexLabel),
    ['01', '02', '03', '04', '05']
  );
});

test('Card 01 uses the real uploaded profile photo and THE BUILDER identity label', () => {
  const profile = SOCIAL_FAN_CARDS[0];
  assert.equal(profile.role, 'photography');
  assert.equal(profile.badgeLabel, 'THE BUILDER');
  assert.equal(profile.imageSrc, CREATOR_PROFILE_IMAGE_SRC);
  assert.equal(
    profile.imageSrc,
    '/assets/aistudio/Thoughtful_Mirror_Selfie_on_a_Patterned_Bed_b6d8f347.webp'
  );
});

test('Social cards 02-04 use verified external account URLs and required copy', () => {
  const instagram = SOCIAL_FAN_CARDS[1];
  assert.equal(instagram.href, 'https://www.instagram.com/_rajdeep.007_/');
  assert.equal(instagram.handle, '@_rajdeep.007_');
  assert.equal(
    instagram.description,
    'Build photos, speaker tests and workshop updates.'
  );

  const github = SOCIAL_FAN_CARDS[2];
  assert.equal(github.href, 'https://github.com/rajdeepbhattacharyya25-pixel');
  assert.equal(github.handle, '@rajdeepbhattacharyya25-pixel');
  assert.equal(
    github.description,
    'Explore the code, prototypes and experiments behind my projects.'
  );

  const linkedin = SOCIAL_FAN_CARDS[3];
  assert.equal(
    linkedin.href,
    'https://www.linkedin.com/in/rajdeep-bhattacharyya-497945371/'
  );
  assert.equal(
    linkedin.description,
    "Connect with me and see what I'm currently working on."
  );
});

test('Card 05 uses Buy Me a Coffee copy and live creator support URL', () => {
  const coffee = SOCIAL_FAN_CARDS[4];
  assert.equal(coffee.role, 'support');
  assert.equal(coffee.badgeLabel, 'SUPPORT THE BUILDER');
  assert.equal(coffee.title, 'Buy me a coffee.');
  assert.equal(
    coffee.description,
    'Your support helps me buy components, tools and materials for future builds.'
  );
  assert.equal(coffee.ctaLabel, 'Support My Work');
  assert.equal(coffee.href, 'https://buymeacoffee.com/rajdeep.bhattacharyya');
  assert.equal(coffee.href, BUY_ME_A_COFFEE_URL);
  assert.equal(SOCIAL_ACCOUNT_LINKS.buyMeACoffee, BUY_ME_A_COFFEE_URL);
  assert.equal(coffee.isExternal, true);
  assert.equal(coffee.isConfigured, true);
});

test('INSTAGRAM_JOURNEY_HIGHLIGHT_URL points to the full build story highlight', () => {
  assert.equal(
    INSTAGRAM_JOURNEY_HIGHLIGHT_URL,
    'https://www.instagram.com/stories/highlights/18103155317053800/'
  );
  assert.equal(
    SOCIAL_ACCOUNT_LINKS.instagramStoryHighlight,
    'https://www.instagram.com/stories/highlights/18103155317053800/'
  );
});

test('SOCIAL_JOURNEY_CAPTION preserves exact requested headline and sentence', () => {
  assert.equal(SOCIAL_JOURNEY_CAPTION.heading, 'FOLLOW MY JOURNEY.');
  assert.equal(
    SOCIAL_JOURNEY_CAPTION.subheading,
    "From experiments to finished creations. There's more to come."
  );
});

test('getSocialFanProgress (6.00..6.75) and getSocialJourneyRevealProgress (6.75..7.50) clamp cleanly into [0..1]', () => {
  assert.equal(getSocialFanProgress(5.2), 0);
  assert.equal(getSocialFanProgress(6.0), 0);
  assert.equal(getSocialFanProgress(6.375), 0.5);
  assert.equal(getSocialFanProgress(6.75), 1);
  assert.equal(getSocialFanProgress(7.5), 1);

  assert.equal(getSocialJourneyRevealProgress(6.0), 0);
  assert.equal(getSocialJourneyRevealProgress(6.75), 0);
  assert.equal(getSocialJourneyRevealProgress(7.125), 0.5);
  assert.equal(getSocialJourneyRevealProgress(7.5), 1);
  assert.equal(getSocialJourneyRevealProgress(8.0), 1);
});

test('Stage 01 stacked state places Card 01 upright in front with Cards 02-05 stacked behind at positive Z', () => {
  const state = computeSocialFanState(6.0, 1440, 900);
  assert.equal(state.stage, 'stacked');
  assert.equal(state.cards.length, 5);

  const [c1, c2, c3, c4, c5] = state.cards;
  assert.equal(c1.x, 0);
  assert.equal(c1.rotateZ, 0);
  assert.ok(c1.z > c2.z && c2.z > c3.z && c3.z > c4.z && c4.z > c5.z);
  assert.ok(c5.z > 0, `Expected Card 05 stacked z > 0, got ${c5.z}`);
  assert.ok(c1.zIndex > c2.zIndex && c2.zIndex > c3.zIndex);
});

test('Stage 04 settled fan spreads all 5 cards into an ordered 3D arc inside desktop & ultrawide viewports with positive Z', () => {
  for (const [w, h] of [
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [3440, 1440],
  ]) {
    const state = computeSocialFanState(6.75, w, h);
    assert.equal(state.stage, 'fanned');
    assert.equal(state.metrics.mode, 'desktop-fan');
    const xs = state.cards.map((c) => c.x);
    assert.ok(xs[0] < xs[1] && xs[1] < xs[2] && xs[2] < xs[3] && xs[3] < xs[4]);

    // Strictly positive Z so outer Card 05 never drops behind z=0 preserve-3d wrapper hit-test
    for (const card of state.cards) {
      assert.ok(card.z > 0, `Expected card ${card.id} z > 0, got ${card.z} at ${w}x${h}`);
    }

    // Neighboring cards clear each other cleanly so text/CTAs are never obscured
    assert.ok(
      state.metrics.spreadStep > state.metrics.cardWidth,
      `Expected spreadStep (${state.metrics.spreadStep}) > cardWidth (${state.metrics.cardWidth})`
    );

    // Outer wing edges stay inside viewport width
    const halfSpan = Math.abs(xs[0]) + state.metrics.cardWidth * 0.5;
    assert.ok(halfSpan < w * 0.5, `Expected ${halfSpan} < ${w * 0.5} at ${w}x${h}`);

    // Outer cards curve downward relative to center card 03
    assert.ok(state.cards[0].y > state.cards[2].y);
    assert.ok(state.cards[4].y > state.cards[2].y);
    assert.ok(state.cards[0].rotateZ < 0 && state.cards[4].rotateZ > 0);
    assert.ok(state.cards[0].rotateY > 0 && state.cards[4].rotateY < 0);
  }
});

test('Fan-out transitions smoothly through Stage 02/03, reverses deterministically, keeps positive Z on tablet/mobile, and respects reduced motion', () => {
  const forwardMid = computeSocialFanState(6.35, 1440, 900);
  assert.equal(forwardMid.stage, 'fanning');
  const reverseMid = computeSocialFanState(6.35, 1440, 900);
  assert.deepEqual(forwardMid, reverseMid);

  const early = computeSocialFanState(6.15, 1440, 900);
  assert.equal(early.stage, 'separating');
  assert.ok(Math.abs(early.cards[0].x) < Math.abs(forwardMid.cards[0].x));

  const reduced = computeSocialFanState(6.75, 1440, 900, true);
  for (const card of reduced.cards) {
    assert.equal(card.rotateX, 0);
    assert.equal(card.rotateY, 0);
  }

  const tabletMetrics = computeSocialFanLayoutMetrics(768, 1024);
  assert.equal(tabletMetrics.mode, 'tablet-fan');
  const tabletState = computeSocialFanState(6.75, 768, 1024);
  assert.ok(tabletMetrics.spreadStep > tabletMetrics.cardWidth);
  for (const card of tabletState.cards) {
    assert.ok(Math.abs(card.x) + tabletMetrics.cardWidth * 0.5 < 768 * 0.5);
    assert.ok(card.z > 0, `Expected tablet card ${card.id} z > 0, got ${card.z}`);
  }

  const mobileMetrics = computeSocialFanLayoutMetrics(390, 844);
  assert.equal(mobileMetrics.mode, 'mobile-fan');
  assert.ok(mobileMetrics.cardWidth <= 176);
  const mobileState = computeSocialFanState(6.75, 390, 844);
  for (const card of mobileState.cards) {
    assert.ok(Math.abs(card.x) + mobileMetrics.cardWidth * 0.5 < 390 * 0.5);
    assert.ok(card.z > 0, `Expected mobile card ${card.id} z > 0, got ${card.z}`);
  }
  assert.ok(mobileState.cards[0].y < mobileState.cards[1].y);
  assert.ok(mobileState.cards[1].y < mobileState.cards[3].y);
});

test('Two-beat finale fans cards first (6.00..6.75) then sweeps FOLLOW MY JOURNEY text (6.75..7.50)', () => {
  const stacked = computeSocialFanState(6.0, 1440, 900);
  assert.equal(stacked.captionOpacity, 0);
  assert.equal(stacked.captionHeadingReveal, 0);
  assert.equal(stacked.captionSubReveal, 0);
  assert.equal(stacked.supportEmphasis, 0);

  // Beat 1 complete at pos = 6.75: cards 100% fanned, caption still waiting for beat 2 scroll
  const beat1End = computeSocialFanState(6.75, 1440, 900);
  assert.equal(beat1End.fanProgress, 1);
  assert.equal(beat1End.stage, 'fanned');
  assert.equal(beat1End.supportEmphasis, 1);
  assert.equal(beat1End.captionOpacity, 0);
  assert.equal(beat1End.captionHeadingReveal, 0);
  assert.equal(beat1End.captionSubReveal, 0);

  // Mid Beat 2 at pos = 7.125: heading sweeps via Cobalt reveal while subheading catches up
  const midReveal = computeSocialFanState(7.125, 1440, 900);
  assert.equal(midReveal.captionOpacity, 1);
  assert.ok(midReveal.captionHeadingReveal > 0.6 && midReveal.captionHeadingReveal < 1);
  assert.ok(midReveal.captionSubReveal > 0 && midReveal.captionSubReveal < 0.5);

  // Beat 2 complete at pos = 7.50
  const settled = computeSocialFanState(7.5, 1440, 900);
  assert.equal(settled.captionOpacity, 1);
  assert.equal(settled.captionTranslateY, 0);
  assert.equal(settled.captionHeadingReveal, 1);
  assert.equal(settled.captionSubReveal, 1);
  assert.equal(settled.supportEmphasis, 1);
  assert.equal(settled.footerOpacity, 1);
});

test('computeSocialCardHoverTransform lifts/tilts only when fanned & interactive and respects reduced motion', async () => {
  const { computeSocialCardHoverTransform } = await import('./socialFanEngine');

  const unhovered = computeSocialCardHoverTransform(0.3, -0.2, false, 1, false);
  assert.equal(unhovered.isActive, false);
  assert.equal(unhovered.liftY, 0);
  assert.equal(unhovered.scale, 1);

  const stackedHover = computeSocialCardHoverTransform(0.3, -0.2, true, 0.1, false);
  assert.equal(stackedHover.isActive, false);
  assert.equal(stackedHover.liftY, 0);

  const reducedHover = computeSocialCardHoverTransform(0.3, -0.2, true, 1, true);
  assert.equal(reducedHover.isActive, false);
  assert.equal(reducedHover.tiltX, 0);

  const activeHover = computeSocialCardHoverTransform(0.5, -0.5, true, 1, false);
  assert.equal(activeHover.isActive, true);
  assert.ok(activeHover.liftY < 0);
  assert.ok(activeHover.scale > 1);
  assert.ok(activeHover.tiltY > 0 && activeHover.tiltX > 0);
});

test('computeCobaltShutterState prevents pre-reveal ghosting and synchronizes shutter peel with clip-path unclip', async () => {
  const { computeCobaltShutterState } = await import('./socialFanEngine');

  const unstarted = computeCobaltShutterState(0, false);
  assert.equal(unstarted.textOpacity, 0);
  assert.equal(unstarted.clipRightPercent, 100);
  assert.equal(unstarted.showBar, false);

  // Phase A: beam builds from left while text remains 100% hidden
  const phaseA = computeCobaltShutterState(0.15, false);
  assert.equal(phaseA.barOrigin, 'left center');
  assert.equal(phaseA.showBar, true);
  assert.ok(phaseA.barScaleX > 0.3 && phaseA.barScaleX <= 1);
  assert.equal(phaseA.clipRightPercent, 100);
  assert.equal(phaseA.textOpacity, 0);

  // Phase B: shutter peels right in exact 1:1 lockstep with clipRightPercent === barScaleX * 100
  const phaseB = computeCobaltShutterState(0.65, false);
  assert.equal(phaseB.barOrigin, 'right center');
  assert.equal(phaseB.showBar, true);
  assert.equal(phaseB.textOpacity, 1);
  assert.ok(
    Math.abs(phaseB.clipRightPercent - phaseB.barScaleX * 100) < 0.05,
    `Expected clipRightPercent (${phaseB.clipRightPercent}) to match barScaleX*100 (${phaseB.barScaleX * 100})`
  );

  const settled = computeCobaltShutterState(1, false);
  assert.equal(settled.isComplete, true);
  assert.equal(settled.showBar, false);
  assert.equal(settled.clipRightPercent, 0);
  assert.equal(settled.textOpacity, 1);
  assert.equal(settled.liftYPx, 0);
});

test('getSocialFooterRevealProgress and footerScrollProgress clamp cleanly across [7.50..8.10]', () => {
  assert.equal(SOCIAL_FOOTER_START_POS, 7.5);
  assert.equal(SOCIAL_FOOTER_END_POS, 8.1);
  assert.equal(getSocialFooterRevealProgress(7.0), 0);
  assert.equal(getSocialFooterRevealProgress(7.5), 0);
  assert.ok(Math.abs(getSocialFooterRevealProgress(7.8) - 0.5) < 0.001);
  assert.equal(getSocialFooterRevealProgress(8.1), 1);
  assert.equal(getSocialFooterRevealProgress(8.5), 1);

  const atCaptionEnd = computeSocialFanState(7.5, 1440, 900);
  assert.equal(atCaptionEnd.footerScrollProgress, 0);
  assert.equal(atCaptionEnd.fanProgress, 1);
  assert.equal(atCaptionEnd.captionHeadingReveal, 1);

  const atFooterMid = computeSocialFanState(7.8, 1440, 900);
  assert.ok(atFooterMid.footerScrollProgress > 0.45 && atFooterMid.footerScrollProgress < 0.55);

  const atFooterEnd = computeSocialFanState(8.1, 1440, 900);
  assert.equal(atFooterEnd.footerScrollProgress, 1);
  assert.equal(atFooterEnd.captionOpacity, 1);
});
