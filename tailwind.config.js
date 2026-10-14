/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', 'Segoe', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          subtle: 'var(--theme-subtle)',
          border: 'var(--theme-border)',
          'border-strong': 'var(--theme-border-strong)',
          text: 'var(--theme-text)',
          muted: 'var(--theme-text-muted)',
          accent: 'var(--theme-accent)',
          'accent-hover': 'var(--theme-accent-hover)',
          success: 'var(--theme-success)',
          warning: 'var(--theme-warning)',
        },
        heatmap: {
          0: 'var(--heatmap-0)',
          1: 'var(--heatmap-1)',
          2: 'var(--heatmap-2)',
          3: 'var(--heatmap-3)',
          4: 'var(--heatmap-4)',
        },
        paper: {
          bg: '#F4EFE6',
          card: '#FAF7F2',
          subtle: '#EAE3D5',
          border: '#D8D0C5',
          ink: '#1F1B16',
          muted: '#686259',
          red: '#C4452D',
          moss: '#4A6B4F',
          amber: '#E8C547',
        },
        charcoal: {
          bg: '#1C1A17',
          card: '#26231F',
          subtle: '#302C26',
          border: '#38342E',
          ink: '#E9E2D3',
          muted: '#9E9689',
          amber: '#E0883A',
          moss: '#5E8464',
        },
        brand: {
          50: 'var(--brand-50, #f0fdf4)',
          100: 'var(--brand-100, #dcfce7)',
          500: 'var(--brand-500, #22c55e)',
          600: 'var(--brand-600, #16a34a)',
          700: 'var(--brand-700, #15803d)',
        },
        learnly: {
          50: '#E6F4EA',
          100: '#CEEAD6',
          200: '#A8DAB5',
          500: '#0D6E4F',
          600: '#0A573E',
          700: '#084330',
          800: '#063224',
          bg: '#F8FAFB',
          card: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}
