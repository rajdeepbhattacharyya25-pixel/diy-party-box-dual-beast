import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEAKER_DIMENSIONS,
  SPEAKER_COMPONENT_MANIFEST,
  validateGlbBuffer,
} from './speakerSpec';
import { buildSpeakerModel, applyExplodedView } from './buildSpeakerModel';
import { buildLeftSpeakerModel } from './buildLeftSpeakerModel';
import {
  tryAcquireWebGLContext,
  renderSpeakerSoftware2D,
} from './softwareCanvasRenderer';
import * as THREE from 'three';
import { serializeSpeakerToGlbBinary } from './glbBinaryWriter';
import {
  refineExistingSpeakerGlb,
  verifyGeometryPreservation,
  parseGlbContainer,
} from './refineSpeakerGlb';

test('speaker enclosure dimensions preserve physical proportions across all 5 views', () => {
  assert.equal(SPEAKER_DIMENSIONS.width, 1.40);
  assert.equal(SPEAKER_DIMENSIONS.height, 2.60);
  assert.equal(SPEAKER_DIMENSIONS.depth, 1.40);

  const aspectRatio = SPEAKER_DIMENSIONS.height / SPEAKER_DIMENSIONS.width;
  assert.ok(aspectRatio > 1.8 && aspectRatio < 1.9);
});

test('front face has 3 vertically aligned circular components in descending Y order', () => {
  const { frontUpperDriver, frontLedRing, frontLowerDriver } = SPEAKER_DIMENSIONS;
  assert.ok(
    frontUpperDriver.centerY > frontLedRing.centerY &&
      frontLedRing.centerY > frontLowerDriver.centerY,
    'Upper driver, central LED ring, and lower driver must be vertically ordered top-to-bottom'
  );
  assert.ok(
    frontUpperDriver.cutoutRadius > frontLowerDriver.cutoutRadius,
    'Upper speaker driver is larger in diameter than lower driver'
  );
});

test('all 5 views and enclosure have dedicated 3D meshes in the component manifest', () => {
  const faces = new Set(SPEAKER_COMPONENT_MANIFEST.map((c) => c.face));
  assert.ok(faces.has('enclosure'));
  assert.ok(faces.has('front'));
  assert.ok(faces.has('back'));
  assert.ok(faces.has('left'));
  assert.ok(faces.has('right'));
  assert.ok(faces.has('top'));
  assert.ok(SPEAKER_COMPONENT_MANIFEST.length >= 34);
});

test('back raised electronics module protrudes past back face (-Z) and aligns with left (+X) and top (+Y) views', () => {
  const { backRaisedModule, halfDepth, halfWidth, halfHeight } = SPEAKER_DIMENSIONS;
  assert.ok(backRaisedModule.minZ < -halfDepth);
  assert.ok(Math.abs(backRaisedModule.maxX - halfWidth) < 0.02);
  assert.ok(Math.abs(backRaisedModule.maxY - halfHeight) < 0.02);
});

test('buildSpeakerModel constructs complete 3D mesh hierarchy and exports valid glTF 2.0 binary (.glb)', () => {
  const built = buildSpeakerModel();
  assert.ok(built.meshCount >= 50, `Expected >= 50 separate 3D meshes, got ${built.meshCount}`);
  assert.ok(built.vertexCount >= 5000, `Expected >= 5000 vertices, got ${built.vertexCount}`);
  assert.ok(built.triangleCount >= 3000, `Expected >= 3000 triangles, got ${built.triangleCount}`);

  applyExplodedView(built.parts, 1.0);
  const firstPart = built.parts[0];
  assert.notEqual(firstPart.object.position.z, firstPart.basePosition.z);
  applyExplodedView(built.parts, 0.0);
  assert.equal(firstPart.object.position.z, firstPart.basePosition.z);

  const glbBuffer = serializeSpeakerToGlbBinary(built.root);
  const validation = validateGlbBuffer(glbBuffer);
  assert.equal(validation.valid, true);
  assert.equal(validation.magic, 'glTF');
  assert.equal(validation.version, 2);
  assert.ok(validation.byteLength > 100000);
  assert.ok(validation.binChunkLength > 90000);

  built.dispose();
});

test('refineExistingSpeakerGlb preserves 100% of original geometry byte-for-byte while embedding photorealistic PBR materials & PNG textures', () => {
  const built = buildSpeakerModel();
  const originalGlb = serializeSpeakerToGlbBinary(built.root);
  built.dispose();

  // Refine with 512px enclosure maps in fast unit test
  const refinedGlb = refineExistingSpeakerGlb(originalGlb, 512, 'R');
  const validation = validateGlbBuffer(refinedGlb);
  assert.equal(validation.valid, true);

  const origParsed = parseGlbContainer(originalGlb);
  const check = verifyGeometryPreservation(originalGlb, refinedGlb);
  assert.equal(check.identicalHierarchy, true, 'Node and scene hierarchy must be 100% identical');
  assert.equal(
    check.identicalMeshCount,
    origParsed.json.meshes.length,
    'All original meshes must be preserved'
  );
  assert.equal(
    check.identicalAccessorsCount,
    origParsed.json.accessors.length,
    'All original geometry accessors must be untouched'
  );
  assert.equal(check.bitExactGeometryBytes, true, 'Original vertex/normal/UV/index binary bytes must be 100% untouched');
  assert.equal(check.embeddedTexturesCount, 10, 'All 10 embedded PNG textures must have valid PNG headers');

  // Verify specific material parameter ranges in refined glTF JSON
  const parsed = parseGlbContainer(refinedGlb);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findMat = (name: string) => parsed.json.materials.find((m: any) => m.name === name);

  const enclosureMat = findMat('Mat_Enclosure_Textured_Black');
  assert.ok(enclosureMat);
  assert.ok(enclosureMat.pbrMetallicRoughness.metallicFactor <= 0.05);
  assert.ok(
    enclosureMat.pbrMetallicRoughness.roughnessFactor >= 0.78 &&
      enclosureMat.pbrMetallicRoughness.roughnessFactor <= 0.90
  );
  assert.ok(enclosureMat.normalTexture);
  assert.ok(enclosureMat.pbrMetallicRoughness.baseColorTexture);

  const coneMat = findMat('Mat_Driver_Paper_Cone');
  assert.ok(
    coneMat.pbrMetallicRoughness.roughnessFactor >= 0.45 &&
      coneMat.pbrMetallicRoughness.roughnessFactor <= 0.65
  );

  const surroundMat = findMat('Mat_Driver_Rubber_Surround');
  assert.ok(
    surroundMat.pbrMetallicRoughness.roughnessFactor >= 0.70 &&
      surroundMat.pbrMetallicRoughness.roughnessFactor <= 0.85
  );

  const dustCapMat = findMat('Mat_Upper_Driver_Glossy_DustCap');
  assert.ok(
    dustCapMat.pbrMetallicRoughness.roughnessFactor >= 0.35 &&
      dustCapMat.pbrMetallicRoughness.roughnessFactor <= 0.50
  );

  const copperMat = findMat('Mat_Copper_Cutout_Rim');
  assert.ok(
    copperMat.pbrMetallicRoughness.metallicFactor >= 0.55 &&
      copperMat.pbrMetallicRoughness.metallicFactor <= 0.75
  );
  assert.ok(
    copperMat.pbrMetallicRoughness.roughnessFactor >= 0.30 &&
      copperMat.pbrMetallicRoughness.roughnessFactor <= 0.45
  );
});

test('buildLeftSpeakerModel constructs complete Left (L) speaker 3D mesh hierarchy and exports photorealistic GLB', () => {
  const builtLeft = buildLeftSpeakerModel();
  assert.ok(builtLeft.meshCount >= 55, `Expected >= 55 meshes for Left speaker, got ${builtLeft.meshCount}`);
  assert.ok(builtLeft.vertexCount >= 5000);
  assert.ok(builtLeft.triangleCount >= 3000);

  const origGlb = serializeSpeakerToGlbBinary(builtLeft.root);
  builtLeft.dispose();

  const refinedLeftGlb = refineExistingSpeakerGlb(origGlb, 512, 'L');
  const check = verifyGeometryPreservation(origGlb, refinedLeftGlb);
  assert.equal(check.identicalHierarchy, true);
  assert.equal(check.bitExactGeometryBytes, true);
  assert.equal(check.embeddedTexturesCount, 10);
});

test('tryAcquireWebGLContext and renderSpeakerSoftware2D handle disabled WebGL gracefully without throwing', () => {
  // Mock a canvas whose WebGL context creation is disabled (returns null)
  const mockCanvas = {
    getContext: () => null,
  } as unknown as HTMLCanvasElement;

  const acquired = tryAcquireWebGLContext(mockCanvas);
  assert.equal(acquired.gl, null);
  assert.equal(acquired.isSoftwareGl, true);

  // Verify 2D software renderer projects and draws triangles cleanly
  let drawnTriangles = 0;
  const mockCtx2D = {
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {
      drawnTriangles++;
    },
    stroke: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineJoin: 'round',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;

  const built = buildLeftSpeakerModel();
  const camera = new THREE.PerspectiveCamera(40, 1280 / 800, 0.1, 50);
  camera.position.set(0, -0.12, 4.75);
  camera.lookAt(0, -0.12, 0);

  renderSpeakerSoftware2D(mockCtx2D, 1280, 800, built.root, camera);
  assert.ok(drawnTriangles > 100, `Expected > 100 projected 3D triangles drawn in software 2D mode, got ${drawnTriangles}`);
  built.dispose();
});


