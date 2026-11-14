import fs from 'node:fs';
import path from 'node:path';
import {
  refineExistingSpeakerGlb,
  verifyGeometryPreservation,
} from '../src/model/refineSpeakerGlb';
import { validateGlbBuffer } from '../src/model/speakerSpec';

const origPath = path.resolve(process.cwd(), 'public', 'speaker.glb');
if (!fs.existsSync(origPath)) {
  throw new Error('Original speaker.glb not found at /public/speaker.glb');
}

const origNodeBuf = fs.readFileSync(origPath);
const origArrayBuf = origNodeBuf.buffer.slice(
  origNodeBuf.byteOffset,
  origNodeBuf.byteOffset + origNodeBuf.byteLength
);

console.log(
  `Loaded original public/speaker.glb (${origArrayBuf.byteLength.toLocaleString()} bytes)`
);

// Refine materials and embed 2048x2048 (2K) enclosure PBR textures + component maps
const refinedArrayBuf = refineExistingSpeakerGlb(origArrayBuf, 2048);

const glbCheck = validateGlbBuffer(refinedArrayBuf);
if (!glbCheck.valid) {
  throw new Error(`Refined GLB failed validation: ${JSON.stringify(glbCheck)}`);
}

const preservation = verifyGeometryPreservation(origArrayBuf, refinedArrayBuf);
if (
  !preservation.identicalHierarchy ||
  preservation.identicalMeshCount < 70 ||
  !preservation.bitExactGeometryBytes ||
  preservation.embeddedTexturesCount < 10
) {
  throw new Error(
    `Geometry preservation verification failed: ${JSON.stringify(preservation)}`
  );
}

const publicOut = path.resolve(
  process.cwd(),
  'public',
  'speaker_photorealistic.glb'
);

fs.mkdirSync(path.dirname(publicOut), { recursive: true });
fs.writeFileSync(publicOut, Buffer.from(refinedArrayBuf));

console.log(
  JSON.stringify(
    {
      status: 'SUCCESS',
      originalFile: 'speaker.glb',
      originalSizeBytes: preservation.originalByteLength,
      refinedFile: 'speaker_photorealistic.glb',
      refinedSizeBytes: preservation.refinedByteLength,
      preservedMeshes: preservation.identicalMeshCount,
      preservedAccessors: preservation.identicalAccessorsCount,
      identicalHierarchy: preservation.identicalHierarchy,
      bitExactGeometryBytes: preservation.bitExactGeometryBytes,
      embeddedPngTextures: preservation.embeddedTexturesCount,
      pbrMaterialsCount: preservation.materialsCount,
    },
    null,
    2
  )
);
