"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";

export type ClipField =
  | "name"
  | "caption"
  | "song"
  | "likes"
  | "comments"
  | "shares"
  | "saves";

export type ClipInfo = Record<ClipField, string>;

export const CLIP_COUNT = 3;

const DEFAULT_CLIPS: ClipInfo[] = [
  {
    name: "เรื่องเล่าสตอรี่",
    caption: "“หน้ากากผี” #หนังสั้น #เอไอ #jintok #ละครสั้น",
    song: "เรื่องเล่าสตอรี่ - ผีหน้ากาก",
    likes: "39.2k",
    comments: "313",
    shares: "4,579",
    saves: "398",
  },
  {
    name: "ม่วนเฟรม",
    caption: "กะหยุดคือกัน #คลิปai #ละครสั้น #หนังไทย",
    song: "ม่วนเฟรม - รถมอไซ",
    likes: "19.4k",
    comments: "145",
    shares: "1,975",
    saves: "1,441",
  },
  {
    name: "จินซีรี่ย์",
    caption: "EP.1 เอ้ายาย!",
    song: "จินซีรี่ย์ - ยายยยยยยย",
    likes: "5,699",
    comments: "312",
    shares: "1,523",
    saves: "290",
  },
];

const META_KEY = "room5:clips2";
const avatarKey = (clip: number) => `room5:avatar${clip}`;
const videoKey = (clip: number) => `room5:video${clip}`;

/**
 * Per-clip editable overlay data for the TikTok feed (room 5): account name,
 * caption, hashtags, song and the four counters live in IndexedDB as one
 * meta record, and each clip's account picture is stored as an image blob.
 * The rotating record disc reuses the same picture as the account avatar.
 */
export function useVideoFeedClips() {
  const [clips, setClips] = useState<ClipInfo[]>(() => DEFAULT_CLIPS.map((c) => ({ ...c })));
  const [avatars, setAvatars] = useState<(string | null)[]>(() => Array.from({ length: CLIP_COUNT }, () => null));
  const [videos, setVideos] = useState<(string | null)[]>(() => Array.from({ length: CLIP_COUNT }, () => null));
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarClip = useRef(0);
  const pendingVideoClip = useRef(0);
  const clipsRef = useRef(clips);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      idbGetMeta<Partial<ClipInfo>[]>(META_KEY),
      ...Array.from({ length: CLIP_COUNT }, (_, i) => idbGetImage(avatarKey(i))),
      ...Array.from({ length: CLIP_COUNT }, (_, i) => idbGetImage(videoKey(i))),
    ]).then(([saved, ...blobs]) => {
      if (cancelled) return;
      if (Array.isArray(saved)) {
        const merged = Array.from({ length: CLIP_COUNT }, (_, i) => ({ ...DEFAULT_CLIPS[i], ...(saved[i] ?? {}) }));
        clipsRef.current = merged;
        setClips(merged);
      }
      const urls = blobs.map((b) => (b ? URL.createObjectURL(b) : null));
      setAvatars(urls.slice(0, CLIP_COUNT));
      setVideos(urls.slice(CLIP_COUNT));
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

  const requestPickVideo = useCallback((clip: number) => {
    pendingVideoClip.current = clip;
    const el = videoInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleVideoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const clip = pendingVideoClip.current;
    await idbSetImage(videoKey(clip), file);
    const url = URL.createObjectURL(file);
    setVideos((prev) => prev.map((v, i) => (i === clip ? url : v)));
  }, []);

  return { clips, avatars, videos, requestPickVideo, videoInputRef, handleVideoChange, setField, requestPickAvatar, avatarInputRef, handleAvatarChange };
}
