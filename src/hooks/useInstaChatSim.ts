"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";

export type InstaMessage =
  | { id: string; side: "left"; kind: "image"; time: string }
  | { id: string; side: "left"; kind: "text"; text: string; time: string }
  | { id: string; side: "right"; kind: "text"; text: string; time: string };

const DEFAULT_NAME = "ดอกรักคนเดิม";
const DEFAULT_AVATAR = "/room3-avatar.png";
const DEFAULT_PHOTO = "/room3-photo.jpg";
const SECOND_LEFT_DELAY_MS = 3000;
const SECOND_LEFT_TEXT = "เมื่อกี้";

function nowLabel() {
  const d = new Date();
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Backs the Instagram-style chat (room 3). The conversation is a fixed
 * script that restarts on every visit: the other side's photo is already
 * there on entering (tap its arrow to put a picture in it — remembered for
 * next time); each thing the operator types goes out as a right-side
 * bubble; 3s after the operator's first message the other side replies
 * "เมื่อกี้"; anything typed after that just keeps sending on the right.
 * The other person's avatar and name persist (tap to change) and every
 * left-side avatar follows the header's.
 */
export function useInstaChatSim(roomId: string) {
  const [name, setName] = useState(DEFAULT_NAME);
  const [editingName, setEditingName] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(DEFAULT_AVATAR);
  const [feed, setFeed] = useState<InstaMessage[]>([]);
  const [hasText, setHasText] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(DEFAULT_PHOTO);

  const textInputRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sentCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      idbGetMeta<string>(`${roomId}:name`),
      idbGetImage(`${roomId}:avatar`),
      idbGetImage(`${roomId}:photo`),
    ]).then(([savedName, avatarBlob, photoBlob]) => {
      if (cancelled) return;
      if (savedName) setName(savedName);
      if (avatarBlob) setAvatarSrc(URL.createObjectURL(avatarBlob));
      if (photoBlob) setPhotoSrc(URL.createObjectURL(photoBlob));
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // Script step 1: the photo message is already there on entering (time
  // stamped client-side, so it can't be part of the server render).
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeed([{ id: "img", side: "left", kind: "image", time: nowLabel() }]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Keep the real keyboard up: focus on entering the room.
  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  const send = useCallback(() => {
    const el = textInputRef.current;
    const text = (el?.textContent ?? "").trim();
    if (!text) {
      el?.focus();
      return;
    }
    sentCountRef.current += 1;
    const isFirst = sentCountRef.current === 1;
    setFeed((prev) => [...prev, { id: `r-${Date.now()}`, side: "right", kind: "text", text, time: nowLabel() }]);
    if (isFirst) {
      setTimeout(() => {
        setFeed((prev) => [
          ...prev,
          { id: "reply", side: "left", kind: "text", text: SECOND_LEFT_TEXT, time: nowLabel() },
        ]);
      }, SECOND_LEFT_DELAY_MS);
    }
    if (el) {
      el.textContent = "";
      el.focus();
    }
    setHasText(false);
  }, []);

  const onInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    setHasText((e.currentTarget.textContent ?? "").trim().length > 0);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        send();
      }
    },
    [send]
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
      await idbSetImage(`${roomId}:photo`, file);
      setPhotoSrc(URL.createObjectURL(file));
      textInputRef.current?.focus();
    },
    [roomId]
  );

  const startEditName = useCallback(() => setEditingName(true), []);
  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);
  const commitName = useCallback(() => {
    setEditingName(false);
    idbSetMeta(`${roomId}:name`, name);
    textInputRef.current?.focus();
  }, [roomId, name]);
  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName();
      }
    },
    [commitName]
  );

  const requestPickAvatar = useCallback(() => {
    const el = avatarInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await idbSetImage(`${roomId}:avatar`, file);
      setAvatarSrc(URL.createObjectURL(file));
      textInputRef.current?.focus();
    },
    [roomId]
  );

  return {
    name,
    setName,
    editingName,
    startEditName,
    commitName,
    onNameKeyDown,
    nameInputRef,
    avatarSrc,
    requestPickAvatar,
    avatarInputRef,
    handleAvatarChange,
    photoSrc,
    requestPickPhoto,
    photoInputRef,
    handlePhotoChange,
    feed,
    hasText,
    textInputRef,
    onInput,
    onKeyDown,
    send,
  };
}
