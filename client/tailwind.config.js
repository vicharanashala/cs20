/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        brand: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
                surface: '#fdfbf7',
        card: '#ffffff',
        border: '#e2e8f0',
        muted: '#64748b',
        primary: '#0f172a',
        accent: {
          DEFAULT: '#d97706',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        violet: {
          DEFAULT: '#9a3412',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdbb2d',
          400: '#fb923c',
          500: '#ea580c',
          600: '#9a3412',
          700: '#7c2d12',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        'card-elevated': '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        glow: '0 0 20px rgba(217, 119, 6, 0.15)',
        'glow-lg': '0 0 40px rgba(217, 119, 6, 0.2)',
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        waveHand: {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '60%, 100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        slideUp: 'slideUp 0.3s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        'bounce-sm': 'bounceSm 0.3s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'wave-hand': 'waveHand 2.5s ease-in-out 1',
      },
    },
  },
  plugins: [],
};