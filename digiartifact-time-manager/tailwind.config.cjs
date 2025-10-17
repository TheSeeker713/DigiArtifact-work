/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#38bdf8',
          accent: '#f97316',
        },
      },
    },
  },
  plugins: [],
};
