/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["10px", { lineHeight: "14px" }],
        sm: ["11px", { lineHeight: "16px" }],
        base: ["12px", { lineHeight: "18px" }],
        lg: ["13px", { lineHeight: "20px" }],
        xl: ["15px", { lineHeight: "22px" }],
        "2xl": ["18px", { lineHeight: "26px" }],
        "3xl": ["22px", { lineHeight: "30px" }],
      },
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          hover: "var(--color-brand-hover)",
          muted: "var(--color-brand-muted)",
          foreground: "var(--color-brand-foreground)",
          accent: "var(--color-brand-accent)",
        },
        primary: {
          DEFAULT: "#0a0a0a",
          hover: "#262626",
        },
        app: "var(--color-app-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        subtle: "var(--color-text-subtle)",
        success: {
          DEFAULT: "#205848",
          muted: "#e8f2ee",
          accent: "#16d595",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          muted: "var(--color-warning-muted)",
        },
        danger: {
          DEFAULT: "#b91c1c",
          muted: "#fef2f2",
        },
        info: {
          DEFAULT: "var(--color-info)",
          muted: "var(--color-info-muted)",
        },
        slate: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#0a0a0a",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-md)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
