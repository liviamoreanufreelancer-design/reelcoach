/**
 * ════════════════════════════════════════════════════════════════════
 *  CATALOG — Category → Subcategory → ReelTemplate
 * ════════════════════════════════════════════════════════════════════
 *
 *  This is the browsable content of the app. It is intentionally SMALL
 *  for the MVP. Scaling happens by adding entries here — never by
 *  touching the filming engine or the editor.
 *
 *  To add a template:
 *    1. (optional) add a Subcategory under a Category
 *    2. add a ReelTemplate with sections + shots
 *    3. each shot picks a pattern from shots.ts and overrides text
 *
 *  Instruction-writing rules (decided together — keep them):
 *    - one bullet = one physical action, imperative ("Așază…")
 *    - no videographer jargon, no unstated equipment assumptions
 *    - if hands are busy with the client → handsBusy: true, phone stays
 *      propped (never "move the phone")
 *    - `mustShow` is a framing checklist, NOT instructions
 *    - if the pro reads only `instructions`, she can film it correctly
 * ════════════════════════════════════════════════════════════════════
 */

import type { Category, Subcategory, ReelTemplate } from "./shots";

// Reuse imagery that already ships with the project.
import coverBeforeAfter from "@/assets/par-cat/stock/before-after.jpg";
import coverGlowUp from "@/assets/par-cat/glow-up.jpg";
import coverReactions from "@/assets/par-cat/reactions.jpg";

/* ─────────────────────────────────────────────────────────────────────
 * CATEGORIES — top level of the browse tree
 * ──────────────────────────────────────────────────────────────────── */

export const CATEGORIES: Category[] = [
  {
    id: "transformation",
    label: "Transformare",
    blurb: "Înainte → după. Cel mai sigur tip de reel.",
    icon: "Wand2",
  },
  {
    id: "emotion",
    label: "Emoție",
    blurb: "Reacția clientei. Social proof care aduce programări.",
    icon: "Heart",
  },
];

/* ─────────────────────────────────────────────────────────────────────
 * SUBCATEGORIES
 * ──────────────────────────────────────────────────────────────────── */

export const SUBCATEGORIES: Subcategory[] = [
  {
    id: "dramatic-transformation",
    categoryId: "transformation",
    label: "Transformare dramatică",
    blurb: "Contrast puternic before/after. Efect WOW.",
  },
  {
    id: "before-after",
    categoryId: "transformation",
    label: "Before & After",
    blurb: "Metamorfoza clasică în câteva cadre.",
  },
  {
    id: "client-reaction",
    categoryId: "emotion",
    label: "Client Reaction",
    blurb: "Reacția autentică în oglindă.",
  },
];

/* ─────────────────────────────────────────────────────────────────────
 * REEL TEMPLATES
 * ──────────────────────────────────────────────────────────────────── */

export const REEL_TEMPLATES: ReelTemplate[] = [
  {
    id: "wow-transformation",
    subcategoryId: "dramatic-transformation",
    title: "Nu o să crezi transformarea asta",
    promise:
      "Un reel cu efect WOW prin contrast puternic before/after. Filmezi relaxat, appul taie și montează singur.",
    cover: coverBeforeAfter,
    professions: ["par"],
    sections: [
      {
        id: "sec-before",
        title: "Punctul de plecare",
        shots: [
          {
            id: "shot-before",
            pattern: "before",
            title: "Filmează BEFORE-ul",
            instructions: [
              "Așază clienta cu fața spre telefon",
              "Încadrează de la piept în sus, cu tot părul vizibil",
              "Sprijină telefonul vertical și nu-l mișca",
              "Cere-i clientei să stea serioasă o secundă",
            ],
            mustShow: ["Tot părul", "Expresia clientei", "Aspectul „înainte”"],
            overlayText: "Nu o să crezi transformarea asta.",
            recordingDuration: 4,
            finalUsageDuration: 2,
          },
        ],
      },
      {
        id: "sec-process",
        title: "Transformarea",
        shots: [
          {
            id: "shot-process",
            pattern: "process",
            title: "Filmează transformarea",
            handsBusy: true,
            instructions: [
              "Sprijină telefonul aproape de zona de lucru — sau roagă o colegă să-l țină",
              "Verifică să se vadă bine mâinile și părul",
              "Lucrează normal până se oprește filmarea",
            ],
            mustShow: ["Procesul", "Mișcarea părului", "Detalii lucioase"],
            overlayText: "Wait for the reveal…",
            recordingDuration: 5,
            finalUsageDuration: 2,
          },
        ],
      },
      {
        id: "sec-reveal",
        title: "Marele reveal",
        shots: [
          {
            id: "shot-suspense",
            pattern: "suspense",
            title: "Creează suspans",
            instructions: [
              "Filmează clienta din spate, fără să-i arăți fața",
              "Ține telefonul stabil în mână",
              "Cere-i să întoarcă puțin capul",
            ],
            mustShow: ["Părul final", "Mișcarea lui", "Doar puțin din transformare"],
            overlayText: "Wait for the reveal…",
            recordingDuration: 4,
            finalUsageDuration: 2,
          },
          {
            id: "shot-reveal",
            pattern: "reveal",
            title: "Filmează reveal-ul",
            instructions: [
              "Cere-i clientei să se întoarce încet spre telefon",
              "La final, cere-i un hair flip ușor",
              "Ține telefonul stabil, în lumină bună",
            ],
            mustShow: ["Culoarea completă", "Luciul", "Volumul", "Expresia clientei"],
            overlayText: "Luxury hair energy.",
            recordingDuration: 6,
            finalUsageDuration: 4,
          },
          {
            id: "shot-confidence",
            pattern: "confidence",
            title: "Filmează energia finală",
            instructions: [
              "Cere-i clientei să zâmbească discret",
              "Cere-i să-și atingă ușor părul",
              "Cere-i să facă doi pași spre telefon",
              "Ține telefonul stabil și filmează natural",
            ],
            mustShow: ["Încrederea", "Transformarea", "Energia feminină"],
            overlayText: "Luxury hair energy.",
            recordingDuration: 5,
            finalUsageDuration: 3,
          },
        ],
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────
 * LOOKUP HELPERS
 * ──────────────────────────────────────────────────────────────────── */

export const getCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id);

export const getSubcategory = (id: string) =>
  SUBCATEGORIES.find((s) => s.id === id);

export const getSubcategoriesForCategory = (categoryId: string) =>
  SUBCATEGORIES.filter((s) => s.categoryId === categoryId);

export const getTemplate = (id: string) =>
  REEL_TEMPLATES.find((t) => t.id === id);

export const getTemplatesForSubcategory = (subcategoryId: string) =>
  REEL_TEMPLATES.filter((t) => t.subcategoryId === subcategoryId);

export const DEFAULT_TEMPLATE_ID = REEL_TEMPLATES[0].id;