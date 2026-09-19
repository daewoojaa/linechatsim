"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbAddStickers, idbGetAllStickers, idbGetImage, idbGetMeta, idbSetMeta } from "@/lib/idbStore";
import type { Mode, Sticker } from "@/lib/types";

const DEFAULT_BACKGROUND = "/default-bg2.png";
// Same placeholder-default convention as useChatSim's DEFAULT_STICKER —
// negative id marks it as not-a-real-upload so it gets dropped the first
// time the user adds one of their own.
const DEFAULT_STICKER: Sticker = { id: -1, url: "/default-stickers/1.png" };

export type MultiImageRoomConfig = {
  /** Namespaces every IndexedDB key for this room, so it never shares
   *  storage with the fixed-4-image ChatSimulator (room "tuang") or any
   *  other MultiImageChatSimulator instance. */
  roomId: string;
  defaultRoomName: string;
  /** Total number of chat-image slots this room supports (e.g. 14). */
  slotCount: number;
  /** Bundled defaults (public/ asset paths), index-aligned to slot number —
   *  shown until the user uploads their own into that slot, same "default
   *  until overridden" pattern as ChatSimulator's DEFAULT_CHAT_IMAGE_1. A
   *  sparse array is fine; only the slots you pass get a bundled default. */
  defaultImages?: string[];
  /** Auto-advances through one or more contiguous slot ranges on a timer
   *  instead of waiting for a tap, once each range is reached — e.g. images
   *  2-7 cycling on their own, then a manual tap into image 8 kicks off the
   *  next range. `from`/`to` are 0-indexed slots: advancing starts on
   *  reaching `from` and stops once `to` is reached (`to` is itself just
   *  the final destination, not a step that advances further — crossing
   *  into the next range needs a tap, even if it's adjacent). `delaysMs[i]`
   *  is how long slot `from + i` waits before moving on to the next one,
   *  cycling through the array if there are more steps than delays given.
   *  Ranges must not overlap. Define this as a stable module-level constant
   *  in the caller, not an inline array/object literal, so its identity
   *  doesn't change every render and retrigger the effect. */
  autoAdvance?: { from: number; to: number; delaysMs: number[] }[];
};

/**
 * Generalized version of useChatSim for a room that needs an arbitrary
 * number of sequential chat-image screenshots (up to slotCount) instead of
 * a fixed 4 with a scripted reveal order. Tapping the chat image or a
 * sticker just advances to the next slot that actually has an image in
 * it — images are uploaded/replaced from a separate "manage images" page
 * (see useManageImages), not from per-slot header icons like ChatSimulator.
 */
export function useMultiImageChatSim({
  roomId,
  defaultRoomName,
  slotCount,
  defaultImages,
  autoAdvance,
}: MultiImageRoomConfig) {
  const [hydrated, setHydrated] = useState(false);

  const [roomName, setRoomName] = useState(defaultRoomName);
  const [editingName, setEditingName] = useState(false);

  const [background, setBackground] = useState<string | null>(DEFAULT_BACKGROUND);
  const [images, setImages] = useState<(string | null)[]>(() => {
    const arr = new Array<string | null>(slotCount).fill(null);
    defaultImages?.forEach((src, i) => {
      if (src) arr[i] = src;
    });
    return arr;
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const [mode, setMode] = useState<Mode>("keyboard");
  const [text, setText] = useState("");

  const [stickers, setStickers] = useState<Sticker[]>([DEFAULT_STICKER]);

  const stickerInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  const tripleTapRef = useRef({ count: 0, timer: null as ReturnType<typeof setTimeout> | null });
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- initial hydration from IndexedDB ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const imageKeys = Array.from({ length: slotCount }, (_, i) => `${roomId}:image:${i}`);
      const [savedRoomName, savedIndex, bgBlob, stickerRows, ...imageBlobs] = await Promise.all([
        idbGetMeta<string>(`${roomId}:roomName`),
        idbGetMeta<number>(`${roomId}:activeIndex`),
        idbGetImage(`${roomId}:background`),
        idbGetAllStickers(roomId),
        ...imageKeys.map((key) => idbGetImage(key)),
      ]);
      if (cancelled) return;

      if (savedRoomName) setRoomName(savedRoomName);
      if (bgBlob) setBackground(URL.createObjectURL(bgBlob));
      if (stickerRows.length) {
        setStickers(stickerRows.map((row) => ({ id: row.id, url: URL.createObjectURL(row.blob) })));
      }
      setImages((prev) => {
        const next = [...prev];
        imageBlobs.forEach((blob, i) => {
          if (blob) next[i] = URL.createObjectURL(blob);
        });
        return next;
      });
      if (savedIndex !== undefined) setActiveIndex(savedIndex);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, slotCount]);

  // persist the active slot after hydration so a reload resumes on the same image
  useEffect(() => {
    if (!hydrated) return;
    idbSetMeta(`${roomId}:activeIndex`, activeIndex);
  }, [activeIndex, hydrated, roomId]);

  // Warms the browser's image cache for every known slot (bundled defaults
  // included) so switching to one — whether by tap or auto-advance — paints
  // instantly instead of flashing blank while it fetches over the network.
  useEffect(() => {
    images.forEach((src) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // ---- auto-advance through configured slot ranges, e.g. images 2-7 ----
  useEffect(() => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    const range = autoAdvance?.find((r) => activeIndex >= r.from && activeIndex < r.to);
    if (!range || !images[activeIndex + 1]) return;

    const delay = range.delaysMs[(activeIndex - range.from) % range.delaysMs.length] ?? 1500;
    autoAdvanceTimerRef.current = setTimeout(() => {
      setActiveIndex((current) => (current === activeIndex ? activeIndex + 1 : current));
    }, delay);

    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [activeIndex, images, autoAdvance]);

  const showFirst = useCallback(() => setActiveIndex(0), []);

  /** Jumps straight to a specific slot, regardless of whether it has an
   *  image uploaded yet — a direct shortcut, unlike advance()'s "skip
   *  forward to the next filled slot" search. */
  const jumpTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < slotCount) setActiveIndex(index);
    },
    [slotCount]
  );

  /** Tapping the chat image or a sticker: jump to the next slot down the
   *  line that actually has an image uploaded (skipping gaps), stopping
   *  at the last one if there's nothing further to reveal. */
  const advance = useCallback(() => {
    setActiveIndex((current) => {
      for (let i = current + 1; i < images.length; i++) {
        if (images[i]) return i;
      }
      return current;
    });
  }, [images]);

  const onChatImageTap = advance;
  const onStickerTap = advance;

  const requestAddStickers = useCallback(() => {
    const el = stickerInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleStickerFilesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      await idbAddStickers(roomId, files);
      const added = files.map((file, i) => ({ id: Date.now() + i, url: URL.createObjectURL(file) }));
      setStickers((prev) => prev.filter((s) => s.id >= 0).concat(added));
    },
    [roomId]
  );

  /** Triple-tap anywhere on the empty sticker-grid background (not a sticker cell) adds stickers. */
  const onPanelBackgroundTap = useCallback(() => {
    const t = tripleTapRef.current;
    t.count += 1;
    if (t.timer) clearTimeout(t.timer);
    if (t.count >= 3) {
      t.count = 0;
      requestAddStickers();
      return;
    }
    t.timer = setTimeout(() => {
      t.count = 0;
    }, 650);
  }, [requestAddStickers]);

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next = current === "keyboard" ? "sticker" : "keyboard";
      // Focus right after setState (not in a useEffect) so this runs inside
      // the same click/tap gesture — switching back to keyboard mode
      // re-opens the OS keyboard immediately instead of requiring an extra tap.
      if (next === "keyboard") textInputRef.current?.focus();
      return next;
    });
  }, []);

  const startEditName = useCallback(() => setEditingName(true), []);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const commitName = useCallback(() => {
    setEditingName(false);
    idbSetMeta(`${roomId}:roomName`, roomName);
  }, [roomId, roomName]);

  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName();
      }
    },
    [commitName]
  );

  const blockEnter = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") e.preventDefault();
  }, []);

  return {
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName: commitName,
    onNameKeyDown,
    nameInputRef,

    background,
    displayedChatSrc: images[activeIndex] ?? null,
    showFirst,
    jumpTo,

    mode,
    toggleMode,

    text,
    setText,
    blockEnter,
    textInputRef,

    stickers,
    onStickerTap,
    onChatImageTap,
    onPanelBackgroundTap,

    stickerInputRef,
    handleStickerFilesChange,
  };
}
