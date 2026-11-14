import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { SPEAKER_DIMENSIONS } from './speakerSpec';
import { createSpeakerTextureSet, SpeakerTextureSet } from './speakerTextures';

export interface ExplodablePart {
  object: THREE.Object3D;
  basePosition: THREE.Vector3;
  explodeOffset: THREE.Vector3;
  face: 'enclosure' | 'front' | 'back' | 'left' | 'right' | 'top';
  label: string;
}

export interface BuiltSpeakerModel {
  root: THREE.Group;
  parts: ExplodablePart[];
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  textures: SpeakerTextureSet;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  dispose: () => void;
}

/**
 * Normalizes planar UVs on an ExtrudeGeometry so procedural tileable textures
 * map cleanly without stretching across faces.
 */
function normalizeExtrudeUVs(geometry: THREE.BufferGeometry, scale = 0.55) {
  const uvAttr = geometry.attributes.uv;
  if (!uvAttr) return;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(i, uvAttr.getX(i) * scale, uvAttr.getY(i) * scale);
  }
  uvAttr.needsUpdate = true;
}

/**
 * Builds the complete, multi-mesh 3D reconstruction of the DIY Speaker
 * matching all five reference photographs (FRONT, BACK, LEFT, RIGHT, TOP).
 */
export function buildSpeakerModel(
  maxAnisotropy = 4,
  onTextureReady?: () => void,
  sharedTextures?: SpeakerTextureSet
): BuiltSpeakerModel {
  const textures =
    sharedTextures || createSpeakerTextureSet(maxAnisotropy, onTextureReady);
  const ownsTextures = !sharedTextures;
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const parts: ExplodablePart[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const registerPart = (
    object: THREE.Object3D,
    explodeOffset: [number, number, number],
    face: ExplodablePart['face'],
    label: string
  ) => {
    parts.push({
      object,
      basePosition: object.position.clone(),
      explodeOffset: new THREE.Vector3(...explodeOffset),
      face,
      label,
    });
  };

  const root = new THREE.Group();
  root.name = 'DIY_Speaker_Reconstruction';

  const {
    width: W,
    height: H,
    depth: D,
    wallThickness: T,
    halfWidth: HW,
    halfHeight: HH,
    halfDepth: HD,
  } = SPEAKER_DIMENSIONS;

  // ============================================================================
  // SHARED PBR MATERIALS (PHOTOREALISTIC STUDIO CALIBRATION)
  // ============================================================================
  const enclosureMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Enclosure_Textured_Black',
      color: 0xffffff,
      map: textures.enclosureAlbedo,
      normalMap: textures.enclosureNormal,
      normalScale: new THREE.Vector2(0.55, 0.55),
      bumpMap: textures.enclosureBump,
      bumpScale: 0.011,
      roughnessMap: textures.enclosureRoughness,
      roughness: 0.84,
      metalness: 0.02,
    })
  );

  const rawBoardMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Raw_MDF_Cutout_Edge',
      color: 0x1c1916,
      bumpMap: textures.enclosureBump,
      bumpScale: 0.008,
      roughness: 0.88,
      metalness: 0.02,
    })
  );

  const wornCornerMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Worn_Cardboard_Edge_Seam',
      color: 0x6e583e,
      roughness: 0.82,
      metalness: 0.02,
    })
  );

  const interiorDarkMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Interior_Acoustic_Cavity',
      color: 0x08090b,
      roughness: 0.94,
      metalness: 0.01,
    })
  );

  const rubberSurroundMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Driver_Rubber_Surround',
      color: 0x1d1f23,
      bumpMap: textures.rubberSurroundBump,
      bumpScale: 0.003,
      roughness: 0.72,
      metalness: 0.02,
    })
  );

  const lowerConeSeamMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Lower_Driver_Cone_Seam',
      color: 0x4c4a46,
      roughness: 0.68,
      metalness: 0.02,
    })
  );

  const lowerDustCapMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Lower_Driver_Center_Cap',
      color: 0x222429,
      roughness: 0.52,
      metalness: 0.04,
    })
  );

  const paperConeMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Driver_Paper_Cone',
      color: 0xffffff,
      map: textures.driverConeAlbedo,
      bumpMap: textures.driverConeBump,
      bumpScale: 0.004,
      roughness: 0.54,
      metalness: 0.03,
      side: THREE.DoubleSide,
    })
  );

  const glossyDustCapMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Upper_Driver_Glossy_DustCap',
      color: 0x0f1013,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.82,
      clearcoatRoughness: 0.14,
    })
  );

  const ledDiffuserMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Front_White_LED_Diffuser_Ring',
      color: 0xffffff,
      map: textures.ledDiffuserAlbedo,
      emissive: 0x161513,
      emissiveIntensity: 0.14,
      roughness: 0.48,
      metalness: 0.0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.42,
    })
  );

  const moduleSideMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Electronics_Module_Glossy_Black',
      color: 0x18191c,
      bumpMap: textures.enclosureBump,
      bumpScale: 0.005,
      roughness: 0.68,
      metalness: 0.06,
      clearcoat: 0.06,
      clearcoatRoughness: 0.55,
    })
  );

  const moduleBackFaceMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Electronics_Module_Back_GoldStreaks',
      color: 0xffffff,
      map: textures.moduleBackAlbedo,
      roughnessMap: textures.moduleBackRoughness,
      metalnessMap: textures.moduleBackMetalness,
      bumpMap: textures.enclosureBump,
      bumpScale: 0.005,
      roughness: 0.56,
      metalness: 0.46,
      clearcoat: 0.08,
      clearcoatRoughness: 0.48,
    })
  );

  const moduleTopFaceMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Electronics_Module_Top_GoldMarkings',
      color: 0xffffff,
      map: textures.moduleTopAlbedo,
      roughnessMap: textures.moduleTopRoughness,
      bumpMap: textures.enclosureBump,
      bumpScale: 0.005,
      roughness: 0.58,
      metalness: 0.42,
      clearcoat: 0.08,
      clearcoatRoughness: 0.48,
    })
  );

  const controlPlateMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Back_Control_Panel_Plate',
      color: 0x151618,
      roughness: 0.75,
      metalness: 0.04,
      clearcoat: 0.06,
      clearcoatRoughness: 0.55,
    })
  );

  const copperTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Copper_Cutout_Rim',
      color: 0x8e5a30,
      roughness: 0.38,
      metalness: 0.65,
    })
  );

  const chromeMetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Chrome_Switch_Hardware',
      color: 0xafb4bc,
      roughness: 0.36,
      metalness: 0.72,
    })
  );

  const redButtonMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Red_Push_Button',
      color: 0xb8221d,
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.38,
    })
  );

  const blueCapsuleMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Blue_Wire_Connector_Sleeve',
      color: 0x2668a8,
      roughness: 0.68,
      metalness: 0.02,
      clearcoat: 0.05,
      clearcoatRoughness: 0.55,
    })
  );

  const silverFoilMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Top_Silver_R_Foil',
      color: 0xffffff,
      map: textures.silverFoilAlbedo,
      roughnessMap: textures.silverFoilRoughness,
      bumpMap: textures.silverFoilAlbedo,
      bumpScale: 0.003,
      roughness: 0.38,
      metalness: 0.68,
    })
  );

  // ============================================================================
  // 1. ENCLOSURE CABINET (WITH GENUINE 3D CUTOUTS ON ALL FACES)
  // ============================================================================
  const enclosureGroup = new THREE.Group();
  enclosureGroup.name = 'Enclosure_Cabinet_Group';
  root.add(enclosureGroup);

  // Inner dark acoustic core box recessed well behind all front/side driver cones
  const innerCoreGeo = trackGeo(
    new THREE.BoxGeometry(W - T * 4.5, H - T * 4.5, D - T * 4.5)
  );
  const innerCoreMesh = new THREE.Mesh(innerCoreGeo, interiorDarkMat);
  innerCoreMesh.name = 'Enclosure_Interior_Core';
  enclosureGroup.add(innerCoreMesh);

  // 1A. FRONT BAFFLE WALL (+Z) with 2 circular driver cutouts
  const frontShape = new THREE.Shape();
  frontShape.moveTo(-HW, -HH);
  frontShape.lineTo(HW, -HH);
  frontShape.lineTo(HW, HH);
  frontShape.lineTo(-HW, HH);
  frontShape.closePath();

  const upperHole = new THREE.Path();
  upperHole.absarc(
    0,
    SPEAKER_DIMENSIONS.frontUpperDriver.centerY,
    SPEAKER_DIMENSIONS.frontUpperDriver.cutoutRadius,
    0,
    Math.PI * 2,
    true
  );
  frontShape.holes.push(upperHole);

  const lowerHole = new THREE.Path();
  lowerHole.absarc(
    0,
    SPEAKER_DIMENSIONS.frontLowerDriver.centerY,
    SPEAKER_DIMENSIONS.frontLowerDriver.cutoutRadius,
    0,
    Math.PI * 2,
    true
  );
  frontShape.holes.push(lowerHole);

  const frontWallGeo = trackGeo(
    new THREE.ExtrudeGeometry(frontShape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 48,
    })
  );
  normalizeExtrudeUVs(frontWallGeo);
  const frontWallMesh = new THREE.Mesh(frontWallGeo, [enclosureMat, rawBoardMat]);
  frontWallMesh.name = 'Enclosure_Front_Baffle';
  frontWallMesh.position.set(0, 0, HD - T);
  frontWallMesh.castShadow = true;
  frontWallMesh.receiveShadow = true;
  enclosureGroup.add(frontWallMesh);
  registerPart(frontWallMesh, [0, 0, 0.22], 'enclosure', 'Front Baffle Wall');

  // 1B. BACK WALL (-Z) with rectangular cutout for recessed control panel
  const backShape = new THREE.Shape();
  backShape.moveTo(-HW, -HH);
  backShape.lineTo(HW, -HH);
  backShape.lineTo(HW, HH);
  backShape.lineTo(-HW, HH);
  backShape.closePath();

  const { minX: rMinX, maxX: rMaxX, minY: rMinY, maxY: rMaxY } =
    SPEAKER_DIMENSIONS.backControlRecess;
  const panelHole = new THREE.Path();
  // Note: back wall is rotated 180 deg around Y, so local X is inverted relative to world X
  panelHole.moveTo(-rMaxX, rMinY);
  panelHole.lineTo(-rMinX, rMinY);
  panelHole.lineTo(-rMinX, rMaxY);
  panelHole.lineTo(-rMaxX, rMaxY);
  panelHole.closePath();
  backShape.holes.push(panelHole);

  const backWallGeo = trackGeo(
    new THREE.ExtrudeGeometry(backShape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
    })
  );
  normalizeExtrudeUVs(backWallGeo);
  const backWallMesh = new THREE.Mesh(backWallGeo, [enclosureMat, rawBoardMat]);
  backWallMesh.name = 'Enclosure_Back_Wall';
  backWallMesh.rotation.y = Math.PI;
  backWallMesh.position.set(0, 0, -HD + T);
  backWallMesh.castShadow = true;
  backWallMesh.receiveShadow = true;
  enclosureGroup.add(backWallMesh);
  registerPart(backWallMesh, [0, 0, -0.22], 'enclosure', 'Back Enclosure Wall');

  // 1C. LEFT SIDE WALL (+X, shown in R_left.jpeg) with circular bass-reflex cutout
  const leftShape = new THREE.Shape();
  leftShape.moveTo(-HD, -HH);
  leftShape.lineTo(HD, -HH);
  leftShape.lineTo(HD, HH);
  leftShape.lineTo(-HD, HH);
  leftShape.closePath();

  const leftPortHole = new THREE.Path();
  leftPortHole.absarc(
    0,
    SPEAKER_DIMENSIONS.leftBassPort.centerY,
    SPEAKER_DIMENSIONS.leftBassPort.cutoutRadius,
    0,
    Math.PI * 2,
    true
  );
  leftShape.holes.push(leftPortHole);

  const leftWallGeo = trackGeo(
    new THREE.ExtrudeGeometry(leftShape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 48,
    })
  );
  normalizeExtrudeUVs(leftWallGeo);
  const leftWallMesh = new THREE.Mesh(leftWallGeo, [enclosureMat, rawBoardMat]);
  leftWallMesh.name = 'Enclosure_Left_Wall';
  leftWallMesh.rotation.y = Math.PI / 2;
  leftWallMesh.position.set(HW - T, 0, 0);
  leftWallMesh.castShadow = true;
  leftWallMesh.receiveShadow = true;
  enclosureGroup.add(leftWallMesh);
  registerPart(leftWallMesh, [0.22, 0, 0], 'enclosure', 'Left Enclosure Wall (+X)');

  // 1D. RIGHT SIDE WALL (-X, shown in R_right.jpeg) with circular bass-reflex cutout
  const rightShape = new THREE.Shape();
  rightShape.moveTo(-HD, -HH);
  rightShape.lineTo(HD, -HH);
  rightShape.lineTo(HD, HH);
  rightShape.lineTo(-HD, HH);
  rightShape.closePath();

  const rightPortHole = new THREE.Path();
  rightPortHole.absarc(
    0,
    SPEAKER_DIMENSIONS.rightBassPort.centerY,
    SPEAKER_DIMENSIONS.rightBassPort.cutoutRadius,
    0,
    Math.PI * 2,
    true
  );
  rightShape.holes.push(rightPortHole);

  const rightWallGeo = trackGeo(
    new THREE.ExtrudeGeometry(rightShape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 48,
    })
  );
  normalizeExtrudeUVs(rightWallGeo);
  const rightWallMesh = new THREE.Mesh(rightWallGeo, [enclosureMat, rawBoardMat]);
  rightWallMesh.name = 'Enclosure_Right_Wall';
  rightWallMesh.rotation.y = -Math.PI / 2;
  rightWallMesh.position.set(-HW + T, 0, 0);
  rightWallMesh.castShadow = true;
  rightWallMesh.receiveShadow = true;
  enclosureGroup.add(rightWallMesh);
  registerPart(rightWallMesh, [-0.22, 0, 0], 'enclosure', 'Right Enclosure Wall (-X)');

  // 1E. TOP WALL (+Y, shown in R_top.jpeg) with central rectangular recessed trench
  const topShape = new THREE.Shape();
  topShape.moveTo(-HW, -HD);
  topShape.lineTo(HW, -HD);
  topShape.lineTo(HW, HD);
  topShape.lineTo(-HW, HD);
  topShape.closePath();

  const {
    minX: tMinX,
    maxX: tMaxX,
    minZ: tMinZ,
    maxZ: tMaxZ,
  } = SPEAKER_DIMENSIONS.topRecessedPanel;
  const topPanelHole = new THREE.Path();
  // Note: rotated -PI/2 around X maps local (x, y) -> world (x, -z)
  topPanelHole.moveTo(tMinX, -tMaxZ);
  topPanelHole.lineTo(tMaxX, -tMaxZ);
  topPanelHole.lineTo(tMaxX, -tMinZ);
  topPanelHole.lineTo(tMinX, -tMinZ);
  topPanelHole.closePath();
  topShape.holes.push(topPanelHole);

  const topWallGeo = trackGeo(
    new THREE.ExtrudeGeometry(topShape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
    })
  );
  normalizeExtrudeUVs(topWallGeo);
  const topWallMesh = new THREE.Mesh(topWallGeo, [enclosureMat, rawBoardMat]);
  topWallMesh.name = 'Enclosure_Top_Wall';
  topWallMesh.rotation.x = -Math.PI / 2;
  topWallMesh.position.set(0, HH - T, 0);
  topWallMesh.castShadow = true;
  topWallMesh.receiveShadow = true;
  enclosureGroup.add(topWallMesh);
  registerPart(topWallMesh, [0, 0.22, 0], 'enclosure', 'Top Enclosure Wall');

  // 1F. BOTTOM WALL (-Y)
  const bottomWallGeo = trackGeo(new THREE.BoxGeometry(W, T, D));
  const bottomWallMesh = new THREE.Mesh(bottomWallGeo, enclosureMat);
  bottomWallMesh.name = 'Enclosure_Bottom_Wall';
  bottomWallMesh.position.set(0, -HH + T * 0.5, 0);
  bottomWallMesh.castShadow = true;
  bottomWallMesh.receiveShadow = true;
  enclosureGroup.add(bottomWallMesh);
  registerPart(bottomWallMesh, [0, -0.22, 0], 'enclosure', 'Bottom Enclosure Base');

  // 1G. Subtle Worn Edge / Corner Board Seams (matching slight golden-tan edge wear in photos)
  const edgeWearGroup = new THREE.Group();
  edgeWearGroup.name = 'Enclosure_Edge_Wear_Trim';
  const cornerVertGeo = trackGeo(new THREE.BoxGeometry(0.011, H * 0.995, 0.011));
  const cornerHorizGeo = trackGeo(new THREE.BoxGeometry(W * 0.995, 0.011, 0.011));
  const cornerDepthGeo = trackGeo(new THREE.BoxGeometry(0.011, 0.011, D * 0.995));

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const vEdge = new THREE.Mesh(cornerVertGeo, wornCornerMat);
      vEdge.name = `Edge_Seam_Vertical_${sx > 0 ? 'L' : 'R'}_${sz > 0 ? 'F' : 'B'}`;
      vEdge.position.set(sx * (HW - 0.002), 0, sz * (HD - 0.002));
      edgeWearGroup.add(vEdge);
    }
    for (const sy of [-1, 1]) {
      const dEdge = new THREE.Mesh(cornerDepthGeo, wornCornerMat);
      dEdge.name = `Edge_Seam_Depth_${sx > 0 ? 'L' : 'R'}_${sy > 0 ? 'T' : 'B'}`;
      dEdge.position.set(sx * (HW - 0.002), sy * (HH - 0.002), 0);
      edgeWearGroup.add(dEdge);
    }
  }
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const hEdge = new THREE.Mesh(cornerHorizGeo, wornCornerMat);
      hEdge.name = `Edge_Seam_Horiz_${sy > 0 ? 'T' : 'B'}_${sz > 0 ? 'F' : 'B'}`;
      hEdge.position.set(0, sy * (HH - 0.002), sz * (HD - 0.002));
      edgeWearGroup.add(hEdge);
    }
  }
  enclosureGroup.add(edgeWearGroup);

  // ============================================================================
  // 2. FRONT VIEW COMPONENTS (+Z): 2 SPEAKER DRIVERS + 1 CENTRAL LED RING
  // ============================================================================
  const frontGroup = new THREE.Group();
  frontGroup.name = 'Front_Face_Components';
  root.add(frontGroup);

  // 2A. UPPER SPEAKER DRIVER (Center at Y = +0.62, Z = +0.70)
  const upperY = SPEAKER_DIMENSIONS.frontUpperDriver.centerY;

  // Rear acoustic backplate behind upper driver cone
  const upperBackplateGeo = trackGeo(new THREE.CircleGeometry(0.35, 48));
  const upperBackplateMesh = new THREE.Mesh(upperBackplateGeo, interiorDarkMat);
  upperBackplateMesh.name = 'Front_Upper_Driver_Backplate';
  upperBackplateMesh.position.set(0, upperY, 0.50);
  frontGroup.add(upperBackplateMesh);

  // Recessed inner collar wall
  const upperBasketGeo = trackGeo(
    new THREE.CylinderGeometry(0.352, 0.34, 0.09, 48, 1, true)
  );
  upperBasketGeo.rotateX(Math.PI / 2);
  const upperBasketMesh = new THREE.Mesh(upperBasketGeo, rawBoardMat);
  upperBasketMesh.name = 'Front_Upper_Driver_Basket';
  upperBasketMesh.position.set(0, upperY, HD - 0.045);
  frontGroup.add(upperBasketMesh);
  registerPart(
    upperBasketMesh,
    [0, 0.04, 0.38],
    'front',
    'Upper Driver Mounting Collar'
  );

  // Outer rubber half-roll surround ring
  const upperSurroundGeo = trackGeo(
    new THREE.TorusGeometry(0.318, 0.028, 24, 64)
  );
  upperSurroundGeo.scale(1, 1, 0.65);
  const upperSurroundMesh = new THREE.Mesh(upperSurroundGeo, rubberSurroundMat);
  upperSurroundMesh.name = 'Front_Upper_Driver_Surround';
  upperSurroundMesh.position.set(0, upperY, HD - 0.018);
  frontGroup.add(upperSurroundMesh);
  registerPart(
    upperSurroundMesh,
    [0, 0.04, 0.48],
    'front',
    'Upper Driver Rubber Surround'
  );

  // Conical matte black paper speaker diaphragm (LatheGeometry)
  const upperConePoints = [
    new THREE.Vector2(0.095, 0.565),
    new THREE.Vector2(0.14, 0.585),
    new THREE.Vector2(0.21, 0.622),
    new THREE.Vector2(0.298, 0.676),
  ];
  const upperConeGeo = trackGeo(new THREE.LatheGeometry(upperConePoints, 64));
  upperConeGeo.rotateX(Math.PI / 2);
  const upperConeMesh = new THREE.Mesh(upperConeGeo, paperConeMat);
  upperConeMesh.name = 'Front_Upper_Driver_Cone';
  upperConeMesh.position.set(0, upperY, 0);
  frontGroup.add(upperConeMesh);
  registerPart(
    upperConeMesh,
    [0, 0.04, 0.56],
    'front',
    'Upper Driver Paper Cone'
  );

  // High-gloss spherical center dome dust cap
  const upperDustCapGeo = trackGeo(
    new THREE.SphereGeometry(0.118, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.46)
  );
  upperDustCapGeo.rotateX(Math.PI / 2);
  const upperDustCapMesh = new THREE.Mesh(upperDustCapGeo, glossyDustCapMat);
  upperDustCapMesh.name = 'Front_Upper_Driver_DustCap';
  upperDustCapMesh.position.set(0, upperY, 0.542);
  frontGroup.add(upperDustCapMesh);
  registerPart(
    upperDustCapMesh,
    [0, 0.04, 0.66],
    'front',
    'Upper Driver Glossy Dome Dust Cap'
  );

  // Glossy adhesive collar ring around base of upper dust cap
  const upperCollarGeo = trackGeo(
    new THREE.TorusGeometry(0.112, 0.008, 20, 64)
  );
  upperCollarGeo.scale(1, 1, 0.65);
  const upperCollarMesh = new THREE.Mesh(upperCollarGeo, glossyDustCapMat);
  upperCollarMesh.name = 'Front_Upper_Driver_DustCap_Collar';
  upperCollarMesh.position.set(0, upperY, 0.580);
  frontGroup.add(upperCollarMesh);

  // Signature two black glossy adhesive voice-coil lead-wire droplets below upper dust cap
  const leadGlueGeo = trackGeo(new THREE.CapsuleGeometry(0.015, 0.054, 10, 18));
  const leadGlueLeft = new THREE.Mesh(leadGlueGeo, glossyDustCapMat);
  leadGlueLeft.name = 'Front_Upper_Driver_LeadGlue_Left';
  leadGlueLeft.position.set(-0.044, upperY - 0.125, 0.618);
  leadGlueLeft.rotation.set(0.38, 0.12, -0.52);
  frontGroup.add(leadGlueLeft);
  registerPart(
    leadGlueLeft,
    [-0.02, 0.03, 0.72],
    'front',
    'Upper Driver Left Voice-Coil Lead Dress'
  );

  const leadGlueRight = new THREE.Mesh(leadGlueGeo, glossyDustCapMat);
  leadGlueRight.name = 'Front_Upper_Driver_LeadGlue_Right';
  leadGlueRight.position.set(0.044, upperY - 0.125, 0.618);
  leadGlueRight.rotation.set(0.38, -0.12, 0.52);
  frontGroup.add(leadGlueRight);
  registerPart(
    leadGlueRight,
    [0.02, 0.03, 0.72],
    'front',
    'Upper Driver Right Voice-Coil Lead Dress'
  );

  // 2B. CENTRAL WHITE TRANSLUCENT LED DIFFUSER RING (Center at Y = -0.08, Z = +0.702)
  const ledY = SPEAKER_DIMENSIONS.frontLedRing.centerY;
  const ledRingShape = new THREE.Shape();
  ledRingShape.absarc(
    0,
    0,
    SPEAKER_DIMENSIONS.frontLedRing.outerRadius,
    0,
    Math.PI * 2,
    false
  );
  const ledInnerHole = new THREE.Path();
  ledInnerHole.absarc(
    0,
    0,
    SPEAKER_DIMENSIONS.frontLedRing.innerRadius,
    0,
    Math.PI * 2,
    true
  );
  ledRingShape.holes.push(ledInnerHole);

  const ledRingGeo = trackGeo(
    new THREE.ExtrudeGeometry(ledRingShape, {
      depth: SPEAKER_DIMENSIONS.frontLedRing.thickness,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 64,
    })
  );
  const ledRingMesh = new THREE.Mesh(ledRingGeo, ledDiffuserMat);
  ledRingMesh.name = 'Front_Center_LED_Ring';
  ledRingMesh.position.set(0, ledY, HD - 0.002);
  frontGroup.add(ledRingMesh);
  registerPart(
    ledRingMesh,
    [0, 0, 0.52],
    'front',
    'Front Central White LED Diffuser Ring'
  );

  // 2C. LOWER SMALLER SPEAKER DRIVER (Cutout at Y = -0.76; driver shifted +0.022 Y inside recessed cutout)
  const lowerY = SPEAKER_DIMENSIONS.frontLowerDriver.centerY;
  const lowerDriverY = lowerY + 0.022; // Off-center upward mounting exposing bottom stepped rough ledge

  // Rear dark acoustic backplate well behind the lower speaker cone
  const lowerBackplateGeo = trackGeo(new THREE.CircleGeometry(0.23, 48));
  const lowerBackplateMesh = new THREE.Mesh(lowerBackplateGeo, interiorDarkMat);
  lowerBackplateMesh.name = 'Front_Lower_Driver_Backplate';
  lowerBackplateMesh.position.set(0, lowerY, 0.52);
  frontGroup.add(lowerBackplateMesh);

  // Deeply recessed cutout cylindrical wall with raw cut edge
  const lowerRecessGeo = trackGeo(
    new THREE.CylinderGeometry(0.225, 0.218, 0.095, 48, 1, true)
  );
  lowerRecessGeo.rotateX(Math.PI / 2);
  const lowerRecessMesh = new THREE.Mesh(lowerRecessGeo, rawBoardMat);
  lowerRecessMesh.name = 'Front_Lower_Driver_Recess_Wall';
  lowerRecessMesh.position.set(0, lowerY, HD - 0.048);
  frontGroup.add(lowerRecessMesh);
  registerPart(
    lowerRecessMesh,
    [0, -0.04, 0.38],
    'front',
    'Lower Driver Recessed Baffle Wall'
  );

  // Stepped rough-cut crescent floor at bottom of cutout hole (visible between outer hole and off-center driver)
  const lowerSteppedLedgeGeo = trackGeo(
    new THREE.RingGeometry(0.145, 0.226, 64)
  );
  const lowerSteppedLedgeMesh = new THREE.Mesh(lowerSteppedLedgeGeo, rawBoardMat);
  lowerSteppedLedgeMesh.name = 'Front_Lower_Driver_Stepped_Ledge';
  lowerSteppedLedgeMesh.position.set(0, lowerY, HD - 0.056);
  frontGroup.add(lowerSteppedLedgeMesh);

  // Worn tan/ochre raw-board wood-fiber specks along bottom arc of lower cutout (as seen in R_front)
  const lowerRimBezelGeo = trackGeo(
    new THREE.TorusGeometry(0.224, 0.0055, 12, 48, Math.PI * 0.88)
  );
  const lowerRimBezelMesh = new THREE.Mesh(lowerRimBezelGeo, wornCornerMat);
  lowerRimBezelMesh.name = 'Front_Lower_Driver_RawRim';
  lowerRimBezelMesh.position.set(0, lowerY, HD - 0.003);
  lowerRimBezelMesh.rotation.z = Math.PI * 1.06;
  frontGroup.add(lowerRimBezelMesh);
  registerPart(
    lowerRimBezelMesh,
    [0, -0.04, 0.42],
    'front',
    'Lower Driver Cutout Rim Wear'
  );

  // Outer recessed gasket flange around the smaller speaker driver
  const lowerGasketGeo = trackGeo(
    new THREE.TorusGeometry(0.190, 0.010, 18, 64)
  );
  lowerGasketGeo.scale(1, 1, 0.55);
  const lowerGasketMesh = new THREE.Mesh(lowerGasketGeo, rawBoardMat);
  lowerGasketMesh.name = 'Front_Lower_Driver_Outer_Gasket';
  lowerGasketMesh.position.set(0, lowerDriverY, HD - 0.050);
  frontGroup.add(lowerGasketMesh);

  // Plump rounded dark-charcoal rubber half-roll surround inside the recess
  const lowerSurroundGeo = trackGeo(
    new THREE.TorusGeometry(0.163, 0.025, 28, 64)
  );
  lowerSurroundGeo.scale(1, 1, 0.72);
  const lowerSurroundMesh = new THREE.Mesh(lowerSurroundGeo, rubberSurroundMat);
  lowerSurroundMesh.name = 'Front_Lower_Driver_Surround';
  lowerSurroundMesh.position.set(0, lowerDriverY, HD - 0.042);
  frontGroup.add(lowerSurroundMesh);
  registerPart(
    lowerSurroundMesh,
    [0, -0.04, 0.50],
    'front',
    'Lower Driver Rubber Surround'
  );

  // Pale greyish-taupe adhesive seam ring between rubber surround inner edge and paper cone
  const lowerConeSeamGeo = trackGeo(
    new THREE.TorusGeometry(0.138, 0.0042, 16, 64)
  );
  lowerConeSeamGeo.scale(1, 1, 0.55);
  const lowerConeSeamMesh = new THREE.Mesh(lowerConeSeamGeo, lowerConeSeamMat);
  lowerConeSeamMesh.name = 'Front_Lower_Driver_Cone_Seam_Ring';
  lowerConeSeamMesh.position.set(0, lowerDriverY, HD - 0.044);
  frontGroup.add(lowerConeSeamMesh);

  // Deep conical matte dark-graphite paper speaker cone
  const lowerConePoints = [
    new THREE.Vector2(0.055, 0.598),
    new THREE.Vector2(0.085, 0.616),
    new THREE.Vector2(0.115, 0.636),
    new THREE.Vector2(0.140, 0.654),
  ];
  const lowerConeGeo = trackGeo(new THREE.LatheGeometry(lowerConePoints, 64));
  lowerConeGeo.rotateX(Math.PI / 2);
  const lowerConeMesh = new THREE.Mesh(lowerConeGeo, paperConeMat);
  lowerConeMesh.name = 'Front_Lower_Driver_Cone';
  lowerConeMesh.position.set(0, lowerDriverY, 0);
  frontGroup.add(lowerConeMesh);
  registerPart(
    lowerConeMesh,
    [0, -0.04, 0.58],
    'front',
    'Lower Driver Paper Cone'
  );

  // Two small dark voice-coil lead-wire eyelets on upper half (11 o'clock and 1 o'clock) of lower cone
  const lowerEyeletGeo = trackGeo(new THREE.CapsuleGeometry(0.0075, 0.016, 8, 12));
  const lowerEyeletLeft = new THREE.Mesh(lowerEyeletGeo, interiorDarkMat);
  lowerEyeletLeft.name = 'Front_Lower_Driver_LeadEyelet_Left';
  lowerEyeletLeft.position.set(-0.032, lowerDriverY + 0.086, 0.634);
  lowerEyeletLeft.rotation.set(0.35, 0.15, 0.45);
  frontGroup.add(lowerEyeletLeft);

  const lowerEyeletRight = new THREE.Mesh(lowerEyeletGeo, interiorDarkMat);
  lowerEyeletRight.name = 'Front_Lower_Driver_LeadEyelet_Right';
  lowerEyeletRight.position.set(0.032, lowerDriverY + 0.086, 0.634);
  lowerEyeletRight.rotation.set(0.35, -0.15, -0.45);
  frontGroup.add(lowerEyeletRight);

  // Concentric raised outer collar ridge around the lower driver's center dust cap
  const lowerCapCollarGeo = trackGeo(
    new THREE.TorusGeometry(0.055, 0.0072, 24, 64)
  );
  lowerCapCollarGeo.scale(1, 1, 0.78);
  const lowerCapCollarMesh = new THREE.Mesh(lowerCapCollarGeo, lowerDustCapMat);
  lowerCapCollarMesh.name = 'Front_Lower_Driver_DustCap_Collar';
  lowerCapCollarMesh.position.set(0, lowerDriverY, 0.610);
  frontGroup.add(lowerCapCollarMesh);

  // Concentric 2-tier center cap with recessed dark groove and raised central button dome
  const lowerCapPoints = [
    new THREE.Vector2(0.0, 0.621),
    new THREE.Vector2(0.022, 0.620),
    new THREE.Vector2(0.038, 0.615),
    new THREE.Vector2(0.044, 0.606),
    new THREE.Vector2(0.047, 0.596),
    new THREE.Vector2(0.053, 0.598),
    new THREE.Vector2(0.058, 0.608),
  ];
  const lowerCapGeo = trackGeo(new THREE.LatheGeometry(lowerCapPoints, 48));
  lowerCapGeo.rotateX(Math.PI / 2);
  const lowerCapMesh = new THREE.Mesh(lowerCapGeo, lowerDustCapMat);
  lowerCapMesh.name = 'Front_Lower_Driver_DustCap';
  lowerCapMesh.position.set(0, lowerDriverY, 0);
  frontGroup.add(lowerCapMesh);
  registerPart(
    lowerCapMesh,
    [0, -0.04, 0.66],
    'front',
    'Lower Driver Center Dust Cap'
  );

  // ============================================================================
  // 3. BACK VIEW COMPONENTS (-Z): RAISED ELECTRONICS MODULE, RECESSED PANEL & WIRING
  // ============================================================================
  const backGroup = new THREE.Group();
  backGroup.name = 'Back_Face_Components';
  root.add(backGroup);

  // 3A. RAISED UPPER-LEFT ELECTRONICS MODULE (Protrudes to z = -0.92, flush with +X and +Y)
  const modW =
    SPEAKER_DIMENSIONS.backRaisedModule.maxX -
    SPEAKER_DIMENSIONS.backRaisedModule.minX; // 0.69
  const modH =
    SPEAKER_DIMENSIONS.backRaisedModule.maxY -
    SPEAKER_DIMENSIONS.backRaisedModule.minY; // 0.445
  const modD =
    SPEAKER_DIMENSIONS.backRaisedModule.maxZ -
    SPEAKER_DIMENSIONS.backRaisedModule.minZ; // 0.23
  const modCenterX =
    (SPEAKER_DIMENSIONS.backRaisedModule.minX +
      SPEAKER_DIMENSIONS.backRaisedModule.maxX) *
    0.5;
  const modCenterY =
    (SPEAKER_DIMENSIONS.backRaisedModule.minY +
      SPEAKER_DIMENSIONS.backRaisedModule.maxY) *
    0.5;
  const modCenterZ =
    (SPEAKER_DIMENSIONS.backRaisedModule.minZ +
      SPEAKER_DIMENSIONS.backRaisedModule.maxZ) *
    0.5;

  const moduleBoxGeo = trackGeo(new THREE.BoxGeometry(modW, modH, modD));
  // BoxGeometry material groups: [+X, -X, +Y, -Y, +Z, -Z]
  const moduleMaterials = [
    moduleSideMat, // +X (outer left side in LEFT view)
    moduleSideMat, // -X (inner side where wires exit)
    moduleTopFaceMat, // +Y (top face with gold "NO ◇" markings)
    moduleSideMat, // -Y (bottom lip above recessed control panel)
    moduleSideMat, // +Z (front against cabinet)
    moduleBackFaceMat, // -Z (back face with diagonal gold/copper streaks)
  ];
  const raisedModuleMesh = new THREE.Mesh(moduleBoxGeo, moduleMaterials);
  raisedModuleMesh.name = 'Back_Raised_Electronics_Module';
  raisedModuleMesh.position.set(modCenterX, modCenterY, modCenterZ);
  raisedModuleMesh.castShadow = true;
  raisedModuleMesh.receiveShadow = true;
  backGroup.add(raisedModuleMesh);
  registerPart(
    raisedModuleMesh,
    [0.14, 0.14, -0.48],
    'back',
    'Back Raised Electronics Module'
  );

  // Dark grey rectangular recessed window patch on upper-left of module back face
  const modPatchGeo = trackGeo(new THREE.BoxGeometry(0.21, 0.12, 0.012));
  const modPatchMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Module_Dark_Window_Patch',
      color: 0x202226,
      roughness: 0.66,
      metalness: 0.05,
    })
  );
  const modPatchMesh = new THREE.Mesh(modPatchGeo, modPatchMat);
  modPatchMesh.name = 'Back_Module_Window_Patch';
  modPatchMesh.position.set(0.54, 1.20, -0.922);
  backGroup.add(modPatchMesh);
  registerPart(
    modPatchMesh,
    [0.15, 0.15, -0.58],
    'back',
    'Module Upper-Left Recessed Patch'
  );

  // Copper border trim around upper-left module patch
  const modPatchRimGeo = trackGeo(new THREE.BoxGeometry(0.225, 0.135, 0.008));
  const modPatchRimMesh = new THREE.Mesh(modPatchRimGeo, copperTrimMat);
  modPatchRimMesh.name = 'Back_Module_Window_Copper_Rim';
  modPatchRimMesh.position.set(0.54, 1.20, -0.919);
  backGroup.add(modPatchRimMesh);
  registerPart(
    modPatchRimMesh,
    [0.15, 0.15, -0.55],
    'back',
    'Module Patch Copper Frame'
  );

  // Small black slide switch sticking up from top of raised module
  const switchKnobGeo = trackGeo(new THREE.BoxGeometry(0.032, 0.055, 0.028));
  const switchKnobMesh = new THREE.Mesh(switchKnobGeo, glossyDustCapMat);
  switchKnobMesh.name = 'Back_Module_Top_Switch';
  switchKnobMesh.position.set(0.16, 1.332, -0.81);
  backGroup.add(switchKnobMesh);
  registerPart(
    switchKnobMesh,
    [0.14, 0.26, -0.48],
    'back',
    'Module Top Slide Switch'
  );

  // 3B. RECESSED CONTROL PANEL BACKING PLATE & INNER WALLS (z = -0.63)
  const panelW = rMaxX - rMinX; // 0.70
  const panelH = rMaxY - rMinY; // 0.44
  const panelCenterY = (rMinY + rMaxY) * 0.5; // +0.62
  const panelZ = -HD + SPEAKER_DIMENSIONS.backControlRecess.depth; // -0.63

  const controlPlateGeo = trackGeo(
    new THREE.BoxGeometry(panelW + 0.02, panelH + 0.02, 0.018)
  );
  const controlPlateMesh = new THREE.Mesh(controlPlateGeo, controlPlateMat);
  controlPlateMesh.name = 'Back_Recessed_Panel_Plate';
  controlPlateMesh.position.set(0, panelCenterY, panelZ + 0.008);
  backGroup.add(controlPlateMesh);
  registerPart(
    controlPlateMesh,
    [0, 0, -0.35],
    'back',
    'Recessed Control Panel Backing Plate'
  );

  // 1) Top-Left Metal Toggle Switch / Threaded Bushing (x = +0.25, y = +0.73)
  const toggleGroup = new THREE.Group();
  toggleGroup.name = 'Back_Toggle_Switch_Assembly';
  toggleGroup.position.set(0.25, 0.73, panelZ);

  const toggleWasherGeo = trackGeo(
    new THREE.CylinderGeometry(0.048, 0.048, 0.012, 24)
  );
  toggleWasherGeo.rotateX(Math.PI / 2);
  const toggleWasherMesh = new THREE.Mesh(toggleWasherGeo, copperTrimMat);
  toggleWasherMesh.name = 'Back_Toggle_Switch_Washer';
  toggleWasherMesh.position.set(0, 0, -0.008);
  toggleGroup.add(toggleWasherMesh);

  const toggleNutGeo = trackGeo(
    new THREE.CylinderGeometry(0.036, 0.036, 0.022, 6)
  );
  toggleNutGeo.rotateX(Math.PI / 2);
  const toggleNutMesh = new THREE.Mesh(toggleNutGeo, chromeMetalMat);
  toggleNutMesh.name = 'Back_Toggle_Switch_HexNut';
  toggleNutMesh.position.set(0, 0, -0.018);
  toggleGroup.add(toggleNutMesh);

  const toggleBushingGeo = trackGeo(
    new THREE.CylinderGeometry(0.024, 0.024, 0.035, 20)
  );
  toggleBushingGeo.rotateX(Math.PI / 2);
  const toggleBushingMesh = new THREE.Mesh(toggleBushingGeo, chromeMetalMat);
  toggleBushingMesh.name = 'Back_Toggle_Switch_Bushing';
  toggleBushingMesh.position.set(0, 0, -0.028);
  toggleGroup.add(toggleBushingMesh);

  const toggleBatGeo = trackGeo(
    new THREE.CylinderGeometry(0.009, 0.013, 0.038, 16)
  );
  toggleBatGeo.rotateX(Math.PI / 2);
  const toggleBatMesh = new THREE.Mesh(toggleBatGeo, chromeMetalMat);
  toggleBatMesh.name = 'Back_Toggle_Switch_Actuator';
  toggleBatMesh.position.set(0, 0.004, -0.045);
  toggleBatMesh.rotation.x = -0.22;
  toggleGroup.add(toggleBatMesh);

  backGroup.add(toggleGroup);
  registerPart(
    toggleGroup,
    [0.06, 0.04, -0.52],
    'back',
    'Top-Left Metal Toggle Switch'
  );

  // 2) Two Red Cylindrical Push-Buttons (Left at x = -0.01, Right at x = -0.21, y = +0.73)
  const createRedButton = (
    name: string,
    x: number,
    y: number,
    radius: number,
    explodeX: number,
    label: string
  ) => {
    const btnGroup = new THREE.Group();
    btnGroup.name = name;
    btnGroup.position.set(x, y, panelZ);

    const rimGeo = trackGeo(
      new THREE.TorusGeometry(radius + 0.012, 0.007, 12, 32)
    );
    const rimMesh = new THREE.Mesh(rimGeo, copperTrimMat);
    rimMesh.name = `${name}_Copper_Rim`;
    rimMesh.position.set(0, 0, -0.006);
    btnGroup.add(rimMesh);

    const capGeo = trackGeo(
      new THREE.CylinderGeometry(radius, radius * 1.04, 0.046, 32)
    );
    capGeo.rotateX(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, redButtonMat);
    capMesh.name = `${name}_Cap`;
    capMesh.position.set(0, 0, -0.024);
    btnGroup.add(capMesh);

    backGroup.add(btnGroup);
    registerPart(btnGroup, [explodeX, 0.04, -0.54], 'back', label);
  };

  createRedButton(
    'Back_Red_Button_Left',
    -0.01,
    0.73,
    0.054,
    0,
    'Left Red Push-Button'
  );
  createRedButton(
    'Back_Red_Button_Right',
    -0.21,
    0.73,
    0.052,
    -0.06,
    'Right Red Push-Button'
  );

  // 3) Two Circular Sensor / Indicator Cutouts with Copper Rims (y = +0.57)
  const sensorWindowMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Back_Sensor_Diffuser',
      color: 0x282a2e,
      roughness: 0.34,
      metalness: 0.05,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
    })
  );

  const createSensorWindow = (
    name: string,
    x: number,
    y: number,
    radius: number,
    explodeX: number,
    label: string
  ) => {
    const winGroup = new THREE.Group();
    winGroup.name = name;
    winGroup.position.set(x, y, panelZ);

    const rimGeo = trackGeo(new THREE.TorusGeometry(radius, 0.007, 12, 32));
    const rimMesh = new THREE.Mesh(rimGeo, copperTrimMat);
    rimMesh.name = `${name}_Copper_Rim`;
    rimMesh.position.set(0, 0, -0.006);
    winGroup.add(rimMesh);

    const discGeo = trackGeo(
      new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.01, 28)
    );
    discGeo.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, sensorWindowMat);
    discMesh.name = `${name}_Lens`;
    discMesh.position.set(0, 0, -0.005);
    winGroup.add(discMesh);

    backGroup.add(winGroup);
    registerPart(winGroup, [explodeX, 0, -0.48], 'back', label);
  };

  createSensorWindow(
    'Back_Sensor_Window_Left',
    0.15,
    0.57,
    0.052,
    0.04,
    'Middle-Left Circular Indicator Window'
  );
  createSensorWindow(
    'Back_Sensor_Window_Right',
    -0.20,
    0.57,
    0.036,
    -0.04,
    'Middle-Right Circular Sensor Window'
  );

  // 4) Bottom-Left DC Barrel Charging Port (x = +0.22, y = +0.45)
  const barrelGroup = new THREE.Group();
  barrelGroup.name = 'Back_Barrel_Charging_Port';
  barrelGroup.position.set(0.22, 0.45, panelZ);

  const barrelRimGeo = trackGeo(new THREE.TorusGeometry(0.036, 0.007, 12, 28));
  const barrelRimMesh = new THREE.Mesh(barrelRimGeo, copperTrimMat);
  barrelRimMesh.name = 'Back_Barrel_Port_Copper_Rim';
  barrelRimMesh.position.set(0, 0, -0.01);
  barrelGroup.add(barrelRimMesh);

  const barrelSleeveGeo = trackGeo(
    new THREE.CylinderGeometry(0.032, 0.032, 0.025, 24, 1, true)
  );
  barrelSleeveGeo.rotateX(Math.PI / 2);
  const barrelSleeveMesh = new THREE.Mesh(barrelSleeveGeo, interiorDarkMat);
  barrelSleeveMesh.name = 'Back_Barrel_Port_Cavity';
  barrelSleeveMesh.position.set(0, 0, -0.01);
  barrelGroup.add(barrelSleeveMesh);

  const barrelPinGeo = trackGeo(
    new THREE.CylinderGeometry(0.008, 0.008, 0.028, 16)
  );
  barrelPinGeo.rotateX(Math.PI / 2);
  const barrelPinMesh = new THREE.Mesh(barrelPinGeo, chromeMetalMat);
  barrelPinMesh.name = 'Back_Barrel_Port_CenterPin';
  barrelPinMesh.position.set(0, 0, -0.014);
  barrelGroup.add(barrelPinMesh);

  backGroup.add(barrelGroup);
  registerPart(
    barrelGroup,
    [0.05, -0.04, -0.52],
    'back',
    'Bottom-Left DC Barrel Connector'
  );

  // 5) Bottom-Center-Left USB Type-C Charging Port (x = +0.08, y = +0.445)
  const usbcGroup = new THREE.Group();
  usbcGroup.name = 'Back_USBC_Charging_Port';
  usbcGroup.position.set(0.08, 0.445, panelZ);

  const usbcBezelShape = new THREE.Shape();
  usbcBezelShape.absarc(-0.024, 0, 0.026, Math.PI * 0.5, Math.PI * 1.5, false);
  usbcBezelShape.absarc(0.024, 0, 0.026, -Math.PI * 0.5, Math.PI * 0.5, false);
  usbcBezelShape.closePath();

  const usbcHole = new THREE.Path();
  usbcHole.absarc(-0.02, 0, 0.014, Math.PI * 0.5, Math.PI * 1.5, false);
  usbcHole.absarc(0.02, 0, 0.014, -Math.PI * 0.5, Math.PI * 0.5, false);
  usbcHole.closePath();
  usbcBezelShape.holes.push(usbcHole);

  const usbcBezelGeo = trackGeo(
    new THREE.ExtrudeGeometry(usbcBezelShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.002,
      bevelSegments: 2,
    })
  );
  const usbcBezelMesh = new THREE.Mesh(usbcBezelGeo, copperTrimMat);
  usbcBezelMesh.name = 'Back_USBC_Copper_Bezel';
  usbcBezelMesh.position.set(0, 0, -0.018);
  usbcGroup.add(usbcBezelMesh);

  const usbcTongueGeo = trackGeo(new THREE.BoxGeometry(0.042, 0.006, 0.022));
  const usbcTongueMesh = new THREE.Mesh(usbcTongueGeo, chromeMetalMat);
  usbcTongueMesh.name = 'Back_USBC_Contact_Tongue';
  usbcTongueMesh.position.set(0, 0, -0.012);
  usbcGroup.add(usbcTongueMesh);

  backGroup.add(usbcGroup);
  registerPart(
    usbcGroup,
    [0, -0.04, -0.52],
    'back',
    'USB Type-C Charging Port'
  );

  // 6) Bottom-Right Micro-SD / Aux Slot (x = -0.18, y = +0.43)
  const slotGroup = new THREE.Group();
  slotGroup.name = 'Back_BottomRight_Slot';
  slotGroup.position.set(-0.18, 0.43, panelZ);

  const slotBezelGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.032, 0.016));
  const slotBezelMesh = new THREE.Mesh(slotBezelGeo, chromeMetalMat);
  slotBezelMesh.name = 'Back_MicroSD_Slot_Housing';
  slotBezelMesh.position.set(0, 0, -0.008);
  slotGroup.add(slotBezelMesh);

  const slotOpeningGeo = trackGeo(new THREE.BoxGeometry(0.13, 0.014, 0.02));
  const slotOpeningMesh = new THREE.Mesh(slotOpeningGeo, interiorDarkMat);
  slotOpeningMesh.name = 'Back_MicroSD_Slot_Cavity';
  slotOpeningMesh.position.set(0, 0, -0.01);
  slotGroup.add(slotOpeningMesh);

  backGroup.add(slotGroup);
  registerPart(
    slotGroup,
    [-0.05, -0.04, -0.48],
    'back',
    'Bottom-Right Card/Aux Slot'
  );

  // 3C. COLOURED WIRES BUNDLE & DIAGONAL BLUE CONNECTOR CAPSULE
  // Visible in BACK (R_back), TOP (R_top), LEFT (R_left), and RIGHT (R_right) views!
  const wiresGroup = new THREE.Group();
  wiresGroup.name = 'Back_Coloured_Wires_Bundle';

  const makeWire = (
    name: string,
    colorHex: number,
    points: [number, number, number][],
    radius = 0.013
  ) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p))
    );
    const wireGeo = trackGeo(new THREE.TubeGeometry(curve, 32, radius, 12, false));
    const wireMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        name: `Mat_${name}`,
        color: colorHex,
        roughness: 0.76,
        metalness: 0.01,
        clearcoat: 0.04,
        clearcoatRoughness: 0.6,
      })
    );
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.name = name;
    wiresGroup.add(wireMesh);
  };

  // Main Red Insulated Wire arcing from module side (+0.02, +1.10, -0.78) to blue capsule (-0.06, +0.69, -0.76)
  makeWire(
    'Back_Wire_Red',
    0x9e241e,
    [
      [0.03, 1.11, -0.77],
      [-0.02, 1.07, -0.80],
      [-0.09, 0.94, -0.82],
      [-0.11, 0.80, -0.80],
      [-0.06, 0.69, -0.76],
    ],
    0.014
  );

  // Secondary Dark Brown/Black Wire running parallel in the harness
  makeWire(
    'Back_Wire_Black',
    0x1d1918,
    [
      [0.03, 1.09, -0.75],
      [-0.01, 1.04, -0.78],
      [-0.07, 0.92, -0.79],
      [-0.09, 0.79, -0.78],
      [-0.05, 0.68, -0.75],
    ],
    0.013
  );

  // Green & Yellow Wire Loops at the module exit port (clearly visible in R_back and R_top!)
  makeWire(
    'Back_Wire_Green',
    0x1f6e39,
    [
      [0.04, 1.12, -0.75],
      [0.0, 1.13, -0.79],
      [-0.03, 1.09, -0.77],
      [0.01, 1.06, -0.73],
    ],
    0.011
  );

  makeWire(
    'Back_Wire_Yellow',
    0xb88b22,
    [
      [0.04, 1.10, -0.73],
      [-0.01, 1.11, -0.76],
      [-0.03, 1.07, -0.74],
      [0.01, 1.04, -0.72],
    ],
    0.010
  );

  backGroup.add(wiresGroup);
  registerPart(
    wiresGroup,
    [0.04, 0.06, -0.64],
    'back',
    'Coloured Wiring Harness (Red/Black/Green/Yellow)'
  );

  // Diagonal Light-Blue Cylindrical Connector / Heat-Shrink Sleeve Capsule
  const blueCapsuleGroup = new THREE.Group();
  blueCapsuleGroup.name = 'Back_Blue_Connector_Capsule';
  blueCapsuleGroup.position.set(0.01, 0.585, -0.755);
  // Tilted diagonally (top-right to bottom-left in Back view)
  blueCapsuleGroup.rotation.set(0.18, -0.12, 0.56);

  const blueBodyGeo = trackGeo(new THREE.CapsuleGeometry(0.044, 0.165, 12, 24));
  const blueBodyMesh = new THREE.Mesh(blueBodyGeo, blueCapsuleMat);
  blueBodyMesh.name = 'Back_Blue_Capsule_Sleeve';
  blueCapsuleGroup.add(blueBodyMesh);

  // Small copper crimp collar at top of blue sleeve
  const crimpCollarGeo = trackGeo(
    new THREE.CylinderGeometry(0.022, 0.03, 0.04, 20)
  );
  const crimpCollarMesh = new THREE.Mesh(crimpCollarGeo, copperTrimMat);
  crimpCollarMesh.name = 'Back_Blue_Capsule_Copper_Crimp';
  crimpCollarMesh.position.set(0, 0.115, 0);
  blueCapsuleGroup.add(crimpCollarMesh);

  backGroup.add(blueCapsuleGroup);
  registerPart(
    blueCapsuleGroup,
    [0, 0, -0.72],
    'back',
    'Light-Blue Wire Connector Capsule'
  );

  // ============================================================================
  // 4. LEFT VIEW COMPONENTS (+X, R_left.jpeg): CIRCULAR BASS-REFLEX PORT
  // ============================================================================
  const leftGroup = new THREE.Group();
  leftGroup.name = 'Left_Face_Components';
  root.add(leftGroup);

  const leftPortY = SPEAKER_DIMENSIONS.leftBassPort.centerY; // -0.62
  const leftPortAssembly = new THREE.Group();
  leftPortAssembly.name = 'Left_Bass_Reflex_Port_Assembly';
  leftPortAssembly.position.set(HW, leftPortY, 0);

  // Beveled dark recess collar inside the +X wall cutout
  const leftCollarGeo = trackGeo(
    new THREE.CylinderGeometry(0.222, 0.195, 0.08, 48, 1, true)
  );
  leftCollarGeo.rotateZ(Math.PI / 2);
  const leftCollarMesh = new THREE.Mesh(leftCollarGeo, rawBoardMat);
  leftCollarMesh.name = 'Left_Bass_Port_Recess_Collar';
  leftCollarMesh.position.set(-0.038, 0, 0);
  leftPortAssembly.add(leftCollarMesh);

  // Raised circular black rubber surround ring inside the port recess
  const leftRingGeo = trackGeo(
    new THREE.TorusGeometry(
      SPEAKER_DIMENSIONS.leftBassPort.ringRadius,
      SPEAKER_DIMENSIONS.leftBassPort.ringTube,
      20,
      48
    )
  );
  leftRingGeo.rotateY(Math.PI / 2);
  const leftRingMesh = new THREE.Mesh(leftRingGeo, rubberSurroundMat);
  leftRingMesh.name = 'Left_Bass_Port_Surround_Ring';
  leftRingMesh.position.set(-0.018, 0, 0);
  leftPortAssembly.add(leftRingMesh);

  // Flat circular matte-black passive bass diaphragm / port cap
  const leftDiaphragmGeo = trackGeo(
    new THREE.CylinderGeometry(
      SPEAKER_DIMENSIONS.leftBassPort.diaphragmRadius,
      SPEAKER_DIMENSIONS.leftBassPort.diaphragmRadius,
      0.018,
      48
    )
  );
  leftDiaphragmGeo.rotateZ(Math.PI / 2);
  const leftDiaphragmMesh = new THREE.Mesh(leftDiaphragmGeo, paperConeMat);
  leftDiaphragmMesh.name = 'Left_Bass_Port_Diaphragm';
  leftDiaphragmMesh.position.set(-0.026, 0, 0);
  leftPortAssembly.add(leftDiaphragmMesh);

  const leftPortBackGeo = trackGeo(
    new THREE.CylinderGeometry(0.222, 0.222, 0.01, 48)
  );
  leftPortBackGeo.rotateZ(Math.PI / 2);
  const leftPortBackMesh = new THREE.Mesh(leftPortBackGeo, interiorDarkMat);
  leftPortBackMesh.name = 'Left_Bass_Port_Backplate';
  leftPortBackMesh.position.set(-0.055, 0, 0);
  leftPortAssembly.add(leftPortBackMesh);

  leftGroup.add(leftPortAssembly);
  registerPart(
    leftPortAssembly,
    [0.48, 0, 0],
    'left',
    'Left Circular Bass-Reflex Port (+X)'
  );

  // ============================================================================
  // 5. RIGHT VIEW COMPONENTS (-X, R_right.jpeg): CIRCULAR BASS-REFLEX PORT
  // ============================================================================
  const rightGroup = new THREE.Group();
  rightGroup.name = 'Right_Face_Components';
  root.add(rightGroup);

  const rightPortY = SPEAKER_DIMENSIONS.rightBassPort.centerY; // -0.70
  const rightPortAssembly = new THREE.Group();
  rightPortAssembly.name = 'Right_Bass_Reflex_Port_Assembly';
  rightPortAssembly.position.set(-HW, rightPortY, 0);

  // Deeply recessed cylindrical port tube
  const rightTubeGeo = trackGeo(
    new THREE.CylinderGeometry(0.212, 0.182, 0.095, 48, 1, true)
  );
  rightTubeGeo.rotateZ(Math.PI / 2);
  const rightTubeMesh = new THREE.Mesh(rightTubeGeo, rawBoardMat);
  rightTubeMesh.name = 'Right_Bass_Port_Tube_Wall';
  rightTubeMesh.position.set(0.045, 0, 0);
  rightPortAssembly.add(rightTubeMesh);

  // Inner dark rubber ring at depth of port
  const rightInnerRingGeo = trackGeo(
    new THREE.TorusGeometry(0.172, 0.018, 16, 48)
  );
  rightInnerRingGeo.rotateY(Math.PI / 2);
  const rightInnerRingMesh = new THREE.Mesh(
    rightInnerRingGeo,
    rubberSurroundMat
  );
  rightInnerRingMesh.name = 'Right_Bass_Port_Inner_Ring';
  rightInnerRingMesh.position.set(0.042, 0, 0);
  rightPortAssembly.add(rightInnerRingMesh);

  // Recessed flat circular black diaphragm inside right port
  const rightDiaphragmGeo = trackGeo(
    new THREE.CylinderGeometry(
      SPEAKER_DIMENSIONS.rightBassPort.diaphragmRadius,
      SPEAKER_DIMENSIONS.rightBassPort.diaphragmRadius,
      0.018,
      48
    )
  );
  rightDiaphragmGeo.rotateZ(Math.PI / 2);
  const rightDiaphragmMesh = new THREE.Mesh(rightDiaphragmGeo, paperConeMat);
  rightDiaphragmMesh.name = 'Right_Bass_Port_Diaphragm';
  rightDiaphragmMesh.position.set(0.052, 0, 0);
  rightPortAssembly.add(rightDiaphragmMesh);

  const rightPortBackGeo = trackGeo(
    new THREE.CylinderGeometry(0.214, 0.214, 0.01, 48)
  );
  rightPortBackGeo.rotateZ(Math.PI / 2);
  const rightPortBackMesh = new THREE.Mesh(rightPortBackGeo, interiorDarkMat);
  rightPortBackMesh.name = 'Right_Bass_Port_Backplate';
  rightPortBackMesh.position.set(0.072, 0, 0);
  rightPortAssembly.add(rightPortBackMesh);

  rightGroup.add(rightPortAssembly);
  registerPart(
    rightPortAssembly,
    [-0.48, 0, 0],
    'right',
    'Right Circular Bass-Reflex Port (-X)'
  );

  // ============================================================================
  // 6. TOP VIEW COMPONENTS (+Y, R_top.jpeg): RECESSED PANEL & SILVER 'R' MARKING
  // ============================================================================
  const topGroup = new THREE.Group();
  topGroup.name = 'Top_Face_Components';
  root.add(topGroup);

  // 6A. Recessed Rectangular Panel Trench Backing & Inset Panel Lid
  const topHoleW = tMaxX - tMinX; // 0.74
  const topHoleD = tMaxZ - tMinZ; // 0.50
  const topCenterX = (tMinX + tMaxX) * 0.5; // +0.01
  const topCenterZ = (tMinZ + tMaxZ) * 0.5; // +0.07
  const grooveW = SPEAKER_DIMENSIONS.topRecessedPanel.grooveWidth;

  // Dark seam floor beneath the recessed lid so the perimeter trench has real 3D shadow depth
  const trenchFloorGeo = trackGeo(
    new THREE.BoxGeometry(topHoleW + 0.02, 0.02, topHoleD + 0.02)
  );
  const trenchFloorMesh = new THREE.Mesh(trenchFloorGeo, rawBoardMat);
  trenchFloorMesh.name = 'Top_Recessed_Panel_Seam_Floor';
  trenchFloorMesh.position.set(topCenterX, HH - 0.032, topCenterZ);
  topGroup.add(trenchFloorMesh);
  registerPart(
    trenchFloorMesh,
    [0, 0.34, 0],
    'top',
    'Top Recessed Panel Trench Base'
  );

  // Inset rectangular panel lid (seated inside the top cutout with a 0.018 perimeter groove gap)
  const lidW = topHoleW - grooveW * 2;
  const lidD = topHoleD - grooveW * 2;
  const lidGeo = trackGeo(new THREE.BoxGeometry(lidW, 0.032, lidD));
  const lidMesh = new THREE.Mesh(lidGeo, enclosureMat);
  lidMesh.name = 'Top_Recessed_Panel_Lid';
  lidMesh.position.set(
    topCenterX,
    HH - SPEAKER_DIMENSIONS.topRecessedPanel.lidRecess - 0.014,
    topCenterZ
  );
  lidMesh.castShadow = true;
  lidMesh.receiveShadow = true;
  topGroup.add(lidMesh);
  registerPart(lidMesh, [0, 0.46, 0], 'top', 'Top Central Recessed Panel Lid');

  // 6B. Metallic Silver Block-Letter 'R' Marking (upper-right quadrant of TOP view)
  // Constructed as a genuine 3D extruded mesh with inner loop hole
  const rShape = new THREE.Shape();
  // Outer contour of geometric block 'R' in local 2D (X: -0.13..+0.13, Y: -0.19..+0.19)
  rShape.moveTo(-0.13, -0.19);
  rShape.lineTo(-0.065, -0.19);
  rShape.lineTo(-0.065, -0.02);
  rShape.lineTo(-0.005, -0.02);
  rShape.lineTo(0.085, -0.19);
  rShape.lineTo(0.145, -0.18);
  rShape.lineTo(0.125, -0.135);
  rShape.lineTo(0.045, -0.015);
  rShape.lineTo(0.115, 0.025);
  rShape.lineTo(0.115, 0.145);
  rShape.lineTo(0.075, 0.19);
  rShape.lineTo(-0.13, 0.19);
  rShape.closePath();

  // Counter-hole inside upper loop of 'R'
  const rHole = new THREE.Path();
  rHole.moveTo(-0.065, 0.035);
  rHole.lineTo(0.052, 0.035);
  rHole.lineTo(0.052, 0.132);
  rHole.lineTo(-0.065, 0.132);
  rHole.closePath();
  rShape.holes.push(rHole);

  const rGeo = trackGeo(
    new THREE.ExtrudeGeometry(rShape, {
      depth: SPEAKER_DIMENSIONS.topSilverR.thickness,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 2,
    })
  );
  normalizeExtrudeUVs(rGeo, 2.0);
  // Rotate so the 'R' lies flat on the +Y top surface, reading upright when viewed from TOP (+Y looking -Y with -Z at top)
  rGeo.rotateX(-Math.PI / 2);
  const silverRMesh = new THREE.Mesh(rGeo, silverFoilMat);
  silverRMesh.name = 'Top_Silver_R_Marking';
  silverRMesh.position.set(
    SPEAKER_DIMENSIONS.topSilverR.centerX,
    HH + 0.001,
    SPEAKER_DIMENSIONS.topSilverR.centerZ
  );
  topGroup.add(silverRMesh);
  registerPart(
    silverRMesh,
    [0.06, 0.56, -0.06],
    'top',
    'Top Metallic Silver "R" Marking'
  );

  // Count total meshes, vertices, and triangles
  let meshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;

  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshCount++;
      const m = obj as THREE.Mesh;
      const pos = m.geometry.attributes.position;
      if (pos) {
        vertexCount += pos.count;
        if (m.geometry.index) {
          triangleCount += Math.floor(m.geometry.index.count / 3);
        } else {
          triangleCount += Math.floor(pos.count / 3);
        }
      }
    }
  });

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    if (ownsTextures) {
      textures.dispose();
    }
  };

  return {
    root,
    parts,
    materials,
    geometries,
    textures,
    meshCount,
    vertexCount,
    triangleCount,
    dispose,
  };
}

/**
 * Smoothly interpolates all registered speaker sub-assemblies between their
 * assembled position (factor = 0) and exploded inspection position (factor = 1).
 */
export function applyExplodedView(parts: ExplodablePart[], factor: number) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    p.object.position.set(
      p.basePosition.x + p.explodeOffset.x * factor,
      p.basePosition.y + p.explodeOffset.y * factor,
      p.basePosition.z + p.explodeOffset.z * factor
    );
  }
}

/**
 * Exports the Three.js speaker hierarchy to a binary glTF 2.0 (.glb) ArrayBuffer.
 */
export function exportSpeakerToGlb(root: THREE.Object3D): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      root,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Expected binary ArrayBuffer from GLTFExporter'));
        }
      },
      (err) => reject(err),
      { binary: true, onlyVisible: true }
    );
  });
}
