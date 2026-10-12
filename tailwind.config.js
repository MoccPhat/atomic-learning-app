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
        sans: ['"Segoe UI"', 'Segoe', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'var(--brand-50, #f0fdf4)',
          100: 'var(--brand-100, #dcfce7)',
          500: 'var(--brand-500, #22c55e)',
          600: 'var(--brand-600, #16a34a)',
          700: 'var(--brand-700, #15803d)',
        }
      }
    },
  },
  plugins: [],
}
