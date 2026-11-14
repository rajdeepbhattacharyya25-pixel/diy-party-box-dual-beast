import * as THREE from 'three';

const preRenderedImageCache = new Map<string, HTMLImageElement>();

interface TurntableRingSpec {
  id: 'neg16' | '0' | '16' | '42';
  phiDeg: number;
  stepDeg: number;
  cols: number;
  rows: number;
  cellSize: number;
}

export const TURNTABLE_CANONICAL_RADIUS = 4.1;

export const TURNTABLE_RINGS: Record<TurntableRingSpec['id'], TurntableRingSpec> = {
  neg16: {
    id: 'neg16',
    phiDeg: -16,
    stepDeg: 10,
    cols: 6,
    rows: 6,
    cellSize: 360,
  },
  '0': {
    id: '0',
    phiDeg: 0,
    stepDeg: 10,
    cols: 6,
    rows: 6,
    cellSize: 360,
  },
  '16': {
    id: '16',
    phiDeg: 16,
    stepDeg: 10,
    cols: 6,
    rows: 6,
    cellSize: 360,
  },
  '42': {
    id: '42',
    phiDeg: 42,
    stepDeg: 10,
    cols: 6,
    rows: 6,
    cellSize: 360,
  },
};

function getOrLoadImage(
  cacheKey: string,
  url: string,
  onImageLoaded?: () => void
): HTMLImageElement {
  let img = preRenderedImageCache.get(cacheKey);
  if (!img) {
    img = new Image();
    img.src = url;
    if (onImageLoaded) {
      img.onload = () => onImageLoaded();
    }
    preRenderedImageCache.set(cacheKey, img);
  }
  return img;
}

function isImageReady(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/**
 * Preloads the primary 360° turntable atlases and studio renders for a speaker side
 * so mouse-drag rotation and close-up zoom are instantaneous.
 */
export function preloadSpeakerTurntable(
  speakerSide: 'L' | 'R',
  onImageLoaded?: () => void
): void {
  if (typeof document === 'undefined') return;
  const presets = ['orbit', 'front', 'back', 'left', 'right', 'top'];
  for (const p of presets) {
    const key = `${speakerSide}_${p}`;
    getOrLoadImage(key, `/assets/renders/${key}.png`, onImageLoaded);
  }
  const ringOrder: TurntableRingSpec['id'][] = ['16', '0', '42', 'neg16'];
  for (const ringId of ringOrder) {
    const key = `atlas_${speakerSide}_${ringId}`;
    const url = `/assets/renders/turntable/${speakerSide}_ring_${ringId}.jpg`;
    getOrLoadImage(key, url, onImageLoaded);
  }
}

/**
 * Safely attempts to acquire a WebGL2 or WebGL1 context without triggering
 * Three.js's internal `console.error` or uncaught exception when WebGL is disabled
 * by the browser or sandbox (`GL_VENDOR = Disabled`).
 */
export function tryAcquireWebGLContext(canvas: HTMLCanvasElement): {
  gl: WebGLRenderingContext | WebGL2RenderingContext | null;
  isSoftwareGl: boolean;
} {
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  const attempts: WebGLContextAttributes[] = [
    { antialias: true, preserveDrawingBuffer: true },
    { antialias: false, preserveDrawingBuffer: true, powerPreference: 'low-power' },
    { failIfMajorPerformanceCaveat: false },
  ];

  for (const attrs of attempts) {
    try {
      gl =
        (canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ||
        (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ||
        (canvas.getContext(
          'experimental-webgl',
          attrs
        ) as WebGLRenderingContext | null);
      if (gl && !(typeof gl.isContextLost === 'function' && gl.isContextLost())) {
        break;
      }
      gl = null;
    } catch {
      gl = null;
    }
  }

  if (!gl) {
    return { gl: null, isSoftwareGl: true };
  }

  let isSoftwareGl = false;
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      gpu
    );
  } catch {
    isSoftwareGl = false;
  }

  return { gl, isSoftwareGl };
}

function angularDistanceDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Renders the 3D speaker onto a 2D Canvas when WebGL context creation is disabled
 * in the user's browser (`GL_VENDOR = Disabled`), using high-resolution studio captures
 * and multi-elevation 360° photorealistic WebGL turntable atlases with Retina scaling.
 */
export function renderSpeakerSoftware2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  root: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  speakerSide: 'L' | 'R' = 'L',
  viewId: string = 'orbit',
  onImageLoaded?: () => void,
  target?: THREE.Vector3
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, width, height);
  const bgGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    height * 0.08,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.58
  );
  bgGrad.addColorStop(0, '#0b0c0f');
  bgGrad.addColorStop(0.52, '#0b0e18');
  bgGrad.addColorStop(0.82, '#080b16');
  bgGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  if (typeof document !== 'undefined') {
    preloadSpeakerTurntable(speakerSide, onImageLoaded);

    const targetX = target ? target.x : 0;
    const targetY = target ? target.y : -0.11;
    const targetZ = target ? target.z : 0;

    const dxCam = camera.position.x - targetX;
    const dyCam = camera.position.y - targetY;
    const dzCam = camera.position.z - targetZ;
    const dist = Math.max(
      0.5,
      Math.sqrt(dxCam * dxCam + dyCam * dyCam + dzCam * dzCam)
    );

    const thetaRad = Math.atan2(dxCam, dzCam);
    const thetaDeg = ((thetaRad * 180) / Math.PI + 360) % 360;
    const phiRad = Math.asin(Math.max(-1, Math.min(1, dyCam / dist)));
    const phiDeg = (phiRad * 180) / Math.PI;

    // 1. Steep top-down view (phi >= 65°): dynamically rotate & zoom the high-res Top studio render
    if (phiDeg >= 65) {
      const topKey = `${speakerSide}_top`;
      const topImg = getOrLoadImage(
        topKey,
        `/assets/renders/${topKey}.png`,
        onImageLoaded
      );
      if (isImageReady(topImg)) {
        const zoomScale = 4.55 / dist;
        const baseScale = Math.min(
          width / topImg.naturalWidth,
          height / topImg.naturalHeight
        );
        const drawW = topImg.naturalWidth * baseScale * zoomScale;
        const drawH = topImg.naturalHeight * baseScale * zoomScale;
        ctx.translate(width * 0.5, height * 0.5);
        if (angularDistanceDeg(thetaDeg, 0) > 1.5) {
          ctx.rotate(-thetaRad);
        }
        ctx.drawImage(topImg, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
        ctx.restore();
        return;
      }
    }

    // 2. Check if camera angle matches one of the high-res studio preset views (supports full zoom!)
    const orbitTheta = speakerSide === 'L' ? 320 : 40;
    const leftTheta = speakerSide === 'L' ? 270 : 90;
    const rightTheta = speakerSide === 'L' ? 90 : 270;

    let matchedPreset: string | null = null;
    let presetBaseDist = 4.75;

    if (
      angularDistanceDeg(thetaDeg, orbitTheta) <= 2.4 &&
      Math.abs(phiDeg - 15.6) <= 2.4
    ) {
      matchedPreset = 'orbit';
      presetBaseDist = 5.085;
    } else if (
      angularDistanceDeg(thetaDeg, 0) <= 2.4 &&
      Math.abs(phiDeg) <= 2.4
    ) {
      matchedPreset = 'front';
      presetBaseDist = 4.75;
    } else if (
      angularDistanceDeg(thetaDeg, 180) <= 2.4 &&
      Math.abs(phiDeg) <= 2.4
    ) {
      matchedPreset = 'back';
      presetBaseDist = 4.85;
    } else if (
      angularDistanceDeg(thetaDeg, leftTheta) <= 2.4 &&
      Math.abs(phiDeg) <= 2.4
    ) {
      matchedPreset = 'left';
      presetBaseDist = 4.75;
    } else if (
      angularDistanceDeg(thetaDeg, rightTheta) <= 2.4 &&
      Math.abs(phiDeg) <= 2.4
    ) {
      matchedPreset = 'right';
      presetBaseDist = 4.75;
    }

    if (matchedPreset) {
      const presetKey = `${speakerSide}_${matchedPreset}`;
      const presetImg = getOrLoadImage(
        presetKey,
        `/assets/renders/${presetKey}.png`,
        onImageLoaded
      );
      if (isImageReady(presetImg)) {
        const zoomScale = presetBaseDist / dist;
        const baseScale = Math.min(
          width / presetImg.naturalWidth,
          height / presetImg.naturalHeight
        );
        const drawW = presetImg.naturalWidth * baseScale * zoomScale;
        const drawH = presetImg.naturalHeight * baseScale * zoomScale;
        const dx = (width - drawW) * 0.5;
        const dy = (height - drawH) * 0.5;
        ctx.drawImage(presetImg, dx, dy, drawW, drawH);
        ctx.restore();
        return;
      }
    }

    // 3. Multi-elevation 360° Turntable Atlas rendering for interactive rotation & zoom
    let targetRingId: TurntableRingSpec['id'] = '16';
    if (phiDeg < -8) {
      targetRingId = 'neg16';
    } else if (phiDeg < 8) {
      targetRingId = '0';
    } else if (phiDeg < 29) {
      targetRingId = '16';
    } else {
      targetRingId = '42';
    }

    const fallbackRingOrder: TurntableRingSpec['id'][] = [
      targetRingId,
      '16',
      '0',
      '42',
      'neg16',
    ];

    for (const ringId of fallbackRingOrder) {
      const ringSpec = TURNTABLE_RINGS[ringId];
      const atlasKey = `atlas_${speakerSide}_${ringId}`;
      const atlasUrl = `/assets/renders/turntable/${speakerSide}_ring_${ringId}.jpg`;
      const atlasImg = getOrLoadImage(atlasKey, atlasUrl, onImageLoaded);

      if (isImageReady(atlasImg)) {
        const totalSteps = Math.round(360 / ringSpec.stepDeg);
        const stepIndex =
          Math.round(thetaDeg / ringSpec.stepDeg) % totalSteps;
        const col = stepIndex % ringSpec.cols;
        const row = Math.floor(stepIndex / ringSpec.cols);
        const sx = col * ringSpec.cellSize;
        const sy = row * ringSpec.cellSize;

        const drawSize = height * (TURNTABLE_CANONICAL_RADIUS / dist);
        const dx = (width - drawSize) * 0.5;
        const dy = (height - drawSize) * 0.5;

        ctx.drawImage(
          atlasImg,
          sx,
          sy,
          ringSpec.cellSize,
          ringSpec.cellSize,
          dx,
          dy,
          drawSize,
          drawSize
        );
        ctx.restore();
        return;
      }
    }

    // 4. Fallback while turntable atlas is still downloading: draw nearest static preset PNG
    const fallbackPresetKey = `${speakerSide}_${viewId}`;
    const fallbackImg = getOrLoadImage(
      fallbackPresetKey,
      `/assets/renders/${fallbackPresetKey}.png`,
      onImageLoaded
    );
    if (isImageReady(fallbackImg)) {
      const scale =
        Math.min(
          width / fallbackImg.naturalWidth,
          height / fallbackImg.naturalHeight
        ) *
        (4.85 / dist);
      const drawW = fallbackImg.naturalWidth * scale;
      const drawH = fallbackImg.naturalHeight * scale;
      const dx = (width - drawW) * 0.5;
      const dy = (height - drawH) * 0.5;
      ctx.drawImage(fallbackImg, dx, dy, drawW, drawH);
      ctx.restore();
      return;
    }
  }

  // Lightweight fallback for headless Node unit tests where DOM Image isn't loaded
  root.updateMatrixWorld(true);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const viewProjMatrix = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const p0 = new THREE.Vector4();
  const p1 = new THREE.Vector4();
  const p2 = new THREE.Vector4();
  const halfW = width * 0.5;
  const halfH = height * 0.5;

  root.traverseVisible((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const posAttr = mesh.geometry.getAttribute('position');
    if (!posAttr) return;
    const indexAttr = mesh.geometry.getIndex();
    const worldMat = mesh.matrixWorld;
    const triCount = Math.min(
      60,
      indexAttr
        ? Math.floor(indexAttr.count / 3)
        : Math.floor(posAttr.count / 3)
    );
    ctx.fillStyle = 'rgb(34,36,40)';
    for (let t = 0; t < triCount; t++) {
      const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
      const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;
      v0.fromBufferAttribute(posAttr, i0).applyMatrix4(worldMat);
      v1.fromBufferAttribute(posAttr, i1).applyMatrix4(worldMat);
      v2.fromBufferAttribute(posAttr, i2).applyMatrix4(worldMat);
      p0.set(v0.x, v0.y, v0.z, 1).applyMatrix4(viewProjMatrix);
      p1.set(v1.x, v1.y, v1.z, 1).applyMatrix4(viewProjMatrix);
      p2.set(v2.x, v2.y, v2.z, 1).applyMatrix4(viewProjMatrix);
      if (p0.w <= 0.05 || p1.w <= 0.05 || p2.w <= 0.05) continue;
      ctx.beginPath();
      ctx.moveTo((p0.x / p0.w + 1) * halfW, (1 - p0.y / p0.w) * halfH);
      ctx.lineTo((p1.x / p1.w + 1) * halfW, (1 - p1.y / p1.w) * halfH);
      ctx.lineTo((p2.x / p2.w + 1) * halfW, (1 - p2.y / p2.w) * halfH);
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.restore();
}
