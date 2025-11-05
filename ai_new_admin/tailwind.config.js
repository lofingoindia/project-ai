/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Tajawal', 'system-ui', 'Arial', 'sans-serif'],
        'tajawal': ['Tajawal', 'system-ui', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}