// "-v2": the row defaults were rewritten, so edits saved against the old
// placeholder rows are deliberately left behind rather than shadowing them.
const DEFAULT_KEY = "linechatsim-chatlist-overrides-v2";

export type RoomOverride = { name?: string; message?: string; time?: string; unread?: string };
export type RoomOverrides = Record<string, RoomOverride>;

/** `key` picks which list's saved edits to use (each chat-list page has its own). */
export function loadRoomOverrides(key: string = DEFAULT_KEY): RoomOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RoomOverrides) : {};
  } catch {
    return {};
  }
}

/**
 * One-time clean-up after a default changed: forgets the saved `field` of the
 * given rooms (once per `version`), so the new default shows instead of an
 * older edit. Everything else that was saved stays.
 */
export function dropSavedFields(
  key: string,
  version: number,
  drops: { id: string; field: keyof RoomOverride }[],
) {
  if (typeof window === "undefined") return;
  const marker = `${key}-migrated`;
  try {
    if ((parseInt(window.localStorage.getItem(marker) ?? "0", 10) || 0) >= version) return;
    const all = loadRoomOverrides(key);
    drops.forEach(({ id, field }) => {
      if (all[id]) delete all[id][field];
    });
    window.localStorage.setItem(key, JSON.stringify(all));
    window.localStorage.setItem(marker, String(version));
  } catch {
    // Best-effort, like the rest of the persistence.
  }
}

export function saveRoomOverride(id: string, override: RoomOverride, key: string = DEFAULT_KEY) {
  if (typeof window === "undefined") return;
  try {
    const all = loadRoomOverrides(key);
    all[id] = { ...all[id], ...override };
    window.localStorage.setItem(key, JSON.stringify(all));
  } catch {
    // Persistence is best-effort; the edit just won't survive a reload.
  }
}
