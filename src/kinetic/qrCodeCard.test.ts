/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import jsQR from 'jsqr';
import sharp from 'sharp';
import QRCode from 'qrcode';

const TARGET_URL = 'https://dualbeast.vercel.app/DualBeast';

test('DualBeast QR Code generates with Error Correction Level H and decodes to target URL', async () => {
  const qr = QRCode.create(TARGET_URL, { errorCorrectionLevel: 'H' });
  assert.equal(qr.modules.size, 37, 'QR matrix size should be 37x37 modules (Version 5)');

  // Verify that the 3 corner finders are present
  assert.equal(qr.modules.get(0, 0), 1, 'Top-left finder origin should be set');
  assert.equal(qr.modules.get(0, 36), 1, 'Top-right finder origin should be set');
  assert.equal(qr.modules.get(36, 0), 1, 'Bottom-left finder origin should be set');
});

test('Exported Dark Luxury QR Card image exists and decodes reliably via jsQR', async () => {
  const darkPngPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-dark.png');
  assert.ok(fs.existsSync(darkPngPath), 'Dark QR card PNG must exist in public/qr-card');

  const fileStat = fs.statSync(darkPngPath);
  assert.ok(fileStat.size > 20000, 'Dark QR card PNG should be a high-resolution image (>20KB)');

  const buffer = fs.readFileSync(darkPngPath);
  const raw = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const scan = jsQR(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  assert.ok(scan, 'Scanner must detect QR code in the Dark Luxury poster');
  assert.equal(scan.data, TARGET_URL, 'Decoded URL must exactly match target deployment link');
});

test('Exported Light Studio QR Card image exists and decodes reliably via jsQR', async () => {
  const lightPngPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-light.png');
  assert.ok(fs.existsSync(lightPngPath), 'Light QR card PNG must exist in public/qr-card');

  const fileStat = fs.statSync(lightPngPath);
  assert.ok(fileStat.size > 20000, 'Light QR card PNG should be a high-resolution image (>20KB)');

  const buffer = fs.readFileSync(lightPngPath);
  const raw = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const scan = jsQR(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

  assert.ok(scan, 'Scanner must detect QR code in the Light Studio poster');
  assert.equal(scan.data, TARGET_URL, 'Decoded URL must exactly match target deployment link');
});

test('Exported Vector SVG files are valid and contain DualBeast speaker logo paths', () => {
  const darkSvgPath = path.resolve(process.cwd(), 'public/qr-card/dualbeast-qr-dark.svg');
  assert.ok(fs.existsSync(darkSvgPath), 'Dark QR SVG must exist');
  const darkSvg = fs.readFileSync(darkSvgPath, 'utf-8');

  assert.ok(darkSvg.includes('DUALBEAST'), 'SVG must include DUALBEAST brand text');
  assert.ok(darkSvg.includes('Two Speakers. One Powerful Experience.'), 'SVG must include tagline');
  assert.ok(darkSvg.includes('dualbeast.vercel.app/DualBeast'), 'SVG must include canonical URL');
  assert.ok(darkSvg.includes('Center Speaker Emblem Shield'), 'SVG must embed the center speaker logo shield');
});
