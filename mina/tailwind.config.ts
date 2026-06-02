import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mina's palette — calm, warm, not the default "AI purple"
        mina: {
          bg: "#0f1115",
          panel: "#171a21",
          edge: "#262b36",
          text: "#e7e9ee",
          muted: "#9aa3b2",
          accent: "#5eead4", // teal — her "presence"
          warn: "#fbbf24",
          danger: "#f87171",
        },
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        breathe: "breathe 3s ease-in-out infinite",
        ripple: "ripple 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
