/**
 * Exact 3D geometric specification and component manifest for the reconstructed DIY Speaker.
 * Coordinate system (Right-Handed, Y-Up, 1 unit = 100 mm):
 * - Enclosure Width (X): 1.40 units (-0.70 to +0.70) [140 mm]
 * - Enclosure Height (Y): 2.60 units (-1.30 to +1.30) [260 mm]
 * - Enclosure Depth (Z): 1.40 units (-0.70 to +0.70) [140 mm]
 * - FRONT Face: +Z (z = +0.70)
 * - BACK Face:  -Z (z = -0.70)
 * - LEFT View:  +X (x = +0.70, where back module protrudes on the right of the view at -Z)
 * - RIGHT View: -X (x = -0.70)
 * - TOP View:   +Y (y = +1.30, with -Z at top of photo and +X on right of photo)
 */

export interface SpeakerComponentSpec {
  name: string;
  face: 'enclosure' | 'front' | 'back' | 'left' | 'right' | 'top';
  primitiveType: string;
  position: [number, number, number];
  explodeVector: [number, number, number];
  description: string;
}

export const SPEAKER_DIMENSIONS = {
  width: 1.40,
  height: 2.60,
  depth: 1.40,
  wallThickness: 0.075,
  halfWidth: 0.70,
  halfHeight: 1.30,
  halfDepth: 0.70,
  frontUpperDriver: {
    centerY: 0.62,
    cutoutRadius: 0.355,
    surroundOuterRadius: 0.348,
    surroundInnerRadius: 0.295,
    coneOuterRadius: 0.295,
    coneInnerRadius: 0.11,
    coneDepth: 0.11,
    dustCapRadius: 0.115,
  },
  frontLedRing: {
    centerY: -0.08,
    outerRadius: 0.325,
    innerRadius: 0.212,
    thickness: 0.014,
  },
  frontLowerDriver: {
    centerY: -0.76,
    cutoutRadius: 0.225,
    recessDepth: 0.068,
    surroundOuterRadius: 0.205,
    surroundInnerRadius: 0.168,
    coneOuterRadius: 0.168,
    coneInnerRadius: 0.062,
    coneDepth: 0.075,
    dustCapRadius: 0.064,
  },
  backRaisedModule: {
    minX: 0.02,
    maxX: 0.71,
    minY: 0.86,
    maxY: 1.305,
    minZ: -0.92,
    maxZ: -0.69,
  },
  backControlRecess: {
    minX: -0.35,
    maxX: 0.35,
    minY: 0.40,
    maxY: 0.84,
    depth: 0.07,
  },
  leftBassPort: {
    centerY: -0.62,
    centerZ: 0.0,
    cutoutRadius: 0.225,
    ringRadius: 0.178,
    ringTube: 0.024,
    diaphragmRadius: 0.158,
  },
  rightBassPort: {
    centerY: -0.70,
    centerZ: 0.0,
    cutoutRadius: 0.215,
    recessDepth: 0.075,
    diaphragmRadius: 0.162,
  },
  topRecessedPanel: {
    minX: -0.36,
    maxX: 0.38,
    minZ: -0.18,
    maxZ: 0.32,
    grooveWidth: 0.018,
    grooveDepth: 0.028,
    lidRecess: 0.008,
  },
  topSilverR: {
    centerX: 0.46,
    centerZ: -0.44,
    width: 0.27,
    height: 0.38,
    thickness: 0.006,
  },
} as const;

export const SPEAKER_COMPONENT_MANIFEST: SpeakerComponentSpec[] = [
  // Enclosure walls
  {
    name: 'Enclosure_Front_Baffle',
    face: 'enclosure',
    primitiveType: 'ExtrudeGeometry (with 2 circular driver cutouts)',
    position: [0, 0, 0.70],
    explodeVector: [0, 0, 0.25],
    description: 'Front textured baffle wall with physical circular cutouts for upper and lower drivers',
  },
  {
    name: 'Enclosure_Back_Wall',
    face: 'enclosure',
    primitiveType: 'ExtrudeGeometry (with rectangular control panel cutout)',
    position: [0, 0, -0.70],
    explodeVector: [0, 0, -0.25],
    description: 'Back textured wall with physical rectangular cutout for recessed control panel',
  },
  {
    name: 'Enclosure_Left_Wall',
    face: 'enclosure',
    primitiveType: 'ExtrudeGeometry (with circular bass port cutout)',
    position: [0.70, 0, 0],
    explodeVector: [0.25, 0, 0],
    description: 'Left textured side wall (+X) with physical circular bass-reflex port opening',
  },
  {
    name: 'Enclosure_Right_Wall',
    face: 'enclosure',
    primitiveType: 'ExtrudeGeometry (with circular bass port cutout)',
    position: [-0.70, 0, 0],
    explodeVector: [-0.25, 0, 0],
    description: 'Right textured side wall (-X) with physical circular bass-reflex port opening',
  },
  {
    name: 'Enclosure_Top_Wall',
    face: 'enclosure',
    primitiveType: 'ExtrudeGeometry (with central rectangular panel recess)',
    position: [0, 1.30, 0],
    explodeVector: [0, 0.25, 0],
    description: 'Top textured wall with recessed rectangular access trench',
  },
  {
    name: 'Enclosure_Bottom_Wall',
    face: 'enclosure',
    primitiveType: 'BoxGeometry',
    position: [0, -1.30, 0],
    explodeVector: [0, -0.25, 0],
    description: 'Bottom textured enclosure base plate',
  },
  {
    name: 'Enclosure_Edge_Wear_Trim',
    face: 'enclosure',
    primitiveType: 'BoxGeometry (12 edge strips)',
    position: [0, 0, 0],
    explodeVector: [0, 0, 0],
    description: 'Subtle worn raw board/tan corner seams along enclosure edges matching reference photos',
  },

  // Front Components
  {
    name: 'Front_Upper_Driver_Basket',
    face: 'front',
    primitiveType: 'CylinderGeometry (openEnded)',
    position: [0, 0.62, 0.66],
    explodeVector: [0, 0.05, 0.45],
    description: 'Upper speaker driver recessed mounting collar',
  },
  {
    name: 'Front_Upper_Driver_Surround',
    face: 'front',
    primitiveType: 'TorusGeometry',
    position: [0, 0.62, 0.682],
    explodeVector: [0, 0.05, 0.55],
    description: 'Upper speaker driver outer rubber half-roll suspension surround',
  },
  {
    name: 'Front_Upper_Driver_Cone',
    face: 'front',
    primitiveType: 'LatheGeometry',
    position: [0, 0.62, 0.63],
    explodeVector: [0, 0.05, 0.62],
    description: 'Upper speaker driver conical black paper diaphragm',
  },
  {
    name: 'Front_Upper_Driver_DustCap',
    face: 'front',
    primitiveType: 'SphereGeometry (spherical cap)',
    position: [0, 0.62, 0.58],
    explodeVector: [0, 0.05, 0.72],
    description: 'Upper speaker driver high-gloss black center dome dust cap',
  },
  {
    name: 'Front_Upper_Driver_LeadGlue_Left',
    face: 'front',
    primitiveType: 'CapsuleGeometry',
    position: [-0.042, 0.495, 0.625],
    explodeVector: [-0.02, 0.04, 0.76],
    description: 'Signature left black glossy adhesive voice-coil lead dress below upper dust cap',
  },
  {
    name: 'Front_Upper_Driver_LeadGlue_Right',
    face: 'front',
    primitiveType: 'CapsuleGeometry',
    position: [0.042, 0.495, 0.625],
    explodeVector: [0.02, 0.04, 0.76],
    description: 'Signature right black glossy adhesive voice-coil lead dress below upper dust cap',
  },
  {
    name: 'Front_Center_LED_Ring',
    face: 'front',
    primitiveType: 'ExtrudeGeometry (annular ring)',
    position: [0, -0.08, 0.702],
    explodeVector: [0, 0, 0.60],
    description: 'Central milky-white translucent silicone/acrylic LED diffuser ring',
  },
  {
    name: 'Front_Lower_Driver_Recess_Wall',
    face: 'front',
    primitiveType: 'CylinderGeometry (openEnded)',
    position: [0, -0.76, 0.662],
    explodeVector: [0, -0.05, 0.45],
    description: 'Deeply recessed circular cutout wall for lower speaker driver',
  },
  {
    name: 'Front_Lower_Driver_Surround',
    face: 'front',
    primitiveType: 'TorusGeometry',
    position: [0, -0.76, 0.648],
    explodeVector: [0, -0.05, 0.56],
    description: 'Lower speaker driver rubber suspension surround ring',
  },
  {
    name: 'Front_Lower_Driver_Cone',
    face: 'front',
    primitiveType: 'LatheGeometry',
    position: [0, -0.76, 0.61],
    explodeVector: [0, -0.05, 0.64],
    description: 'Lower speaker driver conical matte paper cone',
  },
  {
    name: 'Front_Lower_Driver_DustCap',
    face: 'front',
    primitiveType: 'LatheGeometry (concave cap)',
    position: [0, -0.76, 0.585],
    explodeVector: [0, -0.05, 0.72],
    description: 'Lower speaker driver molded center dust cap with raised rim',
  },

  // Back Components
  {
    name: 'Back_Raised_Electronics_Module',
    face: 'back',
    primitiveType: 'BoxGeometry',
    position: [0.365, 1.08, -0.805],
    explodeVector: [0.15, 0.15, -0.55],
    description: 'Protruding upper-left electronics housing with diagonal gold/copper streak markings',
  },
  {
    name: 'Back_Module_Window_Patch',
    face: 'back',
    primitiveType: 'BoxGeometry',
    position: [0.54, 1.19, -0.922],
    explodeVector: [0.16, 0.16, -0.68],
    description: 'Recessed dark grey rectangular window patch on upper-left of raised module',
  },
  {
    name: 'Back_Module_Top_Switch',
    face: 'back',
    primitiveType: 'BoxGeometry',
    position: [0.16, 1.33, -0.81],
    explodeVector: [0.15, 0.28, -0.55],
    description: 'Small black slide switch knob protruding from top of electronics module',
  },
  {
    name: 'Back_Recessed_Panel_Plate',
    face: 'back',
    primitiveType: 'BoxGeometry',
    position: [0, 0.62, -0.63],
    explodeVector: [0, 0, -0.42],
    description: 'Recessed dark phenolic control panel backing board',
  },
  {
    name: 'Back_Toggle_Switch_Assembly',
    face: 'back',
    primitiveType: 'CylinderGeometry + TorusGeometry',
    position: [0.25, 0.73, -0.65],
    explodeVector: [0.06, 0.04, -0.58],
    description: 'Top-left metal bushing/toggle switch with brass washer and hex nut',
  },
  {
    name: 'Back_Red_Button_Left',
    face: 'back',
    primitiveType: 'CylinderGeometry',
    position: [-0.01, 0.73, -0.655],
    explodeVector: [0, 0.04, -0.60],
    description: 'Left cylindrical red push-button switch with copper cutout bezel',
  },
  {
    name: 'Back_Red_Button_Right',
    face: 'back',
    primitiveType: 'CylinderGeometry',
    position: [-0.21, 0.73, -0.655],
    explodeVector: [-0.06, 0.04, -0.60],
    description: 'Right cylindrical red push-button switch',
  },
  {
    name: 'Back_Sensor_Window_Left',
    face: 'back',
    primitiveType: 'CylinderGeometry + RingGeometry',
    position: [0.15, 0.57, -0.635],
    explodeVector: [0.04, 0, -0.54],
    description: 'Middle-left circular indicator window with copper rim',
  },
  {
    name: 'Back_Sensor_Window_Right',
    face: 'back',
    primitiveType: 'CylinderGeometry + RingGeometry',
    position: [-0.20, 0.57, -0.635],
    explodeVector: [-0.04, 0, -0.54],
    description: 'Middle-right smaller circular window with copper rim',
  },
  {
    name: 'Back_Barrel_Charging_Port',
    face: 'back',
    primitiveType: 'CylinderGeometry + TorusGeometry',
    position: [0.22, 0.45, -0.648],
    explodeVector: [0.05, -0.04, -0.58],
    description: 'Bottom-left circular DC barrel connector with copper rim and center pin',
  },
  {
    name: 'Back_USBC_Charging_Port',
    face: 'back',
    primitiveType: 'ExtrudeGeometry (stadium oval)',
    position: [0.08, 0.445, -0.648],
    explodeVector: [0, -0.04, -0.58],
    description: 'Bottom USB Type-C charging port with copper stadium bezel and center tongue',
  },
  {
    name: 'Back_BottomRight_Slot',
    face: 'back',
    primitiveType: 'BoxGeometry',
    position: [-0.18, 0.43, -0.64],
    explodeVector: [-0.05, -0.04, -0.55],
    description: 'Bottom-right horizontal micro-SD / aux slot opening',
  },
  {
    name: 'Back_Coloured_Wires_Bundle',
    face: 'back',
    primitiveType: 'TubeGeometry (4 CatmullRomCurve3 paths)',
    position: [0.01, 0.92, -0.77],
    explodeVector: [0.05, 0.08, -0.72],
    description: 'Red, black, green, and yellow insulated wires curving from raised module to blue connector',
  },
  {
    name: 'Back_Blue_Connector_Capsule',
    face: 'back',
    primitiveType: 'CapsuleGeometry + CylinderGeometry',
    position: [-0.01, 0.58, -0.755],
    explodeVector: [0, 0, -0.78],
    description: 'Diagonal light-blue cylindrical heat-shrink / wire connector sleeve hanging over control panel',
  },

  // Left Face (+X)
  {
    name: 'Left_Bass_Reflex_Port_Assembly',
    face: 'left',
    primitiveType: 'CylinderGeometry + TorusGeometry',
    position: [0.67, -0.62, 0],
    explodeVector: [0.55, 0, 0],
    description: 'Left circular bass-reflex port with beveled recess, rubber ring, and flat black diaphragm',
  },

  // Right Face (-X)
  {
    name: 'Right_Bass_Reflex_Port_Assembly',
    face: 'right',
    primitiveType: 'CylinderGeometry',
    position: [-0.66, -0.70, 0],
    explodeVector: [-0.55, 0, 0],
    description: 'Right deeply recessed circular bass-reflex port tube and inner diaphragm',
  },

  // Top Face (+Y)
  {
    name: 'Top_Recessed_Panel_Lid',
    face: 'top',
    primitiveType: 'BoxGeometry',
    position: [0.01, 1.292, 0.07],
    explodeVector: [0, 0.48, 0],
    description: 'Top central rectangular panel seated inside recessed perimeter seam',
  },
  {
    name: 'Top_Silver_R_Marking',
    face: 'top',
    primitiveType: 'ExtrudeGeometry (R glyph with counter hole)',
    position: [0.46, 1.303, -0.44],
    explodeVector: [0.06, 0.58, -0.06],
    description: 'Metallic silver tape/paint block letter R on upper-right of top surface',
  },
];

/**
 * Validates that an ArrayBuffer contains a valid binary glTF 2.0 (.glb) container.
 */
export function validateGlbBuffer(buffer: ArrayBuffer): {
  valid: boolean;
  magic: string;
  version: number;
  byteLength: number;
  jsonChunkLength: number;
  binChunkLength: number;
} {
  if (buffer.byteLength < 20) {
    return {
      valid: false,
      magic: '',
      version: 0,
      byteLength: buffer.byteLength,
      jsonChunkLength: 0,
      binChunkLength: 0,
    };
  }
  const view = new DataView(buffer);
  const magicBytes = new Uint8Array(buffer, 0, 4);
  const magic = String.fromCharCode(...magicBytes);
  const version = view.getUint32(4, true);
  const totalLength = view.getUint32(8, true);
  const jsonChunkLength = view.getUint32(12, true);
  const jsonChunkType = view.getUint32(16, true);

  let binChunkLength = 0;
  const binChunkOffset = 20 + jsonChunkLength;
  if (buffer.byteLength >= binChunkOffset + 8) {
    binChunkLength = view.getUint32(binChunkOffset, true);
  }

  const isJsonChunk = jsonChunkType === 0x4e4f534a; // 'JSON'
  const valid =
    magic === 'glTF' &&
    version === 2 &&
    totalLength === buffer.byteLength &&
    isJsonChunk &&
    jsonChunkLength > 0;

  return {
    valid,
    magic,
    version,
    byteLength: buffer.byteLength,
    jsonChunkLength,
    binChunkLength,
  };
}
