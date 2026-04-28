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
      screens: {
        'xs': '375px',    // iPhone SE
        'sm': '640px',    // Large phones, small tablets
        'md': '768px',    // Tablets (iPad Mini+)
        'lg': '1024px',   // iPad Pro, small laptops
        'xl': '1280px',   // Laptops, desktops
        '2xl': '1536px',  // Large monitors
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      gridTemplateColumns: {
        'responsive-2': 'repeat(auto-fit, minmax(300px, 1fr))',
        'responsive-3': 'repeat(auto-fit, minmax(280px, 1fr))',
        'responsive-4': 'repeat(auto-fit, minmax(240px, 1fr))',
        'mobile': '1fr',
        'tablet': 'repeat(2, 1fr)',
        'desktop': 'repeat(3, 1fr)',
        'large': 'repeat(4, 1fr)',
      },
    },
  },
  plugins: [],
};