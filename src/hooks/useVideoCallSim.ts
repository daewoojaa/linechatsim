"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbSetImage } from "@/lib/idbStore";

/**
 * Backs the video-call simulator (room 4)'s main frame: a looping MP4
 * standing in for "the other person", picked via the "Activities" button
 * — same one-file-picker pattern as ChatSimulator's per-slot image
 * uploads. The picture-in-picture camera preview is a separate concern,
 * see useFrontCamera.
 */
export function useVideoCallSim(roomId: string) {
  const [clipSrc, setClipSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- hydrate the saved clip from IndexedDB ----
  useEffect(() => {
    let cancelled = false;
    idbGetImage(`${roomId}:clip`).then((blob) => {
      if (cancelled || !blob) return;
      setClipSrc(URL.createObjectURL(blob));
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const requestPickClip = useCallback(() => {
    const el = fileInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleClipFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await idbSetImage(`${roomId}:clip`, file);
      setClipSrc(URL.createObjectURL(file));
    },
    [roomId]
  );

  return {
    clipSrc,
    fileInputRef,
    requestPickClip,
    handleClipFileChange,
  };
}
