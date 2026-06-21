/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'netflix-red': '#e50914',
        'dark-bg': '#0a0a1a',
        'card-bg': '#1a1a2e',
        'text-gray': '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}