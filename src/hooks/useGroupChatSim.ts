"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GroupMessage =
  | { id: string; side: "left"; sender: string; kind: "image"; src: string; time: string; baseRead: number }
  | { id: string; side: "right"; kind: "image"; src: string; time: string; readable?: boolean }
  | { id: string; side: "right"; kind: "text"; text: string; time: string; readable?: boolean };

// The old slip already shows this many readers; once the count starts
// running it grows by the same amount as the two newer messages.
const OLD_READ_BASE = 847;

const SCRIPT: GroupMessage[] = [
  { id: "slip", side: "left", sender: "พรชัย", kind: "image", src: "/room2-slip.webp", time: "18.28 น.", baseRead: OLD_READ_BASE },
];

const FIRST_IMAGE_TIME = "19.25 น.";
const FIXED_TEXT = "ใครที่แจ้งเบาะแสของแก่นได้ จะยกหนี้ให้หนึ่งหมื่นบาท";
const FIXED_TEXT_TIME = "19.25 น.";

const READ_DELAY_MS = 3000;
const READ_RUN_MS = 10000;
const READ_TICK_MS = 100;

export const DEFAULT_MAX_READ = "589";
const MAX_READ_KEY = "linechatsim-room2-maxread-v1";

/**
 * Cumulative progress (0..1) at each tick of the read-count run. Stretches
 * of fast climbing alternate with slow ones (a few ticks each, uneven
 * inside), so the number surges and stalls instead of rising steadily; the
 * last tick always lands on exactly 1.
 */
function randomSchedule(totalTicks: number): number[] {
  const weights: number[] = [];
  let fast = Math.random() < 0.5;
  let left = 0;
  for (let i = 0; i < totalTicks; i++) {
    if (left <= 0) {
      fast = !fast;
      left = 4 + Math.floor(Math.random() * 10);
    }
    left -= 1;
    weights.push((fast ? 3 : 0.25) * (0.2 + Math.random() * 1.6));
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let sum = 0;
  return weights.map((w) => (sum += w) / total);
}

function nowLabel() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}.${d.getMinutes().toString().padStart(2, "0")} น.`;
}

/**
 * Backs room 2: a LINE group chat ("ลูกหนี้ไม่หนีไปไหน"). A bank slip from
 * "พรชัย" is already in the chat. The operator's first send is a picture
 * (the ">" in the input bar picks it); the first text send, whatever is
 * typed, goes out as the fixed announcement, and 3 seconds later the "อ่านแล้ว"
 * count of the two new messages (same number on both) runs from 1 up to the
 * configured maximum over 10 seconds, in uneven surges and stalls. The old
 * slip shows 847 from the start and climbs by the same amount. Anything sent
 * after that is plain.
 */
export function useGroupChatSim() {
  const [feed, setFeed] = useState<GroupMessage[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const [readCount, setReadCount] = useState<number | null>(null);
  const [maxRead, setMaxReadState] = useState(DEFAULT_MAX_READ);

  const textInputRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const maxReadRef = useRef(DEFAULT_MAX_READ);
  const sentTextRef = useRef(0);
  const sentImageRef = useRef(0);
  const idRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (runTimerRef.current) clearInterval(runTimerRef.current);
    };
  }, []);

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
    const schedule = randomSchedule(totalTicks);
    let ticks = 0;
    setReadCount(1);
    if (runTimerRef.current) clearInterval(runTimerRef.current);
    runTimerRef.current = setInterval(() => {
      ticks += 1;
      const progress = schedule[Math.min(ticks, totalTicks) - 1];
      setReadCount(1 + Math.round((max - 1) * progress));
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
    if (sentTextRef.current === 1) {
      setFeed((prev) => [...prev, { id, side: "right", kind: "text", text: FIXED_TEXT, time: FIXED_TEXT_TIME, readable: true }]);
      delayTimerRef.current = setTimeout(() => {
        delayTimerRef.current = null;
        startReadRun();
      }, READ_DELAY_MS);
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
    const time = sentImageRef.current === 1 ? FIRST_IMAGE_TIME : nowLabel();
    const src = URL.createObjectURL(file);
    setFeed((prev) => [
      ...prev,
      { id: `i${idRef.current}`, side: "right", kind: "image", src, time, readable: sentImageRef.current === 1 },
    ]);
    textInputRef.current?.focus();
  }, []);

  return {
    feed,
    hasText,
    readCount,
    maxRead,
    setMaxRead,
    textInputRef,
    imageInputRef,
    onInput,
    onKeyDown,
    send,
    requestPickImage,
    handleImageChange,
  };
}
