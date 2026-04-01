/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tea: {
          primary: '#1A3C6E',
          dark: '#0F2444',
          light: '#2A5298',
          accent: '#E8A020',
          bg: '#F0F4F8',
          surface: '#EBF3FB',
        }
      },
    },
  },
  plugins: [],
}
