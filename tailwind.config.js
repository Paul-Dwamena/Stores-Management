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
        app: "var(--color-app-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        subtle: "var(--color-text-subtle)",
        success: {
          DEFAULT: "var(--color-success)",
          muted: "var(--color-success-muted)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          muted: "var(--color-warning-muted)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          muted: "var(--color-danger-muted)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          muted: "var(--color-info-muted)",
        },
        slate: {
          50: "#f9fcfb",
          100: "#f1f8f6",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
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
