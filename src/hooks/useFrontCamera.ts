"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Opens the device's own live front camera as soon as the calling
 * component mounts — shared by the incoming-call alert's full-screen
 * background and the video-call simulator's picture-in-picture box, so
 * both show the same "you, live" preview a real call would.
 */
export function useFrontCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Every setState call here happens inside a promise callback, never
  // synchronously in the calling frame, so this stays safe to invoke
  // directly from the mount effect below.
  const request = useCallback(() => {
    const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    const p = getUserMedia
      ? getUserMedia({ video: { facingMode: "user" }, audio: false })
      : Promise.reject(new Error("getUserMedia unsupported"));

    return p.then(
      (s) => {
        streamRef.current = s;
        setError(false);
        setStream(s);
      },
      () => setError(true)
    );
  }, []);

  useEffect(() => {
    request();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [request]);

  return { stream, error, retry: request };
}
