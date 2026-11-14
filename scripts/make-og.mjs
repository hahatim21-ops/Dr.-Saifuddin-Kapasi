/**
 * Generates public/og.jpg (1200 × 630), the share image for WhatsApp, LinkedIn etc.
 * Run: node scripts/make-og.mjs
 * Interim: set in Georgia (the SVG renderer can't load Cormorant). Replace with a
 * designed card using his portrait once it exists — see TODO.md.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#F6F1E7"/>
  <rect x="${W - 300}" y="0" width="300" height="${H}" fill="#1F3D33"/>
  <path d="M${W - 260} ${H - 150} H ${W - 160} C ${W - 110} ${H - 150}, ${W - 85} ${H - 170}, ${W - 50} ${H - 260}" fill="none" stroke="#D4B483" stroke-width="4" stroke-linecap="round"/>
  <path d="M80 118 H 104 C 112 118, 116 115, 122 104" fill="none" stroke="#B08D57" stroke-width="3" stroke-linecap="round"/>
  <text x="138" y="122" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#6B665C">EDUCATOR · AUTHOR · ADVISOR</text>
  <text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="700" fill="#1C1F1E">Dr. Saifuddin</text>
  <text x="80" y="352" font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="700" fill="#1C1F1E">Kapasi</text>
  <text x="80" y="440" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="#1C1F1E">Architect of <tspan font-style="italic" fill="#1F3D33">enduring</tspan> institutions</text>
  <path d="M80 520 H 560 C 660 520, 720 510, 820 470" fill="none" stroke="#B08D57" stroke-width="3" stroke-linecap="round"/>
  <text x="80" y="580" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#6B665C">saifuddinkapasi.in</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og.jpg', import.meta.url));
await sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log('wrote public/og.jpg');
