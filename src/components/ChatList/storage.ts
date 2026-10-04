// "-v2": the row defaults were rewritten, so edits saved against the old
// placeholder rows are deliberately left behind rather than shadowing them.
const STORAGE_KEY = "linechatsim-chatlist-overrides-v2";

export type RoomOverride = { name?: string; message?: string; time?: string; unread?: string };
export type RoomOverrides = Record<string, RoomOverride>;

export function loadRoomOverrides(): RoomOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoomOverrides) : {};
  } catch {
    return {};
  }
}

export function saveRoomOverride(id: string, override: RoomOverride) {
  if (typeof window === "undefined") return;
  try {
    const all = loadRoomOverrides();
    all[id] = { ...all[id], ...override };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Persistence is best-effort; the edit just won't survive a reload.
  }
}
