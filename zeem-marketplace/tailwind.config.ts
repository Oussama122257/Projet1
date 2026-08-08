import type { Config } from "tailwindcss";

/**
 * "Tlemcen Gold" design system.
 * Primary  : Gold    #E8B931 — CTAs ("Acheter Maintenant"), highlights
 * Secondary: Navy    #0A2647 — headers, sidebars, text on light
 * Accent   : Emerald #2C7A4A — success states (COD collected, delivered)
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#E8B931",
          50: "#FDF8E7",
          100: "#FAEFC4",
          200: "#F5DF8A",
          300: "#EFCE55",
          400: "#E8B931",
          500: "#D4A31E",
          600: "#B08418",
          700: "#8C6613",
          800: "#68490E",
          900: "#443008",
        },
        navy: {
          DEFAULT: "#0A2647",
          50: "#E8EEF6",
          100: "#C6D5E8",
          200: "#8FABD0",
          300: "#5881B8",
          400: "#2E5C97",
          500: "#1B4272",
          600: "#12335C",
          700: "#0A2647",
          800: "#071B33",
          900: "#04101F",
        },
        emerald2: {
          DEFAULT: "#2C7A4A",
          light: "#E6F4EC",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(10, 38, 71, 0.12)",
        gold: "0 4px 20px rgba(232, 185, 49, 0.35)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
