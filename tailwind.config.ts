import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b0d12",
          raised: "#12151d",
          overlay: "#1a1e29",
          border: "#252a38",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          muted: "#312e81",
        },
        content: {
          primary: "#e7e9ee",
          secondary: "#9aa1b2",
          tertiary: "#5d6577",
        },
        success: "#34d399",
        warning: "#fbbf24",
        danger: "#f87171",
        ai: "#a78bfa",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
