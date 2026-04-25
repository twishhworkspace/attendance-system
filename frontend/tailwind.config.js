/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#f43f5e',
        'k-navy': '#002D5B',
        'k-gold': '#FDB913',
        'k-red': '#D24B51',
        'k-cream': '#FEF9E7',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        'k-primary': ['Inter', 'sans-serif'],
        'k-secondary': ['DM Sans', 'Manrope', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
