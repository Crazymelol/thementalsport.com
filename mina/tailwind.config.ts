import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mina: {
          bg: "#000308",
          panel: "#020a12",
          edge: "#0d2a3a",
          text: "#c8f0ff",
          muted: "#4a7a99",
          accent: "#00d4ff",
          accent2: "#0077ff",
          glow: "#00aadd",
          warn: "#ffaa00",
          danger: "#ff4466",
        },
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        spin_slow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        spin_rev: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.4" },
          "94%": { opacity: "1" },
        },
        data_flow: {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translateY(-200px)", opacity: "0" },
        },
        glow_pulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(0,212,255,0.6), 0 0 100px rgba(0,212,255,0.2)" },
        },
      },
      animation: {
        breathe: "breathe 3s ease-in-out infinite",
        ripple: "ripple 2s ease-out infinite",
        spin_slow: "spin_slow 8s linear infinite",
        spin_rev: "spin_rev 12s linear infinite",
        spin_slow2: "spin_slow 20s linear infinite",
        scanline: "scanline 8s linear infinite",
        flicker: "flicker 6s ease-in-out infinite",
        data_flow: "data_flow 3s ease-out infinite",
        glow_pulse: "glow_pulse 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
