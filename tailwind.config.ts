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
        // Board Game Night palette
        wood: {
          50: '#fdf8f3',
          100: '#f9edd8',
          200: '#f3d9af',
          300: '#ebc07d',
          400: '#e2a249',
          500: '#d98b2b',
          600: '#c67020',
          700: '#a4551d',
          800: '#85451f',
          900: '#6d3a1c',
          950: '#3b1c0c',
        },
        felt: {
          50: '#f0fdf1',
          100: '#dcfce0',
          200: '#bbf7c3',
          300: '#86ef96',
          400: '#4ade61',
          500: '#22c53d',
          600: '#16a32d',
          700: '#158027',
          800: '#166524',
          900: '#14532d',
          950: '#052e14',
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
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(217, 139, 43, 0.4)',
        'glow-lg': '0 0 40px rgba(217, 139, 43, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
