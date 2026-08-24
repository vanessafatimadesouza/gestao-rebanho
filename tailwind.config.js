/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f3f7f4',
          100: '#e1ece4',
          200: '#c5d9cb',
          300: '#9cbca6',
          400: '#6d977b',
          500: '#47775a',
          600: '#315e43',
          700: '#1f4933',
          800: '#163b29',
          900: '#0d2d1e',
        },
      },
    },
  },
  plugins: [],
}
