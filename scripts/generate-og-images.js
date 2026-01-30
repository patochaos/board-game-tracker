/**
 * Generate Open Graph images for CRUSADE and Praxis Seizure
 * Run with: node scripts/generate-og-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// OG Image for CRUSADE (1200x630 for Facebook/LinkedIn, 1200x675 for Twitter)
const createCrusadeOG = (width, height) => {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a0a0a"/>
          <stop offset="50%" style="stop-color:#0f0505"/>
          <stop offset="100%" style="stop-color:#0a0a0f"/>
        </linearGradient>
        <linearGradient id="blood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ff1a1a"/>
          <stop offset="100%" style="stop-color:#8a0303"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffd700"/>
          <stop offset="100%" style="stop-color:#b8860b"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="textShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>

      <!-- Decorative blood drips at top -->
      <path d="M 0 0 L 100 0 L 80 60 Q 70 80, 60 60 L 40 0 Z" fill="#8a0303" opacity="0.3"/>
      <path d="M 200 0 L 280 0 L 260 40 Q 250 55, 240 40 L 220 0 Z" fill="#8a0303" opacity="0.2"/>
      <path d="M ${width - 150} 0 L ${width - 80} 0 L ${width - 100} 50 Q ${width - 110} 70, ${width - 120} 50 L ${width - 140} 0 Z" fill="#8a0303" opacity="0.3"/>

      <!-- Large C icon on left -->
      <g transform="translate(100, ${height / 2 - 120})">
        <!-- Blood drop shape -->
        <ellipse cx="120" cy="140" rx="100" ry="130" fill="url(#blood)" opacity="0.2"/>

        <!-- Stylized C -->
        <path
          d="M 180 40
             C 100 20, 40 80, 40 140
             C 40 200, 100 260, 180 240
             L 150 200
             C 100 210, 70 180, 70 140
             C 70 100, 100 70, 150 80
             Z"
          fill="url(#blood)"
          filter="url(#glow)"
        />

        <!-- Fang accent -->
        <path d="M 175 30 L 195 70 L 210 40 Z" fill="#ff3333" filter="url(#glow)"/>

        <!-- Blood drip -->
        <ellipse cx="200" cy="250" rx="12" ry="18" fill="#ff1a1a" filter="url(#glow)"/>
      </g>

      <!-- Title: CRUSADE -->
      <text x="${width / 2 + 80}" y="${height / 2 - 40}"
            font-family="Georgia, serif" font-size="120" font-weight="bold"
            fill="url(#blood)" filter="url(#textShadow)" text-anchor="middle">
        <tspan fill="#ff1a1a">C</tspan><tspan fill="#e8e8e8">RUSADE</tspan>
      </text>

      <!-- Subtitle -->
      <text x="${width / 2 + 80}" y="${height / 2 + 40}"
            font-family="Arial, sans-serif" font-size="36"
            fill="#b0b0b0" text-anchor="middle">
        Test Your VTES Knowledge
      </text>

      <!-- Features -->
      <g transform="translate(${width / 2 - 150}, ${height / 2 + 100})">
        <text font-family="Arial, sans-serif" font-size="24" fill="#888">
          <tspan x="0" dy="0" fill="url(#gold)">&#9733;</tspan>
          <tspan dx="10">5000+ Cards</tspan>
          <tspan dx="40" fill="url(#gold)">&#9733;</tspan>
          <tspan dx="10">Ranked Mode</tspan>
          <tspan dx="40" fill="url(#gold)">&#9733;</tspan>
          <tspan dx="10">Leaderboard</tspan>
        </text>
      </g>

      <!-- Bottom gradient fade -->
      <rect x="0" y="${height - 80}" width="${width}" height="80"
            fill="url(#bg)" opacity="0.8"/>

      <!-- VTES branding -->
      <text x="${width - 40}" y="${height - 30}"
            font-family="Arial, sans-serif" font-size="18"
            fill="#555" text-anchor="end">
        Vampire: The Eternal Struggle
      </text>
    </svg>
  `;
};

// OG Image for Praxis Seizure (Tracker)
const createPraxisOG = (width, height) => {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgP" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a0808"/>
          <stop offset="50%" style="stop-color:#0f0404"/>
          <stop offset="100%" style="stop-color:#0a0a0f"/>
        </linearGradient>
        <linearGradient id="red" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#dc2626"/>
          <stop offset="100%" style="stop-color:#7f1d1d"/>
        </linearGradient>
        <filter id="glowP">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="textShadowP">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgP)"/>

      <!-- Crossed swords icon -->
      <g transform="translate(${width / 2 - 300}, ${height / 2 - 80})">
        <!-- Sword 1 -->
        <path d="M 80 20 L 100 180 L 110 180 L 130 20 L 105 30 Z"
              fill="url(#red)" filter="url(#glowP)" transform="rotate(-30, 105, 100)"/>
        <!-- Sword 2 -->
        <path d="M 80 20 L 100 180 L 110 180 L 130 20 L 105 30 Z"
              fill="url(#red)" filter="url(#glowP)" transform="rotate(30, 105, 100)"/>
        <!-- Crossguard -->
        <rect x="60" y="140" width="90" height="15" rx="3" fill="#666" transform="rotate(-30, 105, 100)"/>
        <rect x="60" y="140" width="90" height="15" rx="3" fill="#666" transform="rotate(30, 105, 100)"/>
      </g>

      <!-- Title: Praxis Seizure -->
      <text x="${width / 2 + 60}" y="${height / 2 - 20}"
            font-family="Georgia, serif" font-size="90" font-weight="bold"
            fill="#e8e8e8" filter="url(#textShadowP)" text-anchor="middle">
        Praxis Seizure
      </text>

      <!-- Subtitle -->
      <text x="${width / 2 + 60}" y="${height / 2 + 50}"
            font-family="Arial, sans-serif" font-size="32"
            fill="#b0b0b0" text-anchor="middle">
        VTES Deck Tracker &amp; Session Manager
      </text>

      <!-- Features -->
      <g transform="translate(${width / 2 - 200}, ${height / 2 + 110})">
        <text font-family="Arial, sans-serif" font-size="22" fill="#888">
          <tspan x="0">Deck Builder</tspan>
          <tspan dx="30" fill="#dc2626">|</tspan>
          <tspan dx="30">Session Tracking</tspan>
          <tspan dx="30" fill="#dc2626">|</tspan>
          <tspan dx="30">Statistics</tspan>
          <tspan dx="30" fill="#dc2626">|</tspan>
          <tspan dx="30">Leaderboard</tspan>
        </text>
      </g>

      <!-- VTES branding -->
      <text x="${width - 40}" y="${height - 30}"
            font-family="Arial, sans-serif" font-size="18"
            fill="#555" text-anchor="end">
        Vampire: The Eternal Struggle
      </text>
    </svg>
  `;
};

async function generateOGImages() {
  console.log('Generating Open Graph images...\n');

  // CRUSADE OG images
  const crusadeOG = createCrusadeOG(1200, 630);
  await sharp(Buffer.from(crusadeOG))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-crusade.png'));
  console.log('  Created: og-crusade.png (1200x630)');

  // CRUSADE Twitter card (slightly taller)
  const crusadeTwitter = createCrusadeOG(1200, 675);
  await sharp(Buffer.from(crusadeTwitter))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'twitter-crusade.png'));
  console.log('  Created: twitter-crusade.png (1200x675)');

  // Praxis Seizure OG images
  const praxisOG = createPraxisOG(1200, 630);
  await sharp(Buffer.from(praxisOG))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-praxis.png'));
  console.log('  Created: og-praxis.png (1200x630)');

  // Praxis Twitter card
  const praxisTwitter = createPraxisOG(1200, 675);
  await sharp(Buffer.from(praxisTwitter))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'twitter-praxis.png'));
  console.log('  Created: twitter-praxis.png (1200x675)');

  // Default OG (use CRUSADE as default since it's the main feature)
  fs.copyFileSync(
    path.join(PUBLIC_DIR, 'og-crusade.png'),
    path.join(PUBLIC_DIR, 'og-image.png')
  );
  console.log('  Created: og-image.png (default, copy of CRUSADE)');

  console.log('\nOG images generated successfully!');
}

generateOGImages().catch(console.error);
