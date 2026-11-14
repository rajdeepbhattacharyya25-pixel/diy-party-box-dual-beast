import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLLAGE_BACKGROUND_NOTES,
  COLLAGE_CLOSING_STATEMENT,
  COLLAGE_PART_ITEMS,
  CORE_PRELOAD_IMAGES,
  SECONDARY_WARMUP_IMAGES,
  getPreloaderDisplayState,
  getChapterBackgroundStyle,
  getSignatureRevealState,
  getContinuousSpeakerZoomState,
  getCustomSignatureProgress,
  getCollageBackgroundNoteTransform,
  getCollageCanvasContainerState,
  getCollageClosingStatementState,
  getDesignedIn3DRevealState,
  getEditorialCollageItemTransform,
  getOpposingSplitState,
  getSplitScreenStageState,
  SPEAKER_COMPONENTS_USED,
  SPLIT_REVEAL_PHOTO_SRC,
  projectSpeaker45OutlinePoint,
  getAdaptive3DCameraConfig,
  getMobilePerformanceProfile,
  shouldInnerScrollConsumeSwipe,
  computeTouchReleaseMomentumTarget,
  getAdjacentMobileWaypoint,
  getMobileChapterIndex,
} from './editorialStages';

test('getPreloaderDisplayState enforces minDisplayMs and reaches 100% cleanly or at safety cap', () => {
  const mid = getPreloaderDisplayState(5, 10, 600, 1150, 4500);
  assert.equal(mid.isComplete, false);
  assert.ok(mid.percent >= 45 && mid.percent <= 55);
  assert.match(mid.formattedPercent, /^\d{3}%$/);

  const loadedEarly = getPreloaderDisplayState(10, 10, 500, 1150, 4500);
  assert.equal(loadedEarly.isComplete, false);
  assert.ok(loadedEarly.percent < 100);

  const ready = getPreloaderDisplayState(10, 10, 1200, 1150, 4500);
  assert.equal(ready.isComplete, true);
  assert.equal(ready.percent, 100);
  assert.equal(ready.formattedPercent, '100%');

  const capHit = getPreloaderDisplayState(2, 10, 4600, 1150, 4500);
  assert.equal(capHit.isComplete, true);
  assert.equal(capHit.percent, 100);
});

test('getChapterBackgroundStyle smoothly transitions Obsidian -> Midnight Cobalt -> Gradual Ice Paper -> Dark Stereo Finale', () => {
  const s0 = getChapterBackgroundStyle(0);
  assert.equal(s0.backgroundColor, '#000000');
  assert.equal(s0.isLightSurface, false);
  assert.equal(s0.inkColor, '#FFFFFF');

  const s1 = getChapterBackgroundStyle(1);
  assert.equal(s1.backgroundColor, '#080c1e');
  assert.equal(s1.isLightSurface, false);

  // At 1.55 (during speaker exit & lead picture diagonal entry), background remains dark Indigo/Cobalt, not pure white
  const sEarlyTransition = getChapterBackgroundStyle(1.55);
  assert.equal(sEarlyTransition.isLightSurface, false);
  assert.notEqual(sEarlyTransition.backgroundColor, '#f1f5ff');

  // By 2.15 (mobile Parts Guide waypoint) and 2.55 (mid-collage), background has smoothly completed its gradual blend to Architectural Ice
  const sMobileCollage = getChapterBackgroundStyle(2.15);
  assert.equal(sMobileCollage.backgroundColor, '#f1f5ff');
  assert.equal(sMobileCollage.isLightSurface, true);
  assert.equal(sMobileCollage.inkColor, '#090D1F');

  const sCollage = getChapterBackgroundStyle(2.55);
  assert.equal(sCollage.backgroundColor, '#f1f5ff');
  assert.equal(sCollage.isLightSurface, true);
  assert.equal(sCollage.inkColor, '#090D1F');

  const s4 = getChapterBackgroundStyle(4);
  assert.equal(s4.isLightSurface, true);

  const s5 = getChapterBackgroundStyle(5);
  assert.equal(s5.backgroundColor, '#050816');
  assert.equal(s5.isLightSurface, false);
  assert.equal(s5.inkColor, '#FFFFFF');
});

test('getSignatureRevealState counter-scrolls marquees and completes SVG stroke near Scene 1', () => {
  const settled = getSignatureRevealState(1, 1);
  assert.ok(settled.strokeProgress > 0.9);
  assert.equal(settled.maskScale, 1);
  assert.ok(settled.marqueeTopOffsetPx < 0);
  assert.ok(settled.marqueeBottomOffsetPx > 0);

  const drifted = getSignatureRevealState(1.4, 1);
  assert.ok(drifted.marqueeTopOffsetPx < settled.marqueeTopOffsetPx);
  assert.ok(drifted.marqueeBottomOffsetPx > settled.marqueeBottomOffsetPx);
});

test('getContinuousSpeakerZoomState computes dual-dimension isotropic zoom and waits for signature fade before upper-left exit', () => {
  const heroRest = getContinuousSpeakerZoomState(0, 1920, 1080, false);
  assert.equal(heroRest.isMounted, true);
  assert.equal(heroRest.scale, 1);
  assert.equal(heroRest.translateXPx, 0);
  assert.equal(heroRest.translateYPx, 0);
  assert.equal(heroRest.heroChromeOpacity, 1);
  assert.equal(heroRest.cobaltWledIntensity, 0);
  assert.equal(heroRest.allowXRaySweep, true);

  const laptop1366 = getContinuousSpeakerZoomState(1.0, 1366, 768, false);
  const fhd1920 = getContinuousSpeakerZoomState(1.0, 1920, 1080, false);
  const qhd2560 = getContinuousSpeakerZoomState(1.0, 2560, 1440, false);
  const uw3440 = getContinuousSpeakerZoomState(1.0, 3440, 1440, false);

  for (const state of [laptop1366, fhd1920, qhd2560, uw3440]) {
    assert.equal(state.isMounted, true);
    assert.ok(state.scale > 1.25);
    assert.equal(state.translateXPx, 0);
    assert.equal(state.heroChromeOpacity, 0);
    assert.equal(state.cobaltWledIntensity, 1);
    assert.equal(state.speakerOpacity, 1);
    assert.equal(state.allowXRaySweep, false);
  }

  assert.equal(uw3440.targetScale, qhd2560.targetScale);

  // While signature is fading out first (1.28), speaker stays centered before starting exit
  const waitingForSigFade = getContinuousSpeakerZoomState(1.28, 1920, 1080, false);
  assert.equal(waitingForSigFade.translateXPx, 0);
  assert.equal(waitingForSigFade.translateYPx, 0);

  const exitingUpperLeft = getContinuousSpeakerZoomState(1.82, 1920, 1080, false);
  assert.equal(exitingUpperLeft.isMounted, true);
  assert.ok(exitingUpperLeft.scale < fhd1920.scale);
  assert.ok(exitingUpperLeft.translateXPx < -400);
  assert.ok(exitingUpperLeft.translateYPx < -250);
  assert.ok(exitingUpperLeft.speakerOpacity > 0 && exitingUpperLeft.speakerOpacity < 1);

  const unmounted = getContinuousSpeakerZoomState(2.1, 1920, 1080, false);
  assert.equal(unmounted.isMounted, false);
  assert.equal(unmounted.speakerOpacity, 0);
});

test('getCustomSignatureProgress draws in exact pen-video order, completes by 0.78, holds across [0.78..1.15], and fades completely before speaker exit', () => {
  const before = getCustomSignatureProgress(0.1, false);
  assert.equal(before.isVisible, false);
  assert.equal(before.drawProgress, 0);

  const early = getCustomSignatureProgress(0.32, false);
  assert.equal(early.isVisible, true);
  assert.ok(early.loopSlash > 0);
  assert.equal(early.rajdeepMain, 0);
  assert.equal(early.crownM, 0);

  const completed78 = getCustomSignatureProgress(0.78, false);
  assert.equal(completed78.drawProgress, 1);
  assert.equal(completed78.crownM, 1);
  assert.equal(completed78.crownUnderlines, 1);
  assert.equal(completed78.opacity, 1);

  const holdPhase = getCustomSignatureProgress(1.05, false);
  assert.equal(holdPhase.drawProgress, 1);
  assert.equal(holdPhase.opacity, 1);

  const fadingFirst = getCustomSignatureProgress(1.26, false);
  assert.ok(fadingFirst.opacity > 0 && fadingFirst.opacity < 0.6);

  const goneBeforeExit = getCustomSignatureProgress(1.38, false);
  assert.equal(goneBeforeExit.isVisible, false);
});

test('Horizontal Floating Editorial Canvas includes 6 clean plates (sketch cards removed), CAD dimension & radiator overlays, background statements, and zero overlaps', () => {
  assert.equal(COLLAGE_PART_ITEMS.length, 6);
  const ids = new Set(COLLAGE_PART_ITEMS.map((item) => item.id));
  assert.equal(ids.size, 6);

  // Hand-drawn raw notebook sketch files must NOT be displayed as cards
  const removedSketches = [
    '/assets/aistudio/image_2dbf7cc9.png',
    '/assets/aistudio/image_e4fb34c9.png',
  ];
  for (const sketch of removedSketches) {
    assert.equal(
      COLLAGE_PART_ITEMS.some((item) => item.imageSrc === sketch),
      false,
      `Sketch ${sketch} should not be plotted as a card`
    );
    assert.equal(CORE_PRELOAD_IMAGES.includes(sketch), false);
  }

  // Both studio speaker renders carry the exact CAD diagram modes and specs
  const tqCard = COLLAGE_PART_ITEMS.find((i) => i.id === 'mdf-chassis-dimensions')!;
  assert.equal(tqCard.imageSrc, '/assets/aistudio/Black_Three-Quarter_Speaker_Cabinet_cd34b97a.png');
  assert.equal(tqCard.diagramOverlay, 'three-quarter-dims');
  assert.ok(tqCard.dimensionsSpec?.includes('15 cm'));
  assert.ok(tqCard.dimensionsSpec?.includes('14.7 cm'));
  assert.ok(tqCard.dimensionsSpec?.includes('27.5 cm'));
  assert.ok(tqCard.dimensionsSpec?.includes('7 cm'));
  assert.ok(tqCard.dimensionsSpec?.includes('5 cm'));

  const dualPrCard = COLLAGE_PART_ITEMS.find((i) => i.id === 'dual-passive-radiators')!;
  assert.equal(dualPrCard.imageSrc, '/assets/aistudio/Matte_Black_Speaker_Texture_Edit_10e0e5ac.png');
  assert.equal(dualPrCard.diagramOverlay, 'dual-passive-radiator');

  // Verify feature detail modals use content-driven, non-repetitive section headings
  const wledCard = COLLAGE_PART_ITEMS.find((i) => i.id === 'wled-halo-ring')!;
  assert.deepEqual(
    wledCard.modalSections?.map((s) => s.heading),
    ['Overview', 'Hardware', 'Features', 'Operation']
  );
  assert.equal(wledCard.modalFooterLabel, 'SYSTEM');
  assert.notDeepEqual(
    tqCard.modalSections?.map((s) => s.heading),
    wledCard.modalSections?.map((s) => s.heading)
  );
  assert.equal(tqCard.modalSections?.length, 2);
  assert.equal(dualPrCard.modalSections?.length, 2);
  const rearCard = COLLAGE_PART_ITEMS.find((i) => i.id === 'rear-control-module')!;
  assert.equal(rearCard.modalSections?.length, 3);

  const micCard = COLLAGE_PART_ITEMS.find((i) => i.id === 'inmp441-microphone')!;
  assert.equal(micCard.partName, 'INMP441 (I2S MEMS Digital Microphone)');
  assert.equal(micCard.modalTitle, 'Music-Reactive Microphone');
  assert.equal(micCard.imageSurface, 'transparent');
  assert.equal(micCard.imageSrc, '/assets/aistudio/Twisted_Wire_Microphone_Module_619dfaa8.webp');
  assert.deepEqual(
    micCard.modalSections?.map((s) => s.heading),
    ['Overview', 'How It Works', 'Hardware Role']
  );
  assert.equal(micCard.modalFooterLabel, 'SPECIFICATION');
  assert.equal(micCard.metric, 'INMP441 · I2S Digital MEMS Microphone · ESP32 Audio Input');
  assert.ok(
    CORE_PRELOAD_IMAGES.includes(micCard.imageSrc) ||
      SECONDARY_WARMUP_IMAGES.includes(micCard.imageSrc)
  );

  // Verify background field bold statements
  assert.equal(COLLAGE_BACKGROUND_NOTES.length, 2);
  assert.equal(COLLAGE_BACKGROUND_NOTES[0].headline, 'Made it with MDF board');
  assert.equal(COLLAGE_BACKGROUND_NOTES[1].headline, '6000 mAh battery');

  const mdfEarly = getCollageBackgroundNoteTransform(COLLAGE_BACKGROUND_NOTES[0], 1.85, 1440, 900, false);
  const mdfLater = getCollageBackgroundNoteTransform(COLLAGE_BACKGROUND_NOTES[0], 2.15, 1440, 900, false);
  assert.equal(mdfEarly.isMounted, true);
  assert.ok(mdfLater.xPx < mdfEarly.xPx, 'Background statement should glide right-to-left on vertical scroll');

  // Lead item enters diagonally bottom-right -> flattens onto upper horizontal leftward path
  const lead = COLLAGE_PART_ITEMS[0];
  assert.ok(lead.canvasYFraction <= 0.16, 'Lead WLED Ring should travel along upper horizontal lane');

  const entryAt152 = getEditorialCollageItemTransform(lead, 1.52, 1920, 1080, false);
  const settledAt198 = getEditorialCollageItemTransform(lead, 1.98, 1920, 1080, false);
  const flatLeftAt218 = getEditorialCollageItemTransform(lead, 2.18, 1920, 1080, false);

  assert.equal(entryAt152.isMounted, true);
  assert.ok(entryAt152.xPx > settledAt198.xPx);
  assert.ok(entryAt152.yPx > settledAt198.yPx);
  assert.ok(flatLeftAt218.xPx < settledAt198.xPx);
  assert.equal(flatLeftAt218.yPx, settledAt198.yPx);
  assert.ok(settledAt198.textRevealProgress >= entryAt152.textRevealProgress);

  // Verify Cobalt block-wipe text progression across right -> center travel
  const secondPlate = COLLAGE_PART_ITEMS[1];
  const onRight = getEditorialCollageItemTransform(secondPlate, 1.7, 1920, 1080, false);
  const wiping = getEditorialCollageItemTransform(secondPlate, 1.95, 1920, 1080, false);
  const centered = getEditorialCollageItemTransform(secondPlate, 2.12, 1920, 1080, false);
  assert.ok(onRight.xPx > 1920 * 0.74);
  assert.ok(onRight.textRevealProgress <= 0.181);
  assert.ok(wiping.textRevealProgress > 0.25 && wiping.textRevealProgress < 1);
  assert.equal(centered.textRevealProgress, 1);

  // Pairwise non-overlap & multi-card visibility across 1440x900, 1920x1080, 2560x1440
  const widthFor = (item: typeof lead, w: number) => {
    if (item.sizeVariant === 'lg') return Math.min(465, Math.max(315, w * 0.255));
    return Math.min(370, Math.max(245, w * 0.195));
  };
  const heightFor = (item: typeof lead, w: number, h: number) => {
    const cw = widthFor(item, w);
    const ratio = item.aspectRatioClass === 'aspect-[3/4]' ? 4 / 3 : item.aspectRatioClass === 'aspect-[3/2]' ? 2 / 3 : 3 / 4;
    const imgH = Math.min(h * 0.46, cw * ratio);
    return 26 + imgH + 92;
  };

  for (const [w, h] of [
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
  ]) {
    for (let pos = 1.45; pos <= 3.45; pos += 0.05) {
      const visible = COLLAGE_PART_ITEMS.map((item) => ({
        item,
        tf: getEditorialCollageItemTransform(item, pos, w, h, false),
      })).filter(({ tf }) => tf.isMounted && tf.opacity > 0.05);

      for (let i = 0; i < visible.length; i++) {
        for (let j = i + 1; j < visible.length; j++) {
          const a = visible[i];
          const b = visible[j];
          const aw = widthFor(a.item, w) * a.tf.scale;
          const ah = heightFor(a.item, w, h) * a.tf.scale;
          const bw = widthFor(b.item, w) * b.tf.scale;
          const bh = heightFor(b.item, w, h) * b.tf.scale;

          const overlapX = a.tf.xPx < b.tf.xPx + bw && a.tf.xPx + aw > b.tf.xPx;
          const overlapY = a.tf.yPx < b.tf.yPx + bh && a.tf.yPx + ah > b.tf.yPx;
          assert.equal(
            overlapX && overlapY,
            false,
            `Collage overlap between ${a.item.id} and ${b.item.id} at pos=${pos.toFixed(2)} (${w}x${h})`
          );
        }
      }
    }

    const concurrentMid = COLLAGE_PART_ITEMS.filter((item) => {
      const tf = getEditorialCollageItemTransform(item, 2.25, w, h, false);
      return tf.isMounted && tf.xPx > -150 && tf.xPx < w;
    });
    assert.ok(
      concurrentMid.length >= 2,
      `Expected >= 2 concurrent collage items at ${w}x${h}, got ${concurrentMid.length}`
    );
  }

  // Exact reverse scrubbing deterministically restores earlier coordinates
  const reverseCheck = getEditorialCollageItemTransform(lead, 1.52, 1920, 1080, false);
  assert.deepEqual(reverseCheck, entryAt152);

  // Closing stereo statement in the trailing blank section matches exact text and reveals progressively
  assert.equal(
    COLLAGE_CLOSING_STATEMENT.text,
    'What sets these speakers apart is that they pair wirelessly and work as separate Left and Right channels, giving you wider stereo sound across the room without a cable running between them.'
  );
  const closingEntering = getCollageClosingStatementState(3.0, 1440, 900, false);
  const closingMid = getCollageClosingStatementState(3.18, 1440, 900, false);
  const closingSettled = getCollageClosingStatementState(3.42, 1440, 900, false);
  assert.equal(closingEntering.isMounted, true);
  assert.ok(closingEntering.revealProgress > 0 && closingEntering.revealProgress < closingMid.revealProgress);
  assert.ok(closingMid.revealProgress >= 0.3 && closingMid.revealProgress <= 0.52, `Expected unhurried mid reveal (~0.40), got ${closingMid.revealProgress}`);
  assert.ok(closingMid.revealProgress < closingSettled.revealProgress);
  assert.equal(closingSettled.revealProgress, 1);

  // Ensure closing statement sits cleanly to the right of the 6th card (inmp441-microphone) without overlapping
  assert.equal(COLLAGE_CLOSING_STATEMENT.eyebrow, '07 · WIRELESS STEREO PAIR');
  const sixthCard = COLLAGE_PART_ITEMS[5];
  const sixthAt342 = getEditorialCollageItemTransform(sixthCard, 3.42, 1440, 900, false);
  const sixthWidth = Math.min(370, Math.max(245, 1440 * 0.195)) * sixthAt342.scale;
  assert.ok(
    closingSettled.xPx > sixthAt342.xPx + sixthWidth + 60,
    `Expected closing statement (${closingSettled.xPx}) to sit cleanly right of 6th card right edge (${sixthAt342.xPx + sixthWidth})`
  );
});

test('getDesignedIn3DRevealState staggers Cobalt block-wipe and column sweeps cleanly across 3.56..4.00 and reverses cleanly', () => {
  const before = getDesignedIn3DRevealState(3.55, false);
  assert.equal(before.eyebrowReveal, 0);
  assert.equal(before.headlineReveal, 0);
  assert.equal(before.dividerProgress, 0);
  assert.deepEqual(before.columnReveals, [0, 0, 0]);

  const midHeadline = getDesignedIn3DRevealState(3.78, false);
  assert.ok(midHeadline.eyebrowReveal > 0.8);
  assert.ok(midHeadline.headlineReveal > 0.4 && midHeadline.headlineReveal < 1);
  assert.ok(midHeadline.dividerProgress > 0.3 && midHeadline.dividerProgress < 1);
  assert.ok(midHeadline.columnReveals[0] > midHeadline.columnReveals[1]);
  assert.ok(midHeadline.columnReveals[1] > midHeadline.columnReveals[2]);

  const settled = getDesignedIn3DRevealState(4.0, false);
  assert.equal(settled.eyebrowReveal, 1);
  assert.equal(settled.headlineReveal, 1);
  assert.equal(settled.dividerProgress, 1);
  assert.deepEqual(settled.columnReveals, [1, 1, 1]);

  // Reverse scroll restores exact intermediate state
  assert.deepEqual(getDesignedIn3DRevealState(3.78, false), midHeadline);

  // Reduced motion resolves immediately to 1
  const reduced = getDesignedIn3DRevealState(3.55, true);
  assert.equal(reduced.eyebrowReveal, 1);
  assert.equal(reduced.headlineReveal, 1);
  assert.equal(reduced.dividerProgress, 1);
  assert.deepEqual(reduced.columnReveals, [1, 1, 1]);
});

test('Floating Editorial Collage rises upward while Inside CAD or Live WLED rises cleanly from bottom', () => {
  const collageActive = getCollageCanvasContainerState(2.6, 1080, false);
  assert.equal(collageActive.isVisible, true);
  assert.equal(collageActive.containerTranslateYPx, 0);

  const collageRising = getCollageCanvasContainerState(3.8, 1080, false);
  assert.ok(collageRising.containerTranslateYPx < -250);

  const splitRising = getOpposingSplitState(3.62, 4, 1920, 1080);
  const splitSettled = getOpposingSplitState(4.0, 4, 1920, 1080);

  assert.ok(splitRising.containerTranslateY > 0);
  assert.ok(splitRising.leftX < 0);
  assert.ok(splitRising.rightX > 0);

  assert.equal(splitSettled.containerTranslateY, 0);
  assert.equal(splitSettled.leftX, 0);
  assert.equal(splitSettled.rightX, 0);
  assert.equal(splitSettled.centerOpacity, 1);
  assert.equal(splitSettled.brushStrokeProgress, 1);
});

test('getAdaptive3DCameraConfig adjusts FOV and distance cleanly for 21:9 ultrawide and standard 16:9 desktops', () => {
  const standard169 = getAdaptive3DCameraConfig(1920 / 1080);
  const ultrawide219 = getAdaptive3DCameraConfig(3440 / 1440);
  const laptop1366 = getAdaptive3DCameraConfig(1366 / 768);

  assert.equal(standard169.fov, 38);
  assert.equal(laptop1366.fov, 38);
  assert.equal(ultrawide219.fov, 35);
  assert.ok(ultrawide219.distanceMultiplier < standard169.distanceMultiplier);
});

test('projectSpeaker45OutlinePoint angles Left (+45°) and Right (-45°) speakers inward toward each other and OpposingSplit exits completely by 5.42', () => {
  const leftOrigin = projectSpeaker45OutlinePoint(0, 0, 0, 'left');
  const leftFrontCenter = projectSpeaker45OutlinePoint(0, 0, 13.5, 'left');
  const leftOuterSide = projectSpeaker45OutlinePoint(-14.2, 0, 0, 'left');

  const rightOrigin = projectSpeaker45OutlinePoint(0, 0, 0, 'right');
  const rightFrontCenter = projectSpeaker45OutlinePoint(0, 0, 13.5, 'right');
  const rightOuterSide = projectSpeaker45OutlinePoint(14.2, 0, 0, 'right');

  assert.equal(leftFrontCenter.yawDeg, 45);
  assert.equal(rightFrontCenter.yawDeg, -45);

  // Left speaker front baffle faces inward-right (+X) while its outer-left passive radiator wall is on -X
  assert.ok(leftFrontCenter.x > leftOrigin.x);
  assert.ok(leftOuterSide.x < leftOrigin.x);

  // Right speaker front baffle faces inward-left (-X) while its outer-right passive radiator wall is on +X
  assert.ok(rightFrontCenter.x < rightOrigin.x);
  assert.ok(rightOuterSide.x > rightOrigin.x);

  // Exact horizontal mirror symmetry around cx=160
  assert.equal(
    Number((leftFrontCenter.x - 160).toFixed(2)),
    Number((160 - rightFrontCenter.x).toFixed(2))
  );
  assert.equal(leftFrontCenter.y, rightFrontCenter.y);

  // Verify OpposingSplitChapter holds pinned across [4.00..5.00] and fades out completely by timelinePos = 5.42
  const splitAt5 = getOpposingSplitState(5.0, 4, 1920, 1080);
  assert.equal(splitAt5.containerTranslateY, 0);
  assert.equal(splitAt5.centerOpacity, 1);

  const splitExited = getOpposingSplitState(5.42, 4, 1920, 1080);
  assert.equal(splitExited.centerOpacity, 0);
});

test('getSplitScreenStageState drives Wipe 1 into Festive Balcony Duo and Wipe 2 into the 16-item Components Used showcase', () => {
  assert.equal(
    SPLIT_REVEAL_PHOTO_SRC,
    '/assets/aistudio/RGB_Speaker_Duo_on_a_Festive_Balcony_Desk_016b6e98.webp'
  );
  assert.ok(
    CORE_PRELOAD_IMAGES.includes(SPLIT_REVEAL_PHOTO_SRC) ||
      SECONDARY_WARMUP_IMAGES.includes(SPLIT_REVEAL_PHOTO_SRC)
  );

  // Verify all 16 authentic hardware components are present in exact order in SPEAKER_COMPONENTS_USED
  assert.equal(SPEAKER_COMPONENTS_USED.length, 16);
  const expectedNames = [
    'Digital Microphone — INMP441',
    'Voltage & Current Sensor — INA219',
    'ESP32 Development Board',
    'WLED — Addressable RGB LED Control',
    'Amplifier',
    'Speakers',
    'Internal Wiring',
    'Power Switch',
    'DC Power Socket',
    '3.5mm Female Audio Jack',
    '6000mAh Battery',
    'BMS — Battery Management System',
    'Polyester Film Capacitor',
    'Bluetooth Audio Receiver — Salvaged from AirPods',
    'Textured Cabinet Wallpaper',
    'Synthetic Cotton — Acoustic Damping',
  ];
  SPEAKER_COMPONENTS_USED.forEach((item, idx) => {
    assert.equal(item.name, expectedNames[idx]);
    assert.equal(item.indexLabel, String(idx + 1).padStart(2, '0'));
  });

  // Ensure artificial AI-generated phrases have been completely removed
  const joinedAll = SPEAKER_COMPONENTS_USED.map(
    (c) => `${c.category} ${c.name} ${c.detail}`
  ).join(' | ');
  for (const bannedPhrase of [
    'Point-to-Point Copper Loom',
    'Internal Standing-Wave Absorption',
    'Tactile Isolation Toggle',
    'Dual-Core Wi-Fi & BLE MCU',
    'Matte Textured Charcoal Cabinet Wrap',
    'High-Efficiency Class-D Board',
  ]) {
    assert.equal(
      joinedAll.includes(bannedPhrase),
      false,
      `Did not expect artificial phrase "${bannedPhrase}" in SPEAKER_COMPONENTS_USED`
    );
  }

  // At pos = 4.00: Slide 0 (45° Black Outline Speakers) is settled; Slide 1 & Slide 2 are parked off-frame
  const atStart = getSplitScreenStageState(4.0);
  assert.equal(atStart.overallProgress, 0);
  assert.equal(atStart.wipe1Progress, 0);
  assert.equal(atStart.wipe2Progress, 0);
  assert.equal(atStart.slide0.isVisible, true);
  assert.equal(atStart.slide1.isVisible, false);
  assert.equal(atStart.slide2.isVisible, false);

  // Mid Wipe 1 (pos = 4.23): Left column wipes UP (+50%), Right column wipes DOWN (-50%) into Slide 1 (Festive Balcony Duo)
  const midWipe1 = getSplitScreenStageState(4.23);
  assert.equal(midWipe1.wipe1Progress, 0.5);
  assert.equal(midWipe1.slide1.leftMaskYPercent, 50);
  assert.equal(midWipe1.slide1.leftInnerYPercent, -50);
  assert.equal(midWipe1.slide1.rightMaskYPercent, -50);
  assert.equal(midWipe1.slide1.rightInnerYPercent, 50);
  assert.ok(midWipe1.slide0.textLeftShearYPercent < 0);
  assert.ok(midWipe1.slide0.textRightShearYPercent > 0);
  assert.ok(midWipe1.slide1.textLeftShearYPercent > 0);
  assert.ok(midWipe1.slide1.textRightShearYPercent < 0);

  // Settled on Slide 1 (pos = 4.50): Festive Balcony RGB Speaker Duo ("LIVING LIGHT / Balcony Duo")
  const settledBalcony = getSplitScreenStageState(4.5);
  assert.equal(settledBalcony.wipe1Progress, 1);
  assert.equal(settledBalcony.wipe2Progress, 0);
  assert.equal(settledBalcony.slide1.isVisible, true);
  assert.equal(settledBalcony.slide1.leftMaskYPercent, 0);
  assert.equal(settledBalcony.slide1.rightMaskYPercent, 0);
  assert.equal(settledBalcony.slide2.isVisible, false);

  // Mid Wipe 2 (pos = 4.77): Second Split-Screen Counter-Wipe into Slide 2 ("COMPONENTS / Used Inside")
  const midWipe2 = getSplitScreenStageState(4.77);
  assert.equal(midWipe2.wipe1Progress, 1);
  assert.equal(midWipe2.wipe2Progress, 0.5);
  assert.equal(midWipe2.slide2.leftMaskYPercent, 50);
  assert.equal(midWipe2.slide2.leftInnerYPercent, -50);
  assert.equal(midWipe2.slide2.rightMaskYPercent, -50);
  assert.equal(midWipe2.slide2.rightInnerYPercent, 50);
  assert.ok(midWipe2.slide1.textLeftShearYPercent < 0);
  assert.ok(midWipe2.slide1.textRightShearYPercent > 0);
  assert.ok(midWipe2.slide2.textLeftShearYPercent > 0);
  assert.ok(midWipe2.slide2.textRightShearYPercent < 0);

  // At pos = 5.00: Slide 2 (16 Components Used) is 100% locked and settled
  const atComponents = getSplitScreenStageState(5.0);
  assert.equal(atComponents.overallProgress, 1);
  assert.equal(atComponents.wipe1Progress, 1);
  assert.equal(atComponents.wipe2Progress, 1);
  assert.equal(atComponents.slide2.isVisible, true);
  assert.equal(atComponents.slide2.leftMaskYPercent, 0);
  assert.equal(atComponents.slide2.rightMaskYPercent, 0);
  assert.equal(atComponents.slide2.textLeftShearYPercent, 0);
  assert.equal(atComponents.slide2.textRightShearYPercent, 0);
});

test('getMobilePerformanceProfile keeps full desktop fidelity while trimming GPU load on phones', () => {
  const desktop = getMobilePerformanceProfile(1440, false);
  assert.equal(desktop.isMobileViewport, false);
  assert.equal(desktop.dprCap, 2);
  assert.equal(desktop.canvasTargetFps, 60);
  assert.equal(desktop.useHeavyBlurFilters, true);
  assert.equal(desktop.enableHeroXRaySweep, true);
  assert.equal(desktop.enableWebGLShadows, true);
  assert.equal(desktop.waveSegmentScale, 1);

  const phone = getMobilePerformanceProfile(390, true);
  assert.equal(phone.isMobileViewport, true);
  assert.ok(phone.dprCap <= 1.25);
  assert.equal(phone.canvasTargetFps, 30);
  assert.equal(phone.useHeavyBlurFilters, false);
  assert.equal(phone.enableHeroXRaySweep, false);
  assert.equal(phone.enableWebGLShadows, false);
  assert.ok(phone.waveSegmentScale <= 0.5);
});

test('shouldInnerScrollConsumeSwipe protects internal scroll containers until top/bottom boundary', () => {
  // Non-scrollable content always yields to global timeline
  assert.equal(shouldInnerScrollConsumeSwipe(0, 400, 400, 12), false);

  // Mid-scroll inside a 1200px list in a 500px viewport: consumes both up & down swipes
  assert.equal(shouldInnerScrollConsumeSwipe(250, 1200, 500, 20), true);
  assert.equal(shouldInnerScrollConsumeSwipe(250, 1200, 500, -20), true);

  // At very top (scrollTop = 0): swiping down (deltaY < 0) hands off to previous chapter, swiping up scrolls list
  assert.equal(shouldInnerScrollConsumeSwipe(0, 1200, 500, -15), false);
  assert.equal(shouldInnerScrollConsumeSwipe(0, 1200, 500, 15), true);

  // At very bottom (scrollTop = 700, clientHeight = 500): swiping up (deltaY > 0) hands off to next chapter
  assert.equal(shouldInnerScrollConsumeSwipe(700, 1200, 500, 15), false);
  assert.equal(shouldInnerScrollConsumeSwipe(700, 1200, 500, -15), true);
});

test('computeTouchReleaseMomentumTarget applies bounded inertia for fast mobile flicks and stops on slow drags', () => {
  const slowDrag = computeTouchReleaseMomentumTarget(2.0, [
    { y: 500, t: 100 },
    { y: 492, t: 200 },
  ]);
  assert.equal(slowDrag, 2.0);

  // Fast swipe up (finger moves from y=600 -> y=420 in 80ms = +2.25 px/ms)
  const fastForwardFlick = computeTouchReleaseMomentumTarget(1.0, [
    { y: 600, t: 100 },
    { y: 420, t: 180 },
  ]);
  assert.ok(fastForwardFlick > 1.5 && fastForwardFlick <= 2.1);

  // Respects [0..7.5] bounds
  const clampedHigh = computeTouchReleaseMomentumTarget(7.2, [
    { y: 600, t: 100 },
    { y: 380, t: 170 },
  ]);
  assert.equal(clampedHigh, 7.5);

  const clampedLow = computeTouchReleaseMomentumTarget(0.2, [
    { y: 300, t: 100 },
    { y: 540, t: 170 },
  ]);
  assert.equal(clampedLow, 0);
});

test('getAdjacentMobileWaypoint and getMobileChapterIndex step cleanly through chapters', () => {
  assert.equal(getMobileChapterIndex(0), 0);
  assert.equal(getMobileChapterIndex(2.15), 2);
  assert.equal(getAdjacentMobileWaypoint(0, 1).pos, 1);
  assert.equal(getAdjacentMobileWaypoint(1, 1).pos, 2.15);
  assert.equal(getAdjacentMobileWaypoint(4.5, -1).pos, 4);
  assert.equal(getAdjacentMobileWaypoint(0, -1).pos, 0);
  assert.equal(getAdjacentMobileWaypoint(7.5, 1).pos, 7.5);
});

