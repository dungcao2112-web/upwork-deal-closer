/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#07090d',
          900: '#0c0f15',
          850: '#11151d',
          800: '#161b25',
          700: '#1f2632',
          600: '#2b3443',
          500: '#3a4557',
        },
        accent: { DEFAULT: '#14e0b0', soft: '#0fb48e' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
