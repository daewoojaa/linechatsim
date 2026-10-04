"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GroupMessage =
  | { id: string; side: "left"; sender: string; avatar: string; kind: "image"; src: string; time: string }
  | { id: string; side: "left"; sender: string; avatar: string; kind: "text"; text: string; time: string }
  | { id: string; side: "right"; kind: "image"; src: string; time: string; readable?: boolean }
  | { id: string; side: "right"; kind: "text"; text: string; time: string; readable?: boolean };

const SCRIPT: GroupMessage[] = [
  {
    id: "slip",
    side: "left",
    sender: "พรชัย",
    avatar: "/room2-avatar.webp",
    kind: "image",
    src: "/room2-slip.webp",
    time: "18.28 น.",
  },
];

const FIRST_IMAGE_TIME = "19.25 น.";
const FIXED_TEXT = "ใครที่แจ้งเบาะแสของแก่นได้ จะยกหนี้ให้หนึ่งหมื่นบาท";
const FIXED_TEXT_TIME = "19.25 น.";

const READ_DELAY_MS = 3000;
const READ_RUN_MS = 15000;
// The first stretch, 1 up to 10, takes about this long (with holds in it).
const READ_START_MS = 5000;
const READ_TICK_MS = 100;

// Mirrored view ("☰"): the same two messages arrive from "บุษบา" on the left.
const SENDER = "บุษบา";
const SENDER_AVATAR = "/room2-busaba.png";
const MIRROR_FIRST_DELAY_MS = 5000;
const MIRROR_GAP_MS = 3000;

export const DEFAULT_MAX_READ = "589";
const MAX_READ_KEY = "linechatsim-room2-maxread-v1";

/**
 * The displayed read count at every tick of the run, in two stretches:
 * 1 up to 10 over ~5 seconds (the nine +1 steps land at random moments, so
 * the number often sits still for a while), then 10 up to the maximum over
 * the rest. In the second stretch fast climbing alternates with slow
 * stretches (a few ticks each, uneven inside), so it surges and stalls
 * instead of rising steadily. The last tick is exactly the maximum.
 */
function readSchedule(max: number, totalTicks: number, startTicks: number): number[] {
  const firstTop = Math.min(10, max);
  const values: number[] = [];

  // Stretch 1: (firstTop - 1) increments at distinct random ticks.
  const steps = new Set<number>();
  while (steps.size < firstTop - 1) steps.add(1 + Math.floor(Math.random() * (startTicks - 2)));
  let v = 1;
  for (let t = 1; t <= startTicks; t++) {
    if (steps.has(t)) v += 1;
    values.push(t === startTicks ? firstTop : v);
  }

  // Stretch 2: uneven surges from firstTop to max.
  const rest = totalTicks - startTicks;
  const weights: number[] = [];
  let fast = Math.random() < 0.5;
  let left = 0;
  for (let i = 0; i < rest; i++) {
    if (left <= 0) {
      fast = !fast;
      left = 4 + Math.floor(Math.random() * 10);
    }
    left -= 1;
    weights.push((fast ? 3 : 0.25) * (0.2 + Math.random() * 1.6));
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let sum = 0;
  for (const w of weights) {
    sum += w;
    values.push(firstTop + Math.round((max - firstTop) * (sum / total)));
  }
  return values;
}

function nowLabel() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}.${d.getMinutes().toString().padStart(2, "0")} น.`;
}

/**
 * Backs room 2: a LINE group chat ("ลูกหนี้ไม่หนีไปไหน"). A bank slip from
 * "พรชัย" is already in the chat (no read count on it). Normal view: the
 * operator's first send is a picture (the ">" in the input bar picks it);
 * the first text send, whatever is typed, goes out as the fixed
 * announcement, and 3 seconds later the "อ่านแล้ว" count of those two
 * messages (same number on both) runs from 1 up to the configured maximum
 * over 15 seconds: 1-10 takes about 5 of them (with holds), then uneven
 * surges and stalls up to the maximum.
 *
 * The ☰ icon flips to the mirrored view: the chat resets, and after 5
 * seconds the two messages arrive on their own, one at a time, from "บุษบา"
 * on the left (the picture first, then the text), with no read counts. Tap
 * ☰ again to go back to the normal view.
 */
export function useGroupChatSim() {
  const [feed, setFeed] = useState<GroupMessage[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const [readCount, setReadCount] = useState<number | null>(null);
  const [maxRead, setMaxReadState] = useState(DEFAULT_MAX_READ);
  const [mirrored, setMirrored] = useState(false);

  const textInputRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const maxReadRef = useRef(DEFAULT_MAX_READ);
  const mirroredRef = useRef(false);
  const sentTextRef = useRef(0);
  const sentImageRef = useRef(0);
  const idRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (runTimerRef.current) {
      clearInterval(runTimerRef.current);
      runTimerRef.current = null;
    }
  }, []);

  // Keep the real keyboard up (focus on entering) + load the saved maximum.
  useEffect(() => {
    textInputRef.current?.focus();
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(MAX_READ_KEY);
        if (saved) {
          maxReadRef.current = saved;
          setMaxReadState(saved);
        }
      } catch {
        // Persistence is best-effort.
      }
    });
    return clearTimers;
  }, [clearTimers]);

  const setMaxRead = useCallback((value: string) => {
    maxReadRef.current = value;
    setMaxReadState(value);
    try {
      window.localStorage.setItem(MAX_READ_KEY, value);
    } catch {
      // Persistence is best-effort.
    }
  }, []);

  const startReadRun = useCallback(() => {
    const max = Math.max(parseInt(maxReadRef.current, 10) || 1, 1);
    const totalTicks = READ_RUN_MS / READ_TICK_MS;
    const schedule = readSchedule(max, totalTicks, READ_START_MS / READ_TICK_MS);
    let ticks = 0;
    setReadCount(1);
    if (runTimerRef.current) clearInterval(runTimerRef.current);
    runTimerRef.current = setInterval(() => {
      ticks += 1;
      setReadCount(schedule[Math.min(ticks, totalTicks) - 1]);
      if (ticks >= totalTicks && runTimerRef.current) {
        clearInterval(runTimerRef.current);
        runTimerRef.current = null;
      }
    }, READ_TICK_MS);
  }, []);

  const send = useCallback(() => {
    const el = textInputRef.current;
    const typed = (el?.textContent ?? "").trim();
    if (!typed) {
      el?.focus();
      return;
    }
    idRef.current += 1;
    const id = `t${idRef.current}`;
    sentTextRef.current += 1;
    if (!mirroredRef.current && sentTextRef.current === 1) {
      setFeed((prev) => [...prev, { id, side: "right", kind: "text", text: FIXED_TEXT, time: FIXED_TEXT_TIME, readable: true }]);
      timersRef.current.push(setTimeout(startReadRun, READ_DELAY_MS));
    } else {
      setFeed((prev) => [...prev, { id, side: "right", kind: "text", text: typed, time: nowLabel() }]);
    }
    if (el) {
      el.textContent = "";
      // Keep the real keyboard (and cursor) open across sends.
      el.focus();
    }
    setHasText(false);
  }, [startReadRun]);

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

  const requestPickImage = useCallback(() => {
    const el = imageInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  /** The picked picture goes straight out as a message on the right. */
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    idRef.current += 1;
    sentImageRef.current += 1;
    const first = sentImageRef.current === 1 && !mirroredRef.current;
    const time = first ? FIRST_IMAGE_TIME : nowLabel();
    const src = URL.createObjectURL(file);
    setFeed((prev) => [
      ...prev,
      { id: `i${idRef.current}`, side: "right", kind: "image", src, time, readable: first },
    ]);
    textInputRef.current?.focus();
  }, []);

  /** ☰: reset the chat and swap views (see the doc comment above). */
  const toggleMirrored = useCallback(() => {
    clearTimers();
    const next = !mirroredRef.current;
    mirroredRef.current = next;
    setMirrored(next);
    setFeed(SCRIPT);
    setReadCount(null);
    sentTextRef.current = 0;
    sentImageRef.current = 0;
    if (next) {
      timersRef.current.push(
        setTimeout(() => {
          setFeed((prev) => [
            ...prev,
            { id: "m-image", side: "left", sender: SENDER, avatar: SENDER_AVATAR, kind: "image", src: "/room2-marker.jpg", time: FIRST_IMAGE_TIME },
          ]);
        }, MIRROR_FIRST_DELAY_MS),
        setTimeout(() => {
          setFeed((prev) => [
            ...prev,
            { id: "m-text", side: "left", sender: SENDER, avatar: SENDER_AVATAR, kind: "text", text: FIXED_TEXT, time: FIXED_TEXT_TIME },
          ]);
        }, MIRROR_FIRST_DELAY_MS + MIRROR_GAP_MS)
      );
    }
    textInputRef.current?.focus();
  }, [clearTimers]);

  return {
    feed,
    hasText,
    readCount,
    maxRead,
    setMaxRead,
    mirrored,
    toggleMirrored,
    textInputRef,
    imageInputRef,
    onInput,
    onKeyDown,
    send,
    requestPickImage,
    handleImageChange,
  };
}
