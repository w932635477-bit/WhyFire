import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background
        "bg-primary": "#0A0A0B",
        "bg-secondary": "#111113",
        "bg-tertiary": "#18181B",
        "bg-card": "#141416",
        "bg-card-hover": "#1A1A1D",
        // Text
        "text-primary": "#FAFAFA",
        "text-secondary": "#A1A1AA",
        "text-tertiary": "#71717A",
        // Accent
        "accent-primary": "#FF6B6B",
        "accent-secondary": "#FF8E53",
        // Status
        "green-primary": "#34D399",
        "green-secondary": "#10B981",
        "purple-primary": "#A78BFA",
        "purple-secondary": "#8B5CF6",
        "yellow-primary": "#FBBF24",
        "yellow-secondary": "#F59E0B",
        // Border
        "border-subtle": "rgba(255, 255, 255, 0.06)",
        "border-default": "rgba(255, 255, 255, 0.1)",
        "border-strong": "rgba(255, 255, 255, 0.15)",
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'Space Mono'", "'SF Mono'", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
        md: "0 4px 12px rgba(0, 0, 0, 0.4)",
        lg: "0 8px 32px rgba(0, 0, 0, 0.5)",
        glow: "0 0 40px rgba(255, 107, 107, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
