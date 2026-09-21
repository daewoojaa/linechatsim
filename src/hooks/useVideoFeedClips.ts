"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";

export type ClipField =
  | "name"
  | "caption"
  | "tags"
  | "song"
  | "likes"
  | "comments"
  | "shares"
  | "saves";

export type ClipInfo = Record<ClipField, string>;

/** The built-in clips; more can be added at run time. */
export const DEFAULT_CLIP_COUNT = 3;

const DEFAULT_CLIPS: ClipInfo[] = [
  {
    name: "เรื่องเล่าสตอรี่",
    caption: "“หน้ากากผี”",
    tags: "#หนังสั้น #เอไอ #jintok #ละครสั้น",
    song: "เสียงต้นฉบับ - เรื่องเล่าสตอรี่",
    likes: "39.2k",
    comments: "313",
    shares: "4,579",
    saves: "398",
  },
  {
    name: "ม่วนเฟรม",
    caption: "กะหยุดคือกัน",
    tags: "#คลิปai #ละครสั้น #หนังไทย",
    song: "เสียงต้นฉบับ - ม่วนเฟรม",
    likes: "19.4k",
    comments: "145",
    shares: "1,975",
    saves: "1,441",
  },
  {
    name: "จินซีรี่ย์",
    caption: "EP.1 เอ้ายาย!",
    tags: "#ละครสั้น",
    song: "เสียงต้นฉบับ - จินซีรี่ย์",
    likes: "5,699",
    comments: "312",
    shares: "1,523",
    saves: "290",
  },
];

/** Older saves kept the hashtags inside the caption; split them back out. */
function mergeSaved(base: ClipInfo, saved: Partial<ClipInfo> | undefined): ClipInfo {
  const merged = { ...base, ...(saved ?? {}) };
  if (saved && saved.tags === undefined && saved.caption) {
    const at = saved.caption.indexOf("#");
    if (at >= 0) {
      merged.caption = saved.caption.slice(0, at).trim();
      merged.tags = saved.caption.slice(at).trim();
    } else {
      merged.tags = "";
    }
  }
  return merged;
}

const DEFAULT_AVATARS = ["/room5-avatar1.jpg", "/room5-avatar2.webp", "/room5-avatar3.webp"];
const DEFAULT_VIDEOS = ["/videos/jintok-1.mp4", "/videos/jintok-2.mp4", "/videos/jintok-3.mp4"];

export const EMPTY_CLIP: ClipInfo = {
  name: "",
  caption: "",
  tags: "",
  song: "",
  likes: "",
  comments: "",
  shares: "",
  saves: "",
};

const META_KEY = "room5:clips2";
const avatarKey = (clip: number) => `room5:avatar${clip}`;
const videoKey = (clip: number) => `room5:video${clip}`;

/**
 * Clip list + per-clip editable overlay data for the TikTok feed (room 5).
 * The first three clips are built in; clips added with the "+" button are
 * appended and kept in IndexedDB (info as one meta record, the video and
 * each account picture as blobs). A search-button upload can also replace
 * any clip's video. The rotating record disc reuses the account picture.
 */
export function useVideoFeedClips() {
  const [clips, setClips] = useState<ClipInfo[]>(() => DEFAULT_CLIPS.map((c) => ({ ...c })));
  const [avatars, setAvatars] = useState<(string | null)[]>(DEFAULT_AVATARS);
  const [videos, setVideos] = useState<(string | null)[]>(() => DEFAULT_VIDEOS.map(() => null));
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarClip = useRef(0);
  const pendingVideoClip = useRef(0);
  const clipsRef = useRef(clips);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await idbGetMeta<Partial<ClipInfo>[]>(META_KEY);
      const count = Math.max(DEFAULT_CLIP_COUNT, Array.isArray(saved) ? saved.length : 0);
      const indexes = Array.from({ length: count }, (_, i) => i);
      const [avatarBlobs, videoBlobs] = await Promise.all([
        Promise.all(indexes.map((i) => idbGetImage(avatarKey(i)))),
        Promise.all(indexes.map((i) => idbGetImage(videoKey(i)))),
      ]);
      if (cancelled) return;
      const merged = indexes.map((i) => mergeSaved(DEFAULT_CLIPS[i] ?? EMPTY_CLIP, Array.isArray(saved) ? saved[i] : undefined));
      clipsRef.current = merged;
      setClips(merged);
      setAvatars(indexes.map((i) => (avatarBlobs[i] ? URL.createObjectURL(avatarBlobs[i]) : (DEFAULT_AVATARS[i] ?? null))));
      setVideos(indexes.map((i) => (videoBlobs[i] ? URL.createObjectURL(videoBlobs[i]) : null)));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** What each slide actually plays: an uploaded video, else the built-in one. */
  const videoSrcs = videos.map((v, i) => v ?? DEFAULT_VIDEOS[i] ?? "");

  const setField = useCallback((clip: number, field: ClipField, value: string) => {
    const next = clipsRef.current.map((c, i) => (i === clip ? { ...c, [field]: value } : c));
    clipsRef.current = next;
    setClips(next);
    idbSetMeta(META_KEY, next);
  }, []);

  /** Appends a new clip (video file + the info typed into the input page)
   *  and resolves to its index. */
  const addClip = useCallback(async (file: File, info: ClipInfo) => {
    const index = clipsRef.current.length;
    await idbSetImage(videoKey(index), file);
    const next = [...clipsRef.current, info];
    clipsRef.current = next;
    idbSetMeta(META_KEY, next);
    const url = URL.createObjectURL(file);
    setClips(next);
    setAvatars((prev) => [...prev, null]);
    setVideos((prev) => [...prev, url]);
    return index;
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

  return {
    clips,
    avatars,
    videoSrcs,
    addClip,
    requestPickVideo,
    videoInputRef,
    handleVideoChange,
    setField,
    requestPickAvatar,
    avatarInputRef,
    handleAvatarChange,
  };
}
