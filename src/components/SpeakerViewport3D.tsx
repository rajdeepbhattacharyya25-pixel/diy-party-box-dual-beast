import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  buildSpeakerModel,
  BuiltSpeakerModel,
} from '../model/buildSpeakerModel';
import { buildLeftSpeakerModel } from '../model/buildLeftSpeakerModel';
import { createSpeakerTextureSet } from '../model/speakerTextures';
import {
  tryAcquireWebGLContext,
  renderSpeakerSoftware2D,
  preloadSpeakerTurntable,
} from '../model/softwareCanvasRenderer';
import { RefreshCw, X } from 'lucide-react';
import { getAdaptive3DCameraConfig } from '../kinetic/editorialStages';

export type CameraPresetId = 'orbit' | 'front' | 'back' | 'left' | 'right' | 'top';
export type SpeakerSideId = 'L' | 'R';

interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
}

export const CAMERA_PRESETS_LEFT: Record<CameraPresetId, CameraPreset> = {
  orbit: {
    id: 'orbit',
    label: '3D Orbit',
    position: [-3.15, 1.25, 3.75],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  front: {
    id: 'front',
    label: 'Front',
    position: [0, -0.12, 4.75],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  back: {
    id: 'back',
    label: 'Back',
    position: [0, -0.10, -4.85],
    target: [0, -0.10, 0],
    up: [0, 1, 0],
  },
  left: {
    id: 'left',
    label: 'Left',
    position: [-4.75, -0.12, 0],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  right: {
    id: 'right',
    label: 'Right',
    position: [4.75, -0.12, 0],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  top: {
    id: 'top',
    label: 'Top',
    position: [0, 4.55, -0.048],
    target: [0, 0, -0.050],
    up: [0, 1, 0],
  },
};

export const CAMERA_PRESETS_RIGHT: Record<CameraPresetId, CameraPreset> = {
  orbit: {
    id: 'orbit',
    label: '3D Orbit',
    position: [3.15, 1.25, 3.75],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  front: {
    id: 'front',
    label: 'Front',
    position: [0, -0.12, 4.75],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  back: {
    id: 'back',
    label: 'Back',
    position: [0, -0.10, -4.85],
    target: [0, -0.10, 0],
    up: [0, 1, 0],
  },
  left: {
    id: 'left',
    label: 'Left',
    position: [4.75, -0.12, 0],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  right: {
    id: 'right',
    label: 'Right',
    position: [-4.75, -0.12, 0],
    target: [0, -0.12, 0],
    up: [0, 1, 0],
  },
  top: {
    id: 'top',
    label: 'Top',
    position: [0, 4.55, -0.048],
    target: [0, 0, -0.050],
    up: [0, 1, 0],
  },
};

export const CAMERA_PRESETS = CAMERA_PRESETS_LEFT;

const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _desiredUp = new THREE.Vector3(0, 1, 0);

interface SpeakerViewport3DProps {
  onClose?: () => void;
}

function SpeakerViewport3DComponent({ onClose }: SpeakerViewport3DProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const leftModelRef = useRef<BuiltSpeakerModel | null>(null);
  const rightModelRef = useRef<BuiltSpeakerModel | null>(null);
  const buildModelForSideRef = useRef<((side: SpeakerSideId) => BuiltSpeakerModel | null) | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const activeSideRef = useRef<SpeakerSideId>('R');
  const activeViewRef = useRef<CameraPresetId>('orbit');
  const requestRenderRef = useRef<(() => void) | null>(null);
  const transitionGoalRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
    up: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS_RIGHT.orbit.position),
    target: new THREE.Vector3(...CAMERA_PRESETS_RIGHT.orbit.target),
    up: new THREE.Vector3(0, 1, 0),
  });

  const [speakerSide, setSpeakerSide] = useState<SpeakerSideId>('R');
  const [activeView, setActiveView] = useState<CameraPresetId>('orbit');
  // Slow auto-rotation enabled by default
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const glProbeCanvas = document.createElement('canvas');
    const { gl, isSoftwareGl } = tryAcquireWebGLContext(glProbeCanvas);

    let renderer: THREE.WebGLRenderer | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let activeCanvas: HTMLCanvasElement;

    const isMobileViewport = width < 768 || window.innerWidth < 768;
    const enableShadows = !isMobileViewport;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobileViewport ? 1.5 : 2.5);

    if (gl && !isSoftwareGl) {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: glProbeCanvas,
          context: gl,
          antialias: true,
          powerPreference: 'default',
          preserveDrawingBuffer: true,
          alpha: true,
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = enableShadows;
        if (enableShadows) {
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        activeCanvas = renderer.domElement;
      } catch {
        renderer = null;
      }
    }

    const dummyRoot = new THREE.Group();

    if (!renderer) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = Math.round(width * dpr);
      fallbackCanvas.height = Math.round(height * dpr);
      fallbackCanvas.style.width = `${width}px`;
      fallbackCanvas.style.height = `${height}px`;
      ctx2d = fallbackCanvas.getContext('2d');
      activeCanvas = fallbackCanvas;
      preloadSpeakerTurntable('R', () => {
        requestRenderRef.current?.();
      });
      preloadSpeakerTurntable('L', () => {
        requestRenderRef.current?.();
      });
    } else {
      activeCanvas = renderer.domElement;
    }

    activeCanvas.setAttribute('data-testid', 'speaker-3d-canvas');
    activeCanvas.style.cursor = 'grab';
    container.appendChild(activeCanvas);

    const scene = new THREE.Scene();

    if (renderer) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;
      scene.environmentIntensity = 0.3;
      pmremGenerator.dispose();
    }

    const camConfig = getAdaptive3DCameraConfig(width / height);
    const camera = new THREE.PerspectiveCamera(
      camConfig.fov,
      width / height,
      0.1,
      50
    );
    const [bx, by, bz] = CAMERA_PRESETS_RIGHT.orbit.position;
    camera.position.set(
      bx * camConfig.distanceMultiplier,
      by * camConfig.distanceMultiplier,
      bz * camConfig.distanceMultiplier
    );
    camera.lookAt(...CAMERA_PRESETS_RIGHT.orbit.target);

    const controls = new OrbitControls(camera, activeCanvas);
    controlsRef.current = controls;
    controls.target.set(...CAMERA_PRESETS_RIGHT.orbit.target);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = 0.85;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    // Slow, smooth 360° turntable rotation by default
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;
    controls.minDistance = camConfig.minDistance;
    controls.maxDistance = camConfig.maxDistance;
    controls.update();

    // Cobalt & Obsidian Studio Lighting Rig matching the Hero design palette
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x050714, 0.48);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.9);
    keyLight.position.set(2.8, 4.2, 4.4);
    keyLight.castShadow = Boolean(renderer) && enableShadows;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    const d = 2.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.95);
    fillLight.position.set(-3.4, 2.4, -3.8);
    scene.add(fillLight);

    const sideLightRight = new THREE.DirectionalLight(0x3b82f6, 1.65);
    sideLightRight.position.set(4.4, 1.4, -1.8);
    scene.add(sideLightRight);

    const sideLightLeft = new THREE.DirectionalLight(0xdbeafe, 1.45);
    sideLightLeft.position.set(-4.4, 1.4, 2.4);
    scene.add(sideLightLeft);

    // Soft Cobalt-tinted radial floor shadow plane beneath the speaker base
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(20, 30, 85, 0.32)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
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
    const contactShadowMesh = new THREE.Mesh(
      contactShadowGeo,
      contactShadowMat
    );
    contactShadowMesh.position.set(0, -1.315, 0);
    scene.add(contactShadowMesh);

    const getActiveModel = () =>
      activeSideRef.current === 'L'
        ? leftModelRef.current
        : rightModelRef.current;

    const drawCurrentScene = () => {
      if (renderer) {
        renderer.render(scene, camera);
      } else if (ctx2d) {
        const activeModel = getActiveModel();
        renderSpeakerSoftware2D(
          ctx2d,
          activeCanvas.width,
          activeCanvas.height,
          activeModel ? activeModel.root : dummyRoot,
          camera,
          activeSideRef.current,
          activeViewRef.current,
          () => {
            requestRenderRef.current?.();
          },
          controls.target
        );
      }
    };

    let sharedTextures: ReturnType<typeof createSpeakerTextureSet> | null = null;
    let builtLeft: BuiltSpeakerModel | null = null;
    let builtRight: BuiltSpeakerModel | null = null;
    let idlePrecacheHandle: number | null = null;

    const buildModelForSide = (side: SpeakerSideId): BuiltSpeakerModel | null => {
      if (!renderer || !sharedTextures) return null;
      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      if (side === 'R') {
        if (!builtRight) {
          builtRight = buildSpeakerModel(maxAnisotropy, undefined, sharedTextures);
          builtRight.root.visible = activeSideRef.current === 'R';
          rightModelRef.current = builtRight;
          scene.add(builtRight.root);
        }
        return builtRight;
      } else {
        if (!builtLeft) {
          builtLeft = buildLeftSpeakerModel(maxAnisotropy, undefined, sharedTextures);
          builtLeft.root.visible = activeSideRef.current === 'L';
          leftModelRef.current = builtLeft;
          scene.add(builtLeft.root);
        }
        return builtLeft;
      }
    };
    buildModelForSideRef.current = buildModelForSide;

    if (renderer) {
      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      sharedTextures = createSpeakerTextureSet(maxAnisotropy, () => {
        requestRenderRef.current?.();
      });

      // Priority mount: build only the currently active speaker model on initial modal open
      const initialActiveModel = buildModelForSide(activeSideRef.current);
      if (initialActiveModel) {
        initialActiveModel.root.visible = true;
      }
      renderer.compile(scene, camera);

      // Background pre-cache: build the secondary speaker during idle cycles (<16ms initial open)
      const secondarySide: SpeakerSideId = activeSideRef.current === 'R' ? 'L' : 'R';
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idlePrecacheHandle = (window as unknown as {
          requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number;
        }).requestIdleCallback(() => {
          buildModelForSide(secondarySide);
          requestRenderRef.current?.();
        }, { timeout: 1200 });
      } else {
        idlePrecacheHandle = window.setTimeout(() => {
          buildModelForSide(secondarySide);
          requestRenderRef.current?.();
        }, 250);
      }
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let isDrawingFrame = false;
    let lastTime = performance.now();

    function stepScene(dt: number): boolean {
      let needsMoreFrames = false;

      const goal = transitionGoalRef.current;
      if (goal.active) {
        const alpha = 1 - Math.exp(-9 * dt);
        camera.position.lerp(goal.pos, alpha);
        controls.target.lerp(goal.target, alpha);
        camera.up.lerp(goal.up, alpha).normalize();
        if (
          camera.position.distanceToSquared(goal.pos) < 0.0002 &&
          controls.target.distanceToSquared(goal.target) < 0.0002
        ) {
          camera.position.copy(goal.pos);
          controls.target.copy(goal.target);
          camera.up.copy(goal.up);
          goal.active = false;
        } else {
          needsMoreFrames = true;
        }
      }

      isDrawingFrame = true;
      const controlsMoving = controls.update(dt);
      isDrawingFrame = false;
      if (controlsMoving || controls.autoRotate) {
        needsMoreFrames = true;
      }

      drawCurrentScene();
      return needsMoreFrames;
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        renderDirty = false;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const needsMoreFrames = stepScene(dt);
        renderBusy = false;
        if (renderDirty || needsMoreFrames) {
          requestRender();
        }
      });
    }

    requestRenderRef.current = () => {
      requestRender();
    };

    const onControlStart = () => {
      transitionGoalRef.current.active = false;
      camera.up.set(0, 1, 0);
      activeCanvas.style.cursor = 'grabbing';
    };
    const onControlEnd = () => {
      activeCanvas.style.cursor = 'grab';
    };
    const onControlChange = () => {
      if (!isDrawingFrame) {
        requestRender();
      }
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);
    controls.addEventListener('change', onControlChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const isNarrow = w < 768 || window.innerWidth < 768;
      const nextDpr = Math.min(window.devicePixelRatio || 1, isNarrow ? 1.5 : 2.5);
      const nextCam = getAdaptive3DCameraConfig(w / h);
      camera.fov = nextCam.fov;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      controls.minDistance = nextCam.minDistance;
      controls.maxDistance = nextCam.maxDistance;
      if (renderer) {
        renderer.setPixelRatio(nextDpr);
        renderer.setSize(w, h);
      } else {
        activeCanvas.width = Math.round(w * nextDpr);
        activeCanvas.height = Math.round(h * nextDpr);
        activeCanvas.style.width = `${w}px`;
        activeCanvas.style.height = `${h}px`;
      }
      stepScene(0.016);
    };
    window.addEventListener('resize', onResize);

    const releaseWebGL = () => {
      if (renderer) {
        try {
          renderer.forceContextLoss();
          renderer.dispose();
        } catch {
          // ignore cleanup errors
        }
      }
    };
    window.addEventListener('pagehide', releaseWebGL);

    // Start initial render and continuous slow turntable loop
    requestRender();

    return () => {
      if (idlePrecacheHandle !== null) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(
            idlePrecacheHandle
          );
        } else {
          clearTimeout(idlePrecacheHandle);
        }
      }
      buildModelForSideRef.current = null;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pagehide', releaseWebGL);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.removeEventListener('change', onControlChange);
      cancelAnimationFrame(frameId);
      controls.dispose();
      controlsRef.current = null;
      contactShadowGeo.dispose();
      contactShadowMat.dispose();
      shadowTex.dispose();
      builtLeft?.dispose();
      builtRight?.dispose();
      sharedTextures?.dispose();
      releaseWebGL();
      if (activeCanvas.parentNode === container) {
        container.removeChild(activeCanvas);
      }
    };
  }, []);

  const getPresetsForSide = useCallback((side: SpeakerSideId) => {
    return side === 'L' ? CAMERA_PRESETS_LEFT : CAMERA_PRESETS_RIGHT;
  }, []);

  const handleSelectSpeakerSide = useCallback(
    (nextSide: SpeakerSideId) => {
      if (nextSide === speakerSide) return;
      activeSideRef.current = nextSide;
      setSpeakerSide(nextSide);

      // Ensure model is built on-demand if idle pre-caching hasn't completed yet
      buildModelForSideRef.current?.(nextSide);

      preloadSpeakerTurntable(nextSide, () => {
        requestRenderRef.current?.();
      });

      const leftModel = leftModelRef.current;
      const rightModel = rightModelRef.current;
      if (leftModel) {
        leftModel.root.visible = nextSide === 'L';
      }
      if (rightModel) {
        rightModel.root.visible = nextSide === 'R';
      }

      const presets = getPresetsForSide(nextSide);
      const preset = presets[activeView];
      _desiredPos.set(...preset.position);
      _desiredTarget.set(...preset.target);
      _desiredUp.set(...preset.up);
      transitionGoalRef.current.pos.copy(_desiredPos);
      transitionGoalRef.current.target.copy(_desiredTarget);
      transitionGoalRef.current.up.copy(_desiredUp);
      transitionGoalRef.current.active = true;
      requestRenderRef.current?.();
    },
    [speakerSide, activeView, getPresetsForSide]
  );

  const handleSelectCameraPreset = useCallback(
    (presetId: CameraPresetId) => {
      const presets = getPresetsForSide(speakerSide);
      const preset = presets[presetId];
      activeViewRef.current = presetId;
      setActiveView(presetId);

      if (presetId === 'orbit') {
        if (controlsRef.current) {
          controlsRef.current.autoRotate = true;
        }
        setAutoRotate(true);
      } else if (controlsRef.current?.autoRotate) {
        controlsRef.current.autoRotate = false;
        setAutoRotate(false);
      }

      _desiredPos.set(...preset.position);
      _desiredTarget.set(...preset.target);
      _desiredUp.set(...preset.up);

      transitionGoalRef.current.pos.copy(_desiredPos);
      transitionGoalRef.current.target.copy(_desiredTarget);
      transitionGoalRef.current.up.copy(_desiredUp);
      transitionGoalRef.current.active = true;
      requestRenderRef.current?.();
    },
    [speakerSide, getPresetsForSide]
  );

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      if (controlsRef.current) {
        controlsRef.current.autoRotate = next;
      }
      if (next && activeViewRef.current === 'top') {
        const presets = getPresetsForSide(speakerSide);
        const orbitPreset = presets.orbit;
        activeViewRef.current = 'orbit';
        setActiveView('orbit');
        transitionGoalRef.current.pos.set(...orbitPreset.position);
        transitionGoalRef.current.target.set(...orbitPreset.target);
        transitionGoalRef.current.up.set(...orbitPreset.up);
        transitionGoalRef.current.active = true;
      }
      requestRenderRef.current?.();
      return next;
    });
  }, [speakerSide, getPresetsForSide]);

  const activePresets = getPresetsForSide(speakerSide);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#000000] select-none font-sans text-white flex flex-col justify-between"
      data-state={`${speakerSide}-${activeView}`}
    >
      {/* Subtle Cobalt Blue Deep (#2C3480) Atmospheric Studio Backdrop & Soundwave Contours */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 60% at 50% 52%, rgba(44, 52, 128, 0.48) 0%, rgba(20, 28, 78, 0.22) 48%, rgba(0, 0, 0, 0.98) 85%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* =====================================================================
          SINGLE UNIFIED TOP BAR (Zero Overlapping Headers)
         ===================================================================== */}
      <header
        data-testid="inspector-top-bar"
        className="relative z-20 flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-10 pt-3 sm:pt-5 pb-2.5 sm:pb-3 border-b border-white/10 bg-black/85 md:bg-black/50 md:backdrop-blur-md"
      >
        {/* Left: Editorial Eyebrow & Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[9.5px] sm:text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#93C5FD]">
            <span className="text-[#3B82F6] font-bold">//</span>
            <span>3D MODEL VIEWER</span>
          </div>
          <h2 className="text-sm sm:text-lg font-serif tracking-tight text-white mt-0.5">
            DIY Party Box Speaker
          </h2>
        </div>

        {/* Center: Left (L) / Right (R) Unit Selector Pill */}
        <div
          className="order-3 sm:order-none w-full sm:w-auto flex items-center justify-center gap-1 rounded-full border border-white/15 bg-[#070B19]/90 p-1 shadow-[0_0_24px_rgba(44,52,128,0.35)]"
          role="group"
          aria-label="Choose Left or Right Speaker"
        >
          <button
            type="button"
            onClick={() => handleSelectSpeakerSide('L')}
            data-testid="select-left-speaker-btn"
            className={`flex-1 sm:flex-initial rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium tracking-wide transition-all cursor-pointer ${
              speakerSide === 'L'
                ? 'bg-[#2C3480] text-white border border-[#3B5BFF]/60 shadow-[0_0_16px_rgba(59,91,255,0.5)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Left Speaker (L)
          </button>
          <button
            type="button"
            onClick={() => handleSelectSpeakerSide('R')}
            data-testid="select-right-speaker-btn"
            className={`flex-1 sm:flex-initial rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium tracking-wide transition-all cursor-pointer ${
              speakerSide === 'R'
                ? 'bg-[#2C3480] text-white border border-[#3B5BFF]/60 shadow-[0_0_16px_rgba(59,91,255,0.5)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Right Speaker (R)
          </button>
        </div>

        {/* Right: Clean Close Inspector Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            data-testid="close-3d-inspector-btn"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 bg-white/5 hover:bg-[#2C3480]/80 hover:border-[#3B5BFF]/60 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        )}
      </header>

      {/* =====================================================================
          CENTRAL 3D WEBGL / TURNTABLE CANVAS STAGE
         ===================================================================== */}
      <div
        ref={canvasMountRef}
        className="relative z-10 flex-1 w-full h-full min-h-0 touch-none"
        aria-label="Interactive 3D speaker model view"
      />

      {/* =====================================================================
          MINIMAL BOTTOM CAMERA ANGLE & SLOW ROTATION DOCK
         ===================================================================== */}
      <nav
        aria-label="Camera angles and rotation controls"
        data-testid="inspector-bottom-dock"
        className="relative z-20 pb-3 sm:pb-6 pt-1.5 sm:pt-2 px-2.5 sm:px-4 flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-none"
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 rounded-2xl sm:rounded-full border border-white/15 bg-[#060916]/95 md:bg-[#060916]/90 md:backdrop-blur-md px-2 sm:px-3 py-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.9)]">
          {(Object.keys(activePresets) as CameraPresetId[]).map((id) => {
            const preset = activePresets[id];
            const isSelected = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectCameraPreset(id)}
                className={`rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2C3480] text-white border border-[#3B5BFF]/60 shadow-[0_0_14px_rgba(59,91,255,0.45)]'
                    : 'text-white/65 hover:text-white hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          <div className="hidden sm:block w-px h-4 bg-white/15 mx-1" />

          <button
            type="button"
            onClick={handleToggleAutoRotate}
            aria-pressed={autoRotate}
            data-testid="toggle-auto-rotate-btn"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium tracking-wide transition-all cursor-pointer ${
              autoRotate
                ? 'bg-[#3B5BFF]/25 text-[#93C5FD] border border-[#3B5BFF]/60 shadow-[0_0_16px_rgba(59,91,255,0.35)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw
              className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                autoRotate ? 'animate-spin [animation-duration:6s]' : ''
              }`}
            />
            <span>Slow Rotate</span>
          </button>
        </div>

        <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-[0.18em] sm:tracking-[0.22em] text-white/45">
          <span className="sm:hidden">Drag to rotate · Pinch to zoom</span>
          <span className="hidden sm:inline">Drag to rotate · Scroll to zoom</span>
        </span>
      </nav>
    </div>
  );
}

const SpeakerViewport3D = React.memo(SpeakerViewport3DComponent);
export default SpeakerViewport3D;
