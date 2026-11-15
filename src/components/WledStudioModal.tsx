import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Power,
  RefreshCw,
  Sun,
  X,
  Palette,
  Sparkles,
  Pipette,
} from 'lucide-react';
import {
  WLED_EFFECTS,
  WLED_PALETTES,
  WLED_QUICK_COLORS,
  applySpeakerPatch,
  clampByte,
  createInitialWledState,
  getEffectById,
  getPaletteById,
  parseHexColor,
  rgbToHex,
  setSyncMode,
} from '../wled/wledSimulation';
import {
  RgbColor,
  VirtualSpeakerId,
  WledStudioState,
} from '../wled/wledTypes';
import WledColorWheel from './WledColorWheel';
import WledLivePreview3D from './WledLivePreview3D';

interface WledStudioModalProps {
  onClose: () => void;
}

function WledStudioModalComponent({ onClose }: WledStudioModalProps) {
  const [studio, setStudio] = useState<WledStudioState>(() => createInitialWledState());
  const [hexDraft, setHexDraft] = useState<string>('#3B5BFF');

  const activeSpeaker = studio.speakers[studio.activeSpeakerId];

  // Keep HEX text box strictly synchronized with active speaker color across switches and Sync toggles
  useEffect(() => {
    setHexDraft(activeSpeaker.colorHex);
  }, [studio.activeSpeakerId, activeSpeaker.colorHex]);

  const activeEffect = useMemo(
    () => getEffectById(activeSpeaker.effectId),
    [activeSpeaker.effectId]
  );
  const activePalette = useMemo(
    () => getPaletteById(activeSpeaker.paletteId),
    [activeSpeaker.paletteId]
  );

  const selectSpeaker = useCallback((id: VirtualSpeakerId) => {
    setStudio((prev) => ({
      ...prev,
      activeSpeakerId: id,
    }));
  }, []);

  const handleTogglePower = useCallback((targetId: VirtualSpeakerId) => {
    setStudio((prev) => {
      const nextPowered = !prev.speakers[targetId].powered;
      return applySpeakerPatch(prev, targetId, { powered: nextPowered });
    });
  }, []);

  const handleBrightnessChange = useCallback((value: number) => {
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, { brightness: value })
    );
  }, []);

  const handleToggleSync = useCallback(() => {
    setStudio((prev) => setSyncMode(prev, !prev.syncEnabled));
  }, []);

  const handleSelectQuickColor = useCallback((hex: string) => {
    const parsed = parseHexColor(hex);
    if (!parsed) return;
    setHexDraft(hex.toUpperCase());
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, {
        rgb: parsed,
        colorHex: hex.toUpperCase(),
      })
    );
  }, []);

  const handleHexInputChange = useCallback((value: string) => {
    setHexDraft(value);
    const parsed = parseHexColor(value);
    if (parsed) {
      setStudio((prev) =>
        applySpeakerPatch(prev, prev.activeSpeakerId, {
          rgb: parsed,
        })
      );
    }
  }, []);

  const handleWheelRgbChange = useCallback((nextRgb: RgbColor) => {
    const nextHex = rgbToHex(nextRgb);
    setHexDraft(nextHex);
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, {
        rgb: nextRgb,
        colorHex: nextHex,
      })
    );
  }, []);

  const handleRgbChannelChange = useCallback((channel: keyof RgbColor, rawValue: string) => {
    const num = Number(rawValue);
    if (Number.isNaN(num)) return;
    const clamped = clampByte(num);
    setStudio((prev) => {
      const curr = prev.speakers[prev.activeSpeakerId].rgb;
      const nextRgb: RgbColor = { ...curr, [channel]: clamped };
      return applySpeakerPatch(prev, prev.activeSpeakerId, { rgb: nextRgb });
    });
  }, []);

  const handleSelectPalette = useCallback((paletteId: WledStudioState['speakers']['left']['paletteId']) => {
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, { paletteId })
    );
  }, []);

  const handleSelectEffect = useCallback((effectId: WledStudioState['speakers']['left']['effectId']) => {
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, { effectId })
    );
  }, []);

  const handleEffectSpeedChange = useCallback((speed: number) => {
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, { speed })
    );
  }, []);

  const handleEffectIntensityChange = useCallback((intensity: number) => {
    setStudio((prev) =>
      applySpeakerPatch(prev, prev.activeSpeakerId, { intensity })
    );
  }, []);

  const handleTabChange = useCallback((tab: WledStudioState['activeTab']) => {
    setStudio((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const displayedHex = hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`;
  const isHexValid = parseHexColor(hexDraft) !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="WLED Studio Browser Lighting Simulation"
      data-testid="wled-studio-modal"
      className="fixed inset-0 z-50 bg-black flex flex-col p-2 sm:p-4 lg:p-5 text-white font-sans overflow-hidden"
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-h-0 w-full max-w-[1920px] mx-auto rounded-2xl border border-white/12 bg-[#070709] flex flex-col overflow-hidden">
        {/* =================================================================
            TOP HEADER & GLOBAL ACTION STRIP
            (Clean WLED PC-mode layout: Brand, Power, Sync, Brightness, Close)
           ================================================================= */}
        <header className="shrink-0 border-b border-white/10 bg-[#0D0E12] px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-display font-semibold tracking-tight text-white whitespace-nowrap">
                WLED Studio
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-white/60 whitespace-nowrap">
                <span>Browser Lighting Simulation</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#93C5FD]">Not Connected to Hardware</span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3">
            {/* Virtual Power Action */}
            <button
              type="button"
              onClick={() => handleTogglePower(studio.activeSpeakerId)}
              data-testid="wled-topbar-power-btn"
              aria-pressed={activeSpeaker.powered}
              className={`h-9 sm:h-10 px-3 sm:px-4 rounded-lg border text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BFF] ${
                activeSpeaker.powered
                  ? 'bg-[#171717] border-white/20 text-white hover:border-[#3B5BFF]'
                  : 'bg-[#111114] border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Power className="w-4 h-4 text-[#93C5FD]" />
              <span>Power {activeSpeaker.powered ? 'On' : 'Off'}</span>
            </button>

            {/* Stereo SYNC Action */}
            <button
              type="button"
              onClick={handleToggleSync}
              data-testid="wled-sync-btn"
              aria-pressed={studio.syncEnabled}
              className={`h-9 sm:h-10 px-3 sm:px-4 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                studio.syncEnabled
                  ? 'bg-[#3B5BFF] border-[#93C5FD]/60 text-white shadow-[0_0_24px_rgba(59,91,255,0.4)]'
                  : 'bg-[#171717] border-white/15 text-white/85 hover:border-[#3B5BFF]/60 hover:text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync {studio.syncEnabled ? 'On' : 'Off'}</span>
            </button>

            {/* Global LED-only Brightness Slider */}
            <label className="order-4 sm:order-none w-full sm:w-auto h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg bg-[#171717] border border-white/10 flex items-center gap-2 sm:gap-3 shrink-0">
              <Sun className="w-4 h-4 text-[#93C5FD] shrink-0" />
              <span className="text-xs text-white/75 whitespace-nowrap">
                Brightness
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={activeSpeaker.brightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                aria-label="LED Ring Brightness Percentage"
                data-testid="wled-brightness-slider"
                className="flex-1 sm:flex-initial w-20 sm:w-28 accent-[#3B5BFF] cursor-pointer"
              />
              <span
                data-testid="wled-brightness-value"
                className="w-9 text-right font-mono text-xs tabular-nums text-white"
              >
                {activeSpeaker.brightness}%
              </span>
            </label>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close WLED Studio"
              data-testid="close-wled-studio-btn"
              className="ml-auto sm:ml-0 h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-[#171717] border border-white/15 hover:bg-[#3B5BFF] hover:border-[#3B5BFF] text-white inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =================================================================
            MAIN 3-ZONE STUDIO BODY
            Left Sidebar (L / R Cards) | Center Controls | Right Live 3D Preview
           ================================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* ZONE 1: LEFT SIDEBAR (VIRTUAL SPEAKER CARDS) */}
          <aside
            aria-label="Simulated Speaker Selection"
            className="order-2 lg:order-none shrink-0 lg:w-[256px] xl:w-[272px] 2xl:w-[296px] border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0A0B0E] p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3"
          >
            <div className="flex items-center justify-between text-xs text-white/60 px-1">
              <span className="font-medium text-white/85">Simulated Speakers</span>
              <span className="font-mono text-[11px] text-[#93C5FD]">L &amp; R Pair</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
              {(['left', 'right'] as VirtualSpeakerId[]).map((id) => {
                const sp = studio.speakers[id];
                const isSelected = studio.syncEnabled || studio.activeSpeakerId === id;
                const isPrimary = studio.activeSpeakerId === id;

                return (
                  <div
                    key={sp.id}
                    data-testid={`wled-speaker-card-${sp.id}`}
                    className={`rounded-xl border p-2.5 sm:p-3.5 transition-colors ${
                      isSelected
                        ? 'bg-[#1D2766] border-[#3B5BFF] shadow-[0_8px_24px_rgba(44,52,128,0.28)]'
                        : 'bg-[#171717] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => selectSpeaker(sp.id)}
                        data-testid={`wled-select-speaker-${sp.id}`}
                        className="text-left flex-1 min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight text-white">
                            {sp.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/40 border border-white/15 text-[#93C5FD]">
                            SIM
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-white/70 font-mono tabular-nums truncate">
                          {sp.code} · {getEffectById(sp.effectId).name}
                        </div>
                      </button>

                      {/* Card Virtual Power Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sp.powered}
                        aria-label={`Toggle ${sp.name} simulated LED power`}
                        data-testid={`wled-power-toggle-${sp.id}`}
                        onClick={() => handleTogglePower(sp.id)}
                        className={`relative w-11 h-6 rounded-full border transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                          sp.powered
                            ? 'bg-[#3B5BFF] border-[#93C5FD]/50'
                            : 'bg-black/60 border-white/20'
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white transition-transform duration-150 ${
                            sp.powered ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Visual Brightness Progress Strip */}
                    <div className="mt-3 flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="w-3 h-3 rounded-sm border border-white/20 shrink-0"
                        style={{
                          backgroundColor: sp.powered ? sp.colorHex : '#27272A',
                        }}
                      />
                      <div className="flex-1 h-1.5 rounded-full bg-black/50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-150"
                          style={{
                            width: `${sp.powered ? sp.brightness : 0}%`,
                            backgroundColor: isPrimary || studio.syncEnabled ? '#93C5FD' : '#3B5BFF',
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-white/80">
                        {sp.powered ? `${sp.brightness}%` : 'Off'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden lg:block mt-auto pt-3 border-t border-white/10 text-[11px] leading-relaxed text-white/55">
              Browser-only simulation. Settings here preview on the 3D models and do not connect to or control the physical speakers.
            </div>
          </aside>

          {/* ZONE 2: CENTER WLED CONTROLS (COLOUR, PALETTES, 10 EFFECTS) */}
          <section
            aria-label="Lighting Controls"
            className="order-3 lg:order-none shrink-0 lg:w-[440px] xl:w-[530px] 2xl:w-[560px] border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0B0C10] flex flex-col min-h-0"
          >
            {/* Segmented Mode Switcher: Colour / Palettes / Effects */}
            <div className="shrink-0 px-4 pt-3.5 pb-3 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#171717] border border-white/10">
                <button
                  type="button"
                  onClick={() => handleTabChange('colour')}
                  data-testid="wled-tab-colour"
                  className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    studio.activeTab === 'colour'
                      ? 'bg-[#3B5BFF] text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>Colour</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('palettes')}
                  data-testid="wled-tab-palettes"
                  className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    studio.activeTab === 'palettes'
                      ? 'bg-[#3B5BFF] text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Palettes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('effects')}
                  data-testid="wled-tab-effects"
                  className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap xl:hidden ${
                    studio.activeTab === 'effects'
                      ? 'bg-[#3B5BFF] text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Effects</span>
                </button>
              </div>

              <div className="hidden sm:block text-xs font-mono text-white/70 truncate">
                Target:{' '}
                <span className="text-[#93C5FD]">
                  {studio.syncEnabled ? 'LEFT + RIGHT' : `${activeSpeaker.name} (${activeSpeaker.code})`}
                </span>
              </div>
            </div>

            {/* Dual-Column Desktop Controls (XL shows Colour/Palettes alongside Effect Mode list) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 overflow-y-auto lg:overflow-hidden">
              {/* Column A: Colour Wheel & Quick Swatches OR Palettes */}
              <div
                className={`xl:col-span-6 xl:border-r border-white/10 p-4 overflow-y-auto ${
                  studio.activeTab === 'effects' ? 'hidden xl:block' : 'block'
                }`}
              >
                {studio.activeTab === 'palettes' ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white">
                        Color Palette
                      </h3>
                      <span className="font-mono text-[11px] text-white/55 tabular-nums">
                        {WLED_PALETTES.length} presets
                      </span>
                    </div>
                    <div className="space-y-2">
                      {WLED_PALETTES.map((pal) => {
                        const selected = activeSpeaker.paletteId === pal.id;
                        return (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() => handleSelectPalette(pal.id)}
                            data-testid={`wled-palette-${pal.id}`}
                            className={`w-full rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                              selected
                                ? 'bg-[#1D2766] border-[#3B5BFF]'
                                : 'bg-[#171717] border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-medium text-white mb-1.5">
                              <span>{pal.name}</span>
                              {selected && (
                                <span className="font-mono text-[10px] text-[#93C5FD]">
                                  Active
                                </span>
                              )}
                            </div>
                            <div
                              className="h-2.5 w-full rounded"
                              style={{
                                background: `linear-gradient(90deg, ${pal.stops.join(', ')})`,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white">
                        Color Wheel
                      </h3>
                      <span className="font-mono text-[11px] text-[#93C5FD] tabular-nums">
                        {activeSpeaker.colorHex}
                      </span>
                    </div>

                    {/* Interactive Full-Spectrum HSV Color Wheel */}
                    <WledColorWheel
                      rgb={activeSpeaker.rgb}
                      hex={activeSpeaker.colorHex}
                      onChange={handleWheelRgbChange}
                    />

                    {/* Synchronized Editable HEX & R / G / B Inputs */}
                    <div className="mt-4 flex flex-col gap-2 text-[11px] font-mono tabular-nums">
                      <div className="bg-[#171717] border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-white/50 shrink-0">HEX</span>
                        <input
                          type="text"
                          value={displayedHex}
                          onChange={(e) => handleHexInputChange(e.target.value)}
                          maxLength={7}
                          aria-label="Hex color code"
                          data-testid="wled-hex-input"
                          className={`min-w-0 flex-1 bg-transparent text-right focus:outline-none ${
                            isHexValid ? 'text-white' : 'text-rose-400'
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['r', 'g', 'b'] as (keyof RgbColor)[]).map((ch) => (
                          <label
                            key={ch}
                            className="bg-[#171717] border border-white/10 rounded-lg px-2 py-1.5 flex items-center justify-between gap-1"
                          >
                            <span className="text-white/45 uppercase">{ch}</span>
                            <input
                              type="number"
                              min={0}
                              max={255}
                              value={activeSpeaker.rgb[ch]}
                              onChange={(e) => handleRgbChannelChange(ch, e.target.value)}
                              aria-label={`${ch.toUpperCase()} color channel`}
                              data-testid={`wled-rgb-${ch}-input`}
                              className="w-10 bg-transparent text-right text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 8 Curated Quick Color Swatches */}
                    <div className="mt-4">
                      <div className="text-xs font-medium text-white/80 mb-2">
                        Quick Colors
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {WLED_QUICK_COLORS.map((swatch) => {
                          const isCurrent =
                            activeSpeaker.colorHex.toUpperCase() === swatch.hex.toUpperCase();
                          return (
                            <button
                              key={swatch.id}
                              type="button"
                              onClick={() => handleSelectQuickColor(swatch.hex)}
                              title={swatch.label}
                              aria-label={`Select color ${swatch.label}`}
                              data-testid={`wled-swatch-${swatch.id}`}
                              className={`h-10 rounded-lg border flex items-center justify-center gap-1.5 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                                isCurrent
                                  ? 'border-white ring-1 ring-[#3B5BFF] bg-[#1D2766]'
                                  : 'border-white/15 bg-[#171717] hover:border-white/40'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-white/25"
                                style={{ backgroundColor: swatch.hex }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Column B: 10 Curated Effect Modes + Effect Speed/Intensity */}
              <div
                className={`xl:col-span-6 p-3.5 flex flex-col justify-between overflow-y-auto ${
                  studio.activeTab === 'effects' ? 'block' : 'hidden xl:flex'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-white">Effect Mode</h3>
                    <span className="font-mono text-[11px] text-white/55 tabular-nums">
                      {WLED_EFFECTS.length} modes
                    </span>
                  </div>

                  <div className="space-y-1">
                    {WLED_EFFECTS.map((fx) => {
                      const selected = activeSpeaker.effectId === fx.id;
                      return (
                        <button
                          key={fx.id}
                          type="button"
                          onClick={() => handleSelectEffect(fx.id)}
                          data-testid={`wled-effect-${fx.id}`}
                          className={`w-full h-[34px] px-3 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                            selected
                              ? 'bg-[#1D2766] border-[#3B5BFF] text-white'
                              : 'bg-[#171717] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{fx.name}</div>
                          </div>
                          <span
                            aria-hidden="true"
                            className={`w-2.5 h-2.5 rounded-full border shrink-0 ${
                              selected
                                ? 'bg-[#93C5FD] border-white'
                                : 'bg-transparent border-white/30'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Effect Tempo & Dynamics Tuning */}
                <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-1.5">
                  <label className="flex items-center justify-between gap-3 text-[11px] font-mono tabular-nums">
                    <span className="text-white/65 shrink-0">Speed</span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={activeSpeaker.speed}
                      onChange={(e) => handleEffectSpeedChange(Number(e.target.value))}
                      aria-label="Effect animation speed"
                      data-testid="wled-speed-slider"
                      className="flex-1 accent-[#3B5BFF] cursor-pointer"
                    />
                    <span className="w-8 text-right text-white/85">
                      {activeSpeaker.speed}%
                    </span>
                  </label>
                  <label className="flex items-center justify-between gap-3 text-[11px] font-mono tabular-nums">
                    <span className="text-white/65 shrink-0">Intensity</span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={activeSpeaker.intensity}
                      onChange={(e) => handleEffectIntensityChange(Number(e.target.value))}
                      aria-label="Effect animation intensity"
                      data-testid="wled-intensity-slider"
                      className="flex-1 accent-[#3B5BFF] cursor-pointer"
                    />
                    <span className="w-8 text-right text-white/85">
                      {activeSpeaker.intensity}%
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* ZONE 3: DOMINANT RIGHT SHOWCASE — LIVE 3D PREVIEW (REPLACES SEGMENTS & PRESETS) */}
          <section
            aria-label="3D Lighting Preview"
            data-testid="wled-live-3d-preview"
            className="order-1 lg:order-none shrink-0 lg:shrink lg:flex-1 min-w-0 lg:min-h-0 border-b lg:border-b-0 border-white/10 bg-black p-3 sm:p-5 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Preview Stage Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-white/10">
              <div>
                <h3 className="text-xs sm:text-sm font-mono uppercase tracking-[0.18em] text-white">
                  3D RING PREVIEW
                </h3>
                <p className="text-[11px] sm:text-xs text-white/60 mt-0.5">
                  {studio.syncEnabled
                    ? 'Synced · Left (L) & Right (R) Pair'
                    : `Single Preview · ${activeSpeaker.name} Speaker (${activeSpeaker.code})`}
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs tabular-nums text-white/85">
                <span>{activeEffect.name}</span>
                <span aria-hidden="true" className="text-white/35">·</span>
                <span className="text-[#93C5FD]">{activePalette.name}</span>
              </div>
            </div>

            {/* Central 3D GLB Stage (Real Left/Right Speaker Models with Live 16-LED Ring Shader) */}
            <div className="h-[240px] sm:h-[310px] lg:h-auto lg:flex-1 min-h-0 flex items-stretch justify-center py-2 sm:py-3">
              <WledLivePreview3D
                leftSpeaker={studio.speakers.left}
                rightSpeaker={studio.speakers.right}
                activeSpeakerId={studio.activeSpeakerId}
                syncEnabled={studio.syncEnabled}
              />
            </div>

            {/* Stage Footer Readout */}
            <div className="pt-2 sm:pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-white/60 tabular-nums">
              <span className="whitespace-nowrap">
                Browser Simulation · 16-LED Ring
              </span>
              <span className="text-[#93C5FD] whitespace-nowrap">
                {activeSpeaker.powered
                  ? `LED Output ${activeSpeaker.brightness}% · ${activeSpeaker.colorHex}`
                  : 'LED Output Off'}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const WledStudioModal = React.memo(WledStudioModalComponent);
export default WledStudioModal;
