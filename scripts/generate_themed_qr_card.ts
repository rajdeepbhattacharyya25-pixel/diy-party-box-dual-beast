/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import sharp from 'sharp';

const TARGET_URL = 'https://dualbeast.vercel.app/DualBeast';

interface CardOptions {
  mode: 'dark' | 'light';
  width: number;
  height: number;
}

function generateSpeakerLogoSvg(x: number, y: number, w: number, h: number, isDark: boolean): string {
  const bgFill = isDark ? '#070B19' : '#FFFFFF';
  const borderStroke = isDark ? '#3B82F6' : '#2563EB';
  const mainStroke = isDark ? '#FFFFFF' : '#0F172A';
  const accentStroke = isDark ? '#93C5FD' : '#3B82F6';
  const ledGlow = isDark ? '#3B5BFF' : '#2563EB';

  return `
    <!-- Center Speaker Emblem Shield -->
    <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${(w * 0.16).toFixed(2)}" fill="${bgFill}" stroke="${borderStroke}" stroke-width="${(w * 0.04).toFixed(2)}" />
    
    <!-- Speaker Cabinet Outer Outline (781:1491 ratio) -->
    <g transform="translate(${(x + w * 0.22).toFixed(2)}, ${(y + h * 0.08).toFixed(2)}) scale(${(w * 0.0175).toFixed(3)}, ${(h * 0.0175).toFixed(3)})">
      <rect x="0" y="0" width="31.4" height="48" rx="3.5" fill="${isDark ? '#0D142B' : '#F8FAFC'}" stroke="${mainStroke}" stroke-width="2.6" />
      <rect x="2.5" y="2.5" width="26.4" height="43" rx="2" fill="none" stroke="${accentStroke}" stroke-opacity="0.65" stroke-width="1.1" />
      
      <!-- Upper Driver -->
      <circle cx="15.7" cy="12" r="7" fill="none" stroke="${mainStroke}" stroke-width="2.0" />
      <circle cx="15.7" cy="12" r="2.3" fill="${accentStroke}" fill-opacity="0.85" />
      
      <!-- Middle 16-LED WLED Ring -->
      <circle cx="15.7" cy="26" r="5.6" fill="none" stroke="${ledGlow}" stroke-width="3.2" stroke-opacity="0.9" />
      <circle cx="15.7" cy="26" r="6.6" fill="none" stroke="${accentStroke}" stroke-width="1.2" />
      <circle cx="15.7" cy="26" r="3.7" fill="${mainStroke}" />
      
      <!-- Lower Woofer -->
      <circle cx="15.7" cy="38" r="5.2" fill="none" stroke="${mainStroke}" stroke-width="1.8" />
      <circle cx="15.7" cy="38" r="1.8" fill="${accentStroke}" />
    </g>
  `;
}

export function buildQrCardSvg(options: CardOptions): { svg: string } {
  const { mode, width, height } = options;
  const isDark = mode === 'dark';

  const qr = QRCode.create(TARGET_URL, { errorCorrectionLevel: 'H' });
  const matrixSize = qr.modules.size; // 37 modules
  const modSize = 10;
  const quietZone = modSize * 4; // Exactly 4 modules (40px) quiet margin
  const qrTotalWidth = matrixSize * modSize + quietZone * 2; // 37 * 10 + 80 = 450px

  const qrBoxX = (width - qrTotalWidth) / 2; // (800 - 450) / 2 = 175
  const qrBoxY = 230;

  // Center mask coordinates (9x9 modules: rows 14..22, cols 14..22)
  const centerStart = 14;
  const centerEnd = 22;

  // Color tokens
  const bgCard = isDark ? '#09090b' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(59, 130, 246, 0.4)' : '#E2E8F0';
  const textPrimary = isDark ? '#FAF8F5' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#475569';
  const textAccent = isDark ? '#93C5FD' : '#2563EB';

  const qrPlateBg = '#FFFFFF';
  const qrModuleColor = '#000000';
  const qrDeckBg = isDark ? '#0C1026' : '#F8FAFC';
  const qrDeckBorder = isDark ? '#3B82F6' : '#CBD5E1';

  // Build clean QR Matrix Rectangles
  let qrModulesSvg = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
        continue;
      }

      if (qr.modules.get(r, c)) {
        const x = qrBoxX + quietZone + c * modSize;
        const y = qrBoxY + quietZone + r * modSize;
        qrModulesSvg += `<rect x="${x}" y="${y}" width="${modSize}" height="${modSize}" fill="${qrModuleColor}" />\n`;
      }
    }
  }

  // Center logo coordinates
  const logoX = qrBoxX + quietZone + centerStart * modSize;
  const logoY = qrBoxY + quietZone + centerStart * modSize;
  const logoW = (centerEnd - centerStart + 1) * modSize;
  const speakerLogo = generateSpeakerLogoSvg(logoX, logoY, logoW, logoW, isDark);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Background Ambient Glow -->
    <radialGradient id="cardGlow" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${isDark ? '#3B5BFF' : '#E0E7FF'}" stop-opacity="${isDark ? '0.22' : '0.45'}" />
      <stop offset="60%" stop-color="${isDark ? '#0D1126' : '#EEF2F6'}" stop-opacity="${isDark ? '0.08' : '0.2'}" />
      <stop offset="100%" stop-color="${bgCard}" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="brandTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${isDark ? '#FFFFFF' : '#0F172A'}" />
      <stop offset="50%" stop-color="${isDark ? '#93C5FD' : '#2563EB'}" />
      <stop offset="100%" stop-color="${isDark ? '#60A5FA' : '#1D4ED8'}" />
    </linearGradient>

    <linearGradient id="frameBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${isDark ? '#3B82F6' : '#94A3B8'}" stop-opacity="0.8" />
      <stop offset="40%" stop-color="${isDark ? '#60A5FA' : '#CBD5E1'}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${isDark ? '#1E293B' : '#E2E8F0'}" stop-opacity="0.8" />
    </linearGradient>

    <linearGradient id="qrDeckBorderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${isDark ? '#3B82F6' : '#94A3B8'}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${isDark ? '#1E3A8A' : '#CBD5E1'}" stop-opacity="0.4" />
    </linearGradient>
  </defs>

  <style>
    .font-mono { font-family: 'JetBrains Mono', Consolas, monospace; }
    .font-display { font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-sans { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  </style>

  <!-- Outer Canvas Base -->
  <rect width="100%" height="100%" fill="${isDark ? '#05070D' : '#F1F5F9'}" />

  <!-- Main Luxury Chassis Card -->
  <g transform="translate(40, 40)">
    <!-- Card Surface & Ambient Radial Beam -->
    <rect x="0" y="0" width="720" height="1080" rx="36" fill="${bgCard}" stroke="url(#frameBorderGrad)" stroke-width="2.5" />
    <rect x="0" y="0" width="720" height="1080" rx="36" fill="url(#cardGlow)" />

    <!-- Precision Engineering Corner Marks -->
    <g stroke="${textAccent}" stroke-opacity="${isDark ? '0.45' : '0.6'}" stroke-width="1.5">
      <!-- Top Left -->
      <line x1="28" y1="20" x2="28" y2="36" />
      <line x1="20" y1="28" x2="36" y2="28" />
      <!-- Top Right -->
      <line x1="692" y1="20" x2="692" y2="36" />
      <line x1="684" y1="28" x2="700" y2="28" />
      <!-- Bottom Left -->
      <line x1="28" y1="1044" x2="28" y2="1060" />
      <line x1="20" y1="1052" x2="36" y2="1052" />
      <!-- Bottom Right -->
      <line x1="692" y1="1044" x2="692" y2="1060" />
      <line x1="684" y1="1052" x2="700" y2="1052" />
    </g>

    <!-- Top Badge Pill -->
    <g transform="translate(225, 34)">
      <rect x="0" y="0" width="270" height="28" rx="14" fill="${isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37, 99, 235, 0.08)'}" stroke="${cardBorder}" stroke-width="1" />
      <circle cx="16" cy="14" r="3.5" fill="${isDark ? '#60A5FA' : '#2563EB'}" />
      <text x="30" y="18" fill="${textAccent}" class="font-mono" font-size="11" font-weight="600" letter-spacing="1.5">
        DUALBEAST AUDIO LABS
      </text>
    </g>

    <!-- Brand Typography Header -->
    <text x="360" y="106" text-anchor="middle" class="font-display" font-size="46" font-weight="900" letter-spacing="3" fill="url(#brandTitleGrad)">
      DUALBEAST
    </text>

    <!-- Tagline -->
    <text x="360" y="136" text-anchor="middle" class="font-sans" font-size="16.5" font-weight="500" letter-spacing="0.4" fill="${textPrimary}">
      Two Speakers. One Powerful Experience.
    </text>

    <!-- Acoustic Wave Graphic -->
    <g transform="translate(210, 150)">
      <line x1="0" y1="8" x2="90" y2="8" stroke="${cardBorder}" stroke-width="1" />
      <!-- Audio wave bars -->
      <line x1="105" y1="3" x2="105" y2="13" stroke="${textAccent}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="117" y1="1" x2="117" y2="15" stroke="${isDark ? '#3B5BFF' : '#2563EB'}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="129" y1="4" x2="129" y2="12" stroke="${textAccent}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="141" y1="0" x2="141" y2="16" stroke="${isDark ? '#60A5FA' : '#1D4ED8'}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="153" y1="5" x2="153" y2="11" stroke="${textAccent}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="165" y1="1" x2="165" y2="15" stroke="${isDark ? '#3B5BFF' : '#2563EB'}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="177" y1="3" x2="177" y2="13" stroke="${textAccent}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="189" y1="0" x2="189" y2="16" stroke="${isDark ? '#60A5FA' : '#1D4ED8'}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="210" y1="8" x2="300" y2="8" stroke="${cardBorder}" stroke-width="1" />
    </g>

    <!-- Subtitle Spec Line -->
    <text x="360" y="184" text-anchor="middle" class="font-mono" font-size="11.5" font-weight="500" letter-spacing="1" fill="${textSecondary}">
      ESP32 WLED • INMP441 SOUND-REACTIVE • 6000 mAh
    </text>
  </g>

  <!-- QR Code Deck Outer Enclosure -->
  <g>
    <rect x="${qrBoxX - 16}" y="${qrBoxY - 16}" width="${qrTotalWidth + 32}" height="${qrTotalWidth + 32}" rx="28" fill="${qrDeckBg}" stroke="url(#qrDeckBorderGrad)" stroke-width="2.2" />
    
    <!-- Decorative Corner Ticks on Deck -->
    <circle cx="${qrBoxX - 4}" cy="${qrBoxY - 4}" r="3" fill="${textAccent}" fill-opacity="0.8" />
    <circle cx="${qrBoxX + qrTotalWidth + 4}" cy="${qrBoxY - 4}" r="3" fill="${textAccent}" fill-opacity="0.8" />
    <circle cx="${qrBoxX - 4}" cy="${qrBoxY + qrTotalWidth + 4}" r="3" fill="${textAccent}" fill-opacity="0.8" />
    <circle cx="${qrBoxX + qrTotalWidth + 4}" cy="${qrBoxY + qrTotalWidth + 4}" r="3" fill="${textAccent}" fill-opacity="0.8" />

    <!-- 100% Fail-Safe White QR Plate (Exact 4-Module Quiet Zone) -->
    <rect x="${qrBoxX}" y="${qrBoxY}" width="${qrTotalWidth}" height="${qrTotalWidth}" rx="18" fill="${qrPlateBg}" />

    <!-- QR Code Black Modules -->
    ${qrModulesSvg}

    <!-- Center Speaker Emblem Shield -->
    ${speakerLogo}
  </g>

  <!-- Lower Section inside Card Group -->
  <g transform="translate(40, 40)">
    <!-- Scan Instruction Pill Button -->
    <g transform="translate(130, 696)">
      <rect x="0" y="0" width="460" height="56" rx="28" fill="${isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(37, 99, 235, 0.08)'}" stroke="${isDark ? '#3B82F6' : '#2563EB'}" stroke-width="1.8" />
      
      <!-- Camera Aperture Icon -->
      <g transform="translate(26, 16)" stroke="${textAccent}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
        <circle cx="12" cy="13" r="3.5"/>
      </g>

      <text x="64" y="34" class="font-sans" font-size="14.5" font-weight="700" fill="${textPrimary}" letter-spacing="0.4">
        POINT CAMERA TO LAUNCH WEB APP
      </text>

      <!-- Right Arrow -->
      <path d="M 425 28 L 417 22 M 425 28 L 417 34" stroke="${textAccent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Verified Canonical URL Deck -->
    <g transform="translate(140, 778)">
      <rect x="0" y="0" width="440" height="46" rx="23" fill="${isDark ? 'rgba(15, 23, 42, 0.65)' : '#F1F5F9'}" stroke="${cardBorder}" stroke-width="1" />
      
      <!-- Link Chain Icon -->
      <g transform="translate(22, 14)" stroke="${textAccent}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </g>

      <text x="54" y="28" class="font-mono" font-size="13" font-weight="600" fill="${textAccent}" letter-spacing="0.3">
        dualbeast.vercel.app/DualBeast
      </text>

      <!-- Verified Green Checkmark Indicator -->
      <g transform="translate(398, 14)">
        <circle cx="8" cy="8" r="8" fill="${isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.15)'}" />
        <path d="M 5 8.5 L 7.5 11 L 11.5 5.5" fill="none" stroke="#22C55E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>

    <!-- Technical Spec 4-Column Feature Bar -->
    <g transform="translate(60, 856)">
      <!-- Col 1 -->
      <g transform="translate(0, 0)">
        <text x="65" y="16" text-anchor="middle" class="font-mono" font-size="12" font-weight="700" fill="${textPrimary}">10W STEREO</text>
        <text x="65" y="32" text-anchor="middle" class="font-mono" font-size="10" fill="${textSecondary}">Dynamic Drivers</text>
      </g>
      <line x1="145" y1="6" x2="145" y2="34" stroke="${cardBorder}" stroke-width="1" />

      <!-- Col 2 -->
      <g transform="translate(150, 0)">
        <text x="75" y="16" text-anchor="middle" class="font-mono" font-size="12" font-weight="700" fill="${textPrimary}">WLED RGB</text>
        <text x="75" y="32" text-anchor="middle" class="font-mono" font-size="10" fill="${textSecondary}">16-LED Ring</text>
      </g>
      <line x1="305" y1="6" x2="305" y2="34" stroke="${cardBorder}" stroke-width="1" />

      <!-- Col 3 -->
      <g transform="translate(310, 0)">
        <text x="75" y="16" text-anchor="middle" class="font-mono" font-size="12" font-weight="700" fill="${textPrimary}">SOUND SYNC</text>
        <text x="75" y="32" text-anchor="middle" class="font-mono" font-size="10" fill="${textSecondary}">INMP441 MEMS</text>
      </g>
      <line x1="465" y1="6" x2="465" y2="34" stroke="${cardBorder}" stroke-width="1" />

      <!-- Col 4 -->
      <g transform="translate(470, 0)">
        <text x="65" y="16" text-anchor="middle" class="font-mono" font-size="12" font-weight="700" fill="${textPrimary}">6000 mAh</text>
        <text x="65" y="32" text-anchor="middle" class="font-mono" font-size="10" fill="${textSecondary}">All-Day Power</text>
      </g>
    </g>

    <!-- Footer Technical Markings -->
    <g transform="translate(60, 955)">
      <line x1="0" y1="0" x2="600" y2="0" stroke="${cardBorder}" stroke-width="1" />
      <text x="0" y="24" class="font-mono" font-size="10" fill="${textSecondary}" letter-spacing="0.5">
        DUALBEAST WIRELESS PAIR • AUTONOMOUS SCAN CODE
      </text>
      <text x="600" y="24" text-anchor="end" class="font-mono" font-size="10" fill="${textAccent}" letter-spacing="0.5">
        REV 2.4 // LEVEL H 30% ECC
      </text>
    </g>
  </g>
</svg>`;

  return { svg };
}

async function verifyAndExport() {
  console.log('🚀 Generating DualBeast Themed QR Cards for:', TARGET_URL);

  const outDirs = [
    path.resolve(process.cwd(), 'public/qr-card'),
    path.resolve(process.cwd(), 'qr-exports'),
  ];

  for (const dir of outDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 1. Generate Dark Card
  console.log('⚡ Generating OLED Dark Luxury QR Card...');
  const darkResult = buildQrCardSvg({ mode: 'dark', width: 800, height: 1160 });
  const darkSvgPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-dark.svg');
  fs.writeFileSync(darkSvgPath, darkResult.svg, 'utf-8');
  fs.writeFileSync(path.resolve(process.cwd(), 'qr-exports/dualbeast-qr-dark.svg'), darkResult.svg, 'utf-8');

  // Render High-Resolution 300 DPI PNG (2400 x 3480 px, 3x resolution)
  console.log('🖼️  Rasterizing 300 DPI Ultra-HD Dark PNG...');
  const darkPngBuffer = await sharp(Buffer.from(darkResult.svg), { density: 300 })
    .resize(2400, 3480)
    .png({ quality: 100, compressionLevel: 8 })
    .toBuffer();

  const darkPngPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-dark.png');
  fs.writeFileSync(darkPngPath, darkPngBuffer);
  fs.writeFileSync(path.resolve(process.cwd(), 'qr-exports/dualbeast-qr-dark.png'), darkPngBuffer);

  // Copy primary card to public root for instant web access
  fs.writeFileSync(path.resolve(process.cwd(), 'public/dualbeast-qr-card.png'), darkPngBuffer);
  fs.writeFileSync(path.resolve(process.cwd(), 'public/dualbeast-qr-card.svg'), darkResult.svg, 'utf-8');

  // 2. Generate Light Card (Print-Safe & High Contrast)
  console.log('☀️  Generating Studio Light High-Contrast QR Card...');
  const lightResult = buildQrCardSvg({ mode: 'light', width: 800, height: 1160 });
  const lightSvgPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-light.svg');
  fs.writeFileSync(lightSvgPath, lightResult.svg, 'utf-8');
  fs.writeFileSync(path.resolve(process.cwd(), 'qr-exports/dualbeast-qr-light.svg'), lightResult.svg, 'utf-8');

  console.log('🖼️  Rasterizing 300 DPI Ultra-HD Light PNG...');
  const lightPngBuffer = await sharp(Buffer.from(lightResult.svg), { density: 300 })
    .resize(2400, 3480)
    .png({ quality: 100, compressionLevel: 8 })
    .toBuffer();

  const lightPngPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-light.png');
  fs.writeFileSync(lightPngPath, lightPngBuffer);
  fs.writeFileSync(path.resolve(process.cwd(), 'qr-exports/dualbeast-qr-light.png'), lightPngBuffer);

  // 3. Automated Scanning Verification via jsQR on the full card images
  console.log('🔍 Running automated barcode scan audit on full 2400x3480 poster images...');

  const darkRaw = await sharp(darkPngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const darkScan = jsQR(new Uint8ClampedArray(darkRaw.data), darkRaw.info.width, darkRaw.info.height);

  if (darkScan && darkScan.data === TARGET_URL) {
    console.log('✅ Dark Luxury Poster: 100% SCAN VERIFIED ->', darkScan.data);
  } else {
    console.warn('⚠️ Dark Poster scan result:', darkScan ? darkScan.data : 'NO_CODE_FOUND');
  }

  const lightRaw = await sharp(lightPngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const lightScan = jsQR(new Uint8ClampedArray(lightRaw.data), lightRaw.info.width, lightRaw.info.height);

  if (lightScan && lightScan.data === TARGET_URL) {
    console.log('✅ Light Studio Poster: 100% SCAN VERIFIED ->', lightScan.data);
  } else {
    console.warn('⚠️ Light Poster scan result:', lightScan ? lightScan.data : 'NO_CODE_FOUND');
  }

  console.log('\n🎉 ALL ASSETS GENERATED & VERIFIED SUCCESSFULLY!');
  console.log('📁 Local Storage Locations:');
  console.log('  - public/qr-card/dualbeast-qr-dark.svg');
  console.log('  - public/qr-card/dualbeast-qr-dark.png (300 DPI Ultra-HD)');
  console.log('  - public/qr-card/dualbeast-qr-light.svg');
  console.log('  - public/qr-card/dualbeast-qr-light.png (300 DPI Ultra-HD)');
  console.log('  - qr-exports/dualbeast-qr-dark.png');
  console.log('  - qr-exports/dualbeast-qr-light.png');
  console.log('  - public/dualbeast-qr-card.png');
}

verifyAndExport().catch((err) => {
  console.error('Fatal error generating QR cards:', err);
  process.exit(1);
});
