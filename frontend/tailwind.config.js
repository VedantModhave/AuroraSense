/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        aurora: {
          green: '#00ff88',
          purple: '#8b5cf6',
          dark: '#0a0a1a',
        },
      },
    },
  },
  plugins: [],
}
