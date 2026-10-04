"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";
import type { ClipInfo } from "@/hooks/useVideoFeedClips";

export type LiveComment = { name: string; text: string };

export const DEFAULT_LIVE_VIDEO = "/videos/TT-demo3.mp4";
const DEFAULT_LIVE_AVATAR = "/room5-live-avatar.jpg";

const DEFAULT_INFO: ClipInfo = {
  name: "พีต้า ดาดาดา",
  caption: "ม่วนคักกก 🔥 ดงชน 3.1",
  tags: "#ดงชนรีมิกซ์3.1 #วงไข่มุกบารมีเศรษฐีพันล้าน #ดงชนChallenge #เพลงใหม่ #เพลงอีสาน",
  song: "ดงชน รีมิกซ์ 3.1 - วงไข่มุกบารมีเศรษฐีพันล้าน",
  likes: "4m",
  comments: "51.7k",
  shares: "199.7k",
  saves: "206.1k",
};

// Comments 1-5 are fixed; 6-10 are placeholders meant to be retyped (see
// the "ข้อความ" editor), so only those five are saved.
const FIXED_COMMENTS: LiveComment[] = [
  { name: "โกโก้", text: "🔥🔥🔥" },
  { name: "peekprae_2003", text: "ม่วนแท้🤣🥰" },
  { name: "จิน จิน", text: "วงเล่นที่ไหนคะ" },
  { name: "บาสคนมักม่วน", text: "ขอชื่อเพลงหน่อยครับ" },
  { name: "K.", text: "พริ้วคัก" },
];
export const EDITABLE_FROM = FIXED_COMMENTS.length; // index of "comment 6"
const DEFAULT_EDITABLE: LiveComment[] = [6, 7, 8, 9, 10].map((n) => ({
  name: `เม้น ${n}`,
  text: "แตะ \"ข้อความ\" เพื่อแก้ไข",
}));

const META_KEY = "room5:live";
const AVATAR_KEY = "room5:liveavatar";
const VIDEO_KEY = "room5:livevideo";

type Saved = { info?: Partial<ClipInfo>; editable?: Partial<LiveComment>[] };

/**
 * The LIVE clip of room 5 (the top-left LIVE badge): one extra clip outside
 * the swipe loop, with its own details, account picture, video and ten
 * floating comments. Info + comments 6-10 live in IndexedDB as one meta
 * record; the video and account picture are blobs. Defaults: TT-demo3.mp4
 * and the supplied profile picture, replaceable from the app.
 */
export function useLiveClip() {
  const [info, setInfo] = useState<ClipInfo>(DEFAULT_INFO);
  const [editable, setEditable] = useState<LiveComment[]>(DEFAULT_EDITABLE);
  const [avatar, setAvatar] = useState<string>(DEFAULT_LIVE_AVATAR);
  const [videoSrc, setVideoSrc] = useState<string>(DEFAULT_LIVE_VIDEO);
  const infoRef = useRef(info);
  const editableRef = useRef(editable);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([idbGetMeta<Saved>(META_KEY), idbGetImage(AVATAR_KEY), idbGetImage(VIDEO_KEY)]).then(
      ([saved, avatarBlob, videoBlob]) => {
        if (cancelled) return;
        if (saved?.info) {
          const merged = { ...DEFAULT_INFO, ...saved.info };
          infoRef.current = merged;
          setInfo(merged);
        }
        if (Array.isArray(saved?.editable)) {
          const merged = DEFAULT_EDITABLE.map((d, i) => ({ ...d, ...(saved.editable?.[i] ?? {}) }));
          editableRef.current = merged;
          setEditable(merged);
        }
        if (avatarBlob) setAvatar(URL.createObjectURL(avatarBlob));
        if (videoBlob) setVideoSrc(URL.createObjectURL(videoBlob));
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(() => {
    idbSetMeta(META_KEY, { info: infoRef.current, editable: editableRef.current } satisfies Saved);
  }, []);

  const setField = useCallback(
    (field: keyof ClipInfo, value: string) => {
      infoRef.current = { ...infoRef.current, [field]: value };
      setInfo(infoRef.current);
      persist();
    },
    [persist]
  );

  /** Edits comment `index` (0-based over all ten); only 6-10 are editable. */
  const setComment = useCallback(
    (index: number, patch: Partial<LiveComment>) => {
      const i = index - EDITABLE_FROM;
      if (i < 0 || i >= editableRef.current.length) return;
      editableRef.current = editableRef.current.map((c, j) => (j === i ? { ...c, ...patch } : c));
      setEditable(editableRef.current);
      persist();
    },
    [persist]
  );

  const requestPick = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (el) {
      el.value = "";
      el.click();
    }
  };
  const requestPickAvatar = useCallback(() => requestPick(avatarInputRef), []);
  const requestPickVideo = useCallback(() => requestPick(videoInputRef), []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await idbSetImage(AVATAR_KEY, file);
    setAvatar(URL.createObjectURL(file));
  }, []);

  const handleVideoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await idbSetImage(VIDEO_KEY, file);
    setVideoSrc(URL.createObjectURL(file));
  }, []);

  const comments: LiveComment[] = [...FIXED_COMMENTS, ...editable];

  return {
    info,
    setField,
    comments,
    setComment,
    avatar,
    videoSrc,
    requestPickAvatar,
    requestPickVideo,
    avatarInputRef,
    videoInputRef,
    handleAvatarChange,
    handleVideoChange,
  };
}
