"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbSetImage } from "@/lib/idbStore";

export type SoundSlot = { url: string; kind: "image" | "video" };

export const SOUND_SLOT_COUNT = 9;

const slotKey = (i: number) => `room5:sound:${i}`;

function toSlot(blob: Blob): SoundSlot {
  return { url: URL.createObjectURL(blob), kind: blob.type.startsWith("video/") ? "video" : "image" };
}

/**
 * The nine tiles of room 5's sound page: each holds one picture or video
 * picked from the device (the blob is kept in IndexedDB, so it is still
 * there next time). A File keeps its MIME type through IndexedDB, which is
 * how a reloaded tile knows whether to render an <img> or a <video>.
 */
export function useSoundGrid() {
  const [slots, setSlots] = useState<(SoundSlot | null)[]>(() => Array.from({ length: SOUND_SLOT_COUNT }, () => null));
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(Array.from({ length: SOUND_SLOT_COUNT }, (_, i) => idbGetImage(slotKey(i)))).then((blobs) => {
      if (cancelled) return;
      setSlots(blobs.map((b) => (b ? toSlot(b) : null)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pick = useCallback((index: number) => {
    pendingRef.current = index;
    const el = inputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const index = pendingRef.current;
    await idbSetImage(slotKey(index), file);
    const slot = toSlot(file);
    setSlots((prev) => prev.map((s, i) => (i === index ? slot : s)));
  }, []);

  return { slots, pick, inputRef, handleChange };
}
