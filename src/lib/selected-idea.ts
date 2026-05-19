import { DEFAULT_SCENARIO_ID, getScenarioById, type Scenario } from "@/data/scenarios";
import { getTemplate } from "@/data/catalog";
import { templateToScenario } from "@/data/template-adapter";

const KEY = "reelpilot:selectedIdeaId";

/**
 * The selected id can point at EITHER:
 *   - a new ReelTemplate (Shot-first architecture), or
 *   - a legacy Scenario (the original 200+ seeded ideas).
 *
 * `getSelectedScenario` resolves both into a Scenario so the existing
 * film / editing / edit flow keeps working unchanged.
 */

export function setSelectedIdeaId(id: string) {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    // ignore (SSR / blocked storage)
  }
}

export function getSelectedIdeaId(): string {
  try {
    return sessionStorage.getItem(KEY) ?? DEFAULT_SCENARIO_ID;
  } catch {
    return DEFAULT_SCENARIO_ID;
  }
}

export function getSelectedScenario(): Scenario {
  const id = getSelectedIdeaId();

  // New architecture first: is this a ReelTemplate id?
  const template = getTemplate(id);
  if (template) return templateToScenario(template);

  // Fall back to legacy scenarios.
  return getScenarioById(id) ?? getScenarioById(DEFAULT_SCENARIO_ID)!;
}
