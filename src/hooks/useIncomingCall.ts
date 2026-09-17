"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";

const DEFAULT_CALLER_NAME = "BBY";

/**
 * Backs the incoming-call alert (room 4's ringing screen) — the caller's
 * profile photo and name, tap-to-edit like every other room-name field in
 * this app, persisted so the last one set is what shows next time.
 */
export function useIncomingCall(roomId: string) {
  const [callerName, setCallerName] = useState(DEFAULT_CALLER_NAME);
  const [editingName, setEditingName] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([idbGetMeta<string>(`${roomId}:callerName`), idbGetImage(`${roomId}:callerPhoto`)]).then(
      ([name, photoBlob]) => {
        if (cancelled) return;
        if (name) setCallerName(name);
        if (photoBlob) setPhotoSrc(URL.createObjectURL(photoBlob));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const startEditName = useCallback(() => setEditingName(true), []);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const commitName = useCallback(() => {
    setEditingName(false);
    idbSetMeta(`${roomId}:callerName`, callerName);
  }, [roomId, callerName]);

  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName();
      }
    },
    [commitName]
  );

  const requestPickPhoto = useCallback(() => {
    const el = photoInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await idbSetImage(`${roomId}:callerPhoto`, file);
      setPhotoSrc(URL.createObjectURL(file));
    },
    [roomId]
  );

  return {
    callerName,
    setCallerName,
    editingName,
    startEditName,
    stopEditName: commitName,
    onNameKeyDown,
    nameInputRef,
    photoSrc,
    requestPickPhoto,
    photoInputRef,
    handlePhotoChange,
  };
}
