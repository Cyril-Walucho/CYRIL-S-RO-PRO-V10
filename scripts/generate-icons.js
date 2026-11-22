import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Creative SVG Icon based on the acronym CRO (Cyril's Rundown Operator)
// Features: Bold emerald 'C', electric cyan 'R', live broadcast timer 'O' with tally dot
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070c18"/>
      <stop offset="50%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#040711"/>
    </linearGradient>

    <!-- Letter C Gradient (Vibrant Emerald to Neon Mint) -->
    <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <!-- Letter R Gradient (Electric Sky to Cyan) -->
    <linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- Letter O Gradient (Cyan to Emerald Broadcast Loop) -->
    <linearGradient id="oGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>

    <!-- Border Ring Gradient -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8"/>
    </linearGradient>

    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>

    <!-- Studio Glow Filter -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Deep Broadcast OLED Squircle Background -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="220" fill="url(#centerGlow)"/>

  <!-- Futuristic Glowing Outer Tech Border -->
  <rect x="16" y="16" width="480" height="480" rx="104" fill="none" stroke="url(#ringGrad)" stroke-width="6" opacity="0.75"/>

  <!-- Top On-Air Broadcast Tally Bar -->
  <g transform="translate(186, 68)">
    <rect x="0" y="0" width="140" height="24" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
    <circle cx="20" cy="12" r="5" fill="#ef4444"/>
    <circle cx="20" cy="12" r="2" fill="#ffffff"/>
    <text x="36" y="16" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="900" fill="#f87171" letter-spacing="2">ON AIR</text>
  </g>

  <!-- CREATIVE ACRONYM: C - R - O -->
  <g filter="url(#softGlow)">
    <!-- 1. LETTER 'C' (Geometric Broadcast Arc) -->
    <path d="M 148 200 C 132 165 98 150 64 150 C 18 150 -20 188 -20 256 C -20 324 18 362 64 362 C 98 362 132 347 148 312"
          transform="translate(42, 0)"
          fill="none"
          stroke="url(#cGrad)"
          stroke-width="38"
          stroke-linecap="round"/>

    <!-- 2. LETTER 'R' (Modern Broadcast Angle) -->
    <!-- R Stem -->
    <path d="M 204 150 L 204 362"
          fill="none"
          stroke="url(#rGrad)"
          stroke-width="38"
          stroke-linecap="round"/>
    <!-- R Upper Loop -->
    <path d="M 204 150 L 254 150 C 292 150 314 172 314 206 C 314 240 292 260 254 260 L 204 260"
          fill="none"
          stroke="url(#rGrad)"
          stroke-width="36"
          stroke-linecap="round"
          stroke-linejoin="round"/>
    <!-- R Dynamic Forward Kick / Leg -->
    <path d="M 248 256 L 310 362"
          fill="none"
          stroke="url(#rGrad)"
          stroke-width="38"
          stroke-linecap="round"/>

    <!-- 3. LETTER 'O' (Broadcast Digital Tally Timer Circle) -->
    <!-- Outer Timer Ring with tick accents -->
    <circle cx="410" cy="256" r="62"
            fill="none"
            stroke="url(#oGrad)"
            stroke-width="34"
            stroke-linecap="round"/>

    <!-- Glowing Live Target Core Dot in O -->
    <circle cx="410" cy="256" r="16" fill="#10b981"/>
    <circle cx="410" cy="256" r="7" fill="#ffffff"/>

    <!-- 4 Ticks around O ring representing broadcast seconds -->
    <circle cx="410" cy="180" r="3.5" fill="#38bdf8"/>
    <circle cx="486" cy="256" r="3.5" fill="#38bdf8"/>
    <circle cx="410" cy="332" r="3.5" fill="#38bdf8"/>
    <circle cx="334" cy="256" r="3.5" fill="#38bdf8"/>
  </g>

  <!-- Bottom Subtitle / Audio Equalizer Bars -->
  <g transform="translate(146, 420)">
    <rect x="0" y="8" width="14" height="18" rx="4" fill="#10b981"/>
    <rect x="22" y="0" width="14" height="26" rx="4" fill="#34d399"/>
    <rect x="44" y="12" width="14" height="14" rx="4" fill="#06b6d4"/>
    <rect x="66" y="4" width="14" height="22" rx="4" fill="#38bdf8"/>
    <rect x="88" y="14" width="14" height="12" rx="4" fill="#0284c7"/>
    <rect x="110" y="6" width="14" height="20" rx="4" fill="#38bdf8"/>
    <rect x="132" y="10" width="14" height="16" rx="4" fill="#22d3ee"/>
    <rect x="154" y="2" width="14" height="24" rx="4" fill="#10b981"/>
    <rect x="176" y="8" width="14" height="18" rx="4" fill="#34d399"/>
    <rect x="198" y="14" width="14" height="12" rx="4" fill="#059669"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Helper distance functions for procedural 2D SDF rendering of "CRO"
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Function to generate PNG with creative acronym "CRO"
export function generateLetterCPng(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const scale = size / 512;

  // Key coordinates scaled from 512x512 design
  // Letter C
  const cCenterX = 106 * scale;
  const cCenterY = 256 * scale;
  const cRadius = 76 * scale;
  const cThick = 20 * scale;
  const cCutAngle = 0.65; // ~37 degrees opening

  // Letter R
  const rStemX = 214 * scale;
  const rTopY = 168 * scale;
  const rBotY = 344 * scale;
  const rMidY = 256 * scale;
  const rLoopCenterX = 250 * scale;
  const rLoopCenterY = 212 * scale;
  const rLoopR = 44 * scale;
  const rThick = 18 * scale;

  // Letter O
  const oCenterX = 398 * scale;
  const oCenterY = 256 * scale;
  const oRadius = 66 * scale;
  const oThick = 19 * scale;
  const dotR = 14 * scale;

  // Corner radius for app squircle
  const cornerR = size * (isMaskable ? 0.0 : 0.23);
  const limit = size / 2 - 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;

      let r = 8;
      let g = 13;
      let b = 25;
      let a = 255;

      // Maskable or rounded rectangle clipping
      if (!isMaskable) {
        const rx = Math.abs(dx);
        const ry = Math.abs(dy);
        if (rx > limit - cornerR && ry > limit - cornerR) {
          const cDist = Math.hypot(rx - (limit - cornerR), ry - (limit - cornerR));
          if (cDist > cornerR) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // --- 1. Letter C Distance ---
        const dxC = x - cCenterX;
        const dyC = y - cCenterY;
        const distC = Math.hypot(dxC, dyC);
        const angleC = Math.atan2(dyC, dxC);
        const inCArc = Math.abs(distC - cRadius) <= cThick && (angleC < -cCutAngle || angleC > cCutAngle);

        // C Caps
        const capTopX = cCenterX + cRadius * Math.cos(-cCutAngle);
        const capTopY = cCenterY + cRadius * Math.sin(-cCutAngle);
        const capBotX = cCenterX + cRadius * Math.cos(cCutAngle);
        const capBotY = cCenterY + cRadius * Math.sin(cCutAngle);
        const inCCaps = Math.hypot(x - capTopX, y - capTopY) <= cThick || Math.hypot(x - capBotX, y - capBotY) <= cThick;
        const inC = inCArc || inCCaps;

        // --- 2. Letter R Distance ---
        // Stem
        const dRStem = distToSegment(x, y, rStemX, rTopY, rStemX, rBotY);
        // Loop top/bottom bars and right arc
        const dxRLoop = x - rLoopCenterX;
        const dyRLoop = y - rLoopCenterY;
        const distRLoop = Math.hypot(dxRLoop, dyRLoop);
        const inRLoopArc = Math.abs(distRLoop - rLoopR) <= rThick && dxRLoop >= 0;
        const inRLoopBars = (y >= rTopY - rThick && y <= rTopY + rThick && x >= rStemX && x <= rLoopCenterX) ||
                            (y >= rMidY - rThick && y <= rMidY + rThick && x >= rStemX && x <= rLoopCenterX);
        // Kick leg
        const dRKick = distToSegment(x, y, rStemX + 16 * scale, rMidY, 298 * scale, rBotY);
        const inR = dRStem <= rThick || inRLoopArc || inRLoopBars || dRKick <= rThick;

        // --- 3. Letter O Distance ---
        const dxO = x - oCenterX;
        const dyO = y - oCenterY;
        const distO = Math.hypot(dxO, dyO);
        const inORing = Math.abs(distO - oRadius) <= oThick;
        const inODot = distO <= dotR;

        // --- 4. Equalizer bars at bottom ---
        const isEqBar = (y >= 405 * scale && y <= 425 * scale && x >= 130 * scale && x <= 382 * scale && (Math.floor(x / (14 * scale)) % 2 === 0));

        // Coloring decision
        if (inC) {
          // Vibrant Emerald gradient
          const t = Math.max(0, Math.min(1, (y - 150 * scale) / (200 * scale)));
          r = Math.round(52 * (1 - t) + 16 * t);
          g = Math.round(211 * (1 - t) + 185 * t);
          b = Math.round(153 * (1 - t) + 129 * t);
        } else if (inR) {
          // Electric Cyan / Sky gradient
          const t = Math.max(0, Math.min(1, (y - 150 * scale) / (200 * scale)));
          r = Math.round(56 * (1 - t) + 2 * t);
          g = Math.round(189 * (1 - t) + 132 * t);
          b = Math.round(248 * (1 - t) + 199 * t);
        } else if (inODot) {
          if (distO <= dotR * 0.4) {
            r = 255; g = 255; b = 255; // Crisp White Core
          } else {
            r = 16; g = 185; b = 129; // Emerald Live Tally Ring
          }
        } else if (inORing) {
          // Cyan to Mint gradient
          const t = Math.max(0, Math.min(1, (x - 330 * scale) / (140 * scale)));
          r = Math.round(34 * (1 - t) + 16 * t);
          g = Math.round(211 * (1 - t) + 185 * t);
          b = Math.round(238 * (1 - t) + 129 * t);
        } else if (isEqBar) {
          r = 16; g = 185; b = 129; // Equalizer accent
        } else {
          // Ambient border glow
          const distFromCenter = Math.hypot(dx, dy);
          const rimDist = Math.abs(distFromCenter - (size * 0.44));
          if (rimDist < size * 0.012) {
            r = 6; g = 182; b = 212; // cyan border glow
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

// Generate PWA and Web Icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateLetterCPng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateLetterCPng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateLetterCPng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateLetterCPng(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateLetterCPng(64, false));

console.log('Successfully generated creative CRO icons in /public');
