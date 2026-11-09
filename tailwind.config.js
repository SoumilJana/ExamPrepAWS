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
        canvas: '#111318',
        surface: {
          DEFAULT: '#191D24',
          elevated: '#222833',
          hover: '#262E3B',
        },
        border: {
          subtle: '#252B35',
          DEFAULT: '#303744',
          active: '#4A5568',
        },
        text: {
          primary: '#F1F3F5',
          secondary: '#A0A8B5',
          muted: '#687182',
        },
        accent: {
          DEFAULT: '#7C9CFF',
          hover: '#92ACFF',
          subtle: 'rgba(124, 156, 255, 0.12)',
        },
        status: {
          success: '#45B881',
          'success-subtle': 'rgba(69, 184, 129, 0.12)',
          warning: '#E5AD55',
          'warning-subtle': 'rgba(229, 173, 85, 0.12)',
          error: '#E47777',
          'error-subtle': 'rgba(228, 119, 119, 0.12)',
        },
        domain: {
          concepts: '#60A5FA', // Sky Blue (24%)
          security: '#F87171', // Crimson / Shield Red (30%)
          technology: '#A78BFA', // Purple / Cloud Tech (34%)
          billing: '#34D399', // Emerald / Cost (12%)
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
