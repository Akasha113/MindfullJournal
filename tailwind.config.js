/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4e4f5',
          100: '#e8c8eb',
          200: '#d191d7',
          300: '#ba5ac3',
          400: '#a323af',
          500: '#8a0a9b',
          600: '#6E2B8A',
          700: '#5a2270',
          800: '#461956',
          900: '#32103c',
        },
        accent: '#6E2B8A',
      },
      backgroundColor: {
        'primary-dark': '#6E2B8A',
        'primary-light': '#f4e4f5',
      },
      textColor: {
        'primary': '#000000',
        'heading': '#6E2B8A',
      },
      borderColor: {
        'primary': '#6E2B8A',
      },
    },
  },
  plugins: [],
};