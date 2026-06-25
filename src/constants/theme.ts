// ─────────────────────────────────────────────────────────────────────────────
// KHL Design Tokens — Purple · White · Ink. No gold/yellow anywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Purple brand palette ──────────────────────────────────────────────────
  brand: "#700CEB", // 500 — primary
  brand50: "#EFC2FF",
  brand100: "#D6A1FB",
  brand200: "#BD80F8",
  brand300: "#A35FF4",
  brand400: "#8A2FF0",
  brand500: "#700CEB",
  brand600: "#6413D4",
  brand700: "#5711BE",
  brand800: "#4B0FA7",
  brand900: "#3F0C91",

  brandDark: "#3F0C91",
  brandMid: "#8A2FF0",
  brandLight: "#EFC2FF",

  // Accent = light purple (replaces every former gold accent)
  accent: "#B080FF",
  accentLight: "#D6A1FB",
  accentDeep: "#5711BE",

  // ── Ink (black) scale ───────────────────────────────────────────────────
  ink50: "#F5F5F5",
  ink100: "#E5E5E5",
  ink200: "#D4D4D4",
  ink300: "#A3A3A3",
  ink400: "#737373",
  ink500: "#525252",
  ink600: "#404040",
  ink700: "#262626",
  ink800: "#171717",
  ink900: "#000000",

  // ── Surfaces ──────────────────────────────────────────────────────────────
  dark: "#0A0A0F", // near-black app background for dark screens
  darkAlt: "#171034",
  surface: "#FFFFFF",
  background: "#F7F7FB",
  card: "#FFFFFF",
  border: "#E5E5E5",
  borderLight: "#F0F0F3",

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: "#171717",
  textSecondary: "#525252",
  textMuted: "#A3A3A3",
  textInverse: "#FFFFFF",

  // ── Status ────────────────────────────────────────────────────────────────
  success: "#059669",
  successBg: "#F0FDF4",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  info: "#0284C7",
  infoBg: "#F0F9FF",

  // ── Deprecated gold aliases → remapped to purple so nothing breaks/shows yellow
  gold: "#B080FF",
  goldLight: "#D6A1FB",
  goldDark: "#5711BE",
} as const;

// ── Gradient presets (purple / black / white only) ──────────────────────────
export const Gradients = {
  brand: ["#3F0C91", "#700CEB", "#8A2FF0"] as const, // realtor
  royal: ["#4B0FA7", "#700CEB", "#8A2FF0"] as const, // signup
  midnight: ["#000000", "#1A0B2E", "#3F0C91"] as const, // admin
  dark: ["#0A0A0F", "#171034", "#3F0C91"] as const, // client
  purple: ["#5711BE", "#700CEB"] as const, // buttons/logos
  glass: ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.06)"] as const,
} as const;

export const Typography = {
  display: { fontSize: 32, fontWeight: "800" as const, lineHeight: 40 },
  h1: { fontSize: 24, fontWeight: "800" as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  bodyLg: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  micro: { fontSize: 10, fontWeight: "500" as const, lineHeight: 14 },
  label: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  labelSm: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#700CEB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: "#700CEB",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 26,
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const MIN_TOUCH_TARGET = 44;
