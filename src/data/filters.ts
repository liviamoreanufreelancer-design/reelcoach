export type FilterId =
  | "none"
  | "warm"
  | "cool"
  | "bw"
  | "vintage"
  | "vivid"
  | "cinema";

export interface FilterPreset {
  id: FilterId;
  label: string;
  desc: string;
  /**
   * CSS filter string applied when drawing each video frame.
   * Values are deliberately strong enough to be visible at preview size —
   * "subtle" filters that need a colour calibrator to spot are useless
   * here, the pro needs to SEE the app doing something.
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
  warm: {
    id: "warm",
    label: "Cald",
    desc: "Tonuri aurii, pielea arată natural.",
    cssFilter: "saturate(1.18) contrast(1.08) brightness(1.04)",
    tint: { color: "rgba(255, 165, 80, 1)", alpha: 0.14 },
  },
  cool: {
    id: "cool",
    label: "Rece",
    desc: "Albastru editorial, look modern.",
    cssFilter: "saturate(1.1) contrast(1.1) brightness(0.98)",
    tint: { color: "rgba(100, 155, 220, 1)", alpha: 0.15 },
  },
  bw: {
    id: "bw",
    label: "Alb-Negru",
    desc: "Monocrom elegant, contrast crescut.",
    cssFilter: "grayscale(1) contrast(1.18) brightness(1.02)",
  },
  vintage: {
    id: "vintage",
    label: "Vintage",
    desc: "Sepia ușor, nostalgie discretă.",
    cssFilter: "sepia(0.5) saturate(1.15) contrast(1.08)",
    tint: { color: "rgba(190, 140, 80, 1)", alpha: 0.12 },
    vignette: 0.35,
  },
  vivid: {
    id: "vivid",
    label: "Vivid",
    desc: "Culori vii, pop pentru produse.",
    cssFilter: "saturate(1.4) contrast(1.14) brightness(1.03)",
  },
  cinema: {
    id: "cinema",
    label: "Cinema",
    desc: "Teal & orange subtil, look de film.",
    cssFilter: "saturate(1.2) contrast(1.18) brightness(0.98)",
    tint: { color: "rgba(255, 135, 60, 1)", alpha: 0.13 },
    vignette: 0.4,
  },
};

export const FILTER_LIST: FilterPreset[] = [
  FILTERS.none,
  FILTERS.warm,
  FILTERS.cool,
  FILTERS.cinema,
  FILTERS.vintage,
  FILTERS.bw,
  FILTERS.vivid,
];
