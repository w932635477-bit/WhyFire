import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景色
        background: '#111113',
        foreground: '#FAFAFA',

        // 卡片
        card: {
          DEFAULT: '#1A1A1C',
          hover: '#222224',
        },

        // 边框
        border: {
          DEFAULT: '#2A2A2E',
          hover: '#3A3A3E',
        },

        // 静音文字
        muted: {
          DEFAULT: '#71717A',
          foreground: '#FAFAFA',
        },

        // 主色 - 紫色 (Primary)
        primary: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
          hover: '#7C3AED',
        },

        // 强调色 - 绿色 (Secondary/Accent)
        secondary: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
          hover: '#059669',
        },

        // 危险/删除
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },

        // 语义颜色
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' },
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
        'glow': '0 0 30px rgba(16, 185, 129, 0.3)',
        'glow-lg': '0 0 50px rgba(16, 185, 129, 0.4)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
