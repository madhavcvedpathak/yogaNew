/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        'ayur-primary': '#D4A373', // Earthy tone
        'ayur-secondary': '#FAEDCD', // Light cream
        'ayur-accent': '#CCD5AE', // Soft green
      }
    },
  },
  plugins: [],
}
