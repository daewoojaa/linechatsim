"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraFacing = "user" | "environment";

/**
 * The device camera, front or back, opened as soon as the caller mounts and
 * re-opened whenever `facing` changes (the old tracks are stopped first so
 * the swap works on phones that only allow one camera at a time).
 */
export function useLiveCamera(facing: CameraFacing) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    const request = getUserMedia
      ? getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false })
      : Promise.reject(new Error("getUserMedia unsupported"));

    request.then(
      (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setError(false);
        setStream(s);
      },
      () => {
        if (!cancelled) {
          setStream(null);
          setError(true);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [facing, attempt]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    []
  );

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { stream, error, retry };
}
