/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:   '#1a1a2e',
        petal: '#e8a0bf',
        bloom: '#c084a0',
        blush: '#fdf0f5',
        slate: '#6b7280',
        plum:  '#3d1f2e',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
