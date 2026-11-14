import React from 'react';

export type VisualRenderMode = 'render' | 'photo';

/**
 * Dark sculpted metallic acoustic waves across the bottom of Scene 01
 * styled in Pure Black (#000000), Cobalt Blue Deep (#2C3480), and Crisp White (#FFFFFF) rims.
 */
export function ObsidianAcousticWaves({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 310"
        fill="none"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient
            id="cobaltWaveRidgeBack"
            x1="720"
            y1="10"
            x2="720"
            y2="310"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2C3480" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#0D112B" stopOpacity="0.97" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id="cobaltWaveRidgeFront"
            x1="720"
            y1="60"
            x2="720"
            y2="310"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#3B46A8" stopOpacity="0.78" />
            <stop offset="32%" stopColor="#111638" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id="cobaltWaveEdgeRim"
            x1="0"
            y1="120"
            x2="1440"
            y2="120"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2C3480" stopOpacity="0.3" />
            <stop offset="25%" stopColor="#93C5FD" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.82" />
            <stop offset="75%" stopColor="#93C5FD" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2C3480" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <path
          d="M-40 240 C60 170, 130 95, 220 145 C300 190, 360 70, 460 120 C560 170, 640 195, 720 175 C800 155, 885 75, 980 125 C1075 175, 1150 55, 1255 110 C1340 155, 1400 190, 1480 220 L1480 320 L-40 320 Z"
          fill="url(#cobaltWaveRidgeBack)"
          stroke="url(#cobaltWaveEdgeRim)"
          strokeWidth="1.3"
        />

        <path
          d="M-20 265 C90 210, 165 125, 265 180 C345 224, 420 110, 525 165 C610 210, 675 235, 755 205 C835 175, 920 105, 1020 160 C1110 210, 1195 95, 1290 150 C1365 190, 1415 225, 1460 250 L1460 320 L-20 320 Z"
          fill="url(#cobaltWaveRidgeFront)"
          stroke="url(#cobaltWaveEdgeRim)"
          strokeWidth="1.5"
        />

        <path
          d="M110 310 C175 230, 235 165, 310 220 M425 310 C475 215, 515 155, 585 215 M890 310 C955 210, 1005 145, 1075 205 M1165 310 C1215 195, 1265 125, 1335 190"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

