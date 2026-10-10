"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { idbGetImage, idbGetMeta, idbSetImage, idbSetMeta } from "@/lib/idbStore";

export type LiveMessage =
  | { id: string; kind: "text"; text: string; time: string; side?: "left" }
  | { id: string; kind: "missedCall"; time: string }
  | { id: string; kind: "voice"; seconds: number; time: string }
  | { id: string; kind: "image"; src: string; time: string; side?: "left" }
  | { id: string; kind: "dateLabel" };

const DAY_LABELS = ["วันนี้", "เมื่อวาน", "จ. 12 ก.ย."];

export const DEFAULT_BG = "#ffffff";

/** Where the voice-record panel is: closed (normal typing), the static
 *  "tap to record" prompt, live recording, or stopped-and-waiting. */
export type VoiceStage = "closed" | "prompt" | "recording" | "recorded";

const SCRIPT: LiveMessage[] = [
  { id: "s1", kind: "text", text: "แก่น", time: "19:38" },
  { id: "s2", kind: "text", text: "มึงอยู่ไหน", time: "19:38" },
  { id: "s3", kind: "text", text: "วันนี้มึงต้องมานะ", time: "19:41" },
  { id: "s4", kind: "missedCall", time: "19:47" },
  { id: "s5", kind: "text", text: "บักแก่น", time: "19:48" },
  { id: "s6", kind: "text", text: "คนเค้ารอมึงอยู่ทั้งวงเนี่ย", time: "19:48" },
];

type SentMessage =
  | { kind: "text"; text: string; time: string }
  | { kind: "voice"; seconds: number; time: string };

function nowLabel(suffix = "") {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}${suffix}`;
}

/**
 * Backs room 6: a simulated LINE conversation. Every bubble is on the
 * operator's side; the scripted lead-in is pre-filled and the operator adds
 * to it — typed text goes out as a bubble, and the voice-record panel sends
 * a voice bubble. The first thing sent is preceded by a "วันนี้" date label.
 */
export type LiveChatOptions = {
  /** The messages already in the chat on entering (default: room 6's lead-in). */
  script?: LiveMessage[];
  /** Appended to the clock time of messages sent live, e.g. " น." (default none). */
  timeSuffix?: string;
  /** Put the cursor in the input on entering, so the device keyboard is up
   *  straight away (room 8; room 6 leaves it off). */
  focusOnEnter?: boolean;
  /** Profile picture shown beside received (left-side) messages; tap it to
   *  pick another (kept per room). Omit for no avatar (room 6 has none). */
  defaultAvatar?: string;
  /** The script's pictures do not show on entering: only the rest of the
   *  script does, and the pictures arrive this many ms later. The header menu
   *  then restarts that sequence instead of stepping the date label (room 8). */
  delayedImageMs?: number;
};

export function useLiveChatSim(roomId: string, defaultRoomName: string, options: LiveChatOptions = {}) {
  const { script = SCRIPT, timeSuffix = "", focusOnEnter = false, defaultAvatar, delayedImageMs } = options;
  // With a delay, the pictures are held back from the opening feed.
  const openingFeed = useMemo(
    () => (delayedImageMs ? script.filter((m) => m.kind !== "image") : script),
    [script, delayedImageMs]
  );
  const [roomName, setRoomName] = useState(defaultRoomName);
  const [editingName, setEditingName] = useState(false);
  const [feed, setFeed] = useState<LiveMessage[]>(openingFeed);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasText, setHasText] = useState(false);
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("closed");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [bgColor, setBgColorState] = useState(DEFAULT_BG);
  const [avatar, setAvatar] = useState<string | null>(defaultAvatar ?? null);
  const [avatarCustom, setAvatarCustom] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [dayLabel, setDayLabel] = useState("วันนี้");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  // The "วันนี้" label goes in before the first thing sent, unless the opening
  // messages already start with one (room 8).
  const hasSentRef = useRef(script.some((m) => m.kind === "dateLabel"));
  const idRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      idbGetMeta<string>(`${roomId}:roomName`),
      idbGetMeta<string>(`${roomId}:bgColor`),
      idbGetImage(`${roomId}:avatar`),
    ]).then(([savedName, savedBg, avatarBlob]) => {
      if (cancelled) return;
      if (savedName) setRoomName(savedName);
      if (savedBg) setBgColorState(savedBg);
      if (avatarBlob) {
        setAvatar(URL.createObjectURL(avatarBlob));
        setAvatarCustom(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const setBgColor = useCallback(
    (color: string) => {
      setBgColorState(color);
      idbSetMeta(`${roomId}:bgColor`, color);
    },
    [roomId]
  );

  /** Brings the held-back pictures in after the delay, right after the opening messages. */
  const scheduleReveal = useCallback(() => {
    if (!delayedImageMs) return;
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => {
      const pictures = script.filter((m) => m.kind === "image");
      setFeed((prev) => [...prev.slice(0, openingFeed.length), ...pictures, ...prev.slice(openingFeed.length)]);
    }, delayedImageMs);
  }, [delayedImageMs, script, openingFeed.length]);

  useEffect(() => {
    scheduleReveal();
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [scheduleReveal]);

  /** The header menu steps the date label through DAY_LABELS - or, when the
   *  pictures are delayed, starts the chat over: messages only, pictures again later. */
  const toggleDayLabel = useCallback(() => {
    if (delayedImageMs) {
      setFeed(openingFeed);
      setDayLabel("วันนี้");
      scheduleReveal();
      textInputRef.current?.focus();
      return;
    }
    setDayLabel((d) => DAY_LABELS[(DAY_LABELS.indexOf(d) + 1) % DAY_LABELS.length]);
  }, [delayedImageMs, openingFeed, scheduleReveal]);

  useEffect(() => {
    if (!focusOnEnter) return;
    const focus = () => textInputRef.current?.focus();
    focus();
    // A second try once the page has settled; some browsers drop the first.
    const retry = setTimeout(focus, 300);
    return () => clearTimeout(retry);
  }, [focusOnEnter]);

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
      setAvatar(URL.createObjectURL(file));
      setAvatarCustom(true);
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
  const stopEditName = useCallback(() => {
    setEditingName(false);
    idbSetMeta(`${roomId}:roomName`, roomName);
  }, [roomId, roomName]);
  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        stopEditName();
      }
    },
    [stopEditName]
  );

  const append = useCallback((msg: SentMessage) => {
    const items: LiveMessage[] = [];
    if (!hasSentRef.current) {
      hasSentRef.current = true;
      items.push({ id: "today", kind: "dateLabel" });
    }
    idRef.current += 1;
    items.push({ ...msg, id: `m${idRef.current}` } as LiveMessage);
    setFeed((prev) => [...prev, ...items]);
  }, []);

  const sendText = useCallback(() => {
    const el = textInputRef.current;
    const text = (el?.textContent ?? "").trim();
    if (!text) {
      el?.focus();
      return;
    }
    append({ kind: "text", text, time: nowLabel(timeSuffix) });
    if (el) {
      el.textContent = "";
      // Keep the real keyboard (and cursor) open across sends.
      el.focus();
    }
    setHasText(false);
  }, [append, timeSuffix]);

  const onInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    setHasText((e.currentTarget.textContent ?? "").trim().length > 0);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendText();
      }
    },
    [sendText]
  );

  // Recording clock.
  useEffect(() => {
    if (voiceStage !== "recording") return;
    const timer = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [voiceStage]);

  const toggleVoicePanel = useCallback(() => {
    if (voiceStage === "closed") {
      setVoiceStage("prompt");
      setRecordSeconds(0);
      // Drop focus so the real keyboard closes — the record panel takes
      // over the same reserved space.
      textInputRef.current?.blur();
    } else {
      setVoiceStage("closed");
      textInputRef.current?.focus();
    }
  }, [voiceStage]);

  const startRecording = useCallback(() => {
    setRecordSeconds(0);
    setVoiceStage("recording");
  }, []);
  const stopRecording = useCallback(() => setVoiceStage("recorded"), []);
  const discardRecording = useCallback(() => {
    setRecordSeconds(0);
    setVoiceStage("prompt");
  }, []);
  const sendVoice = useCallback(() => {
    append({ kind: "voice", seconds: Math.max(recordSeconds, 1), time: nowLabel(timeSuffix) });
    setRecordSeconds(0);
    setVoiceStage("prompt");
  }, [append, recordSeconds, timeSuffix]);

  return {
    avatar,
    avatarCustom,
    requestPickAvatar,
    avatarInputRef,
    handleAvatarChange,
    bgColor,
    setBgColor,
    dayLabel,
    toggleDayLabel,
    menuRestarts: Boolean(delayedImageMs),
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName,
    onNameKeyDown,
    nameInputRef,
    feed,
    hasText,
    textInputRef,
    onInput,
    onKeyDown,
    sendText,
    voiceStage,
    recordSeconds,
    toggleVoicePanel,
    startRecording,
    stopRecording,
    discardRecording,
    sendVoice,
  };
}
