import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主色 - 深紫 (Primary)
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#1E1B4B',
          600: '#1a1539',
          700: '#150f2e',
          800: '#100a23',
          900: '#0a0519',
        },
        // 强调色 - 亮紫 (Secondary)
        secondary: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c7d6fe',
          300: '#a4b8fc',
          400: '#7c8ff8',
          500: '#4338CA',
          600: '#3730ab',
          700: '#2d2789',
          800: '#25206e',
          900: '#1c1853',
        },
        // CTA - 活力绿
        cta: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22C55E',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // 背景色
        dark: {
          900: '#0F0F23',
          800: '#1a1a2e',
          700: '#252542',
          600: '#36365a',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Righteous', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'soft-lg': '0 8px 40px rgba(0, 0, 0, 0.35)',
        'glow': '0 0 30px rgba(34, 197, 94, 0.3)',
        'glow-lg': '0 0 50px rgba(34, 197, 94, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
