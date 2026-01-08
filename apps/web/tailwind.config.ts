import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ana renkler
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Kaynak renkleri
        hazine: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        refah: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        istikrar: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        altyapi: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        // Olay renkleri
        kriz: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        firsat: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
