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

// The five comments that always loop. More are added one at a time from the
// "ข้อความ" editor (comment 6, 7, ...) and kept in IndexedDB.
const FIXED_COMMENTS: LiveComment[] = [
  { name: "โกโก้", text: "🔥🔥🔥" },
  { name: "peekprae_2003", text: "ม่วนแท้🤣🥰" },
  { name: "จิน จิน", text: "วงเล่นที่ไหนคะ" },
  { name: "บาสคนมักม่วน", text: "ขอชื่อเพลงหน่อยครับ" },
  { name: "K.", text: "พริ้วคัก" },
];
export const FIXED_COMMENT_COUNT = FIXED_COMMENTS.length;

const META_KEY = "room5:live";
const AVATAR_KEY = "room5:liveavatar";
const VIDEO_KEY = "room5:livevideo";

type Saved = {
  info?: Partial<ClipInfo>;
  /** Comments added by the operator (6th onwards). */
  extra?: LiveComment[];
  /** Older saves: five placeholder-or-edited slots standing in for 6-10. */
  editable?: Partial<LiveComment>[];
};

/** The 6-10 placeholders of the previous design ("เม้น 6: แตะ ... แก้ไข"). */
function isLegacyPlaceholder(c: Partial<LiveComment>) {
  return /^เม้น \d+$/.test(c.name ?? "") && (c.text ?? "").includes("เพื่อแก้ไข");
}

/**
 * The LIVE clip of room 5 (the top-left LIVE badge): one extra clip outside
 * the swipe loop, with its own details, account picture, video and floating
 * comments. Info + added comments live in IndexedDB as one meta record; the
 * video and account picture are blobs. Defaults: TT-demo3.mp4 and the supplied
 * profile picture, replaceable from the app.
 */
export function useLiveClip() {
  const [info, setInfo] = useState<ClipInfo>(DEFAULT_INFO);
  const [extra, setExtra] = useState<LiveComment[]>([]);
  const [avatar, setAvatar] = useState<string>(DEFAULT_LIVE_AVATAR);
  const [videoSrc, setVideoSrc] = useState<string>(DEFAULT_LIVE_VIDEO);
  const infoRef = useRef(info);
  const extraRef = useRef(extra);
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
        // New saves keep `extra`; an older save contributes the slots that were
        // actually edited (placeholders are dropped).
        const restored: LiveComment[] = Array.isArray(saved?.extra)
          ? saved.extra
          : (saved?.editable ?? [])
              .filter((c) => !isLegacyPlaceholder(c) && ((c.name ?? "") !== "" || (c.text ?? "") !== ""))
              .map((c) => ({ name: c.name ?? "", text: c.text ?? "" }));
        if (restored.length > 0) {
          extraRef.current = restored;
          setExtra(restored);
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
    idbSetMeta(META_KEY, { info: infoRef.current, extra: extraRef.current } satisfies Saved);
  }, []);

  const setField = useCallback(
    (field: keyof ClipInfo, value: string) => {
      infoRef.current = { ...infoRef.current, [field]: value };
      setInfo(infoRef.current);
      persist();
    },
    [persist]
  );

  /** Adds one comment after the existing ones (6th, 7th, ...). */
  const addComment = useCallback(
    (comment: LiveComment) => {
      extraRef.current = [...extraRef.current, comment];
      setExtra(extraRef.current);
      persist();
    },
    [persist]
  );

  /** Removes an added comment (index counts from the 6th comment). */
  const removeComment = useCallback(
    (index: number) => {
      extraRef.current = extraRef.current.filter((_, i) => i !== index);
      setExtra(extraRef.current);
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

  const comments: LiveComment[] = [...FIXED_COMMENTS, ...extra];

  return {
    info,
    setField,
    comments,
    addedComments: extra,
    addComment,
    removeComment,
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
