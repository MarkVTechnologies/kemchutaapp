/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // KHL Brand Palette — mirrors web Tailwind config
        purple: {
          50:  "#F3EBFF",
          100: "#E7D6FF",
          200: "#CEB0FF",
          300: "#B080FF",
          400: "#9050F5",
          500: "#700CEB", // Primary brand purple
          600: "#5A09BC",
          700: "#3F0C91", // Dark purple
          800: "#2D0870",
          900: "#1A1A2E", // Near black
        },
        gold: {
          300: "#EFC050",
          400: "#D4A017", // Primary gold
          500: "#B8860B",
        },
        // Semantic aliases
        brand:    "#700CEB",
        brandDark:"#3F0C91",
        brandBg:  "#F3EBFF",
        surface:  "#FFFFFF",
        background: "#F7F8FA",
        card:     "#FFFFFF",
        border:   "#E5E7EB",
        // Status
        success:  "#059669",
        warning:  "#D97706",
        error:    "#DC2626",
        info:     "#0284C7",
        // Text
        textPrimary:   "#1A1A2E",
        textSecondary: "#6B7280",
        textMuted:     "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
};
