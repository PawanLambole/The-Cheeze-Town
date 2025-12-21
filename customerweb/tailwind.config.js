/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          yellow: '#FFB800', // Cheeze Gold
          dark: '#121212',
          darker: '#000000',
          gray: '#1E1E1E', // Card bg
          border: '#2D2D2D',
          text: '#FFFFFF',
          muted: '#A1A1AA',
        }
      }
    },
  },
  plugins: [],
};
