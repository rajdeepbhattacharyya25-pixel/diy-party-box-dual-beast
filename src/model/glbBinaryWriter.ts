import * as THREE from 'three';

/**
 * Pure, dependency-free binary glTF 2.0 (.glb) serializer that converts a
 * Three.js Object3D / Group hierarchy of Meshes and PBR Materials into a
 * standards-compliant glTF 2.0 binary container suitable for Blender, Three.js
 * GLTFLoader, Babylon.js, and any 3D viewer.
 *
 * Works identically in Node.js (for CLI generation & unit tests) and in the browser.
 */
export function serializeSpeakerToGlbBinary(root: THREE.Object3D): ArrayBuffer {
  root.updateMatrixWorld(true);

  const meshes: {
    name: string;
    geometry: THREE.BufferGeometry;
    material: THREE.MeshStandardMaterial;
  }[] = [];

  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      const clonedGeo = mesh.geometry.clone();
      clonedGeo.applyMatrix4(mesh.matrixWorld);
      if (!clonedGeo.attributes.normal) {
        clonedGeo.computeVertexNormals();
      }
      const mat = Array.isArray(mesh.material)
        ? (mesh.material[0] as THREE.MeshStandardMaterial)
        : (mesh.material as THREE.MeshStandardMaterial);

      meshes.push({
        name: mesh.name || `Speaker_Mesh_${meshes.length}`,
        geometry: clonedGeo,
        material: mat,
      });
    }
  });

  const bufferViews: {
    buffer: number;
    byteOffset: number;
    byteLength: number;
    target?: number;
  }[] = [];
  const accessors: {
    bufferView: number;
    byteOffset: number;
    componentType: number;
    count: number;
    type: string;
    min?: number[];
    max?: number[];
  }[] = [];
  const gltfMaterials: {
    name: string;
    pbrMetallicRoughness: {
      baseColorFactor: [number, number, number, number];
      metallicFactor: number;
      roughnessFactor: number;
    };
    emissiveFactor?: [number, number, number];
    doubleSided?: boolean;
  }[] = [];
  const gltfMeshes: {
    name: string;
    primitives: {
      attributes: Record<string, number>;
      indices?: number;
      material: number;
    }[];
  }[] = [];
  const gltfNodes: {
    name: string;
    mesh?: number;
    children?: number[];
  }[] = [];

  const materialIndexMap = new Map<THREE.Material, number>();
  const binaryChunks: Uint8Array[] = [];
  let currentByteOffset = 0;

  const appendBinaryChunk = (bytes: Uint8Array, target?: number): number => {
    const pad = (4 - (bytes.byteLength % 4)) % 4;
    const alignedLength = bytes.byteLength + pad;
    const chunk = new Uint8Array(alignedLength);
    chunk.set(bytes, 0);

    const viewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentByteOffset,
      byteLength: bytes.byteLength,
      ...(target !== undefined ? { target } : {}),
    });

    binaryChunks.push(chunk);
    currentByteOffset += alignedLength;
    return viewIdx;
  };

  for (let i = 0; i < meshes.length; i++) {
    const { name, geometry, material } = meshes[i];

    let matIdx = materialIndexMap.get(material);
    if (matIdx === undefined) {
      matIdx = gltfMaterials.length;
      materialIndexMap.set(material, matIdx);

      // If material uses a white multiplier over a dark procedural map, use realistic dark charcoal fallback color for untextured viewers
      let c = material.color ? material.color.clone() : new THREE.Color(0.12, 0.12, 0.14);
      if (
        material.name === 'Mat_Enclosure_Textured_Black' ||
        material.name === 'Mat_Electronics_Module_Back_GoldStreaks' ||
        material.name === 'Mat_Electronics_Module_Top_GoldMarkings'
      ) {
        c = new THREE.Color(0x181a1d);
      } else if (material.name === 'Mat_Top_Silver_R_Foil') {
        c = new THREE.Color(0xd6d9df);
      }

      const emissive = material.emissive
        ? ([material.emissive.r, material.emissive.g, material.emissive.b] as [
            number,
            number,
            number,
          ])
        : ([0, 0, 0] as [number, number, number]);

      gltfMaterials.push({
        name: material.name || `Material_${matIdx}`,
        pbrMetallicRoughness: {
          baseColorFactor: [c.r, c.g, c.b, 1.0],
          metallicFactor:
            typeof material.metalness === 'number' ? material.metalness : 0.1,
          roughnessFactor:
            typeof material.roughness === 'number' ? material.roughness : 0.7,
        },
        emissiveFactor: emissive,
        doubleSided: true,
      });
    }

    const posAttr = geometry.attributes.position;
    const normAttr = geometry.attributes.normal;
    const uvAttr = geometry.attributes.uv;
    const indexAttr = geometry.index;

    // 1. POSITION attribute
    const posArray = new Float32Array(posAttr.count * 3);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let v = 0; v < posAttr.count; v++) {
      const x = posAttr.getX(v);
      const y = posAttr.getY(v);
      const z = posAttr.getZ(v);
      posArray[v * 3] = x;
      posArray[v * 3 + 1] = y;
      posArray[v * 3 + 2] = z;
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
    const posViewIdx = appendBinaryChunk(
      new Uint8Array(posArray.buffer),
      34962 // ARRAY_BUFFER
    );
    const posAccIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: posAttr.count,
      type: 'VEC3',
      min,
      max,
    });

    const primitiveAttrs: Record<string, number> = {
      POSITION: posAccIdx,
    };

    // 2. NORMAL attribute
    if (normAttr) {
      const normArray = new Float32Array(normAttr.count * 3);
      for (let v = 0; v < normAttr.count; v++) {
        const nx = normAttr.getX(v);
        const ny = normAttr.getY(v);
        const nz = normAttr.getZ(v);
        const len = Math.hypot(nx, ny, nz) || 1;
        normArray[v * 3] = nx / len;
        normArray[v * 3 + 1] = ny / len;
        normArray[v * 3 + 2] = nz / len;
      }
      const normViewIdx = appendBinaryChunk(
        new Uint8Array(normArray.buffer),
        34962
      );
      const normAccIdx = accessors.length;
      accessors.push({
        bufferView: normViewIdx,
        byteOffset: 0,
        componentType: 5126,
        count: normAttr.count,
        type: 'VEC3',
      });
      primitiveAttrs.NORMAL = normAccIdx;
    }

    // 3. TEXCOORD_0 attribute
    if (uvAttr) {
      const uvArray = new Float32Array(uvAttr.count * 2);
      for (let v = 0; v < uvAttr.count; v++) {
        uvArray[v * 2] = uvAttr.getX(v);
        uvArray[v * 2 + 1] = uvAttr.getY(v);
      }
      const uvViewIdx = appendBinaryChunk(
        new Uint8Array(uvArray.buffer),
        34962
      );
      const uvAccIdx = accessors.length;
      accessors.push({
        bufferView: uvViewIdx,
        byteOffset: 0,
        componentType: 5126,
        count: uvAttr.count,
        type: 'VEC2',
      });
      primitiveAttrs.TEXCOORD_0 = uvAccIdx;
    }

    // 4. INDICES
    let indicesAccIdx: number | undefined;
    if (indexAttr) {
      const idxArray = new Uint32Array(indexAttr.count);
      for (let k = 0; k < indexAttr.count; k++) {
        idxArray[k] = indexAttr.getX(k);
      }
      const idxViewIdx = appendBinaryChunk(
        new Uint8Array(idxArray.buffer),
        34963 // ELEMENT_ARRAY_BUFFER
      );
      indicesAccIdx = accessors.length;
      accessors.push({
        bufferView: idxViewIdx,
        byteOffset: 0,
        componentType: 5125, // UNSIGNED_INT
        count: indexAttr.count,
        type: 'SCALAR',
      });
    }

    const meshIdx = gltfMeshes.length;
    gltfMeshes.push({
      name,
      primitives: [
        {
          attributes: primitiveAttrs,
          ...(indicesAccIdx !== undefined ? { indices: indicesAccIdx } : {}),
          material: matIdx,
        },
      ],
    });

    gltfNodes.push({
      name,
      mesh: meshIdx,
    });

    geometry.dispose();
  }

  const rootNodeIdx = gltfNodes.length;
  gltfNodes.push({
    name: 'DIY_Speaker_Reconstruction_Root',
    children: gltfNodes.map((_, idx) => idx),
  });

  const gltfJson = {
    asset: {
      version: '2.0',
      generator: 'Three.js DIY Speaker 3D Reconstructor',
    },
    scene: 0,
    scenes: [
      {
        name: 'DIY_Speaker_Scene',
        nodes: [rootNodeIdx],
      },
    ],
    nodes: gltfNodes,
    meshes: gltfMeshes,
    materials: gltfMaterials,
    accessors,
    bufferViews,
    buffers: [
      {
        byteLength: currentByteOffset,
      },
    ],
  };

  const jsonEncoder = new TextEncoder();
  const rawJsonBytes = jsonEncoder.encode(JSON.stringify(gltfJson));
  const jsonPad = (4 - (rawJsonBytes.byteLength % 4)) % 4;
  const paddedJsonLength = rawJsonBytes.byteLength + jsonPad;
  const jsonChunkBytes = new Uint8Array(paddedJsonLength);
  jsonChunkBytes.set(rawJsonBytes, 0);
  for (let i = rawJsonBytes.byteLength; i < paddedJsonLength; i++) {
    jsonChunkBytes[i] = 0x20; // space padding per glTF 2.0 spec
  }

  const totalByteLength = 12 + 8 + paddedJsonLength + 8 + currentByteOffset;
  const outBuffer = new ArrayBuffer(totalByteLength);
  const outView = new DataView(outBuffer);
  const outBytes = new Uint8Array(outBuffer);

  // 12-byte GLB Header
  outView.setUint32(0, 0x46546c67, true); // 'glTF'
  outView.setUint32(4, 2, true); // version 2
  outView.setUint32(8, totalByteLength, true);

  // JSON Chunk Header + Payload
  outView.setUint32(12, paddedJsonLength, true);
  outView.setUint32(16, 0x4e4f534a, true); // 'JSON'
  outBytes.set(jsonChunkBytes, 20);

  // BIN Chunk Header + Payload
  const binHeaderOffset = 20 + paddedJsonLength;
  outView.setUint32(binHeaderOffset, currentByteOffset, true);
  outView.setUint32(binHeaderOffset + 4, 0x004e4942, true); // 'BIN\0'

  let writeOffset = binHeaderOffset + 8;
  for (const chunk of binaryChunks) {
    outBytes.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  }

  return outBuffer;
}
