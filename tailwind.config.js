/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#000000',
          secondary: '#0A0A0A',
          card: '#111111',
        },
        accent: {
          cyan: '#00F5FF',
          purple: '#7B2FBE',
          pink: '#FF006E',
          green: '#06FFA5',
          orange: '#FF6B00',
        },
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(255,255,255,0.6)',
          muted: 'rgba(255,255,255,0.3)',
        },
      },
    },
  },
  plugins: [],
};
