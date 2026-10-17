"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbSetImage } from "@/lib/idbStore";

/**
 * Backs the video-call simulator (room 4)'s main frame: a looping video clip
 * or a still picture standing in for "the other person", picked via the
 * "Activities" button
 * — same one-file-picker pattern as ChatSimulator's per-slot image
 * uploads. The picture-in-picture camera preview is a separate concern,
 * see useFrontCamera. exitImageSrc is the "app closed" still shown full-
 * screen when the call ends — set from the incoming-call alert screen
 * (see IncomingCallAlert), just read here.
 */
export function useVideoCallSim(roomId: string) {
  const [clipSrc, setClipSrc] = useState<string | null>(null);
  /** What the picked file is: a clip plays, a picture just fills the frame. */
  const [clipIsImage, setClipIsImage] = useState(false);
  const [exitImageSrc, setExitImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- hydrate the saved clip + "app closed" exit image from IndexedDB ----
  useEffect(() => {
    let cancelled = false;
    Promise.all([idbGetImage(`${roomId}:clip`), idbGetImage(`${roomId}:exitImage`)]).then(
      ([clipBlob, exitBlob]) => {
        if (cancelled) return;
        if (clipBlob) {
          setClipSrc(URL.createObjectURL(clipBlob));
          setClipIsImage(clipBlob.type.startsWith("image/"));
        }
        if (exitBlob) setExitImageSrc(URL.createObjectURL(exitBlob));
      }
    );
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
      setClipIsImage(file.type.startsWith("image/"));
    },
    [roomId]
  );

  return {
    clipSrc,
    clipIsImage,
    exitImageSrc,
    fileInputRef,
    requestPickClip,
    handleClipFileChange,
  };
}
