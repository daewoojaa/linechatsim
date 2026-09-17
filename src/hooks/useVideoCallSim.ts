"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbSetImage } from "@/lib/idbStore";

/**
 * Backs the video-call simulator (room 4): a looping MP4 "the other
 * person" clip fills the main frame — picked via the "Activities" button,
 * same one-file-picker pattern as ChatSimulator's per-slot image uploads —
 * while a picture-in-picture box opens the device's real front camera so
 * the actor can act alongside the clip live, the same way a real video
 * call would show your own preview.
 */
export function useVideoCallSim(roomId: string) {
  const [clipSrc, setClipSrc] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Every setState call here happens inside a promise callback, never
  // synchronously in the calling frame, so this stays safe to invoke
  // directly from the mount effect below.
  const requestCamera = useCallback(() => {
    const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    const request = getUserMedia
      ? getUserMedia({ video: { facingMode: "user" }, audio: false })
      : Promise.reject(new Error("getUserMedia unsupported"));

    return request.then(
      (stream) => {
        streamRef.current = stream;
        setCameraError(false);
        setCameraStream(stream);
      },
      () => setCameraError(true)
    );
  }, []);

  // ---- open the front camera as soon as the room mounts ----
  useEffect(() => {
    requestCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [requestCamera]);

  useEffect(() => {
    if (pipVideoRef.current) pipVideoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

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
    cameraStream,
    cameraError,
    pipVideoRef,
    fileInputRef,
    requestPickClip,
    handleClipFileChange,
    retryCamera: requestCamera,
  };
}
