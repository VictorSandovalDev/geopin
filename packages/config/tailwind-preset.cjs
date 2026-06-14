/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "#080B1A",
        abyss: "#0E1329",
        deep: "#141B33",
        panel: "#1A2240",
        surface: "#232C4F",
        border: "#2E3960",
        brand: {
          cyan: "#22E9FF",
          cyanSoft: "#5AF0FF",
          violet: "#8B5CF6",
          magenta: "#FF3CAC",
          lime: "#A3F700",
          gold: "#FFC93C",
        },
        ink: {
          DEFAULT: "#F2F5FF",
          muted: "#9AA3C7",
          dim: "#5F6892",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 32px rgba(34, 233, 255, 0.35)",
        "glow-magenta": "0 0 32px rgba(255, 60, 172, 0.35)",
        card: "0 10px 30px rgba(0,0,0,0.35)",
        lift: "0 20px 60px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "grad-brand":
          "linear-gradient(135deg, #22E9FF 0%, #8B5CF6 60%, #FF3CAC 100%)",
        "grad-night":
          "radial-gradient(circle at 20% 10%, #1A2240 0%, #080B1A 60%)",
        "grad-aurora":
          "conic-gradient(from 140deg at 50% 50%, #22E9FF, #8B5CF6, #FF3CAC, #22E9FF)",
        "grad-gold":
          "linear-gradient(135deg, #FFD96B 0%, #FFC93C 50%, #E67A00 100%)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "22px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "pulse-ring": "pulse-ring 1.4s ease-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
