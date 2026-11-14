import fs from 'node:fs';
import path from 'node:path';
import { buildLeftSpeakerModel } from '../src/model/buildLeftSpeakerModel';
import { serializeSpeakerToGlbBinary } from '../src/model/glbBinaryWriter';
import {
  refineExistingSpeakerGlb,
  verifyGeometryPreservation,
} from '../src/model/refineSpeakerGlb';
import { validateGlbBuffer } from '../src/model/speakerSpec';

const rootDir = process.cwd();
const built = buildLeftSpeakerModel();
const glbBuffer = serializeSpeakerToGlbBinary(built.root);
const check = validateGlbBuffer(glbBuffer);

if (!check.valid) {
  throw new Error('Generated left_speaker.glb failed binary validation');
}

const publicLeftGlbPath = path.resolve(rootDir, 'public/left_speaker.glb');
fs.writeFileSync(publicLeftGlbPath, Buffer.from(glbBuffer));

console.log(
  `Phase 1/2 Left Speaker GLB generated: ${built.meshCount} meshes, ${built.vertexCount} vertices, ${built.triangleCount} triangles (${check.byteLength} bytes)`
);

const refinedBuffer = refineExistingSpeakerGlb(glbBuffer, 1024, 'L');
const refinedCheck = validateGlbBuffer(refinedBuffer);
if (!refinedCheck.valid) {
  throw new Error('Refined left_speaker_photorealistic.glb failed binary validation');
}

const preservation = verifyGeometryPreservation(glbBuffer, refinedBuffer);
console.log('Phase 3 Left Speaker Geometry & PBR Verification:', preservation);

const publicPhotoPath = path.resolve(
  rootDir,
  'public/left_speaker_photorealistic.glb'
);
fs.writeFileSync(publicPhotoPath, Buffer.from(refinedBuffer));

built.dispose();
