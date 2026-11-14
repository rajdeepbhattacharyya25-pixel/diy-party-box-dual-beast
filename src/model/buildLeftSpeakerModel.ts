import * as THREE from 'three';
import { SPEAKER_DIMENSIONS } from './speakerSpec';
import { createSpeakerTextureSet, SpeakerTextureSet } from './speakerTextures';
import type { BuiltSpeakerModel, ExplodablePart } from './buildSpeakerModel';

function normalizeExtrudeUVs(geometry: THREE.BufferGeometry, scale = 0.55) {
  const uvAttr = geometry.attributes.uv;
  if (!uvAttr) return;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(i, uvAttr.getX(i) * scale, uvAttr.getY(i) * scale);
  }
  uvAttr.needsUpdate = true;
}

function normalizeBoxUVs(geometry: THREE.BufferGeometry, scale = 0.55) {
  const posAttr = geometry.attributes.position;
  const normAttr = geometry.attributes.normal;
  const uvAttr = geometry.attributes.uv;
  if (!posAttr || !normAttr || !uvAttr) return;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const nx = Math.abs(normAttr.getX(i));
    const ny = Math.abs(normAttr.getY(i));
    const nz = Math.abs(normAttr.getZ(i));
    if (nz >= nx && nz >= ny) {
      uvAttr.setXY(i, x * scale, y * scale);
    } else if (nx >= ny && nx >= nz) {
      uvAttr.setXY(i, z * scale, y * scale);
    } else {
      uvAttr.setXY(i, x * scale, z * scale);
    }
  }
  uvAttr.needsUpdate = true;
}

/**
 * Builds the complete, multi-mesh 3D reconstruction of the LEFT ('L') DIY Speaker
 * matching all six reference photographs:
 * - L_front_05e20147.jpeg
 * - L_left_cd777779.jpeg
 * - L_back_214d743c.jpeg
 * - L_top_4fdfe085.jpeg
 * - L_right_2162743f.jpeg
 * - L_back_components_b6c8f3c6.jpeg
 */
export function buildLeftSpeakerModel(
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
  root.name = 'DIY_Left_Speaker_Reconstruction';

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
      color: 0x52412f,
      roughness: 0.84,
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
      color: 0x565043,
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
      map: textures.leftModuleBackAlbedo,
      roughnessMap: textures.leftModuleBackRoughness,
      metalnessMap: textures.leftModuleBackMetalness,
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
      map: textures.leftModuleTopAlbedo,
      roughnessMap: textures.leftModuleTopRoughness,
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
      color: 0xffffff,
      map: textures.leftControlPanelAlbedo,
      bumpMap: textures.enclosureBump,
      bumpScale: 0.006,
      roughness: 0.72,
      metalness: 0.08,
      clearcoat: 0.08,
      clearcoatRoughness: 0.50,
    })
  );

  const copperTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Copper_Cutout_Rim',
      color: 0x9b642b,
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

  const brushedSilverDiskMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Right_Passive_Radiator_Silver_Disk',
      color: 0xc8c7c2,
      map: textures.silverFoilAlbedo,
      roughnessMap: textures.silverFoilRoughness,
      roughness: 0.32,
      metalness: 0.78,
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

  const yellowPortBezelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Back_Yellow_USBC_Bezel',
      color: 0xd6b015,
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.16,
      clearcoatRoughness: 0.36,
    })
  );

  const blueWireMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Blue_Wire_Connector_Sleeve',
      color: 0x2668a8,
      roughness: 0.68,
      metalness: 0.02,
      clearcoat: 0.06,
      clearcoatRoughness: 0.52,
    })
  );

  const frostedWindowMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      name: 'Mat_Frosted_Translucent_Window',
      color: 0x7b8088,
      roughness: 0.40,
      metalness: 0.05,
      clearcoat: 0.22,
      clearcoatRoughness: 0.32,
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
      roughness: 0.36,
      metalness: 0.70,
    })
  );

  // ============================================================================
  // 1. ENCLOSURE CABINET (WITH STEPPED BACK WALL & GENUINE 3D CUTOUTS)
  // ============================================================================
  const enclosureGroup = new THREE.Group();
  enclosureGroup.name = 'Enclosure_Cabinet_Group';
  root.add(enclosureGroup);

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
      curveSegments: 64,
    })
  );
  normalizeExtrudeUVs(frontWallGeo);
  const frontWallMesh = new THREE.Mesh(frontWallGeo, [enclosureMat, rawBoardMat]);
  frontWallMesh.name = 'Enclosure_Front_Wall';
  frontWallMesh.position.set(0, 0, HD - T);
  frontWallMesh.castShadow = true;
  frontWallMesh.receiveShadow = true;
  enclosureGroup.add(frontWallMesh);
  registerPart(frontWallMesh, [0, 0, 0.22], 'enclosure', 'Front Baffle Wall');

  // 1B. BACK WALL (-Z) with rectangular recessed control panel cutout
  // In L_back_214d743c.jpeg, the recessed control panel is shifted slightly left of center:
  // world X in [-0.26 .. +0.44], world Y in [+0.38 .. +0.84].
  // Because backWallMesh is rotated by Math.PI around Y, local X = -world X:
  // local X in [-0.44 .. +0.26].
  const backShape = new THREE.Shape();
  backShape.moveTo(-HW, -HH);
  backShape.lineTo(HW, -HH);
  backShape.lineTo(HW, HH);
  backShape.lineTo(-HW, HH);
  backShape.closePath();

  const lPanelMinWorldX = -0.26;
  const lPanelMaxWorldX = 0.44;
  const lPanelMinY = 0.38;
  const lPanelMaxY = 0.84;

  const backCutout = new THREE.Path();
  backCutout.moveTo(-lPanelMaxWorldX, lPanelMinY);
  backCutout.lineTo(-lPanelMinWorldX, lPanelMinY);
  backCutout.lineTo(-lPanelMinWorldX, lPanelMaxY);
  backCutout.lineTo(-lPanelMaxWorldX, lPanelMaxY);
  backCutout.closePath();
  backShape.holes.push(backCutout);

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

  // Stepped Lower Back Panel (visible in L_back, L_left, and L_right: lower half y = -1.30..-0.10 protrudes by 0.022 in -Z)
  const lowerBackStepGeo = trackGeo(
    new THREE.BoxGeometry(W - 0.008, 1.20, 0.022)
  );
  normalizeBoxUVs(lowerBackStepGeo);
  const lowerBackStepMesh = new THREE.Mesh(lowerBackStepGeo, enclosureMat);
  lowerBackStepMesh.name = 'Back_Lower_Stepped_Panel';
  lowerBackStepMesh.position.set(0, -0.70, -HD - 0.010);
  lowerBackStepMesh.castShadow = true;
  lowerBackStepMesh.receiveShadow = true;
  enclosureGroup.add(lowerBackStepMesh);
  registerPart(
    lowerBackStepMesh,
    [0, -0.05, -0.28],
    'enclosure',
    'Lower Back Stepped Wall Layer'
  );

  // 1C. LEFT SIDE WALL (-X, shown in L_left_cd777779.jpeg) with dark recessed bass port cutout
  const leftShape = new THREE.Shape();
  leftShape.moveTo(-HD, -HH);
  leftShape.lineTo(HD, -HH);
  leftShape.lineTo(HD, HH);
  leftShape.lineTo(-HD, HH);
  leftShape.closePath();

  const leftPortHole = new THREE.Path();
  leftPortHole.absarc(0, -0.68, 0.195, 0, Math.PI * 2, true);
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
  leftWallMesh.rotation.y = -Math.PI / 2;
  leftWallMesh.position.set(-HW + T, 0, 0);
  leftWallMesh.castShadow = true;
  leftWallMesh.receiveShadow = true;
  enclosureGroup.add(leftWallMesh);
  registerPart(leftWallMesh, [-0.22, 0, 0], 'enclosure', 'Left Enclosure Wall (-X)');

  // 1D. RIGHT SIDE WALL (+X, shown in L_right_2162743f.jpeg) with circular silver passive radiator cutout
  const rightShape = new THREE.Shape();
  rightShape.moveTo(-HD, -HH);
  rightShape.lineTo(HD, -HH);
  rightShape.lineTo(HD, HH);
  rightShape.lineTo(-HD, HH);
  rightShape.closePath();

  const rightPortHole = new THREE.Path();
  rightPortHole.absarc(0, -0.68, 0.225, 0, Math.PI * 2, true);
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
  rightWallMesh.rotation.y = Math.PI / 2;
  rightWallMesh.position.set(HW - T, 0, 0);
  rightWallMesh.castShadow = true;
  rightWallMesh.receiveShadow = true;
  enclosureGroup.add(rightWallMesh);
  registerPart(rightWallMesh, [0.22, 0, 0], 'enclosure', 'Right Enclosure Wall (+X)');

  // 1E. TOP WALL (+Y, shown in L_top_4fdfe085.jpeg — continuous textured black top surface)
  const topShape = new THREE.Shape();
  topShape.moveTo(-HW, -HD);
  topShape.lineTo(HW, -HD);
  topShape.lineTo(HW, HD);
  topShape.lineTo(-HW, HD);
  topShape.closePath();

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
  normalizeBoxUVs(bottomWallGeo);
  const bottomWallMesh = new THREE.Mesh(bottomWallGeo, enclosureMat);
  bottomWallMesh.name = 'Enclosure_Bottom_Wall';
  bottomWallMesh.position.set(0, -HH + T * 0.5, 0);
  bottomWallMesh.castShadow = true;
  bottomWallMesh.receiveShadow = true;
  enclosureGroup.add(bottomWallMesh);
  registerPart(bottomWallMesh, [0, -0.22, 0], 'enclosure', 'Bottom Enclosure Base');

  // 1G. Subtle Worn Edge / Corner Board Seams
  const edgeWearGroup = new THREE.Group();
  edgeWearGroup.name = 'Enclosure_Edge_Wear_Trim';
  const cornerVertGeo = trackGeo(new THREE.BoxGeometry(0.011, H * 0.995, 0.011));
  const cornerHorizGeo = trackGeo(new THREE.BoxGeometry(W * 0.995, 0.011, 0.011));
  const cornerDepthGeo = trackGeo(new THREE.BoxGeometry(0.011, 0.011, D * 0.995));

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const vEdge = new THREE.Mesh(cornerVertGeo, wornCornerMat);
      vEdge.name = `Edge_Seam_Vertical_${sx > 0 ? 'R' : 'L'}_${sz > 0 ? 'F' : 'B'}`;
      vEdge.position.set(sx * (HW - 0.002), 0, sz * (HD - 0.002));
      edgeWearGroup.add(vEdge);
    }
    for (const sy of [-1, 1]) {
      const dEdge = new THREE.Mesh(cornerDepthGeo, wornCornerMat);
      dEdge.name = `Edge_Seam_Depth_${sx > 0 ? 'R' : 'L'}_${sy > 0 ? 'T' : 'B'}`;
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
  // 2. FRONT VIEW COMPONENTS (+Z, L_front_05e20147.jpeg)
  // ============================================================================
  const frontGroup = new THREE.Group();
  frontGroup.name = 'Front_Face_Components';
  root.add(frontGroup);

  // 2A. UPPER SPEAKER DRIVER (Center at Y = +0.62, Z = +0.70)
  // Note: In L_front_05e20147.jpeg, the two glossy black lead-wire glue drops on the cone
  // are at the TOP (11 o'clock and 1 o'clock) above the glossy dome dust cap!
  const upperY = SPEAKER_DIMENSIONS.frontUpperDriver.centerY;

  const upperBackplateGeo = trackGeo(new THREE.CircleGeometry(0.35, 48));
  const upperBackplateMesh = new THREE.Mesh(upperBackplateGeo, interiorDarkMat);
  upperBackplateMesh.name = 'Front_Upper_Driver_Backplate';
  upperBackplateMesh.position.set(0, upperY, 0.50);
  frontGroup.add(upperBackplateMesh);

  const upperBasketGeo = trackGeo(
    new THREE.CylinderGeometry(0.352, 0.34, 0.09, 48, 1, true)
  );
  upperBasketGeo.rotateX(Math.PI / 2);
  const upperBasketMesh = new THREE.Mesh(upperBasketGeo, rawBoardMat);
  upperBasketMesh.name = 'Front_Upper_Driver_Basket';
  upperBasketMesh.position.set(0, upperY, HD - 0.045);
  frontGroup.add(upperBasketMesh);
  registerPart(upperBasketMesh, [0, 0.04, 0.38], 'front', 'Upper Driver Mounting Collar');

  const upperSurroundGeo = trackGeo(
    new THREE.TorusGeometry(0.318, 0.028, 24, 64)
  );
  upperSurroundGeo.scale(1, 1, 0.65);
  const upperSurroundMesh = new THREE.Mesh(upperSurroundGeo, rubberSurroundMat);
  upperSurroundMesh.name = 'Front_Upper_Driver_Surround';
  upperSurroundMesh.position.set(0, upperY, HD - 0.018);
  frontGroup.add(upperSurroundMesh);
  registerPart(upperSurroundMesh, [0, 0.04, 0.48], 'front', 'Upper Driver Rubber Surround');

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
  registerPart(upperConeMesh, [0, 0.04, 0.56], 'front', 'Upper Driver Paper Cone');

  const upperDustCapGeo = trackGeo(
    new THREE.SphereGeometry(0.118, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.46)
  );
  upperDustCapGeo.rotateX(Math.PI / 2);
  const upperDustCapMesh = new THREE.Mesh(upperDustCapGeo, glossyDustCapMat);
  upperDustCapMesh.name = 'Front_Upper_Driver_DustCap';
  upperDustCapMesh.position.set(0, upperY, 0.542);
  frontGroup.add(upperDustCapMesh);
  registerPart(upperDustCapMesh, [0, 0.04, 0.66], 'front', 'Upper Driver Glossy Dust Cap');

  // Two voice-coil lead-wire glue drops at TOP (11 o'clock & 1 o'clock) in L_front_05e20147.jpeg
  const leadGeo = trackGeo(new THREE.CapsuleGeometry(0.012, 0.042, 8, 12));
  const leadLeft = new THREE.Mesh(leadGeo, glossyDustCapMat);
  leadLeft.name = 'Front_Upper_Driver_LeadWire_TopLeft';
  leadLeft.position.set(-0.045, upperY + 0.112, 0.618);
  leadLeft.rotation.set(0.32, 0, 0.36);
  frontGroup.add(leadLeft);
  registerPart(leadLeft, [0, 0.04, 0.68], 'front', 'Upper Driver Lead Wire (Top-Left)');

  const leadRight = new THREE.Mesh(leadGeo, glossyDustCapMat);
  leadRight.name = 'Front_Upper_Driver_LeadWire_TopRight';
  leadRight.position.set(0.045, upperY + 0.112, 0.618);
  leadRight.rotation.set(0.32, 0, -0.36);
  frontGroup.add(leadRight);
  registerPart(leadRight, [0, 0.04, 0.68], 'front', 'Upper Driver Lead Wire (Top-Right)');

  // 2B. CENTRAL WHITE LED DIFFUSER RING (Center at Y = -0.08, Z = +0.70)
  const ledY = SPEAKER_DIMENSIONS.frontLedRing.centerY;
  const ledOuterR = SPEAKER_DIMENSIONS.frontLedRing.outerRadius;
  const ledInnerR = SPEAKER_DIMENSIONS.frontLedRing.innerRadius;
  const ledDepth = SPEAKER_DIMENSIONS.frontLedRing.thickness;

  const ledRingShape = new THREE.Shape();
  ledRingShape.absarc(0, 0, ledOuterR, 0, Math.PI * 2, false);
  const ledHole = new THREE.Path();
  ledHole.absarc(0, 0, ledInnerR, 0, Math.PI * 2, true);
  ledRingShape.holes.push(ledHole);

  const ledRingGeo = trackGeo(
    new THREE.ExtrudeGeometry(ledRingShape, {
      depth: ledDepth,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 64,
    })
  );
  normalizeExtrudeUVs(ledRingGeo, 1.1);
  const ledRingMesh = new THREE.Mesh(ledRingGeo, ledDiffuserMat);
  ledRingMesh.name = 'Front_Central_LED_Diffuser_Ring';
  ledRingMesh.position.set(0, ledY, HD - 0.002);
  ledRingMesh.castShadow = true;
  ledRingMesh.receiveShadow = true;
  frontGroup.add(ledRingMesh);
  registerPart(ledRingMesh, [0, 0, 0.55], 'front', 'Central Frosted LED Diffuser Ring');

  const ledGasketGeo = trackGeo(
    new THREE.RingGeometry(ledInnerR - 0.006, ledOuterR + 0.01, 64)
  );
  const ledGasketMesh = new THREE.Mesh(ledGasketGeo, rawBoardMat);
  ledGasketMesh.name = 'Front_Central_LED_Mount_Groove';
  ledGasketMesh.position.set(0, ledY, HD + 0.001);
  frontGroup.add(ledGasketMesh);
  registerPart(ledGasketMesh, [0, 0, 0.42], 'front', 'Central LED Ring Mounting Rim');

  // 2C. LOWER SMALLER SPEAKER DRIVER (Center at Y = -0.76, Z = +0.70)
  const lowerY = SPEAKER_DIMENSIONS.frontLowerDriver.centerY;

  const lowerBackplateGeo = trackGeo(new THREE.CircleGeometry(0.24, 48));
  const lowerBackplateMesh = new THREE.Mesh(lowerBackplateGeo, interiorDarkMat);
  lowerBackplateMesh.name = 'Front_Lower_Driver_Backplate';
  lowerBackplateMesh.position.set(0, lowerY, 0.52);
  frontGroup.add(lowerBackplateMesh);

  const lowerCutoutRimGeo = trackGeo(
    new THREE.TorusGeometry(0.236, 0.007, 16, 56)
  );
  lowerCutoutRimGeo.scale(1, 1, 0.45);
  const lowerCutoutRimMesh = new THREE.Mesh(lowerCutoutRimGeo, wornCornerMat);
  lowerCutoutRimMesh.name = 'Front_Lower_Driver_Cutout_Rim';
  lowerCutoutRimMesh.position.set(0, lowerY, HD - 0.006);
  frontGroup.add(lowerCutoutRimMesh);
  registerPart(lowerCutoutRimMesh, [0, -0.04, 0.36], 'front', 'Lower Driver Cutout Bevel Rim');

  const lowerBasketGeo = trackGeo(
    new THREE.CylinderGeometry(0.238, 0.222, 0.085, 56, 1, true)
  );
  lowerBasketGeo.rotateX(Math.PI / 2);
  const lowerBasketMesh = new THREE.Mesh(lowerBasketGeo, rawBoardMat);
  lowerBasketMesh.name = 'Front_Lower_Driver_Basket';
  lowerBasketMesh.position.set(0, lowerY, HD - 0.044);
  frontGroup.add(lowerBasketMesh);
  registerPart(lowerBasketMesh, [0, -0.04, 0.38], 'front', 'Lower Driver Recessed Wall');

  const lowerSurroundGeo = trackGeo(
    new THREE.TorusGeometry(0.194, 0.032, 28, 64)
  );
  lowerSurroundGeo.scale(1, 1, 0.78);
  const lowerSurroundMesh = new THREE.Mesh(lowerSurroundGeo, rubberSurroundMat);
  lowerSurroundMesh.name = 'Front_Lower_Driver_Surround';
  lowerSurroundMesh.position.set(0, lowerY, HD - 0.040);
  frontGroup.add(lowerSurroundMesh);
  registerPart(lowerSurroundMesh, [0, -0.04, 0.48], 'front', 'Lower Driver Rubber Surround');

  // Pale yellowish-grey adhesive/paper cone-to-surround seam ring visible in L_front_05e20147.jpeg
  const lowerSeamRingGeo = trackGeo(
    new THREE.TorusGeometry(0.165, 0.0055, 16, 56)
  );
  lowerSeamRingGeo.scale(1, 1, 0.5);
  const lowerSeamRingMesh = new THREE.Mesh(lowerSeamRingGeo, lowerConeSeamMat);
  lowerSeamRingMesh.name = 'Front_Lower_Driver_Cone_Seam_Ring';
  lowerSeamRingMesh.position.set(0, lowerY, 0.642);
  frontGroup.add(lowerSeamRingMesh);
  registerPart(lowerSeamRingMesh, [0, -0.04, 0.52], 'front', 'Lower Driver Cone Seam Ring');

  const lowerConePoints = [
    new THREE.Vector2(0.068, 0.568),
    new THREE.Vector2(0.105, 0.588),
    new THREE.Vector2(0.140, 0.614),
    new THREE.Vector2(0.168, 0.642),
  ];
  const lowerConeGeo = trackGeo(new THREE.LatheGeometry(lowerConePoints, 56));
  lowerConeGeo.rotateX(Math.PI / 2);
  const lowerConeMesh = new THREE.Mesh(lowerConeGeo, paperConeMat);
  lowerConeMesh.name = 'Front_Lower_Driver_Cone';
  lowerConeMesh.position.set(0, lowerY, 0);
  frontGroup.add(lowerConeMesh);
  registerPart(lowerConeMesh, [0, -0.04, 0.56], 'front', 'Lower Driver Paper Cone');

  // Upper-left voice-coil eyelet / lead drop on lower cone (11 o'clock in L_front_05e20147.jpeg)
  const lowerLeadGeo = trackGeo(new THREE.SphereGeometry(0.012, 16, 12));
  lowerLeadGeo.scale(1.1, 1.4, 0.6);
  const lowerLeadMesh = new THREE.Mesh(lowerLeadGeo, glossyDustCapMat);
  lowerLeadMesh.name = 'Front_Lower_Driver_VoiceCoil_Lead';
  lowerLeadMesh.position.set(-0.028, lowerY + 0.095, 0.602);
  frontGroup.add(lowerLeadMesh);
  registerPart(lowerLeadMesh, [0, -0.04, 0.61], 'front', 'Lower Driver Voice-Coil Lead');

  // Concentric 2-tier center cap (outer raised collar ring + recessed groove + flat-topped button dome)
  const lowerCapProfile = [
    new THREE.Vector2(0.0, 0.602),
    new THREE.Vector2(0.028, 0.601),
    new THREE.Vector2(0.042, 0.594),
    new THREE.Vector2(0.048, 0.582),
    new THREE.Vector2(0.055, 0.582),
    new THREE.Vector2(0.062, 0.596),
    new THREE.Vector2(0.070, 0.595),
    new THREE.Vector2(0.074, 0.570),
  ];
  const lowerCapGeo = trackGeo(new THREE.LatheGeometry(lowerCapProfile, 56));
  lowerCapGeo.rotateX(Math.PI / 2);
  const lowerCapMesh = new THREE.Mesh(lowerCapGeo, lowerDustCapMat);
  lowerCapMesh.name = 'Front_Lower_Driver_DustCap';
  lowerCapMesh.position.set(0, lowerY, 0);
  frontGroup.add(lowerCapMesh);
  registerPart(lowerCapMesh, [0, -0.04, 0.66], 'front', 'Lower Driver Center Dust Cap');

  // ============================================================================
  // 3. BACK VIEW COMPONENTS (-Z, L_back_214d743c.jpeg & L_back_components_b6c8f3c6.jpeg)
  // ============================================================================
  const backGroup = new THREE.Group();
  backGroup.name = 'Back_Face_Components';
  root.add(backGroup);

  // 3A. RAISED UPPER-RIGHT ELECTRONICS MODULE (in Back view, right side is -X!)
  // Spans world X in [-0.68 .. +0.04], world Y in [+0.85 .. +1.26], world Z in [-0.92 .. -0.69]
  const modMinX = -0.68;
  const modMaxX = 0.04;
  const modMinY = 0.85;
  const modMaxY = 1.26;
  const modMinZ = -0.92;
  const modMaxZ = -0.69;

  const modW = modMaxX - modMinX; // 0.72
  const modH = modMaxY - modMinY; // 0.41
  const modD = modMaxZ - modMinZ; // 0.23
  const modCenterX = (modMinX + modMaxX) * 0.5; // -0.32
  const modCenterY = (modMinY + modMaxY) * 0.5; // +1.055
  const modCenterZ = (modMinZ + modMaxZ) * 0.5; // -0.805

  const moduleBoxGeo = trackGeo(new THREE.BoxGeometry(modW, modH, modD));
  const moduleMaterials = [
    moduleSideMat, // +X (inner left side where blue cable exits)
    moduleSideMat, // -X (outer right side visible in L_left & L_right)
    moduleTopFaceMat, // +Y (top face with gold switch border & "NO ◇" markings)
    moduleSideMat, // -Y (bottom lip above recessed control panel)
    moduleSideMat, // +Z (front against cabinet)
    moduleBackFaceMat, // -Z (back face with gold branching trunk & white/silver blossom dots)
  ];
  const raisedModuleMesh = new THREE.Mesh(moduleBoxGeo, moduleMaterials);
  raisedModuleMesh.name = 'Back_Raised_Electronics_Module';
  raisedModuleMesh.position.set(modCenterX, modCenterY, modCenterZ);
  raisedModuleMesh.castShadow = true;
  raisedModuleMesh.receiveShadow = true;
  backGroup.add(raisedModuleMesh);
  registerPart(
    raisedModuleMesh,
    [-0.14, 0.14, -0.48],
    'back',
    'Back Raised Electronics Module (Top-Right)'
  );

  // Subtle recessed dark bezel rings around the two circular windows on the module back face (-Z)
  const modWinRimGeo = trackGeo(new THREE.TorusGeometry(0.044, 0.005, 12, 32));
  const modWinLeftRim = new THREE.Mesh(modWinRimGeo, rubberSurroundMat);
  modWinLeftRim.name = 'Back_Module_Window_Left';
  modWinLeftRim.position.set(-0.14, 1.116, -0.921);
  backGroup.add(modWinLeftRim);

  const modWinRightRim = new THREE.Mesh(modWinRimGeo, rubberSurroundMat);
  modWinRightRim.name = 'Back_Module_Window_Right';
  modWinRightRim.position.set(-0.50, 0.985, -0.921);
  backGroup.add(modWinRightRim);

  // Vertical black slide switch knob protruding from top-right of module (world x = -0.52, y = +1.285, z = -0.81)
  const switchKnobGeo = trackGeo(new THREE.BoxGeometry(0.028, 0.056, 0.026));
  const switchKnobMesh = new THREE.Mesh(switchKnobGeo, glossyDustCapMat);
  switchKnobMesh.name = 'Back_Module_Top_Switch';
  switchKnobMesh.position.set(-0.52, 1.285, -0.81);
  backGroup.add(switchKnobMesh);
  registerPart(
    switchKnobMesh,
    [-0.14, 0.26, -0.48],
    'back',
    'Module Top Slide Switch Knob'
  );

  // Thin black wire arching over the top edge of the module (visible in L_back and L_back_components)
  const topArchWireCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 1.25, -0.82),
    new THREE.Vector3(-0.39, 1.30, -0.78),
    new THREE.Vector3(-0.43, 1.315, -0.72),
    new THREE.Vector3(-0.45, 1.30, -0.66),
  ]);
  const topArchWireGeo = trackGeo(
    new THREE.TubeGeometry(topArchWireCurve, 20, 0.008, 10, false)
  );
  const topArchWireMesh = new THREE.Mesh(topArchWireGeo, rubberSurroundMat);
  topArchWireMesh.name = 'Back_Module_Top_Arch_Wire';
  backGroup.add(topArchWireMesh);

  // 3B. RECESSED CONTROL PANEL BACKING PLATE & COMPONENTS (z = -0.63)
  const panelW = lPanelMaxWorldX - lPanelMinWorldX; // 0.70
  const panelH = lPanelMaxY - lPanelMinY; // 0.46
  const panelCenterX = (lPanelMinWorldX + lPanelMaxWorldX) * 0.5; // +0.09
  const panelCenterY = (lPanelMinY + lPanelMaxY) * 0.5; // +0.61
  const panelZ = -HD + SPEAKER_DIMENSIONS.backControlRecess.depth; // -0.63

  const controlPlateGeo = trackGeo(
    new THREE.BoxGeometry(panelW + 0.02, panelH + 0.02, 0.018)
  );
  const controlPlateMesh = new THREE.Mesh(controlPlateGeo, controlPlateMat);
  controlPlateMesh.name = 'Back_Recessed_Panel_Plate';
  controlPlateMesh.position.set(panelCenterX, panelCenterY, panelZ + 0.008);
  backGroup.add(controlPlateMesh);
  registerPart(
    controlPlateMesh,
    [0, 0, -0.35],
    'back',
    'Recessed Control Panel Backing Plate'
  );

  // 1) Top-Left Metallic Toggle Switch with Golden-Copper Rim (world x = +0.31, y = +0.74)
  const toggleGroup = new THREE.Group();
  toggleGroup.name = 'Back_Toggle_Switch_Assembly';
  toggleGroup.position.set(0.31, 0.74, panelZ);

  const toggleRimGeo = trackGeo(new THREE.TorusGeometry(0.046, 0.007, 14, 32));
  const toggleRimMesh = new THREE.Mesh(toggleRimGeo, copperTrimMat);
  toggleRimMesh.name = 'Back_Toggle_Copper_Rim';
  toggleRimMesh.position.set(0, 0, -0.008);
  toggleGroup.add(toggleRimMesh);

  const toggleNutGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.022, 6));
  toggleNutGeo.rotateX(Math.PI / 2);
  const toggleNutMesh = new THREE.Mesh(toggleNutGeo, chromeMetalMat);
  toggleNutMesh.name = 'Back_Toggle_Hex_Nut';
  toggleNutMesh.position.set(0, 0, -0.016);
  toggleGroup.add(toggleNutMesh);

  const toggleBushingGeo = trackGeo(
    new THREE.CylinderGeometry(0.024, 0.024, 0.032, 20)
  );
  toggleBushingGeo.rotateX(Math.PI / 2);
  const toggleBushingMesh = new THREE.Mesh(toggleBushingGeo, chromeMetalMat);
  toggleBushingMesh.name = 'Back_Toggle_Bushing';
  toggleBushingMesh.position.set(0, 0, -0.026);
  toggleGroup.add(toggleBushingMesh);

  const toggleBatGeo = trackGeo(new THREE.CylinderGeometry(0.009, 0.013, 0.038, 16));
  toggleBatGeo.rotateX(Math.PI / 2);
  const toggleBatMesh = new THREE.Mesh(toggleBatGeo, chromeMetalMat);
  toggleBatMesh.name = 'Back_Toggle_Actuator_Bat';
  toggleBatMesh.position.set(0, 0.005, -0.044);
  toggleBatMesh.rotation.x = -0.22;
  toggleGroup.add(toggleBatMesh);

  backGroup.add(toggleGroup);
  registerPart(
    toggleGroup,
    [0.06, 0.04, -0.52],
    'back',
    'Top-Left Metallic Toggle Switch'
  );

  // 2) Middle-Left Rectangular Frosted Window with Golden-Copper Frame (world x = +0.23, y = +0.60)
  const rectWindowGroup = new THREE.Group();
  rectWindowGroup.name = 'Back_Left_Rect_Frosted_Window_Group';
  rectWindowGroup.position.set(0.23, 0.60, panelZ);

  const frameOuterShape = new THREE.Shape();
  frameOuterShape.moveTo(-0.092, -0.048);
  frameOuterShape.lineTo(0.092, -0.048);
  frameOuterShape.lineTo(0.092, 0.048);
  frameOuterShape.lineTo(-0.092, 0.048);
  frameOuterShape.closePath();

  const frameInnerHole = new THREE.Path();
  frameInnerHole.moveTo(-0.078, -0.036);
  frameInnerHole.lineTo(0.078, -0.036);
  frameInnerHole.lineTo(0.078, 0.036);
  frameInnerHole.lineTo(-0.078, 0.036);
  frameInnerHole.closePath();
  frameOuterShape.holes.push(frameInnerHole);

  const rectFrameGeo = trackGeo(
    new THREE.ExtrudeGeometry(frameOuterShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
    })
  );
  const rectFrameMesh = new THREE.Mesh(rectFrameGeo, copperTrimMat);
  rectFrameMesh.name = 'Back_Left_Rect_Window_Copper_Frame';
  rectFrameMesh.position.set(0, 0, -0.016);
  rectWindowGroup.add(rectFrameMesh);

  const rectGlassGeo = trackGeo(new THREE.BoxGeometry(0.160, 0.076, 0.010));
  const rectGlassMesh = new THREE.Mesh(rectGlassGeo, frostedWindowMat);
  rectGlassMesh.name = 'Back_Left_Rect_Window_Diffuser';
  rectGlassMesh.position.set(0, 0, -0.008);
  rectWindowGroup.add(rectGlassMesh);

  backGroup.add(rectWindowGroup);
  registerPart(
    rectWindowGroup,
    [0.05, 0, -0.50],
    'back',
    'Middle-Left Rectangular Frosted Window'
  );

  // 3) Bottom-Left Yellow Circular USB Type-C Port (world x = +0.29, y = +0.46)
  const usbcGroup = new THREE.Group();
  usbcGroup.name = 'Back_Left_Yellow_USBC_Port';
  usbcGroup.position.set(0.29, 0.46, panelZ);

  const usbcCopperRimGeo = trackGeo(new THREE.TorusGeometry(0.056, 0.006, 14, 32));
  const usbcCopperRimMesh = new THREE.Mesh(usbcCopperRimGeo, copperTrimMat);
  usbcCopperRimMesh.name = 'Back_USBC_Outer_Copper_Rim';
  usbcCopperRimMesh.position.set(0, 0, -0.010);
  usbcGroup.add(usbcCopperRimMesh);

  const usbcYellowCylGeo = trackGeo(new THREE.CylinderGeometry(0.050, 0.050, 0.022, 32));
  usbcYellowCylGeo.rotateX(Math.PI / 2);
  const usbcYellowCylMesh = new THREE.Mesh(usbcYellowCylGeo, yellowPortBezelMat);
  usbcYellowCylMesh.name = 'Back_USBC_Yellow_Bezel';
  usbcYellowCylMesh.position.set(0, 0, -0.012);
  usbcGroup.add(usbcYellowCylMesh);

  const usbcSlotCavityGeo = trackGeo(new THREE.BoxGeometry(0.052, 0.018, 0.016));
  const usbcSlotCavityMesh = new THREE.Mesh(usbcSlotCavityGeo, interiorDarkMat);
  usbcSlotCavityMesh.name = 'Back_USBC_Slot_Opening';
  usbcSlotCavityMesh.position.set(0, -0.003, -0.018);
  usbcGroup.add(usbcSlotCavityMesh);

  const usbcTongueGeo = trackGeo(new THREE.BoxGeometry(0.038, 0.005, 0.018));
  const usbcTongueMesh = new THREE.Mesh(usbcTongueGeo, chromeMetalMat);
  usbcTongueMesh.name = 'Back_USBC_Contact_Tongue';
  usbcTongueMesh.position.set(0, -0.003, -0.019);
  usbcGroup.add(usbcTongueMesh);

  backGroup.add(usbcGroup);
  registerPart(
    usbcGroup,
    [0.06, -0.04, -0.52],
    'back',
    'Bottom-Left Yellow USB Type-C Port'
  );

  // 4) Bottom-Center-Left Black Circular DC Barrel Jack (world x = +0.14, y = +0.46)
  const dcJackGroup = new THREE.Group();
  dcJackGroup.name = 'Back_CenterLeft_DC_Barrel_Jack';
  dcJackGroup.position.set(0.14, 0.46, panelZ);

  const dcCopperRimGeo = trackGeo(new THREE.TorusGeometry(0.054, 0.005, 14, 32));
  const dcCopperRimMesh = new THREE.Mesh(dcCopperRimGeo, copperTrimMat);
  dcCopperRimMesh.name = 'Back_DC_Jack_Copper_Rim';
  dcCopperRimMesh.position.set(0, 0, -0.008);
  dcJackGroup.add(dcCopperRimMesh);

  const dcHousingGeo = trackGeo(new THREE.CylinderGeometry(0.048, 0.050, 0.024, 32));
  dcHousingGeo.rotateX(Math.PI / 2);
  const dcHousingMesh = new THREE.Mesh(dcHousingGeo, rubberSurroundMat);
  dcHousingMesh.name = 'Back_DC_Jack_Black_Bezel';
  dcHousingMesh.position.set(0, 0, -0.012);
  dcJackGroup.add(dcHousingMesh);

  const dcBoreGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.028, 24));
  dcBoreGeo.rotateX(Math.PI / 2);
  const dcBoreMesh = new THREE.Mesh(dcBoreGeo, interiorDarkMat);
  dcBoreMesh.name = 'Back_DC_Jack_Bore';
  dcBoreMesh.position.set(0, -0.004, -0.014);
  dcJackGroup.add(dcBoreMesh);

  const dcPinGeo = trackGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.032, 16));
  dcPinGeo.rotateX(Math.PI / 2);
  const dcPinMesh = new THREE.Mesh(dcPinGeo, chromeMetalMat);
  dcPinMesh.name = 'Back_DC_Jack_Center_Pin';
  dcPinMesh.position.set(0, -0.004, -0.018);
  dcJackGroup.add(dcPinMesh);

  backGroup.add(dcJackGroup);
  registerPart(
    dcJackGroup,
    [0.02, -0.04, -0.50],
    'back',
    'Bottom-Center DC Barrel Jack'
  );

  // 5) Two Red Push Buttons (Top-Center x = +0.07, y = +0.73 and Top-Right x = -0.13, y = +0.73)
  const makeRedButton = (name: string, bx: number, by: number) => {
    const btnGroup = new THREE.Group();
    btnGroup.name = name;
    btnGroup.position.set(bx, by, panelZ);

    const rimGeo = trackGeo(new THREE.TorusGeometry(0.066, 0.007, 14, 36));
    const rimMesh = new THREE.Mesh(rimGeo, copperTrimMat);
    rimMesh.name = `${name}_Outer_Rim`;
    rimMesh.position.set(0, 0, -0.008);
    btnGroup.add(rimMesh);

    const collarGeo = trackGeo(new THREE.CylinderGeometry(0.058, 0.060, 0.022, 36));
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, rubberSurroundMat);
    collarMesh.name = `${name}_Bezel_Collar`;
    collarMesh.position.set(0, 0, -0.012);
    btnGroup.add(collarMesh);

    const capGeo = trackGeo(new THREE.CylinderGeometry(0.048, 0.050, 0.036, 36));
    capGeo.rotateX(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, redButtonMat);
    capMesh.name = `${name}_Red_Cap`;
    capMesh.position.set(0, 0, -0.022);
    btnGroup.add(capMesh);

    backGroup.add(btnGroup);
    registerPart(btnGroup, [0, 0.03, -0.52], 'back', name);
  };

  makeRedButton('Back_Red_Push_Button_Left', 0.07, 0.73);
  makeRedButton('Back_Red_Push_Button_Right', -0.13, 0.73);

  // 6) Curved Blue-Sheathed Cable from Left Side of Raised Module to Center Brown Grommet Node
  const cableGroup = new THREE.Group();
  cableGroup.name = 'Back_Curved_Blue_Cable_Group';

  // Upper black segment exiting module side (+0.04, +1.00, -0.78)
  const upperCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.03, 1.01, -0.78),
    new THREE.Vector3(0.09, 0.94, -0.79),
    new THREE.Vector3(0.12, 0.83, -0.77),
  ]);
  const upperCableGeo = trackGeo(
    new THREE.TubeGeometry(upperCableCurve, 20, 0.016, 14, false)
  );
  const upperCableMesh = new THREE.Mesh(upperCableGeo, rubberSurroundMat);
  upperCableMesh.name = 'Back_Cable_Upper_Black_Sleeve';
  cableGroup.add(upperCableMesh);

  // Lower blue heat-shrink segment curving into the center node (+0.02, +0.58, -0.70)
  const blueCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, 0.84, -0.77),
    new THREE.Vector3(0.125, 0.73, -0.76),
    new THREE.Vector3(0.09, 0.64, -0.73),
    new THREE.Vector3(0.04, 0.59, -0.70),
  ]);
  const blueCableGeo = trackGeo(
    new THREE.TubeGeometry(blueCableCurve, 24, 0.019, 16, false)
  );
  const blueCableMesh = new THREE.Mesh(blueCableGeo, blueWireMat);
  blueCableMesh.name = 'Back_Cable_Blue_Sleeve';
  cableGroup.add(blueCableMesh);

  // Reddish-brown round grommet / connector node at (x = +0.02, y = +0.57, z = -0.68)
  const grommetGeo = trackGeo(new THREE.SphereGeometry(0.028, 24, 24));
  const grommetMat = trackMat(
    new THREE.MeshStandardMaterial({
      name: 'Mat_Back_Brown_Grommet',
      color: 0x6a3022,
      roughness: 0.54,
      metalness: 0.06,
    })
  );
  const grommetMesh = new THREE.Mesh(grommetGeo, grommetMat);
  grommetMesh.name = 'Back_Center_Brown_Wire_Grommet';
  grommetMesh.position.set(0.02, 0.575, -0.68);
  cableGroup.add(grommetMesh);

  // 7) Bottom-Right Red & Blue Jumper Wire Loops (world x = -0.16, y = +0.50)
  const redLoopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.13, 0.54, -0.65),
    new THREE.Vector3(-0.17, 0.56, -0.72),
    new THREE.Vector3(-0.21, 0.51, -0.71),
    new THREE.Vector3(-0.16, 0.43, -0.69),
  ]);
  const redLoopGeo = trackGeo(
    new THREE.TubeGeometry(redLoopCurve, 24, 0.009, 12, false)
  );
  const redLoopMesh = new THREE.Mesh(redLoopGeo, redButtonMat);
  redLoopMesh.name = 'Back_LowerRight_Red_Wire_Loop';
  cableGroup.add(redLoopMesh);

  const blueLoopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.11, 0.51, -0.68),
    new THREE.Vector3(-0.16, 0.52, -0.72),
    new THREE.Vector3(-0.18, 0.46, -0.70),
    new THREE.Vector3(-0.14, 0.44, -0.65),
  ]);
  const blueLoopGeo = trackGeo(
    new THREE.TubeGeometry(blueLoopCurve, 24, 0.007, 12, false)
  );
  const blueLoopMesh = new THREE.Mesh(blueLoopGeo, blueWireMat);
  blueLoopMesh.name = 'Back_LowerRight_Blue_Wire_Loop';
  cableGroup.add(blueLoopMesh);

  backGroup.add(cableGroup);
  registerPart(
    cableGroup,
    [0, 0, -0.66],
    'back',
    'Back Blue Cable & Lower-Right Red/Blue Wire Cluster'
  );

  // ============================================================================
  // 4. LEFT PROFILE VIEW COMPONENTS (-X, L_left_cd777779.jpeg): DARK RECESSED BASS PORT
  // ============================================================================
  const leftGroup = new THREE.Group();
  leftGroup.name = 'Left_Face_Components';
  root.add(leftGroup);

  const leftPortAssembly = new THREE.Group();
  leftPortAssembly.name = 'Left_Bass_Reflex_Port_Assembly';
  leftPortAssembly.position.set(-HW, -0.68, 0);

  const leftTubeGeo = trackGeo(
    new THREE.CylinderGeometry(0.194, 0.172, 0.09, 48, 1, true)
  );
  leftTubeGeo.rotateZ(Math.PI / 2);
  const leftTubeMesh = new THREE.Mesh(leftTubeGeo, rawBoardMat);
  leftTubeMesh.name = 'Left_Bass_Port_Recess_Collar';
  leftTubeMesh.position.set(0.042, 0, 0);
  leftPortAssembly.add(leftTubeMesh);

  const leftRingGeo = trackGeo(new THREE.TorusGeometry(0.148, 0.024, 20, 48));
  leftRingGeo.rotateY(Math.PI / 2);
  const leftRingMesh = new THREE.Mesh(leftRingGeo, rubberSurroundMat);
  leftRingMesh.name = 'Left_Bass_Port_Surround_Ring';
  leftRingMesh.position.set(0.024, 0, 0);
  leftPortAssembly.add(leftRingMesh);

  const leftDiaphragmGeo = trackGeo(new THREE.CylinderGeometry(0.132, 0.132, 0.016, 48));
  leftDiaphragmGeo.rotateZ(Math.PI / 2);
  const leftDiaphragmMesh = new THREE.Mesh(leftDiaphragmGeo, paperConeMat);
  leftDiaphragmMesh.name = 'Left_Bass_Port_Diaphragm';
  leftDiaphragmMesh.position.set(0.044, 0, 0);
  leftPortAssembly.add(leftDiaphragmMesh);

  const leftBackplateGeo = trackGeo(new THREE.CylinderGeometry(0.196, 0.196, 0.01, 48));
  leftBackplateGeo.rotateZ(Math.PI / 2);
  const leftBackplateMesh = new THREE.Mesh(leftBackplateGeo, interiorDarkMat);
  leftBackplateMesh.name = 'Left_Bass_Port_Backplate';
  leftBackplateMesh.position.set(0.068, 0, 0);
  leftPortAssembly.add(leftBackplateMesh);

  leftGroup.add(leftPortAssembly);
  registerPart(leftPortAssembly, [-0.48, 0, 0], 'left', 'Left Side Recessed Bass Port (-X)');

  // ============================================================================
  // 5. RIGHT PROFILE VIEW COMPONENTS (+X, L_right_2162743f.jpeg): BRUSHED SILVER PASSIVE RADIATOR
  // ============================================================================
  const rightGroup = new THREE.Group();
  rightGroup.name = 'Right_Face_Components';
  root.add(rightGroup);

  const rightPortAssembly = new THREE.Group();
  rightPortAssembly.name = 'Right_Silver_Passive_Radiator_Assembly';
  rightPortAssembly.position.set(HW, -0.68, 0);

  const rightCollarGeo = trackGeo(
    new THREE.CylinderGeometry(0.224, 0.205, 0.08, 48, 1, true)
  );
  rightCollarGeo.rotateZ(Math.PI / 2);
  const rightCollarMesh = new THREE.Mesh(rightCollarGeo, rawBoardMat);
  rightCollarMesh.name = 'Right_Bass_Port_Tube_Wall';
  rightCollarMesh.position.set(-0.038, 0, 0);
  rightPortAssembly.add(rightCollarMesh);

  const rightSurroundGeo = trackGeo(new THREE.TorusGeometry(0.172, 0.028, 24, 64));
  rightSurroundGeo.rotateY(Math.PI / 2);
  const rightSurroundMesh = new THREE.Mesh(rightSurroundGeo, rubberSurroundMat);
  rightSurroundMesh.name = 'Right_Bass_Port_Inner_Ring';
  rightSurroundMesh.position.set(-0.016, 0, 0);
  rightPortAssembly.add(rightSurroundMesh);

  // Distinctive brushed metallic silver/aluminium circular disk diaphragm in L_right_2162743f.jpeg!
  const rightSilverDiskGeo = trackGeo(new THREE.CylinderGeometry(0.146, 0.146, 0.018, 64));
  rightSilverDiskGeo.rotateZ(Math.PI / 2);
  const rightSilverDiskMesh = new THREE.Mesh(rightSilverDiskGeo, brushedSilverDiskMat);
  rightSilverDiskMesh.name = 'Right_Bass_Port_Silver_Diaphragm';
  rightSilverDiskMesh.position.set(-0.014, 0, 0);
  rightPortAssembly.add(rightSilverDiskMesh);

  const rightBackplateGeo = trackGeo(new THREE.CylinderGeometry(0.224, 0.224, 0.01, 48));
  rightBackplateGeo.rotateZ(Math.PI / 2);
  const rightBackplateMesh = new THREE.Mesh(rightBackplateGeo, interiorDarkMat);
  rightBackplateMesh.name = 'Right_Bass_Port_Backplate';
  rightBackplateMesh.position.set(-0.055, 0, 0);
  rightPortAssembly.add(rightBackplateMesh);

  rightGroup.add(rightPortAssembly);
  registerPart(
    rightPortAssembly,
    [0.48, 0, 0],
    'right',
    'Right Side Brushed Silver Passive Radiator (+X)'
  );

  // ============================================================================
  // 6. TOP VIEW COMPONENTS (+Y, L_top_4fdfe085.jpeg): SILVER 'L' EMBLEM WITH GOLD BORDER
  // ============================================================================
  const topGroup = new THREE.Group();
  topGroup.name = 'Top_Face_Components';
  root.add(topGroup);

  // Outer golden-copper border shape around block letter 'L'
  const lBorderShape = new THREE.Shape();
  lBorderShape.moveTo(-0.105, -0.195);
  lBorderShape.lineTo(0.105, -0.195);
  lBorderShape.lineTo(0.120, -0.155);
  lBorderShape.lineTo(0.105, -0.110);
  lBorderShape.lineTo(-0.015, -0.110);
  lBorderShape.lineTo(-0.015, 0.175);
  lBorderShape.lineTo(-0.055, 0.205);
  lBorderShape.lineTo(-0.105, 0.175);
  lBorderShape.closePath();

  const lBorderGeo = trackGeo(
    new THREE.ExtrudeGeometry(lBorderShape, {
      depth: 0.005,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 2,
    })
  );
  normalizeExtrudeUVs(lBorderGeo, 2.2);
  const lBorderMesh = new THREE.Mesh(lBorderGeo, copperTrimMat);
  lBorderMesh.name = 'Top_Gold_L_Border';
  lBorderMesh.rotation.x = -Math.PI / 2;
  lBorderMesh.position.set(-0.43, HH + 0.001, -0.34);
  topGroup.add(lBorderMesh);

  // Inner metallic silver foil block letter 'L'
  const lSilverShape = new THREE.Shape();
  lSilverShape.moveTo(-0.088, -0.176);
  lSilverShape.lineTo(0.088, -0.176);
  lSilverShape.lineTo(0.098, -0.152);
  lSilverShape.lineTo(0.086, -0.126);
  lSilverShape.lineTo(-0.032, -0.126);
  lSilverShape.lineTo(-0.032, 0.162);
  lSilverShape.lineTo(-0.058, 0.182);
  lSilverShape.lineTo(-0.088, 0.162);
  lSilverShape.closePath();

  const lSilverGeo = trackGeo(
    new THREE.ExtrudeGeometry(lSilverShape, {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 2,
    })
  );
  normalizeExtrudeUVs(lSilverGeo, 2.2);
  const lSilverMesh = new THREE.Mesh(lSilverGeo, silverFoilMat);
  lSilverMesh.name = 'Top_Silver_R_Foil';
  lSilverMesh.rotation.x = -Math.PI / 2;
  lSilverMesh.position.set(-0.43, HH + 0.003, -0.34);
  topGroup.add(lSilverMesh);
  registerPart(
    lSilverMesh,
    [-0.08, 0.56, -0.08],
    'top',
    'Top Metallic Silver L Marking with Gold Border'
  );

  // Compute mesh, vertex, and triangle counts
  let meshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshCount++;
      const pos = obj.geometry.attributes.position;
      if (pos) {
        vertexCount += pos.count;
      }
      if (obj.geometry.index) {
        triangleCount += Math.floor(obj.geometry.index.count / 3);
      } else if (pos) {
        triangleCount += Math.floor(pos.count / 3);
      }
    }
  });

  return {
    root,
    parts,
    materials,
    geometries,
    textures,
    meshCount,
    vertexCount,
    triangleCount,
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      if (ownsTextures) {
        textures.dispose();
      }
    },
  };
}
