import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Table palette - like sitting at a game night
        wood: {
          50: '#fdf8f3',   // Cream canvas
          100: '#f9edd8',  // Parchment
          200: '#f3d9af',  // Light wood
          300: '#ebc07d',  // Honey
          400: '#e2a249',  // Amber
          500: '#d98b2b',  // Gold
          600: '#c67020',  // Deep amber
          700: '#a4551d',  // Warm brown
          800: '#85451f',  // Dark wood
          900: '#6d3a1c',  // Deep brown
          950: '#3b1c0c',  // Espresso
        },
        felt: {
          50: '#f0fdf1',
          100: '#dcfce0',
          200: '#bbf7c3',
          300: '#86ef96',
          400: '#4ade61',
          500: '#22c53d',
          600: '#16a32d',  // Classic green meeple
          700: '#158027',
          800: '#166524',
          900: '#14532d',
          950: '#052e14',
        },
        // Meeple accent colors
        meeple: {
          red: '#ef4444',     // Winner red (brighter for dark)
          blue: '#60a5fa',    // Player blue
          yellow: '#fbbf24',  // Highlight yellow
          purple: '#a78bfa',  // Achievement purple
        },
        // Warm dark surface colors
        surface: {
          canvas: '#1a1412',     // Warm black (dark espresso)
          card: '#251e1a',       // Card backgrounds (dark walnut)
          elevated: '#302723',   // Elevated elements (lighter walnut)
          muted: '#1f1916',      // Muted sections
        },
        // Light text for dark backgrounds
        ink: {
          rich: '#faf5f0',       // Primary text (warm white)
          muted: '#c4b5a8',      // Secondary text (warm gray)
          faint: '#8c7b6d',      // Tertiary text (muted brown)
        },
        slate: {
          850: '#172033',
          950: '#0a0f1a',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        vtes: ['var(--font-vtes)', 'serif'],
      },
      backgroundImage: {
        'noise': "url('/noise.svg')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'dice-roll': 'diceRoll 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'winner-pulse': 'winnerPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(90deg) scale(1.1)' },
          '50%': { transform: 'rotate(180deg) scale(1)' },
          '75%': { transform: 'rotate(270deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(217, 139, 43, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(217, 139, 43, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(217, 139, 43, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(217, 139, 43, 0.7))' },
        },
        winnerPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(217, 139, 43, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(217, 139, 43, 0.5)' },
        },
      },
      boxShadow: {
        // Dark mode shadows (deeper blacks)
        'card': '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
        'card-active': '0 1px 2px rgba(0, 0, 0, 0.3)',
        // Elevated elements (modals, dropdowns)
        'elevated': '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)',
        // Winner glow (warm gold - more vibrant on dark)
        'glow': '0 0 20px rgba(217, 139, 43, 0.4)',
        'glow-lg': '0 0 40px rgba(217, 139, 43, 0.5)',
        'winner': '0 0 0 3px rgba(217, 139, 43, 0.3), 0 4px 16px rgba(217, 139, 43, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
