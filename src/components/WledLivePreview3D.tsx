import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { computeLedRingFrame, LED_RING_COUNT } from '../wled/ledEffectsEngine';
import {
  LED_DIFFUSER_MATERIAL_NAME,
  LED_RING_BOUNCE_DISTANCE,
  STEREO_HALF_SPACING_X,
  WledRingShaderHandle,
  applyWledRingShader,
  computeRingBounceLight,
  getStereoPreviewLayout,
  isLedRingMeshName,
} from '../wled/ledRingShader';
import { getEffectById, getPaletteById } from '../wled/wledSimulation';
import { VirtualSpeakerId, VirtualSpeakerState } from '../wled/wledTypes';
import {
  preloadSpeakerTurntable,
  tryAcquireWebGLContext,
} from '../model/softwareCanvasRenderer';

const GLB_URLS: Record<VirtualSpeakerId, string> = {
  left: '/left_speaker_photorealistic.glb',
  right: '/speaker_photorealistic.glb',
};

// Module-level binary ArrayBuffer cache so each modal open avoids re-fetching ~11 MB over HTTP,
// while GLTFLoader.parse() produces fresh disposable GPU resources per WebGLRenderer lifecycle.
const glbArrayBufferCache = new Map<string, Promise<ArrayBuffer>>();

function fetchGlbArrayBuffer(url: string): Promise<ArrayBuffer> {
  const existing = glbArrayBufferCache.get(url);
  if (existing) return existing;

  const promise = fetch(url).then((res) => {
    if (!res.ok) {
      glbArrayBufferCache.delete(url);
      throw new Error(`Failed to fetch 3D speaker asset (${res.status})`);
    }
    return res.arrayBuffer();
  });

  glbArrayBufferCache.set(url, promise);
  return promise;
}

function disposeObjectHierarchy(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.geometry) {
        geometries.add(mesh.geometry);
      }
      const matList = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      for (const mat of matList) {
        materials.add(mat);
        const std = mat as THREE.MeshStandardMaterial;
        if (std.map) textures.add(std.map);
        if (std.normalMap) textures.add(std.normalMap);
        if (std.bumpMap) textures.add(std.bumpMap);
        if (std.roughnessMap) textures.add(std.roughnessMap);
        if (std.metalnessMap) textures.add(std.metalnessMap);
        if (std.emissiveMap) textures.add(std.emissiveMap);
        if (std.aoMap) textures.add(std.aoMap);
        if (std.alphaMap) textures.add(std.alphaMap);
      }
    }
  });

  textures.forEach((tex) => tex.dispose());
  materials.forEach((mat) => mat.dispose());
  geometries.forEach((geo) => geo.dispose());
}

interface LoadedSpeakerUnit {
  id: VirtualSpeakerId;
  pivot: THREE.Group;
  modelRoot: THREE.Group;
  ringShader: WledRingShaderHandle | null;
  bounceLight: THREE.PointLight;
}

const _ringCenter = new THREE.Vector2();
const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

function prepareSpeakerUnit(
  id: VirtualSpeakerId,
  rawScene: THREE.Group,
  isSoftwareGl: boolean,
  maxAnisotropy: number,
  enableShadows = true
): LoadedSpeakerUnit {
  const pivot = new THREE.Group();
  pivot.name = `WledPreviewUnit_${id}`;

  const modelRoot = rawScene;

  // Normalize bottom-center onto y = -1.30 (aligned with contact shadow plane) and X/Z centered
  modelRoot.updateMatrixWorld(true);
  _box.setFromObject(modelRoot);
  if (!_box.isEmpty()) {
    _box.getCenter(_center);
    _box.getSize(_size);
    const maxDim = Math.max(_size.x, _size.y, _size.z);
    const scale = maxDim > 0 ? 2.65 / Math.max(_size.y, 0.001) : 1;
    modelRoot.scale.multiplyScalar(scale);
    modelRoot.updateMatrixWorld(true);
    _box.setFromObject(modelRoot);
    _box.getCenter(_center);
    modelRoot.position.x -= _center.x;
    modelRoot.position.z -= _center.z;
    modelRoot.position.y -= _box.min.y + 1.3;
  }

  let ringShader: WledRingShaderHandle | null = null;
  let ringLocalPos = new THREE.Vector3(0, -0.08, 0.7);

  modelRoot.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = enableShadows;
    mesh.receiveShadow = enableShadows;

    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];

    for (const mat of mats) {
      const stdMat = mat as THREE.MeshPhysicalMaterial;
      if (isSoftwareGl && typeof stdMat.transmission === 'number') {
        stdMat.transmission = 0;
      }
      if (stdMat.map) {
        stdMat.map.anisotropy = Math.min(4, maxAnisotropy);
      }
    }

    const isRingMesh =
      isLedRingMeshName(mesh.name, id) ||
      mats.some((m) => m.name === LED_DIFFUSER_MATERIAL_NAME);

    if (isRingMesh && !Array.isArray(mesh.material) && mesh.material) {
      const baseMat = mesh.material as
        | THREE.MeshPhysicalMaterial
        | THREE.MeshStandardMaterial;

      mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox) {
        mesh.geometry.boundingBox.getCenter(_center);
        _ringCenter.set(_center.x, _center.y);
      } else {
        _ringCenter.set(0, 0);
      }

      ringShader = applyWledRingShader(baseMat, _ringCenter);
      baseMat.dispose();
      mesh.material = ringShader.material;
      mesh.updateWorldMatrix(true, false);
      ringLocalPos = mesh.position.clone();
      ringLocalPos.z += 0.14;
    }
  });

  // Strictly range-clamped local bezel rim light positioned directly in front of the LED diffuser ring
  const bounceLight = new THREE.PointLight(
    0x3b5bff,
    0,
    LED_RING_BOUNCE_DISTANCE,
    2.0
  );
  bounceLight.position.copy(ringLocalPos);
  bounceLight.castShadow = false;

  pivot.add(modelRoot);
  pivot.add(bounceLight);

  return {
    id,
    pivot,
    modelRoot,
    ringShader,
    bounceLight,
  };
}

export interface WledLivePreview3DProps {
  leftSpeaker: VirtualSpeakerState;
  rightSpeaker: VirtualSpeakerState;
  activeSpeakerId: VirtualSpeakerId;
  syncEnabled: boolean;
}

function WledLivePreview3DComponent({
  leftSpeaker,
  rightSpeaker,
  activeSpeakerId,
  syncEnabled,
}: WledLivePreview3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    leftSpeaker,
    rightSpeaker,
    activeSpeakerId,
    syncEnabled,
  });
  stateRef.current = {
    leftSpeaker,
    rightSpeaker,
    activeSpeakerId,
    syncEnabled,
  };

  const [readyUnits, setReadyUnits] = useState<Record<VirtualSpeakerId, boolean>>({
    left: false,
    right: false,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    yawOffset: -0.26,
    pitchOffset: 0.04,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const width = Math.max(container.clientWidth || 480, 200);
    const height = Math.max(container.clientHeight || 380, 200);
    const isMobileViewport = width < 768 || window.innerWidth < 768;

    const probeCanvas = document.createElement('canvas');
    const { gl, isSoftwareGl } = tryAcquireWebGLContext(probeCanvas);
    const enableShadows = !isSoftwareGl && !isMobileViewport;

    let renderer: THREE.WebGLRenderer | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let canvasEl: HTMLCanvasElement;

    if (gl) {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: probeCanvas,
          context: gl,
          antialias: !isSoftwareGl,
          powerPreference: isMobileViewport ? 'default' : 'high-performance',
          preserveDrawingBuffer: true,
          alpha: true,
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.setPixelRatio(
          isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, isMobileViewport ? 1.5 : 2)
        );
        renderer.setSize(width, height, false);
        renderer.shadowMap.enabled = enableShadows;
        if (enableShadows) {
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        canvasEl = renderer.domElement;
      } catch {
        renderer = null;
      }
    }

    if (!renderer) {
      const fallback = document.createElement('canvas');
      fallback.width = width;
      fallback.height = height;
      ctx2d = fallback.getContext('2d');
      canvasEl = fallback;
      preloadSpeakerTurntable('L');
      preloadSpeakerTurntable('R');
    } else {
      canvasEl = renderer.domElement;
    }

    canvasEl.setAttribute('data-testid', 'wled-live-3d-canvas');
    canvasEl.className = 'w-full h-full block touch-none outline-none';
    container.appendChild(canvasEl);

    // Build Three.js Scene (shared identical geometry/lighting across GPU & SwiftShader)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);

    let envTexture: THREE.Texture | null = null;
    if (renderer) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      scene.environmentIntensity = 0.34;
      pmremGenerator.dispose();
    }

    // Calibrated dark acoustic studio lighting: warm key + cool fill + subtle cobalt rim
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x060914, 0.52);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.15);
    keyLight.position.set(2.6, 3.8, 4.5);
    if (renderer && enableShadows) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 14;
      const sd = 2.6;
      keyLight.shadow.camera.left = -sd;
      keyLight.shadow.camera.right = sd;
      keyLight.shadow.camera.top = sd;
      keyLight.shadow.camera.bottom = -sd;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.75);
    fillLight.position.set(-3.5, 2.2, 1.8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x3b5bff, 1.35);
    rimLight.position.set(0.4, 2.0, -4.2);
    scene.add(rimLight);

    // Contact shadow plane grounding the speaker(s) cleanly without floating
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    sGrad.addColorStop(0.55, 'rgba(18, 28, 72, 0.28)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const contactShadowGeo = new THREE.PlaneGeometry(2.8, 2.8);
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const leftShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    leftShadow.position.set(0, -1.305, 0);
    scene.add(leftShadow);

    const rightShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    rightShadow.position.set(0, -1.305, 0);
    rightShadow.visible = false;
    scene.add(rightShadow);

    const updateCameraFraming = (w: number, h: number, isSync: boolean) => {
      const layout = getStereoPreviewLayout(isSync, w, h);
      camera.aspect = Math.max(0.45, w / Math.max(1, h));
      camera.fov = layout.fovDeg;
      camera.updateProjectionMatrix();

      camera.position.set(0, layout.cameraY, layout.cameraDist);
      camera.lookAt(0, layout.lookAtY, 0);
    };

    updateCameraFraming(width, height, stateRef.current.syncEnabled);

    const units: Partial<Record<VirtualSpeakerId, LoadedSpeakerUnit>> = {};

    const gltfLoader = new GLTFLoader();
    const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;

    const loadUnit = async (id: VirtualSpeakerId) => {
      try {
        const buffer = await fetchGlbArrayBuffer(GLB_URLS[id]);
        if (disposed) return;

        const gltf = await new Promise<{ scene: THREE.Group }>(
          (resolve, reject) => {
            gltfLoader.parse(buffer, '/', resolve, reject);
          }
        );

        if (disposed) {
          disposeObjectHierarchy(gltf.scene);
          return;
        }

        const unit = prepareSpeakerUnit(
          id,
          gltf.scene,
          isSoftwareGl,
          maxAniso,
          enableShadows
        );
        units[id] = unit;
        scene.add(unit.pivot);
        if (!disposed) {
          setReadyUnits((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
        }
      } catch (err) {
        if (!disposed) {
          setLoadError(
            err instanceof Error ? err.message : 'Could not load 3D speaker model'
          );
        }
      }
    };

    // Stagger GLB parsing: load active speaker first, then queue second unit during idle/next tick
    const firstUnit = stateRef.current.activeSpeakerId;
    const secondUnit = firstUnit === 'left' ? 'right' : 'left';
    void loadUnit(firstUnit).then(() => {
      if (!disposed) {
        if (stateRef.current.syncEnabled) {
          void loadUnit(secondUnit);
        } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void }).requestIdleCallback(
            () => {
              if (!disposed) void loadUnit(secondUnit);
            },
            { timeout: 1200 }
          );
        } else {
          window.setTimeout(() => {
            if (!disposed) void loadUnit(secondUnit);
          }, 250);
        }
      }
    });

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    let frameId = 0;
    let spinAngle = 0;
    let lastNow = performance.now();
    const startNow = lastNow;
    let lastSyncLayout = stateRef.current.syncEnabled;
    let lastSizeW = width;
    let lastSizeH = height;

    const afterDraw = (cb: () => void) => {
      if (!renderer) return;
      const ctx = renderer.getContext() as WebGL2RenderingContext;
      if (typeof ctx.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE, 0);
      ctx.flush();
      const poll = () => {
        if (disposed) {
          if (sync) ctx.deleteSync(sync);
          return;
        }
        const status = sync ? ctx.getSyncParameter(sync, ctx.SYNC_STATUS) : ctx.SIGNALED;
        if (status === ctx.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) ctx.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const drawSoftware2DFallback = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      timeSec: number
    ) => {
      const { leftSpeaker: lSp, rightSpeaker: rSp, activeSpeakerId: actId, syncEnabled: syncOn } =
        stateRef.current;
      ctx.fillStyle = '#040509';
      ctx.fillRect(0, 0, w, h);
      const list = syncOn ? [lSp, rSp] : [actId === 'left' ? lSp : rSp];
      const slotW = w / list.length;

      list.forEach((sp, idx) => {
        const cx = slotW * idx + slotW * 0.5;
        const cy = h * 0.5;
        const frame = computeLedRingFrame(sp, timeSec);
        const radius = Math.min(slotW, h) * 0.16;

        // Subtle dark cabinet silhouette
        ctx.fillStyle = '#12141a';
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(cx - radius * 1.45, cy - radius * 2.6, radius * 2.9, radius * 5.2);
        ctx.strokeRect(cx - radius * 1.45, cy - radius * 2.6, radius * 2.9, radius * 5.2);

        for (let i = 0; i < LED_RING_COUNT; i++) {
          const a0 = ((i - 0.42) / LED_RING_COUNT) * Math.PI * 2 - Math.PI / 2;
          const a1 = ((i + 0.42) / LED_RING_COUNT) * Math.PI * 2 - Math.PI / 2;
          const px = frame[i];
          ctx.beginPath();
          ctx.arc(cx, cy, radius, a0, a1);
          ctx.strokeStyle =
            sp.powered && sp.brightness > 0
              ? `rgb(${px.r}, ${px.g}, ${px.b})`
              : 'rgb(52, 54, 62)';
          ctx.lineWidth = Math.max(4, radius * 0.28);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });
    };

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      const elapsedSec = (now - startNow) / 1000;

      const {
        leftSpeaker: lSp,
        rightSpeaker: rSp,
        activeSpeakerId: actId,
        syncEnabled: isSync,
      } = stateRef.current;

      if (isSync !== lastSyncLayout) {
        lastSyncLayout = isSync;
        updateCameraFraming(lastSizeW, lastSizeH, isSync);
      }

      if (!prefersReducedMotion && !dragRef.current.active) {
        spinAngle += dt * 0.28;
      }

      const targetYaw = dragRef.current.yawOffset + spinAngle;
      const targetPitch = dragRef.current.pitchOffset;

      const updateUnit = (unit: LoadedSpeakerUnit | undefined, sp: VirtualSpeakerState, visible: boolean, posX: number) => {
        if (!unit) return;
        unit.pivot.visible = visible;
        if (!visible) return;

        unit.pivot.position.set(posX, 0, 0);
        unit.pivot.rotation.set(targetPitch, targetYaw, 0);

        const frame = computeLedRingFrame(sp, elapsedSec);
        unit.ringShader?.update(frame, sp.powered, sp.brightness);

        const bounce = computeRingBounceLight(frame, sp.powered, sp.brightness);
        unit.bounceLight.color.setRGB(bounce.r, bounce.g, bounce.b);
        unit.bounceLight.intensity = bounce.intensity;
      };

      if (isSync) {
        updateUnit(units.left, lSp, true, -STEREO_HALF_SPACING_X);
        updateUnit(units.right, rSp, true, STEREO_HALF_SPACING_X);
        leftShadow.position.set(-STEREO_HALF_SPACING_X, -1.305, 0);
        leftShadow.visible = Boolean(units.left);
        rightShadow.position.set(STEREO_HALF_SPACING_X, -1.305, 0);
        rightShadow.visible = Boolean(units.right);
      } else {
        updateUnit(units.left, lSp, actId === 'left', 0);
        updateUnit(units.right, rSp, actId === 'right', 0);
        leftShadow.position.set(0, -1.305, 0);
        leftShadow.visible = Boolean(actId === 'left' ? units.left : units.right);
        rightShadow.visible = false;
      }

      if (renderer) {
        renderer.render(scene, camera);
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      } else if (ctx2d) {
        drawSoftware2DFallback(ctx2d, canvasEl.width, canvasEl.height, elapsedSec);
        setReadyUnits((prev) =>
          prev.left && prev.right ? prev : { left: true, right: true }
        );
        frameId = window.setTimeout(tick, 60);
      }
    };

    // Kick off render loop
    if (renderer) {
      if (isSoftwareGl) {
        frameId = window.setTimeout(tick, 16);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    } else {
      frameId = window.setTimeout(tick, 16);
    }

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (disposed) return;
      for (const entry of entries) {
        const w = Math.max(Math.round(entry.contentRect.width), 160);
        const h = Math.max(Math.round(entry.contentRect.height), 160);
        if (w === lastSizeW && h === lastSizeH) continue;
        lastSizeW = w;
        lastSizeH = h;
        updateCameraFraming(w, h, stateRef.current.syncEnabled);
        if (renderer) {
          const isNarrow = w < 768 || window.innerWidth < 768;
          renderer.setPixelRatio(
            isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, isNarrow ? 1.5 : 2)
          );
          renderer.setSize(w, h, false);
          if (units.left || units.right) {
            renderer.render(scene, camera);
          }
        } else {
          canvasEl.width = w;
          canvasEl.height = h;
          if (ctx2d) {
            drawSoftware2DFallback(ctx2d, w, h, (performance.now() - startNow) / 1000);
          }
        }
      }
    });
    resizeObserver.observe(container);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
    };
    const onContextRestored = () => {
      if (!disposed) tick();
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);

      if (units.left) disposeObjectHierarchy(units.left.pivot);
      if (units.right) disposeObjectHierarchy(units.right.pivot);

      contactShadowGeo.dispose();
      contactShadowMat.dispose();
      shadowTex.dispose();
      envTexture?.dispose();

      if (renderer) {
        try {
          renderer.forceContextLoss();
          renderer.dispose();
        } catch {
          // ignore cleanup errors
        }
      }

      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    dragRef.current.yawOffset += dx * 0.0085;
    dragRef.current.pitchOffset = Math.max(
      -0.45,
      Math.min(0.45, dragRef.current.pitchOffset + dy * 0.0055)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleDoubleClick = () => {
    dragRef.current.yawOffset = -0.26;
    dragRef.current.pitchOffset = 0.04;
  };

  const activeSpeaker =
    activeSpeakerId === 'left' ? leftSpeaker : rightSpeaker;
  const isWaitingForActiveModel = syncEnabled
    ? !readyUnits.left || !readyUnits.right
    : !readyUnits[activeSpeakerId];

  return (
    <div
      data-testid="wled-live-3d-stage"
      data-active-speaker={activeSpeakerId}
      data-sync={syncEnabled ? 'on' : 'off'}
      data-left-ready={readyUnits.left ? 'true' : 'false'}
      data-right-ready={readyUnits.right ? 'true' : 'false'}
      className="relative w-full h-full min-h-[190px] sm:min-h-[260px] rounded-xl border border-white/10 bg-[#040509] overflow-hidden select-none"
      style={{
        background:
          'radial-gradient(ellipse 74% 64% at 50% 48%, rgba(44, 52, 128, 0.24) 0%, rgba(10, 14, 34, 0.45) 52%, rgba(4, 5, 9, 1) 88%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Dedicated empty Three.js WebGL canvas mount node */}
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label={
          syncEnabled
            ? '3D lighting preview for Left and Right speakers'
            : `3D lighting preview for ${activeSpeaker.name} speaker`
        }
      />

      {/* Non-intrusive Speaker Identification & Live Parameter Badges */}
      {!syncEnabled ? (
        <div
          data-testid={`wled-preview-speaker-${activeSpeaker.id}`}
          className="pointer-events-none absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between gap-2"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md bg-black/75 border border-white/15 font-mono text-[10px] sm:text-[11px] text-white">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#1D2766] border border-[#3B5BFF]/60 text-[10px] font-bold">
              {activeSpeaker.code}
            </span>
            <span className="uppercase tracking-wider">{activeSpeaker.name}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md bg-black/75 border border-white/15 font-mono text-[10px] sm:text-[11px] tabular-nums text-[#93C5FD]">
            <span>{getEffectById(activeSpeaker.effectId).name}</span>
            <span className="text-white/30">·</span>
            <span>
              {activeSpeaker.powered ? `${activeSpeaker.brightness}%` : 'OFF'}
            </span>
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 grid grid-cols-2 gap-2 sm:gap-3">
          {[leftSpeaker, rightSpeaker].map((sp) => (
            <div
              key={sp.id}
              data-testid={`wled-preview-speaker-${sp.id}`}
              className="flex items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md bg-black/75 border border-white/15 font-mono text-[10px] sm:text-[11px]"
            >
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded bg-[#1D2766] border border-[#3B5BFF]/60 text-[9px] sm:text-[10px] font-bold text-white shrink-0">
                  {sp.code}
                </span>
                <span className="uppercase tracking-wider text-white font-semibold whitespace-nowrap">
                  {sp.name}
                </span>
              </div>
              <span className="text-[#93C5FD] tabular-nums whitespace-nowrap shrink-0">
                {sp.powered ? `${sp.brightness}%` : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subtle Bottom Orbit Hint */}
      <div className="pointer-events-none absolute bottom-2 sm:bottom-2.5 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] truncate px-2.5 sm:px-3 py-1 rounded bg-black/70 border border-white/10 font-mono text-[9px] sm:text-[10px] tracking-[0.14em] sm:tracking-[0.16em] uppercase text-white/55 whitespace-nowrap">
        Drag to rotate · {getPaletteById(activeSpeaker.paletteId).name}
      </div>

      {/* Initial GLB Loading Overlay */}
      {isWaitingForActiveModel && !loadError && (
        <div
          role="status"
          aria-live="polite"
          data-testid="wled-3d-loading"
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#040509]/85 text-center px-4"
        >
          <div className="w-8 h-8 rounded-full border-2 border-[#3B5BFF]/30 border-t-[#93C5FD] animate-spin mb-3" />
          <p className="font-mono text-xs tracking-wider uppercase text-white/80">
            Loading 3D speaker model…
          </p>
        </div>
      )}

      {/* Resilient Error State if Asset Fails */}
      {loadError && (
        <div
          role="alert"
          data-testid="wled-3d-error"
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#040509]/95 text-center px-6"
        >
          <p className="font-mono text-xs text-rose-400 mb-1">
            Could not load 3D model
          </p>
          <p className="text-xs text-white/60 max-w-xs">{loadError}</p>
        </div>
      )}
    </div>
  );
}

const WledLivePreview3D = React.memo(WledLivePreview3DComponent);
export default WledLivePreview3D;
