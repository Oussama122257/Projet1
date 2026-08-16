import type { Config } from "tailwindcss";

/**
 * PayLoop design system.
 *
 * Base is near-black with off-white text; a single saturated accent (electric
 * violet) carries CTAs, earnings figures and focus rings. Status hues are kept
 * deliberately far from the accent so a "paid" badge can never be confused with
 * a call to action.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Surfaces — near-black base, each step one notch lighter.
        surface: {
          DEFAULT: "#08090C",
          raised: "#0F1116",
          overlay: "#161922",
          hover: "#1D212C",
          border: "#23283442",
        },
        // Text — off-white down to muted.
        ink: {
          DEFAULT: "#F2F3F5",
          secondary: "#9BA1B0",
          tertiary: "#666D7E",
          inverse: "#08090C",
        },
        // The single saturated accent.
        accent: {
          DEFAULT: "#B25CFF",
          hover: "#C482FF",
          pressed: "#9B3FF0",
          muted: "#2A1546",
          ring: "#B25CFF66",
        },
        success: { DEFAULT: "#2FD98A", muted: "#0C3324" },
        warning: { DEFAULT: "#FFB224", muted: "#3A2A08" },
        danger: { DEFAULT: "#FF5C6C", muted: "#3D1219" },
        info: { DEFAULT: "#4CC9F0", muted: "#0A2C38" },

        // Platform brand colors, used only for the connect cards / logos.
        platform: {
          tiktok: "#25F4EE",
          instagram: "#E1306C",
          youtube: "#FF0033",
        },

        border: "#232834",
        input: "#232834",
        ring: "#B25CFF",
        background: "#08090C",
        foreground: "#F2F3F5",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-text)", "system-ui", "sans-serif"],
        mono: ["var(--font-display)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-lg": ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-md": ["2.75rem", { lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-sm": ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(178,92,255,0.35), 0 8px 32px -8px rgba(178,92,255,0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1.8s infinite",
        "fade-up": "fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
