import { get, set, del, keys } from "idb-keyval";

export type StoredClip = {
  scenarioId: string;
  sceneIdx: number;
  blob: Blob;
  mimeType: string;
  duration: number; // seconds
  createdAt: number;
};

const k = (scenarioId: string, sceneIdx: number) =>
  `clip:${scenarioId}:${sceneIdx}`;

export async function saveClip(c: StoredClip): Promise<void> {
  await set(k(c.scenarioId, c.sceneIdx), c);
  // Best-effort persistence request (so the browser doesn't evict our data).
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    // ignore
  }
}

export async function getClip(
  scenarioId: string,
  sceneIdx: number,
): Promise<StoredClip | undefined> {
  return (await get(k(scenarioId, sceneIdx))) as StoredClip | undefined;
}

export async function listClips(scenarioId: string): Promise<StoredClip[]> {
  const allKeys = await keys();
  const prefix = `clip:${scenarioId}:`;
  const matching = allKeys.filter(
    (key) => typeof key === "string" && key.startsWith(prefix),
  );
  const clips = await Promise.all(
    matching.map((key) => get(key) as Promise<StoredClip | undefined>),
  );
  return clips
    .filter((c): c is StoredClip => !!c)
    .sort((a, b) => a.sceneIdx - b.sceneIdx);
}

export async function clearScenario(scenarioId: string): Promise<void> {
  const allKeys = await keys();
  const prefix = `clip:${scenarioId}:`;
  await Promise.all(
    allKeys
      .filter((key) => typeof key === "string" && key.startsWith(prefix))
      .map((key) => del(key)),
  );
}

export async function getStorageEstimate(): Promise<{
  usageMB: number;
  quotaMB: number;
} | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const e = await navigator.storage.estimate();
    return {
      usageMB: Math.round(((e.usage ?? 0) / 1024 / 1024) * 10) / 10,
      quotaMB: Math.round((e.quota ?? 0) / 1024 / 1024),
    };
  } catch {
    return null;
  }
}
