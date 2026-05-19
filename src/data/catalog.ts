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
 *    3. each shot just picks a pattern from shots.ts and overrides text
 *
 *  Patterns carry all the boring defaults. A template stays readable.
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
    id: "before-after",
    categoryId: "transformation",
    label: "Before & After",
    blurb: "Metamorfoza clasică în 4 cadre.",
  },
  {
    id: "glow-up",
    categoryId: "transformation",
    label: "Glow Up",
    blurb: "Pas cu pas spre versiunea ei cea mai bună.",
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
 *
 * One fully built demo template, shot-first, end to end. It proves the
 * structure works through the whole flow. Copy it to add more.
 * ──────────────────────────────────────────────────────────────────── */

export const REEL_TEMPLATES: ReelTemplate[] = [
  {
    id: "before-after-classic",
    subcategoryId: "before-after",
    title: "Before & After clasic",
    promise: "Un reel de transformare în 4 cadre. Filmezi 34 de secunde, iese un clip de ~13.",
    cover: coverBeforeAfter,
    professions: ["par", "machiaj", "unghii", "gene", "sprancene"],
    sections: [
      {
        id: "sec-start",
        title: "Punctul de plecare",
        shots: [
          {
            id: "shot-before",
            pattern: "before",
            title: "Cadrul „înainte”",
            instructions: [
              "Așază clienta pe scaun, lumina pe față.",
              "Ține telefonul vertical, fix, la nivelul ochilor.",
              "Nu corecta nimic — arată exact cum a venit.",
            ],
            overlayText: "ÎNAINTE",
          },
        ],
      },
      {
        id: "sec-work",
        title: "Transformarea",
        shots: [
          {
            id: "shot-process",
            pattern: "process",
            title: "Mâinile la lucru",
            instructions: [
              "Filmează de aproape mâinile tale în timp ce lucrezi.",
              "Mișcări lente și sigure — nu te grăbi.",
              "Lasă camera fixă, lasă mișcarea ta să umple cadrul.",
            ],
            overlayText: "Magia se întâmplă",
          },
        ],
      },
      {
        id: "sec-result",
        title: "Rezultatul",
        shots: [
          {
            id: "shot-reveal",
            pattern: "reveal",
            title: "Cadrul „după”",
            instructions: [
              "Același unghi ca la cadrul „înainte”.",
              "Mișcă telefonul foarte încet spre clientă.",
              "Lasă rezultatul să respire — fără grabă.",
            ],
            overlayText: "DUPĂ",
          },
          {
            id: "shot-reaction",
            pattern: "reaction",
            title: "Reacția clientei",
            instructions: [
              "Întoarce clienta spre oglindă.",
              "Filmează-i fața, nu oglinda.",
              "Nu regiza nimic — prinde reacția reală.",
            ],
            overlayText: "Reacția ei spune tot",
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
