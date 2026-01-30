/**
 * Generate favicons and PWA icons for CRUSADE / Praxis Seizure
 * Run with: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// CRUSADE icon - Vampire fang/blood drop theme
// Dark red background with stylized "C" that looks like fangs
const createCrusadeIcon = (size) => {
  const padding = Math.floor(size * 0.1);
  const innerSize = size - padding * 2;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2d0a0a"/>
          <stop offset="50%" style="stop-color:#1a0505"/>
          <stop offset="100%" style="stop-color:#0a0a0f"/>
        </linearGradient>
        <linearGradient id="blood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ff1a1a"/>
          <stop offset="100%" style="stop-color:#8a0303"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="${size * 0.02}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>

      <!-- Blood drop shape behind the C -->
      <ellipse
        cx="${size * 0.5}"
        cy="${size * 0.55}"
        rx="${size * 0.28}"
        ry="${size * 0.35}"
        fill="url(#blood)"
        opacity="0.3"
      />

      <!-- Stylized C with fang-like points -->
      <path
        d="M ${size * 0.65} ${size * 0.25}
           C ${size * 0.45} ${size * 0.2}, ${size * 0.25} ${size * 0.35}, ${size * 0.25} ${size * 0.5}
           C ${size * 0.25} ${size * 0.65}, ${size * 0.45} ${size * 0.8}, ${size * 0.65} ${size * 0.75}
           L ${size * 0.55} ${size * 0.65}
           C ${size * 0.42} ${size * 0.68}, ${size * 0.35} ${size * 0.6}, ${size * 0.35} ${size * 0.5}
           C ${size * 0.35} ${size * 0.4}, ${size * 0.42} ${size * 0.32}, ${size * 0.55} ${size * 0.35}
           Z"
        fill="url(#blood)"
        filter="url(#glow)"
      />

      <!-- Fang accent on top -->
      <path
        d="M ${size * 0.62} ${size * 0.22}
           L ${size * 0.68} ${size * 0.35}
           L ${size * 0.72} ${size * 0.25}
           Z"
        fill="#ff3333"
        filter="url(#glow)"
      />

      <!-- Blood drip accent -->
      <ellipse
        cx="${size * 0.68}"
        cy="${size * 0.78}"
        rx="${size * 0.04}"
        ry="${size * 0.06}"
        fill="#ff1a1a"
        filter="url(#glow)"
      />
    </svg>
  `;
};

// Icon sizes to generate
const sizes = {
  // Favicons
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-96x96.png': 96,
  // Apple touch icon
  'apple-touch-icon.png': 180,
  // PWA icons
  'icon-192.png': 192,
  'icon-512.png': 512,
};

async function generateIcons() {
  console.log('Generating CRUSADE icons...\n');

  for (const [filename, size] of Object.entries(sizes)) {
    const svgContent = createCrusadeIcon(size);
    const outputPath = path.join(ICONS_DIR, filename);

    await sharp(Buffer.from(svgContent))
      .png()
      .toFile(outputPath);

    console.log(`  Created: ${filename} (${size}x${size})`);
  }

  // Generate favicon.ico (multi-resolution)
  // For simplicity, we'll use the 32x32 as the main favicon
  const favicon32 = createCrusadeIcon(32);
  await sharp(Buffer.from(favicon32))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
  console.log(`  Created: favicon.png (32x32)`);

  // Copy 32x32 to root as well
  fs.copyFileSync(
    path.join(ICONS_DIR, 'favicon-32x32.png'),
    path.join(PUBLIC_DIR, 'favicon-32x32.png')
  );

  console.log('\nIcons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Update app/layout.tsx with the icon metadata');
  console.log('2. Update manifest.json if needed');
}

generateIcons().catch(console.error);
