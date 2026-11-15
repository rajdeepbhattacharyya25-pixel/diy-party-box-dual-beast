import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  hsvToRgb,
  rgbToHsv,
  rgbToWheelOffset,
  wheelOffsetToRgb,
} from '../wled/wledSimulation';
import { RgbColor } from '../wled/wledTypes';

interface WledColorWheelProps {
  rgb: RgbColor;
  hex: string;
  onChange: (nextRgb: RgbColor) => void;
  size?: number;
}

// Module-level cached offscreen canvas so the 112k-pixel trigonometry disc
// is computed only once per pixel size rather than on every render/drag frame.
const spectrumCanvasCache = new Map<number, HTMLCanvasElement>();

function getOrCreateSpectrumCanvas(pixelSize: number): HTMLCanvasElement {
  const cached = spectrumCanvasCache.get(pixelSize);
  if (cached) return cached;

  const offscreen = document.createElement('canvas');
  offscreen.width = pixelSize;
  offscreen.height = pixelSize;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  const img = ctx.createImageData(pixelSize, pixelSize);
  const data = img.data;
  const half = pixelSize / 2;
  const radius = half - 1;

  for (let py = 0; py < pixelSize; py++) {
    for (let px = 0; px < pixelSize; px++) {
      const dx = px - half + 0.5;
      const dy = py - half + 0.5;
      const dist = Math.hypot(dx, dy);
      const idx = (py * pixelSize + px) * 4;

      if (dist > radius + 0.75) {
        data[idx + 3] = 0;
        continue;
      }

      const sat = Math.min(1, dist / radius);
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const pxRgb = hsvToRgb({ h: hue, s: sat, v: 1 });
      const aa = dist > radius - 0.75 ? Math.max(0, Math.min(1, radius + 0.75 - dist)) : 1;

      data[idx] = pxRgb.r;
      data[idx + 1] = pxRgb.g;
      data[idx + 2] = pxRgb.b;
      data[idx + 3] = Math.round(aa * 255);
    }
  }

  ctx.putImageData(img, 0, 0);
  spectrumCanvasCache.set(pixelSize, offscreen);
  return offscreen;
}

/**
 * Interactive full-spectrum HSV Color Wheel rendered onto a HiDPI Canvas
 * with synchronized polar thumb handle, luminance value bar, and keyboard navigation.
 */
function WledColorWheelComponent({
  rgb,
  hex,
  onChange,
  size = 168,
}: WledColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);

  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);
  const thumbOffset = useMemo(() => rgbToWheelOffset(rgb), [rgb]);

  // Draw crisp HSV spectrum disc using fast cached canvas blit + luminance overlay (<0.1ms)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    const pixelSize = Math.round(size * dpr);

    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseSpectrum = getOrCreateSpectrumCanvas(pixelSize);
    ctx.clearRect(0, 0, pixelSize, pixelSize);
    ctx.drawImage(baseSpectrum, 0, 0);

    const activeVal = Math.max(0.2, hsv.v);
    if (activeVal < 0.99) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - activeVal})`;
      ctx.fillRect(0, 0, pixelSize, pixelSize);
      ctx.restore();
    }
  }, [size, hsv.v]);

  const pickFromClientPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = clientX - (rect.left + radius);
    const dy = clientY - (rect.top + radius);
    const nextRgb = wheelOffsetToRgb(dx, dy, radius, Math.max(0.2, hsv.v || 1));
    onChange(nextRgb);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    pickFromClientPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    pickFromClientPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nextH = hsv.h;
    let nextS = hsv.s;
    let changed = false;

    if (e.key === 'ArrowRight') {
      nextH = (hsv.h + 12) % 360;
      changed = true;
    } else if (e.key === 'ArrowLeft') {
      nextH = (hsv.h + 348) % 360;
      changed = true;
    } else if (e.key === 'ArrowUp') {
      nextS = Math.min(1, hsv.s + 0.08);
      changed = true;
    } else if (e.key === 'ArrowDown') {
      nextS = Math.max(0, hsv.s - 0.08);
      changed = true;
    }

    if (changed) {
      e.preventDefault();
      onChange(hsvToRgb({ h: nextH, s: nextS, v: Math.max(0.2, hsv.v || 1) }));
    }
  };

  const thumbPxRadius = size / 2 - 10;
  const thumbLeftPct = 50 + ((thumbOffset.nx * thumbPxRadius) / size) * 100;
  const thumbTopPct = 50 + ((thumbOffset.ny * thumbPxRadius) / size) * 100;

  const fullHueRgb = useMemo(
    () => hsvToRgb({ h: hsv.h, s: hsv.s, v: 1 }),
    [hsv.h, hsv.s]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="application"
        tabIndex={0}
        aria-label="Color wheel picker. Drag or use arrow keys to pick a color."
        data-testid="wled-color-wheel-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative rounded-full p-1.5 bg-[#171717] border border-white/15 cursor-crosshair touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
        style={{ width: size + 12, height: size + 12 }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded-full"
            style={{ width: size, height: size }}
          />
          <div
            aria-hidden="true"
            data-testid="wled-color-wheel-thumb"
            className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] transition-transform ${
              isDragging ? 'w-6 h-6 scale-110' : 'w-5 h-5'
            }`}
            style={{
              left: `${thumbLeftPct}%`,
              top: `${thumbTopPct}%`,
              backgroundColor: hex,
            }}
          />
        </div>
      </div>

      {/* Chromatic Tone / Luminance Bar (mirrors WLED wheel value bar) */}
      <div className="w-full flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 shrink-0">
          Tone
        </span>
        <input
          type="range"
          min={20}
          max={100}
          value={Math.round(Math.max(0.2, hsv.v) * 100)}
          onChange={(e) => {
            const nextV = Number(e.target.value) / 100;
            onChange(hsvToRgb({ h: hsv.h, s: hsv.s, v: nextV }));
          }}
          aria-label="Color brightness tone"
          data-testid="wled-color-value-slider"
          className="flex-1 h-2 rounded-full accent-white cursor-pointer"
          style={{
            background: `linear-gradient(90deg, #1E1E24 0%, rgb(${fullHueRgb.r}, ${fullHueRgb.g}, ${fullHueRgb.b}) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

const WledColorWheel = React.memo(WledColorWheelComponent);
export default WledColorWheel;
