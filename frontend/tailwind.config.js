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
        primary: {
          DEFAULT: '#13daec',
          dark: '#0bb8cc',
        },
        background: {
          light: '#f6f8f8',
          dark: '#102022',
        },
      },
      fontFamily: {
        display: ['"Spline Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
