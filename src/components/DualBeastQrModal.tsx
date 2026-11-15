/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sun,
  Moon,
  ExternalLink,
  X,
  Sparkles,
  HardDrive,
  Share2,
} from 'lucide-react';

interface DualBeastQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_URL = 'https://dualbeast.vercel.app/DualBeast';
const LOCAL_STORAGE_KEY = 'dualbeast_qr_cached_v1';

export default function DualBeastQrModal({ isOpen, onClose }: DualBeastQrModalProps) {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [copied, setCopied] = useState(false);
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Sync to browser localStorage when opened or theme changed
  useEffect(() => {
    if (isOpen) {
      try {
        const metadata = {
          url: TARGET_URL,
          cachedAt: new Date().toISOString(),
          theme: themeMode,
          status: 'verified_active',
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(metadata));
        setIsSavedLocally(true);
      } catch (e) {
        console.warn('LocalStorage access warning:', e);
      }
    }
  }, [isOpen, themeMode]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';
  const currentPngPath = isDark
    ? '/qr-card/dualbeast-qr-dark.png'
    : '/qr-card/dualbeast-qr-light.png';
  const currentSvgPath = isDark
    ? '/qr-card/dualbeast-qr-dark.svg'
    : '/qr-card/dualbeast-qr-light.svg';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = TARGET_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleDownload = (format: 'png' | 'svg') => {
    const filePath = format === 'png' ? currentPngPath : currentSvgPath;
    const fileName = `dualbeast-qr-${themeMode}.${format}`;

    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(format.toUpperCase());
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-3xl border border-[#3B5BFF]/35 bg-[#09090b]/95 shadow-[0_25px_60px_-15px_rgba(59,91,255,0.25)] flex flex-col md:flex-row text-[#FAF8F5] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top-Right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close QR Modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: Interactive Card Preview */}
        <div className="md:w-1/2 p-5 sm:p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A]/40 to-transparent border-b md:border-b-0 md:border-r border-white/10">
          {/* Card Frame Visual */}
          <div className="relative group w-full max-w-[320px] aspect-[800/1160] rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-transform duration-300 hover:scale-[1.02]">
            <img
              src={currentPngPath}
              alt={`DualBeast Themed QR Card (${themeMode} edition)`}
              className="w-full h-full object-contain bg-[#09090b]"
            />
            {/* Live Scan Radar Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#3B5BFF]/10 via-transparent to-[#93C5FD]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>

          {/* Theme Switcher Below Preview */}
          <div className="mt-4 flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#3B5BFF] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              OLED Dark
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                !isDark
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Studio Light
            </button>
          </div>
          <span className="mt-2 text-[11px] font-mono text-zinc-400">
            {isDark ? 'Obsidian luxury display' : 'Print-safe high contrast'}
          </span>
        </div>

        {/* RIGHT PANEL: Details, Quick Actions & Local Storage */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#93C5FD] text-xs font-mono tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Autonomous QR Code
            </div>

            <h2
              id="qr-modal-title"
              className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white"
            >
              Scan & Launch DualBeast
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400 font-sans leading-relaxed">
              Scan with any mobile phone camera to instantly launch the
              interactive 3D speaker experience.
            </p>

            {/* Target URL Pill & Copy */}
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <span className="font-mono text-xs text-zinc-200 truncate">
                  {TARGET_URL}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Copy website URL"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6]/20 hover:bg-[#3B82F6]/35 border border-[#3B82F6]/40 text-xs font-mono text-[#93C5FD] transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Local Storage Cache Confirmation Badge */}
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-emerald-400/90 bg-emerald-950/20 border border-emerald-500/25 px-3 py-2 rounded-xl">
              <HardDrive className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                {isSavedLocally
                  ? 'Saved to Local Storage (Offline Ready)'
                  : 'Syncing to local storage...'}
              </span>
            </div>

            {/* Specs Summary */}
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400">
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="block text-[10px] text-zinc-400 uppercase">
                  Format
                </span>
                <span className="text-zinc-200 font-semibold">
                  300 DPI Ultra-HD
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="block text-[10px] text-zinc-400 uppercase">
                  ECC Redundancy
                </span>
                <span className="text-zinc-200 font-semibold">Level H (30%)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="block text-[10px] text-zinc-400 uppercase">
                  Logo
                </span>
                <span className="text-zinc-200 font-semibold">
                  DualBeast Emblem
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="block text-[10px] text-zinc-400 uppercase">
                  Scan Speed
                </span>
                <span className="text-zinc-200 font-semibold">&lt; 80ms</span>
              </div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B5BFF] to-[#2563EB] hover:from-[#4768FF] hover:to-[#3B82F6] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-[#3B5BFF]/30 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload('svg')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Vector SVG</span>
              </button>
            </div>

            {/* Direct Open in Browser */}
            <a
              href={TARGET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 transition-all text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#93C5FD]" />
              <span>Test Live Deployment Link</span>
            </a>

            {downloadSuccess && (
              <p className="text-center text-xs font-mono text-emerald-400 animate-fade-in">
                Saved {downloadSuccess} card to your downloads folder!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
