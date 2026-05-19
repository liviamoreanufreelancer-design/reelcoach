/**
 * ════════════════════════════════════════════════════════════════════
 *  TEMPLATE → SCENARIO ADAPTER
 * ════════════════════════════════════════════════════════════════════
 *
 *  The new architecture is Shot-first (see shots.ts / catalog.ts). The
 *  existing flow — film, editing, edit, export — still speaks the older
 *  `Scenario` / `Scene` language.
 *
 *  Rather than rewrite the whole flow at once, this adapter projects a
 *  `ReelTemplate` down into a `Scenario`. New code reads ReelTemplate
 *  directly; legacy screens keep working unchanged. Zero regression.
 *
 *  This file is the ONE seam between old and new. When the legacy flow
 *  is eventually migrated to consume Shots directly, this file is the
 *  only thing that gets deleted.
 * ════════════════════════════════════════════════════════════════════
 */

import type { Scenario, Scene } from "./scenarios";
import {
  flattenShots,
  sectionForShotIndex,
  type ReelTemplate,
} from "./shots";

/** Project one ReelTemplate into a legacy Scenario the old flow can run. */
export function templateToScenario(t: ReelTemplate): Scenario {
  const shots = flattenShots(t);

  const scenes: Scene[] = shots.map((shot, flatIdx) => {
    const sec = sectionForShotIndex(t, flatIdx);
    const sectionLabel = sec
      ? `${sec.section.title} · ${sec.indexInSection + 1}/${sec.total}`
      : undefined;

    return {
      bg: t.cover,
      hook: shot.title,
      // The legacy Scene timer drives the in-app recording. Use the
      // shot's recording duration, NOT the final-usage duration.
      duration: shot.recordingDuration,
      what: shot.patternMeta.purpose,
      how: shot.instructions.join(" "),
      section: sectionLabel,
      // Pattern label drives the colored badge on the filming card.
      tag: shot.patternMeta.label,
      instructions: shot.instructions,
      mustShow: shot.mustShow,
      handsBusy: shot.handsBusy,
      patternId: shot.pattern,
    };
  });

  return {
    id: t.id,
    // Legacy `format` is unused by the filming flow itself; a stable
    // placeholder keeps old type checks happy.
    format: "transformation",
    professions: t.professions,
    title: t.title,
    hook: t.promise,
    description: t.promise,
    image: t.cover,
    keywords: [],
    scenes,
    source: "seed",
    difficulty: "easy",
    goal: t.promise,
  };
}