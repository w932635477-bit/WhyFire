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
        // Editorial Immersion Surface Hierarchy
        surface: {
          DEFAULT: '#000000',
          dim: '#0e0e0e',
          low: '#131313',
          card: '#1C1C1E',
          mid: '#1f1f1f',
          high: '#2a2a2a',
          highest: '#353535',
          bright: '#393939',
        },
        on: {
          surface: '#E2E2E2',
          'surface-variant': '#cbc3d7',
        },
        // Brand Gradient Colors
        primary: {
          DEFAULT: '#d0bcff',
          dim: '#a078ff',
          fixed: '#e9ddff',
        },
        secondary: {
          DEFAULT: '#4edea3',
          dim: '#00a572',
        },
        // Accent Colors (kept from original)
        accent: {
          purple: '#8B5CF6',
          green: '#10B981',
        },
        // Semantic Colors
        background: '#000000',
        foreground: '#E2E2E2',
        muted: {
          DEFAULT: '#958ea0',
          foreground: '#E2E2E2',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Legacy compat
        card: {
          DEFAULT: '#1C1C1E',
          hover: '#2a2a2a',
        },
        border: {
          DEFAULT: '#2a2a2a',
          hover: '#353535',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'PingFang SC', 'sans-serif'],
        body: ['Inter', 'PingFang SC', 'sans-serif'],
        label: ['Inter', 'PingFang SC', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
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
        'glow-purple': '0 8px 32px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': { display: 'none' },
        '.no-scrollbar': { '-ms-overflow-style': 'none', 'scrollbar-width': 'none' },
        '.text-gradient': {
          background: 'linear-gradient(to right, #8B5CF6, #10B981)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.glass-shell': {
          background: 'rgba(0, 0, 0, 0.7)',
          'backdrop-filter': 'blur(40px)',
          '-webkit-backdrop-filter': 'blur(40px)',
        },
        '.hero-mask': {
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
        },
      })
    },
  ],
}

export default config
