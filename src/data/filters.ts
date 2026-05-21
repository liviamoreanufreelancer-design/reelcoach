/**
 * ════════════════════════════════════════════════════════════════════
 *  BEAUTY-FIRST FILTER SYSTEM
 * ════════════════════════════════════════════════════════════════════
 *
 *  Every filter here is tuned for ONE thing: making hair, skin, makeup
 *  and nails look like premium salon content. Not generic "Instagram
 *  filters". Not bling-effects. Beauty editorial grading.
 *
 *  Organization:
 *    - "natural"   → safe choices, light correction
 *    - "soft"      → skin & beauty, glowy & forgiving
 *    - "cinematic" → editorial drama, transformations
 *    - "bold"      → product POP, dramatic colors
 *
 *  All intensities ~60% — visible without caricature.
 * ════════════════════════════════════════════════════════════════════
 */

export type FilterId =
  // natural
  | "none"
  | "clean"
  // soft & beauty
  | "glow"
  | "porcelain"
  | "honey"
  | "velvet"
  // cinematic
  | "studio"
  | "moody"
  | "film"
  | "noir"
  // bold
  | "pop"
  | "neon"
  // legacy ids kept so old saved state still resolves
  | "warm"
  | "cool"
  | "bw"
  | "vintage"
  | "vivid"
  | "cinema";

export type FilterCategory = "natural" | "soft" | "cinematic" | "bold";

export interface FilterPreset {
  id: FilterId;
  label: string;
  desc: string;
  category: FilterCategory;
  /**
   * CSS filter string applied when drawing each video frame.
   * Tuned for VISIBILITY — beauty content needs the app to SHOW work.
   */
  cssFilter: string;
  /** Optional rgba tint drawn on top with given alpha. */
  tint?: { color: string; alpha: number };
  /** Subtle vignette opacity 0..1. */
  vignette?: number;
  /**
   * Optional highlight boost layer — adds a soft brightness overlay that
   * mostly affects bright areas (where hair gloss / shine lives).
   * 0..1 alpha. Approximates "hair gloss boost" without face detection.
   */
  highlightBoost?: number;
}

export const FILTERS: Record<FilterId, FilterPreset> = {
  // ── NATURAL ────────────────────────────────────────────────────────
  none: {
    id: "none",
    label: "Original",
    desc: "Fără filtru. Claritate maximă.",
    category: "natural",
    cssFilter: "none",
  },
  clean: {
    id: "clean",
    label: "Clean",
    desc: "Corecție subtilă — exact ca în salon.",
    category: "natural",
    cssFilter: "saturate(1.08) contrast(1.06) brightness(1.03)",
    highlightBoost: 0.08,
  },

  // ── SOFT & BEAUTY ──────────────────────────────────────────────────
  glow: {
    id: "glow",
    label: "Glow",
    desc: "Piele luminoasă, lumină moale. Cel mai bun pentru close-up.",
    category: "soft",
    cssFilter: "saturate(1.15) contrast(1.05) brightness(1.08) blur(0.3px)",
    tint: { color: "rgba(255, 220, 180, 1)", alpha: 0.12 },
    highlightBoost: 0.18,
  },
  porcelain: {
    id: "porcelain",
    label: "Porcelain",
    desc: "Look editorial alb. Piele de porțelan.",
    category: "soft",
    cssFilter: "saturate(0.85) contrast(1.12) brightness(1.1)",
    tint: { color: "rgba(245, 230, 220, 1)", alpha: 0.14 },
    highlightBoost: 0.12,
  },
  honey: {
    id: "honey",
    label: "Honey",
    desc: "Auriu cald, peach undertones. Pentru blonde și golden hour.",
    category: "soft",
    cssFilter: "saturate(1.3) contrast(1.08) brightness(1.06)",
    tint: { color: "rgba(255, 175, 95, 1)", alpha: 0.2 },
    highlightBoost: 0.15,
  },
  velvet: {
    id: "velvet",
    label: "Velvet",
    desc: "Mid-tones cremoase, blacks moi. Pentru brunete.",
    category: "soft",
    cssFilter: "saturate(1.15) contrast(1.1) brightness(0.98)",
    tint: { color: "rgba(180, 130, 105, 1)", alpha: 0.16 },
    vignette: 0.35,
    highlightBoost: 0.1,
  },

  // ── CINEMATIC ──────────────────────────────────────────────────────
  studio: {
    id: "studio",
    label: "Studio",
    desc: "Fashion magazine. Contrast crescut, blacks punctate.",
    category: "cinematic",
    cssFilter: "saturate(1.2) contrast(1.28) brightness(0.99)",
    tint: { color: "rgba(255, 145, 80, 1)", alpha: 0.14 },
    vignette: 0.4,
    highlightBoost: 0.12,
  },
  moody: {
    id: "moody",
    label: "Moody",
    desc: "Dark editorial. Pentru bordo, negru, transformări dramatice.",
    category: "cinematic",
    cssFilter: "saturate(1.1) contrast(1.35) brightness(0.92)",
    tint: { color: "rgba(80, 70, 105, 1)", alpha: 0.22 },
    vignette: 0.65,
    highlightBoost: 0.08,
  },
  film: {
    id: "film",
    label: "Film 35mm",
    desc: "Grain, warmth, look analog. Aspect retro premium.",
    category: "cinematic",
    cssFilter: "saturate(1.05) contrast(1.18) brightness(0.97)",
    tint: { color: "rgba(210, 165, 110, 1)", alpha: 0.18 },
    vignette: 0.55,
    highlightBoost: 0.1,
  },
  noir: {
    id: "noir",
    label: "Noir",
    desc: "Alb-negru cu skin tones păstrate. Editorial.",
    category: "cinematic",
    cssFilter: "saturate(0.18) contrast(1.32) brightness(1.0)",
    tint: { color: "rgba(220, 180, 145, 1)", alpha: 0.08 },
    vignette: 0.5,
  },

  // ── BOLD ───────────────────────────────────────────────────────────
  pop: {
    id: "pop",
    label: "Pop",
    desc: "Culori vii, saturate. Pentru produse și roșu dramatic.",
    category: "bold",
    cssFilter: "saturate(1.65) contrast(1.22) brightness(1.04)",
    highlightBoost: 0.14,
  },
  neon: {
    id: "neon",
    label: "Neon",
    desc: "High contrast, tonuri electric. Gen-Z reels.",
    category: "bold",
    cssFilter: "saturate(1.5) contrast(1.4) brightness(1.0)",
    tint: { color: "rgba(120, 100, 255, 1)", alpha: 0.14 },
    highlightBoost: 0.16,
  },

  // ── LEGACY ALIASES ─────────────────────────────────────────────────
  // Kept so any previously-saved state still resolves to something sensible.
  warm:    { id: "warm",    label: "Cald",     desc: "—", category: "soft",
             cssFilter: "saturate(1.3) contrast(1.08) brightness(1.06)",
             tint: { color: "rgba(255, 175, 95, 1)", alpha: 0.2 }, highlightBoost: 0.15 },
  cool:    { id: "cool",    label: "Rece",     desc: "—", category: "cinematic",
             cssFilter: "saturate(1.2) contrast(1.15) brightness(0.96)",
             tint: { color: "rgba(85, 145, 220, 1)", alpha: 0.18 } },
  bw:      { id: "bw",      label: "Alb-Negru", desc: "—", category: "cinematic",
             cssFilter: "grayscale(1) contrast(1.25) brightness(1.0)" },
  vintage: { id: "vintage", label: "Vintage",  desc: "—", category: "cinematic",
             cssFilter: "sepia(0.75) saturate(1.25) contrast(1.12)",
             tint: { color: "rgba(195, 140, 75, 1)", alpha: 0.2 }, vignette: 0.5 },
  vivid:   { id: "vivid",   label: "Vivid",    desc: "—", category: "bold",
             cssFilter: "saturate(1.7) contrast(1.2) brightness(1.05)" },
  cinema:  { id: "cinema",  label: "Cinema",   desc: "—", category: "cinematic",
             cssFilter: "saturate(1.35) contrast(1.25) brightness(0.96)",
             tint: { color: "rgba(255, 125, 50, 1)", alpha: 0.22 }, vignette: 0.55 },
};

/** Ordered list shown in the UI (legacy aliases excluded). */
export const FILTER_LIST: FilterPreset[] = [
  FILTERS.none,
  FILTERS.clean,
  FILTERS.glow,
  FILTERS.porcelain,
  FILTERS.honey,
  FILTERS.velvet,
  FILTERS.studio,
  FILTERS.moody,
  FILTERS.film,
  FILTERS.noir,
  FILTERS.pop,
  FILTERS.neon,
];

/** Grouped for the UI — categories matter, "47 filters" doesn't. */
export const FILTER_GROUPS: { id: FilterCategory; label: string; filters: FilterPreset[] }[] = [
  { id: "natural",   label: "Natural",      filters: [FILTERS.none, FILTERS.clean] },
  { id: "soft",      label: "Soft & Beauty", filters: [FILTERS.glow, FILTERS.porcelain, FILTERS.honey, FILTERS.velvet] },
  { id: "cinematic", label: "Cinematic",    filters: [FILTERS.studio, FILTERS.moody, FILTERS.film, FILTERS.noir] },
  { id: "bold",      label: "Bold",         filters: [FILTERS.pop, FILTERS.neon] },
];
