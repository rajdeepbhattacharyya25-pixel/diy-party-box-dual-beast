import fs from 'node:fs';
import path from 'node:path';
import { buildSpeakerModel } from '../src/model/buildSpeakerModel';
import { serializeSpeakerToGlbBinary } from '../src/model/glbBinaryWriter';
import { validateGlbBuffer } from '../src/model/speakerSpec';

const built = buildSpeakerModel();
const glbBuffer = serializeSpeakerToGlbBinary(built.root);
const check = validateGlbBuffer(glbBuffer);

if (!check.valid) {
  throw new Error(`Generated GLB failed validation: ${JSON.stringify(check)}`);
}

const publicOut = path.resolve(process.cwd(), 'public', 'speaker.glb');

fs.mkdirSync(path.dirname(publicOut), { recursive: true });
fs.writeFileSync(publicOut, Buffer.from(glbBuffer));

console.log(
  `Generated public/speaker.glb (${check.byteLength.toLocaleString()} bytes, ${built.meshCount} meshes, ${built.vertexCount.toLocaleString()} vertices, ${built.triangleCount.toLocaleString()} triangles)`
);
built.dispose();
