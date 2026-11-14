import React from 'react';
import { CollagePartItem } from '../kinetic/editorialStages';

interface CollagePlateMediaProps {
  item: CollagePartItem;
  isLightSurface: boolean;
  interactiveHover?: boolean;
  showExtendedAnnotations?: boolean;
  frameClassName?: string;
  borderless?: boolean;
  imageFit?: 'cover' | 'contain';
}

/**
 * Renders each collage speaker plate with studio-matched surface framing and
 * bespoke Cobalt CAD diagrams (exact cabinet dimensions on the 3/4 tower,
 * and dual passive radiator callout arrows across the stereo L & R pair).
 */
export default function CollagePlateMedia({
  item,
  isLightSurface,
  interactiveHover = true,
  showExtendedAnnotations = true,
  frameClassName,
  borderless = false,
  imageFit,
}: CollagePlateMediaProps) {
  const isPaperPlate = item.imageSurface === 'paper';
  const isThreeQuarterDims = item.diagramOverlay === 'three-quarter-dims';
  const isDualRadiatorDiagram = item.diagramOverlay === 'dual-passive-radiator';
  const isPlainTransparentPng = item.imageSurface === 'transparent';
  const isTransparentCutout =
    isThreeQuarterDims || isDualRadiatorDiagram || isPlainTransparentPng;

  const frameSurfaceClass = isTransparentCutout
    ? 'bg-transparent border-transparent'
    : isPaperPlate
    ? 'bg-[#F4F7FF] border-[#2C3480]/22'
    : isLightSurface
    ? 'bg-[#070B19] border-[#090D1F]/16'
    : 'bg-[#070B19] border-white/15';

  const shadowClass =
    isTransparentCutout || borderless
      ? 'shadow-none'
      : isLightSurface
      ? 'shadow-[0_22px_52px_rgba(9,13,31,0.13)]'
      : 'shadow-[0_24px_54px_rgba(0,0,0,0.45)]';

  const lineStroke = isPaperPlate ? '#2C3480' : '#93C5FD';
  const nodeFill = isPaperPlate ? '#3B5BFF' : '#FFFFFF';
  const badgeClass = isPaperPlate
    ? 'bg-[#F1F5FF]/94 text-[#090D1F] border-[#2C3480]/35'
    : 'bg-[#070B19]/90 text-[#F1F5FF] border-[#93C5FD]/40';

  return (
    <div
      className={`relative ${frameClassName ?? `w-full ${item.aspectRatioClass}`} ${
        isTransparentCutout
          ? 'overflow-visible'
          : borderless
          ? 'overflow-hidden'
          : 'overflow-hidden border'
      } transition-transform duration-300 ${
        interactiveHover ? 'group-hover:-translate-y-1' : ''
      } ${frameSurfaceClass} ${shadowClass}`}
    >
      <img
        src={item.imageSrc}
        alt={item.partName}
        decoding="async"
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-center transition-transform duration-500 ${
          isThreeQuarterDims
            ? 'object-contain scale-[0.83]'
            : isDualRadiatorDiagram
            ? 'object-contain scale-[0.82] -translate-x-[7%]'
            : isPlainTransparentPng || imageFit === 'contain'
            ? 'object-contain'
            : 'object-cover'
        } ${
          interactiveHover && !isTransparentCutout ? 'group-hover:scale-[1.03]' : ''
        }`}
      />

      {/* CAD Leader Lines + Pinpoint Callouts (optional generic slots) */}
      {showExtendedAnnotations &&
        item.cadAnnotations &&
        item.cadAnnotations.length > 0 && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 w-full h-full"
            >
              {item.cadAnnotations.map((ann) => {
                const elbowX =
                  ann.align === 'right' ? ann.labelX - 10 : ann.labelX + 10;
                return (
                  <g key={ann.id}>
                    <polyline
                      points={`${ann.targetX},${ann.targetY} ${elbowX},${ann.labelY} ${ann.labelX},${ann.labelY}`}
                      fill="none"
                      stroke={lineStroke}
                      strokeWidth="0.45"
                      strokeOpacity="0.88"
                    />
                    <circle
                      cx={ann.targetX}
                      cy={ann.targetY}
                      r="1.1"
                      fill={nodeFill}
                      stroke="#3B5BFF"
                      strokeWidth="0.45"
                    />
                  </g>
                );
              })}
            </svg>

            {item.cadAnnotations.map((ann) => (
              <div
                key={ann.id}
                aria-hidden="true"
                className={`pointer-events-none absolute px-1.5 py-0.5 border font-mono text-[8.5px] xl:text-[9.5px] leading-none tracking-[0.12em] uppercase whitespace-nowrap ${badgeClass}`}
                style={{
                  left: `${ann.labelX}%`,
                  top: `${ann.labelY}%`,
                  transform:
                    ann.align === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0%, -50%)',
                }}
              >
                {ann.label}
              </div>
            ))}
          </>
        )}

      {/* Bespoke Perspective CAD Dimension Diagram on Three-Quarter Cutout PNG (directly on blue background) */}
      {showExtendedAnnotations && isThreeQuarterDims && (
        <>
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
          >
            <defs>
              <marker
                id="dim-arrow-start"
                viewBox="0 0 10 10"
                refX="2"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M 9 1 L 1 5 L 9 9" fill="none" stroke="#090D1F" strokeWidth="1.8" />
              </marker>
              <marker
                id="dim-arrow-end"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#090D1F" strokeWidth="1.8" />
              </marker>
              <marker
                id="driver-arrow-start"
                viewBox="0 0 10 10"
                refX="2"
                refY="5"
                markerWidth="4.5"
                markerHeight="4.5"
                orient="auto"
              >
                <path d="M 9 1 L 1 5 L 9 9" fill="none" stroke="#93C5FD" strokeWidth="1.9" />
              </marker>
              <marker
                id="driver-arrow-end"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4.5"
                markerHeight="4.5"
                orient="auto"
              >
                <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#93C5FD" strokeWidth="1.9" />
              </marker>
            </defs>

            {/* Witness extension ticks + Width 15 cm parallel to top-front cabinet edge (29.2, 14.8 -> 53.8, 10.2) */}
            <line x1="29.2" y1="14.8" x2="28.5" y2="9.5" stroke="#090D1F" strokeWidth="0.45" strokeDasharray="1.1 0.9" />
            <line x1="53.8" y1="10.2" x2="53.1" y2="4.9" stroke="#090D1F" strokeWidth="0.45" strokeDasharray="1.1 0.9" />
            <line
              x1="28.7"
              y1="9.7"
              x2="52.9"
              y2="5.1"
              stroke="#F8FAFC"
              strokeWidth="1.35"
              strokeOpacity="0.65"
            />
            <line
              x1="28.7"
              y1="9.7"
              x2="52.9"
              y2="5.1"
              stroke="#090D1F"
              strokeWidth="0.65"
              markerStart="url(#dim-arrow-start)"
              markerEnd="url(#dim-arrow-end)"
            />

            {/* Witness extension ticks + Depth 14.7 cm parallel to top-side cabinet edge (53.8, 10.2 -> 70.7, 15.8) */}
            <line x1="54.2" y1="10.2" x2="55.2" y2="5.4" stroke="#090D1F" strokeWidth="0.45" strokeDasharray="1.1 0.9" />
            <line x1="70.7" y1="15.8" x2="71.7" y2="11.0" stroke="#090D1F" strokeWidth="0.45" strokeDasharray="1.1 0.9" />
            <line
              x1="55.4"
              y1="5.7"
              x2="71.5"
              y2="11.1"
              stroke="#F8FAFC"
              strokeWidth="1.35"
              strokeOpacity="0.65"
            />
            <line
              x1="55.4"
              y1="5.7"
              x2="71.5"
              y2="11.1"
              stroke="#090D1F"
              strokeWidth="0.65"
              markerStart="url(#dim-arrow-start)"
              markerEnd="url(#dim-arrow-end)"
            />

            {/* Height 27.5 cm parallel along the right vertical wall (70.7, 15.8 -> 70.7, 78.2) */}
            <line x1="70.9" y1="15.8" x2="76.2" y2="15.8" stroke="#090D1F" strokeWidth="0.45" strokeDasharray="1.1 0.9" />
            <line x1="70.9" y1="78.2" x2="76.2" y2="78.2" stroke="#090D1F" strokeWidth="0.45" strokeDasharray="1.1 0.9" />
            <line
              x1="75.4"
              y1="16.0"
              x2="75.4"
              y2="78.0"
              stroke="#F8FAFC"
              strokeWidth="1.35"
              strokeOpacity="0.65"
            />
            <line
              x1="75.4"
              y1="16.0"
              x2="75.4"
              y2="78.0"
              stroke="#090D1F"
              strokeWidth="0.65"
              markerStart="url(#dim-arrow-start)"
              markerEnd="url(#dim-arrow-end)"
            />

            {/* Ø 7 cm Upper Driver exact inner-bore horizontal diameter (35.0, 34.2 -> 46.2, 34.2) */}
            <line
              x1="35.0"
              y1="34.2"
              x2="46.2"
              y2="34.2"
              stroke="#93C5FD"
              strokeWidth="0.7"
              markerStart="url(#driver-arrow-start)"
              markerEnd="url(#driver-arrow-end)"
            />

            {/* Ø 5 cm Lower Woofer exact inner-bore horizontal diameter (35.6, 73.5 -> 45.3, 73.5) */}
            <line
              x1="35.6"
              y1="73.5"
              x2="45.3"
              y2="73.5"
              stroke="#93C5FD"
              strokeWidth="0.7"
              markerStart="url(#driver-arrow-start)"
              markerEnd="url(#driver-arrow-end)"
            />
          </svg>

          {/* 15 cm Width Tag centered cleanly along top-front edge arrow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute px-1.5 py-0.5 bg-[#F1F5FF]/95 border border-[#090D1F]/40 shadow-sm font-mono text-[9.5px] font-semibold tracking-[0.06em] text-[#090D1F] tabular-nums whitespace-nowrap"
            style={{ left: '40.8%', top: '7.4%', transform: 'translate(-50%, -50%)' }}
          >
            15 cm
          </div>

          {/* 14.7 cm Depth Tag directly above top-side edge arrow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute px-1.5 py-0.5 bg-[#F1F5FF]/95 border border-[#090D1F]/40 shadow-sm font-mono text-[9.5px] font-semibold tracking-[0.06em] text-[#090D1F] tabular-nums whitespace-nowrap"
            style={{ left: '65.5%', top: '4.2%', transform: 'translate(-50%, -50%)' }}
          >
            14.7 cm
          </div>

          {/* 27.5 cm Height Tag beside right vertical edge arrow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute px-1.5 py-0.5 bg-[#F1F5FF]/95 border border-[#090D1F]/40 shadow-sm font-mono text-[9.5px] font-semibold tracking-[0.06em] text-[#090D1F] tabular-nums whitespace-nowrap"
            style={{ left: '78.2%', top: '47%', transform: 'translate(0%, -50%)' }}
          >
            27.5 cm
          </div>

          {/* Ø 7 cm Driver Tag centered inside upper cutout above chord */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute px-1.5 py-0.5 bg-[#090D1F]/92 border border-[#93C5FD]/60 font-mono text-[8.5px] font-semibold tracking-[0.06em] text-[#F1F5FF] tabular-nums whitespace-nowrap"
            style={{ left: '40.8%', top: '28.8%', transform: 'translate(-50%, -50%)' }}
          >
            Ø 7 cm
          </div>

          {/* Ø 5 cm Woofer Tag at upper-right of lower cutout matching hand-drawn diagram */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute px-1.5 py-0.5 bg-[#090D1F]/92 border border-[#93C5FD]/60 font-mono text-[8.5px] font-semibold tracking-[0.06em] text-[#F1F5FF] tabular-nums whitespace-nowrap"
            style={{ left: '45.8%', top: '66.5%', transform: 'translate(0%, -50%)' }}
          >
            Ø 5 cm
          </div>
        </>
      )}

      {/* Dual Passive Radiator Converging Callout Arrows on Transparent Stereo L & R Cutout (matched to hand-drawn diagram) */}
      {showExtendedAnnotations && isDualRadiatorDiagram && (
        <>
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
          >
            <defs>
              <marker
                id="pr-converge-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto"
              >
                <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#090D1F" strokeWidth="1.8" />
              </marker>
            </defs>

            {/* Contrast halo under converging lines from Left PR (37.5, 63.5) and Right PR (73.1, 60.1) -> (79.5, 48.0) -> (84.8, 46.1) */}
            <line
              x1="37.5"
              y1="63.5"
              x2="84.8"
              y2="46.1"
              stroke="#F8FAFC"
              strokeWidth="1.45"
              strokeOpacity="0.8"
            />
            <line
              x1="73.1"
              y1="60.1"
              x2="79.5"
              y2="48.0"
              stroke="#F8FAFC"
              strokeWidth="1.45"
              strokeOpacity="0.8"
            />

            {/* Primary converging lines + arrowhead matching user's hand-drawn sketch */}
            <line
              x1="73.1"
              y1="60.1"
              x2="79.5"
              y2="48.0"
              stroke="#090D1F"
              strokeWidth="0.7"
            />
            <line
              x1="37.5"
              y1="63.5"
              x2="84.8"
              y2="46.1"
              stroke="#090D1F"
              strokeWidth="0.7"
              markerEnd="url(#pr-converge-arrow)"
            />

            {/* Pinpoint anchor dots on both Left & Right Passive Radiators */}
            <circle cx="37.5" cy="63.5" r="1.25" fill="#F8FAFC" stroke="#090D1F" strokeWidth="0.55" />
            <circle cx="73.1" cy="60.1" r="1.25" fill="#F8FAFC" stroke="#090D1F" strokeWidth="0.55" />
          </svg>

          {/* Passive Radiator Callout Badge at Arrow Tip matching hand-drawn diagram */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-2 lg:right-auto lg:left-[85.8%] top-[45.8%] -translate-y-1/2 px-2 py-1 bg-[#F1F5FF]/96 border border-[#090D1F]/45 shadow-sm font-mono text-[9.5px] font-semibold leading-tight tracking-[0.08em] uppercase text-[#090D1F] whitespace-nowrap"
          >
            Passive Radiator
          </div>
        </>
      )}
    </div>
  );
}
