/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8bc4ff',
          400: '#53a2ff',
          500: '#2d7eff',
          600: '#1d62f2',
          700: '#194ddf',
          800: '#1c41b4',
          900: '#1d398d'
        },
        ink: '#071122',
        slateglass: 'rgba(148, 163, 184, 0.12)'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.12)',
        glow: '0 24px 64px rgba(29, 78, 216, 0.25)'
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at top, rgba(45,126,255,0.18), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0))'
      }
    }
  },
  plugins: []
};
