/**
 * Generates clearly-marked placeholder images into src/assets/placeholders/.
 * Run: node scripts/make-placeholders.mjs
 * Every file here is listed in TODO.md and must be replaced with a real asset.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const OUT = new URL('../src/assets/placeholders/', import.meta.url);
await mkdir(OUT, { recursive: true });

const label = (w, h, title, note, color = '#6B665C') => `
  <text x="${w / 2}" y="${h - h * 0.085}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.round(w * 0.034)}" font-weight="700" letter-spacing="${Math.round(w * 0.006)}" fill="${color}">${title}</text>
  <text x="${w / 2}" y="${h - h * 0.05}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.round(w * 0.024)}" fill="${color}">${note}</text>`;

/** Warm, slightly desaturated portrait stand-in with a soft silhouette. */
function portrait(w = 1600, h = 2000) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#EDE4D3"/><stop offset="1" stop-color="#D8C9AE"/>
      </linearGradient>
      <radialGradient id="light" cx="0.7" cy="0.25" r="0.8">
        <stop offset="0" stop-color="#FFF8EA" stop-opacity="0.75"/><stop offset="1" stop-color="#FFF8EA" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#light)"/>
    <g fill="#B9A68A" opacity="0.55">
      <ellipse cx="${w * 0.52}" cy="${h * 0.36}" rx="${w * 0.15}" ry="${h * 0.14}"/>
      <path d="M${w * 0.14} ${h} C ${w * 0.16} ${h * 0.66}, ${w * 0.32} ${h * 0.56}, ${w * 0.52} ${h * 0.56}
               C ${w * 0.72} ${h * 0.56}, ${w * 0.88} ${h * 0.66}, ${w * 0.9} ${h} Z"/>
    </g>
    ${label(w, h, 'PLACEHOLDER PORTRAIT', 'Replace with a professional portrait — see TODO.md', '#4F4A42')}
  </svg>`;
}

/** Book cover stand-in, 2:3. Not a copy of the real cover — just enough to judge layout. */
function cover({ title, accent, subtitle, bg, ink, accentInk, prism = false }, w = 1000, h = 1500) {
  const spectrum = ['#C8553D', '#E08E45', '#E9C46A', '#7FAE6A', '#4F8FA8', '#5B6BB5', '#8A5FA8'];
  const rays = prism
    ? `<path d="M80 ${h * 0.62} L ${w * 0.42} ${h * 0.6}" stroke="${ink}" stroke-width="3" opacity="0.6"/>
       <path d="M${w * 0.5} ${h * 0.5} L ${w * 0.6} ${h * 0.7} L ${w * 0.4} ${h * 0.7} Z" fill="none" stroke="${ink}" stroke-width="3"/>
       ${spectrum.map((c, i) => `<path d="M${w * 0.555} ${h * 0.6} L ${w - 60} ${h * 0.52 + i * 22}" stroke="${c}" stroke-width="6"/>`).join('')}`
    : `<path d="M90 ${h * 0.66} H ${w * 0.55} C ${w * 0.72} ${h * 0.66}, ${w * 0.8} ${h * 0.62}, ${w - 90} ${h * 0.5}" fill="none" stroke="${accentInk}" stroke-width="5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="90" y="${h * 0.2}" font-family="Georgia, 'Times New Roman', serif" font-size="128" font-weight="700" fill="${ink}">${title}</text>
    <text x="90" y="${h * 0.2 + 140}" font-family="Georgia, 'Times New Roman', serif" font-size="128" font-style="italic" fill="${accentInk}">${accent}</text>
    <text x="92" y="${h * 0.2 + 230}" font-family="Arial, Helvetica, sans-serif" font-size="40" letter-spacing="2" fill="${ink}" opacity="0.8">${subtitle}</text>
    ${rays}
    <text x="92" y="${h - 200}" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="${ink}">Dr. Saifuddin Kapasi</text>
    ${label(w, h, 'PLACEHOLDER COVER', 'Replace with the real cover — see TODO.md', ink)}
  </svg>`;
}

/** Event-photo stand-in: a warm, slightly desaturated "room" with a few figures. */
function photo(caption, ratio, tint, w = 1600) {
  const h = Math.round(w / ratio);
  const heads = [0.22, 0.38, 0.55, 0.7, 0.84]
    .map((x, i) => `<circle cx="${w * x}" cy="${h * (0.52 + (i % 2) * 0.04)}" r="${w * 0.035}"/>
      <rect x="${w * x - w * 0.06}" y="${h * (0.6 + (i % 2) * 0.04)}" width="${w * 0.12}" height="${h}" rx="${w * 0.05}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${tint[0]}"/><stop offset="1" stop-color="${tint[1]}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="#000" opacity="0.06"/>
    <rect x="${w * 0.3}" y="${h * 0.12}" width="${w * 0.4}" height="${h * 0.24}" fill="#fff" opacity="0.18"/>
    <g fill="#5C5446" opacity="0.28">${heads}</g>
    ${label(w, h, 'PLACEHOLDER PHOTO', caption, '#3F3A33')}
  </svg>`;
}

const photos = [
  ['kampala-convocation', 'Kampala convocation', 4 / 5, ['#E7DCC8', '#CDBB9C']],
  ['kampala-masterclass', 'Growth Mindset Master Class, Kampala', 3 / 2, ['#E9DFCF', '#C9B89D']],
  ['naval-dockyard-mdp', 'Naval Dockyard MDP, SIMSREE', 3 / 2, ['#E2DED2', '#BFB8A6']],
  ['book-presentation', 'Presenting both books, Kampala', 4 / 5, ['#EADCC6', '#D2BC99']],
  ['burhani-classroom', 'Burhani College classroom', 1, ['#E6E0D2', '#C8BEA8']],
  ['productivity-war-room', 'Productivity War Room', 3 / 2, ['#E4DCCB', '#C4B394']],
];

/** Certificate stand-in: cream paper, brass double border, award + issuer. */
function certificate(title, issuer, w = 1600, h = 1200) {
  const esc = (s) => s.replace(/&/g, '&amp;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="100%" height="100%" fill="#FBF7EE"/>
    <rect x="50" y="50" width="${w - 100}" height="${h - 100}" fill="none" stroke="#B08D57" stroke-width="6"/>
    <rect x="76" y="76" width="${w - 152}" height="${h - 152}" fill="none" stroke="#B08D57" stroke-width="2"/>
    <text x="${w / 2}" y="${h * 0.24}" text-anchor="middle" font-family="Georgia, serif" font-size="44" letter-spacing="12" fill="#6B665C">CERTIFICATE</text>
    <text x="${w / 2}" y="${h * 0.42}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${title.length > 34 ? 52 : 72}" fill="#1C1F1E">${esc(title)}</text>
    <text x="${w / 2}" y="${h * 0.53}" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#1C1F1E">Dr. Saifuddin Kapasi</text>
    <text x="${w / 2}" y="${h * 0.63}" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#6B665C">${esc(issuer)}</text>
    <circle cx="${w / 2}" cy="${h * 0.74}" r="44" fill="none" stroke="#B08D57" stroke-width="4"/>
    ${label(w, h, 'PLACEHOLDER CERTIFICATE', 'Replace with a 300 dpi scan — see TODO.md', '#3F3A33')}
  </svg>`;
}

/** Magazine-page stand-in. */
function magazine(title, w = 1200, h = 1600) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="100%" height="100%" fill="#F2EEE6"/>
    <rect x="70" y="70" width="${w - 140}" height="150" fill="#1F3D33"/>
    <text x="110" y="172" font-family="Georgia, serif" font-size="72" font-weight="700" fill="#F6F1E7">HALL OF FAME</text>
    <rect x="70" y="270" width="${w * 0.48}" height="${h * 0.42}" fill="#D9CDB6"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${w * 0.56}" y="${290 + i * 52}" width="${w * 0.36}" height="16" fill="#C9C0AE"/>`).join('')}
    <text x="70" y="${h * 0.66}" font-family="Georgia, serif" font-size="56" fill="#1C1F1E">${title}</text>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="70" y="${h * 0.7 + i * 40}" width="${w - 140}" height="14" fill="#D8D0C0"/>`).join('')}
    ${label(w, h, 'PLACEHOLDER FEATURE', 'Replace with a photo of the magazine page', '#3F3A33')}
  </svg>`;
}

const achievementImages = [
  ['achv-hon-doctorate-cdu.jpg', certificate('Honorary Doctorate', 'Cambridge Digital University · 2024')],
  ['achv-global-eminence.jpg', certificate('Global Eminence Award', 'Bestow Edutrex International · 2024')],
  ['achv-ifeel-chairman.jpg', certificate('Chairman, Governing Body', 'IFEEL Institute · 2022')],
  ['achv-hall-of-fame.jpg', magazine('Edition 57')],
  ['achv-kampala-chief-guest.jpg', photo('Kennedy University convocation, Kampala', 3 / 2, ['#E6DCC9', '#C8B596'])],
  ['achv-global-eminence-ceremony.jpg', photo('Receiving the Global Eminence Award', 3 / 2, ['#E8DECB', '#CBB797'])],
];

const jobs = [
  ...achievementImages,
  ...photos.map(([id, caption, ratio, tint]) => [`gallery-${id}.jpg`, photo(caption, ratio, tint)]),
  ['portrait-hero.jpg', portrait()],
  [
    'cover-beyond-ideas.jpg',
    cover({ title: 'Beyond', accent: 'Ideas', subtitle: 'LEAD TO IMPACT', bg: '#EFE6D4', ink: '#1C1F1E', accentInk: '#1F3D33', prism: true }),
  ],
  [
    'cover-beyond-satisfaction.jpg',
    cover({ title: 'Beyond', accent: 'Satisfaction', subtitle: 'CUSTOMER AT THE CORE', bg: '#1F3D33', ink: '#F6F1E7', accentInk: '#D4B483' }),
  ],
];

// Existing files are kept (the dev server may hold them open); pass --force to redo them.
const force = process.argv.includes('--force');
for (const [name, svg] of jobs) {
  const path = fileURLToPath(new URL(name, OUT));
  if (!force && existsSync(path)) {
    console.log('kept ', name);
    continue;
  }
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(path);
  console.log('wrote', name);
}
