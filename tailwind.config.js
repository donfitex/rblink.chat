/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slack: {
          dark: '#1A1D21',
          sidebar: '#19171D',
          hover: '#27242C',
          active: '#1164A3',
          border: '#383F45',
          text: '#D1D2D3',
          muted: '#ABABAD',
          accent: '#1264A3',
          badge: '#E01E5A',
          presence: '#2BAC76',
          away: '#ECB22E',
          dnd: '#E01E5A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      keyframes: {
        pulseHighlight: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '30%, 70%': { backgroundColor: 'rgba(236, 178, 46, 0.25)' },
        }
      },
      animation: {
        'highlight-pulse': 'pulseHighlight 2.5s ease-in-out',
      }
    },
  },
  plugins: [],
}
