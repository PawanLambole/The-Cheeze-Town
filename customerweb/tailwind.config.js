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
          yellow: '#fbbf24',
          dark: '#18181b', // zinc-900
          darker: '#09090b', // zinc-950
          gray: '#27272a', // zinc-800
        }
      }
    },
  },
  plugins: [],
};
