/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Match kristiantalley.com - clean system sans-serif stack
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Minimal palette matching kristiantalley.com
        white: '#ffffff',
        black: '#000000',
        gray: {
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      spacing: {
        '18': '4.5rem',
      },
      fontSize: {
        'nav': ['12px', { letterSpacing: '0.05em', lineHeight: '1.5' }],
        'logo': ['24px', { letterSpacing: '0.02em', lineHeight: '1' }],
      },
      maxWidth: {
        '8xl': '1400px',
      },
    },
  },
  plugins: [],
}
