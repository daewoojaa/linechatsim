"use client";

import { useCallback, useEffect, useState } from "react";
import { idbDeleteImage, idbGetImage, idbSetImage } from "@/lib/idbStore";

/**
 * Backs the "จัดการรูปภาพ" (manage images) page for a MultiImageChatSimulator
 * room — reads/writes the same `${roomId}:image:${i}` IndexedDB keys that
 * hook uses, so uploading or clearing a slot here shows up immediately the
 * next time the chat room itself is opened (each page hydrates fresh from
 * IndexedDB on mount; there's no other state to keep in sync).
 */
export function useManageImages(roomId: string, slotCount: number, defaults: (string | null)[] = []) {
  const [images, setImages] = useState<(string | null)[]>(() =>
    Array.from({ length: slotCount }, (_, i) => defaults[i] ?? null)
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const blobs = await Promise.all(
        Array.from({ length: slotCount }, (_, i) => idbGetImage(`${roomId}:image:${i}`))
      );
      if (cancelled) return;
      setImages(blobs.map((blob, i) => (blob ? URL.createObjectURL(blob) : (defaults[i] ?? null))));
    })();

    return () => {
      cancelled = true;
    };
    // defaults is expected to be a stable/constant array from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, slotCount]);

  const upload = useCallback(
    async (index: number, file: File) => {
      const url = URL.createObjectURL(file);
      await idbSetImage(`${roomId}:image:${index}`, file);
      setImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
    },
    [roomId]
  );

  const clear = useCallback(
    async (index: number) => {
      await idbDeleteImage(`${roomId}:image:${index}`);
      setImages((prev) => {
        const next = [...prev];
        next[index] = defaults[index] ?? null;
        return next;
      });
    },
    [roomId, defaults]
  );

  return { images, upload, clear };
}
