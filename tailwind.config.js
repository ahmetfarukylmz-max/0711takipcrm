/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // Ana aksiyon rengi (Indigo)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#4f46e5',
        },
        secondary: '#64748b', // Slate-500
        background: '#f3f4f6', // Slate-100 (Daha belirgin arka plan)
        surface: '#ffffff',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft: '0 8px 30px rgb(0,0,0,0.04)',
        'soft-md': '0 12px 40px rgb(0,0,0,0.06)',
        'soft-lg': '0 16px 48px rgb(0,0,0,0.08)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        glow: '0 0 20px rgba(99, 102, 241, 0.2)',
        primary: '0 10px 15px -3px rgba(79, 70, 229, 0.2), 0 4px 6px -2px rgba(79, 70, 229, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
        slideUp: 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
