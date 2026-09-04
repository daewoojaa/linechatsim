/**
 * Tiny IndexedDB-backed store for the chat simulator's staged scene.
 *
 * The prototype persists everything as base64 data URLs in localStorage.
 * Images are kept here as Blobs in IndexedDB instead — localStorage's ~5MB
 * quota and synchronous base64 (de)serialization don't hold up once a user
 * has stacked a background + three chat screenshots + a sticker sheet.
 */

const DB_NAME = "chatsim-db";
const DB_VERSION = 1;

const META_STORE = "meta";
const IMAGES_STORE = "images";
const STICKERS_STORE = "stickers";

export type ImageKey = "background" | "chatImage1" | "chatImage2" | "chatImage3";

export type StickerRecord = { id: number; blob: Blob };

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB unavailable (server render)"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STICKERS_STORE)) {
        db.createObjectStore(STICKERS_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const req = run(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function idbGetMeta<T>(key: string): Promise<T | undefined> {
  try {
    const row = await tx<{ key: string; value: T } | undefined>(META_STORE, "readonly", (s) => s.get(key));
    return row?.value;
  } catch {
    return undefined;
  }
}

export async function idbSetMeta(key: string, value: unknown): Promise<void> {
  try {
    await tx(META_STORE, "readwrite", (s) => s.put({ key, value }));
  } catch {
    // Persistence is best-effort; the scene just won't survive a reload.
  }
}

export async function idbGetImage(key: ImageKey): Promise<Blob | undefined> {
  try {
    const row = await tx<{ key: string; blob: Blob } | undefined>(IMAGES_STORE, "readonly", (s) => s.get(key));
    return row?.blob;
  } catch {
    return undefined;
  }
}

export async function idbSetImage(key: ImageKey, blob: Blob): Promise<void> {
  try {
    await tx(IMAGES_STORE, "readwrite", (s) => s.put({ key, blob }));
  } catch {
    // ignore
  }
}

export async function idbGetAllStickers(): Promise<StickerRecord[]> {
  try {
    const rows = await tx<StickerRecord[]>(STICKERS_STORE, "readonly", (s) => s.getAll());
    return rows.sort((a, b) => a.id - b.id);
  } catch {
    return [];
  }
}

export async function idbAddStickers(blobs: Blob[]): Promise<void> {
  if (!blobs.length) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(STICKERS_STORE, "readwrite");
      const store = t.objectStore(STICKERS_STORE);
      blobs.forEach((blob) => store.add({ blob }));
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  } catch {
    // ignore
  }
}
