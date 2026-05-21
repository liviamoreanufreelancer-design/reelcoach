export type FilterId =
  | "none"
  | "warm"
  | "cool"
  | "bw"
  | "vintage"
  | "vivid"
  | "cinema"
  | "glow"
  | "film"
  | "dreamy"
  | "moody"
  | "golden"
  | "frost";

export interface FilterPreset {
  id: FilterId;
  label: string;
  desc: string;
  /**
   * CSS filter applied per frame. Tuned for visibility (~60% intensity)
   * so the user sees the app doing something.
   */
  cssFilter: string;
  /** Optional rgba tint drawn on top with given alpha. */
  tint?: { color: string; alpha: number };
  /** Subtle vignette opacity 0..1. */
  vignette?: number;
}

export const FILTERS: Record<FilterId, FilterPreset> = {
  none: {
    id: "none",
    label: "Original",
    desc: "Fără filtru. Claritate maximă.",
    cssFilter: "none",
  },

  // ─── Originals ───────────────────────────────────────────────────────
  warm: {
    id: "warm",
    label: "Cald",
    desc: "Tonuri aurii, pielea arată natural.",
    cssFilter: "saturate(1.3) contrast(1.12) brightness(1.05)",
    tint: { color: "rgba(255, 160, 70, 1)", alpha: 0.22 },
  },
  cool: {
    id: "cool",
    label: "Rece",
    desc: "Albastru editorial, look modern.",
    cssFilter: "saturate(1.2) contrast(1.15) brightness(0.96)",
    tint: { color: "rgba(85, 145, 220, 1)", alpha: 0.24 },
  },
  bw: {
    id: "bw",
    label: "Alb-Negru",
    desc: "Monocrom pur, contrast puternic.",
    cssFilter: "grayscale(1) contrast(1.25) brightness(1.0)",
  },
  vintage: {
    id: "vintage",
    label: "Vintage",
    desc: "Sepia caldă, nostalgie discretă.",
    cssFilter: "sepia(0.75) saturate(1.25) contrast(1.12)",
    tint: { color: "rgba(195, 140, 75, 1)", alpha: 0.2 },
    vignette: 0.5,
  },
  vivid: {
    id: "vivid",
    label: "Vivid",
    desc: "Culori vii, pop pentru produse.",
    cssFilter: "saturate(1.7) contrast(1.2) brightness(1.05)",
  },
  cinema: {
    id: "cinema",
    label: "Cinema",
    desc: "Teal & orange, look de film.",
    cssFilter: "saturate(1.35) contrast(1.25) brightness(0.96)",
    tint: { color: "rgba(255, 125, 50, 1)", alpha: 0.22 },
    vignette: 0.55,
  },

  // ─── New (Instagram/TikTok-inspired) ─────────────────────────────────
  glow: {
    id: "glow",
    label: "Glow",
    desc: "Piele luminoasă, soft beauty.",
    // Slight blur softens skin; brightness lifts shadows; warm tint reads
    // as healthy glow rather than yellow cast.
    cssFilter: "saturate(1.15) contrast(1.05) brightness(1.12) blur(0.4px)",
    tint: { color: "rgba(255, 200, 170, 1)", alpha: 0.18 },
  },
  film: {
    id: "film",
    label: "Film",
    desc: "Grain 35mm, look analogic.",
    // Slightly desaturated + warm. Grain is added by vignette + the existing
    // overlay system; this gives the colour-grade base.
    cssFilter: "saturate(0.92) contrast(1.18) brightness(0.98) sepia(0.15)",
    tint: { color: "rgba(220, 180, 130, 1)", alpha: 0.16 },
    vignette: 0.45,
  },
  dreamy: {
    id: "dreamy",
    label: "Dreamy",
    desc: "Lifted shadows, beauty soft.",
    // Hue rotate + low contrast = airy editorial. Pastel highlights.
    cssFilter: "saturate(1.1) contrast(0.92) brightness(1.15) hue-rotate(-5deg)",
    tint: { color: "rgba(255, 200, 220, 1)", alpha: 0.2 },
  },
  moody: {
    id: "moody",
    label: "Moody",
    desc: "Dark editorial, contrast.",
    cssFilter: "saturate(1.1) contrast(1.45) brightness(0.82)",
    tint: { color: "rgba(40, 30, 60, 1)", alpha: 0.18 },
    vignette: 0.7,
  },
  golden: {
    id: "golden",
    label: "Golden",
    desc: "Golden hour, lumină de seară.",
    cssFilter: "saturate(1.4) contrast(1.18) brightness(1.08)",
    tint: { color: "rgba(255, 145, 40, 1)", alpha: 0.28 },
    vignette: 0.4,
  },
  frost: {
    id: "frost",
    label: "Frost",
    desc: "Albastru rece, highlights păstrate.",
    cssFilter: "saturate(0.95) contrast(1.2) brightness(1.02) hue-rotate(8deg)",
    tint: { color: "rgba(120, 180, 240, 1)", alpha: 0.22 },
  },
};

export const FILTER_LIST: FilterPreset[] = [
  FILTERS.none,
  FILTERS.warm,
  FILTERS.cool,
  FILTERS.glow,
  FILTERS.cinema,
  FILTERS.golden,
  FILTERS.dreamy,
  FILTERS.moody,
  FILTERS.film,
  FILTERS.vintage,
  FILTERS.frost,
  FILTERS.bw,
  FILTERS.vivid,
];
