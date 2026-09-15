const STORAGE_KEY = "linechatsim-chatlist-overrides";

export type RoomOverride = { name?: string; message?: string };
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
