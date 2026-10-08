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
