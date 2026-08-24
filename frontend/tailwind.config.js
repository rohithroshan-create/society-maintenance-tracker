/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EFEAE0",
        card: "#FFFDF8",
        ink: "#22271F",
        inkfaint: "#5B6156",
        line: "#D8D0BF",
        brand: {
          DEFAULT: "#2B5D50",
          dark: "#1F453B",
          light: "#DDE7E2",
        },
        amber: {
          DEFAULT: "#C9762B",
          light: "#F3E3CC",
        },
        brick: {
          DEFAULT: "#A63D2F",
          light: "#F0DAD3",
        },
        leaf: {
          DEFAULT: "#3E7C4A",
          light: "#DCEBDD",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle, rgba(34,39,31,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grain: "6px 6px",
      },
      boxShadow: {
        pin: "0 6px 14px -6px rgba(34,39,31,0.35)",
        stamp: "0 0 0 1.5px currentColor",
      },
    },
  },
  plugins: [],
};
