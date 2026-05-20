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
   * Tuned for VISIBILITY — the pro needs to see the app actually doing
   * something. Roughly ~60% intensity vs the "subtle" baseline.
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
    // True monochrome — no tint, no warm-up. The user asked for proper
    // black-and-white; previously a 14% boost still let some colour slip
    // through on bright frames.
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
