/**
 * ════════════════════════════════════════════════════════════════════
 *  SHOT-FIRST DATA LAYER
 * ════════════════════════════════════════════════════════════════════
 *
 *  This app is a GUIDED FILMING ENGINE, not a video editor.
 *
 *  The core unit is the SHOT — never the Reel.
 *
 *  Hierarchy:
 *      Category → Subcategory → ReelTemplate → Section[] → Shot[]
 *
 *  Every Shot is built from a reusable SHOT PATTERN (Before, Process,
 *  Reveal, Reaction, Confidence...). Patterns carry the defaults that
 *  make hundreds of templates feel consistent without hand-writing
 *  every shot. A template author only overrides what's specific.
 *
 *  Design rule: users are salon professionals, not creators. The data
 *  must always produce a flow that is guided, stress-free, and almost
 *  impossible to mess up — "TikTok GPS", not "production software".
 * ════════════════════════════════════════════════════════════════════
 */

import type { TransitionId } from "./transitions";
import type { FilterId } from "./filters";
import type { Profession } from "./scenarios";

/* ─────────────────────────────────────────────────────────────────────
 * 1. SHOT PATTERNS — the reusable building blocks
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The five canonical shot patterns. Every shot in every template is one
 * of these. Adding a new pattern here makes it instantly reusable across
 * all templates — that is the whole point of the architecture.
 */
export type ShotPatternId =
  | "before"
  | "process"
  | "reveal"
  | "reaction"
  | "confidence";

export interface ShotPattern {
  id: ShotPatternId;
  /** Short human label, e.g. "Before Shot". */
  label: string;
  /** One calm sentence telling the pro what this shot is for. */
  purpose: string;
  /** Sensible defaults — a template only overrides what differs. */
  defaults: {
    /** Seconds the pro records in-app. */
    recordingDuration: number;
    /** Seconds of that recording actually used in the final reel. */
    finalUsageDuration: number;
    transitionType: TransitionId;
    filterStyle: FilterId;
    /** Countdown shown before recording starts (seconds). */
    countdown: number;
  };
  /** Lucide icon name, for UI. */
  icon: string;
  /** Accent used across guidance screens for this pattern. */
  accent: "rose" | "gold" | "emerald" | "violet" | "sky";
}

export const SHOT_PATTERNS: Record<ShotPatternId, ShotPattern> = {
  before: {
    id: "before",
    label: "Before Shot",
    purpose: "Arată punctul de plecare — onest, fără filtru. Aici începe transformarea.",
    icon: "Camera",
    accent: "sky",
    defaults: {
      recordingDuration: 5,
      finalUsageDuration: 2,
      transitionType: "cut",
      filterStyle: "none",
      countdown: 3,
    },
  },
  process: {
    id: "process",
    label: "Process Shot",
    purpose: "Munca în desfășurare. Mâini, mișcare, detaliu — dovada priceperii tale.",
    icon: "Sparkles",
    accent: "violet",
    defaults: {
      recordingDuration: 15,
      finalUsageDuration: 5,
      transitionType: "fade",
      filterStyle: "warm",
      countdown: 3,
    },
  },
  reveal: {
    id: "reveal",
    label: "Reveal Shot",
    purpose: "Momentul „uite ce am făcut”. Rezultatul final, filmat curat și încet.",
    icon: "Star",
    accent: "gold",
    defaults: {
      recordingDuration: 6,
      finalUsageDuration: 3,
      transitionType: "zoom",
      filterStyle: "cinema",
      countdown: 3,
    },
  },
  reaction: {
    id: "reaction",
    label: "Reaction Shot",
    purpose: "Reacția reală a clientei. Emoția autentică e cel mai bun social proof.",
    icon: "Heart",
    accent: "rose",
    defaults: {
      recordingDuration: 8,
      finalUsageDuration: 3,
      transitionType: "fade",
      filterStyle: "warm",
      countdown: 3,
    },
  },
  confidence: {
    id: "confidence",
    label: "Confidence Shot",
    purpose: "Clienta se privește și se place. Cadrul care vinde următoarea programare.",
    icon: "Crown",
    accent: "emerald",
    defaults: {
      recordingDuration: 6,
      finalUsageDuration: 3,
      transitionType: "fade",
      filterStyle: "cinema",
      countdown: 3,
    },
  },
};

export const SHOT_PATTERN_LIST: ShotPattern[] = [
  SHOT_PATTERNS.before,
  SHOT_PATTERNS.process,
  SHOT_PATTERNS.reveal,
  SHOT_PATTERNS.reaction,
  SHOT_PATTERNS.confidence,
];

/* ─────────────────────────────────────────────────────────────────────
 * 2. SHOT — one filming instruction
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A single shot the pro will film. Every field a template can set lives
 * here. Anything left undefined falls back to the shot pattern default
 * (see `resolveShot`), so a template stays short and readable.
 */
export interface Shot {
  /** Stable id, unique within a template. */
  id: string;
  /** Which reusable pattern this shot is built on. */
  pattern: ShotPatternId;
  /** Short title shown on the guidance card, e.g. "Părul înainte de tuns". */
  title: string;
  /**
   * Ordered, plain-language steps. Written for a salon pro, not a
   * videographer. Keep each line short and concrete.
   */
  instructions: string[];
  /** Seconds recorded in-app. Falls back to pattern default. */
  recordingDuration?: number;
  /** Seconds used in the final reel. Falls back to pattern default. */
  finalUsageDuration?: number;
  /** Countdown before recording. Falls back to pattern default. */
  countdown?: number;
  /** Caption burned over this shot in the final reel. */
  overlayText?: string;
  /** Transition INTO the next shot. Falls back to pattern default. */
  transitionType?: TransitionId;
  /** Color look for this shot. Falls back to pattern default. */
  filterStyle?: FilterId;
}

/** A shot with every field filled in (pattern defaults applied). */
export interface ResolvedShot extends Required<Omit<Shot, "overlayText">> {
  overlayText: string;
  patternMeta: ShotPattern;
}

/** Merge a shot with its pattern defaults — single source of truth. */
export function resolveShot(shot: Shot): ResolvedShot {
  const p = SHOT_PATTERNS[shot.pattern];
  return {
    id: shot.id,
    pattern: shot.pattern,
    title: shot.title,
    instructions: shot.instructions,
    recordingDuration: shot.recordingDuration ?? p.defaults.recordingDuration,
    finalUsageDuration: shot.finalUsageDuration ?? p.defaults.finalUsageDuration,
    countdown: shot.countdown ?? p.defaults.countdown,
    overlayText: shot.overlayText ?? "",
    transitionType: shot.transitionType ?? p.defaults.transitionType,
    filterStyle: shot.filterStyle ?? p.defaults.filterStyle,
    patternMeta: p,
  };
}

/* ─────────────────────────────────────────────────────────────────────
 * 3. SECTION — a named group of shots inside a template
 * ──────────────────────────────────────────────────────────────────── */

export interface Section {
  id: string;
  /** Label shown to the pro, e.g. "Transformarea". */
  title: string;
  shots: Shot[];
}

/* ─────────────────────────────────────────────────────────────────────
 * 4. REEL TEMPLATE — a full guided filming recipe
 * ──────────────────────────────────────────────────────────────────── */

export interface ReelTemplate {
  id: string;
  subcategoryId: string;
  /** Title shown in the template picker. */
  title: string;
  /** One-line promise of what the pro will end up with. */
  promise: string;
  /** Cover image (imported asset URL). */
  cover: string;
  /** Professions this template suits. */
  professions: Profession[];
  sections: Section[];
}

/* ─────────────────────────────────────────────────────────────────────
 * 5. CATEGORY / SUBCATEGORY — the browse hierarchy
 * ──────────────────────────────────────────────────────────────────── */

export interface Subcategory {
  id: string;
  categoryId: string;
  label: string;
  blurb: string;
}

export interface Category {
  id: string;
  label: string;
  blurb: string;
  /** Lucide icon name. */
  icon: string;
}

/* ─────────────────────────────────────────────────────────────────────
 * 6. DERIVED HELPERS — used by the filming flow
 * ──────────────────────────────────────────────────────────────────── */

/** Every shot of a template, flattened in filming order. */
export function flattenShots(t: ReelTemplate): ResolvedShot[] {
  return t.sections.flatMap((s) => s.shots.map(resolveShot));
}

/** Which section a given flat shot index belongs to (for "Process · 2/4"). */
export function sectionForShotIndex(
  t: ReelTemplate,
  flatIdx: number,
): { section: Section; indexInSection: number; total: number } | null {
  let cursor = 0;
  for (const section of t.sections) {
    if (flatIdx < cursor + section.shots.length) {
      return {
        section,
        indexInSection: flatIdx - cursor,
        total: section.shots.length,
      };
    }
    cursor += section.shots.length;
  }
  return null;
}

/** Total seconds the pro spends recording (sum of recordingDuration). */
export function totalRecordingSeconds(t: ReelTemplate): number {
  return flattenShots(t).reduce((sum, s) => sum + s.recordingDuration, 0);
}

/** Approx length of the finished reel (sum of finalUsageDuration). */
export function totalFinalSeconds(t: ReelTemplate): number {
  return flattenShots(t).reduce((sum, s) => sum + s.finalUsageDuration, 0);
}

export function shotCount(t: ReelTemplate): number {
  return t.sections.reduce((n, s) => n + s.shots.length, 0);
}
