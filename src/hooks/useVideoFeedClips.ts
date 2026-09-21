"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";

export type ClipField =
  | "name"
  | "caption"
  | "tag0"
  | "tag1"
  | "tag2"
  | "song"
  | "likes"
  | "comments"
  | "shares"
  | "saves";

export type ClipInfo = Record<ClipField, string>;

export const CLIP_COUNT = 3;

const DEFAULT_CLIP: ClipInfo = {
  name: "sleepyy.y",
  caption: "เตรียมของ ทริปหน้าแล้ววว ☂️",
  tag0: "กระเป๋า",
  tag1: "เดินทาง",
  tag2: "ไลฟ์สไตล์",
  song: "good days - trees and lucy",
  likes: "1,449",
  comments: "72",
  shares: "153",
  saves: "439",
};

const META_KEY = "room5:clips";
const avatarKey = (clip: number) => `room5:avatar${clip}`;

/**
 * Per-clip editable overlay data for the TikTok feed (room 5): account name,
 * caption, hashtags, song and the four counters live in IndexedDB as one
 * meta record, and each clip's account picture is stored as an image blob.
 * The rotating record disc reuses the same picture as the account avatar.
 */
export function useVideoFeedClips() {
  const [clips, setClips] = useState<ClipInfo[]>(() => Array.from({ length: CLIP_COUNT }, () => ({ ...DEFAULT_CLIP })));
  const [avatars, setAvatars] = useState<(string | null)[]>(() => Array.from({ length: CLIP_COUNT }, () => null));
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarClip = useRef(0);
  const clipsRef = useRef(clips);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      idbGetMeta<Partial<ClipInfo>[]>(META_KEY),
      ...Array.from({ length: CLIP_COUNT }, (_, i) => idbGetImage(avatarKey(i))),
    ]).then(([saved, ...blobs]) => {
      if (cancelled) return;
      if (Array.isArray(saved)) {
        const merged = Array.from({ length: CLIP_COUNT }, (_, i) => ({ ...DEFAULT_CLIP, ...(saved[i] ?? {}) }));
        clipsRef.current = merged;
        setClips(merged);
      }
      setAvatars(blobs.map((b) => (b ? URL.createObjectURL(b) : null)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = useCallback((clip: number, field: ClipField, value: string) => {
    const next = clipsRef.current.map((c, i) => (i === clip ? { ...c, [field]: value } : c));
    clipsRef.current = next;
    setClips(next);
    idbSetMeta(META_KEY, next);
  }, []);

  const requestPickAvatar = useCallback((clip: number) => {
    pendingAvatarClip.current = clip;
    const el = avatarInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const clip = pendingAvatarClip.current;
    await idbSetImage(avatarKey(clip), file);
    const url = URL.createObjectURL(file);
    setAvatars((prev) => prev.map((a, i) => (i === clip ? url : a)));
  }, []);

  return { clips, avatars, setField, requestPickAvatar, avatarInputRef, handleAvatarChange };
}
