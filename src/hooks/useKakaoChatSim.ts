"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** "a" is the operator's own side of the conversation, "b" the other person
 *  (지훈). Which screen side each lands on depends on `mirrored`. */
export type Owner = "a" | "b";

export type KakaoMessage =
  | { id: string; kind: "dateLabel"; text: string }
  | { id: string; kind: "text"; owner: Owner; text: string; time: string }
  | { id: string; kind: "call"; owner: Owner; variant: "voice" | "missed"; label: string; time: string };

const SCRIPT: KakaoMessage[] = [
  { id: "s1", kind: "text", owner: "a", text: "야", time: "오후 06:10" },
  { id: "s2", kind: "text", owner: "a", text: "그럼 소영 씨가 물어보면 어떡할 거야??", time: "오후 06:19" },
  { id: "s3", kind: "dateLabel", text: "2027년 9월 19일 일요일" },
  { id: "s4", kind: "call", owner: "b", variant: "voice", label: "보이스톡", time: "오전 11:56" },
  { id: "s5", kind: "call", owner: "b", variant: "missed", label: "부재중", time: "오전 11:57" },
];

// The one scripted beat: a new date label and this line from side "a".
const BEAT: KakaoMessage[] = [
  { id: "n1", kind: "dateLabel", text: "2027년 10월 1일 금요일" },
  { id: "n2", kind: "text", owner: "a", text: "서둘러, 나도 더 이상 소영이를 말릴 수는 없을거 같아", time: "오전 7:30" },
];

const BEAT_DELAY_MS = 5000;

function nowLabel() {
  const d = new Date();
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Backs room 1: a KakaoTalk-style chat with a pre-filled lead-in, viewable
 * from either end of the conversation (the ☰ icon flips `mirrored`: sides
 * and colours swap, and the partner becomes "Harry").
 *
 * The scripted beat (date label + "서둘러, ...") shows up one of two ways:
 * in the normal view, the first thing sent (whatever is typed) puts it out
 * on the right; in the mirrored view, tapping the conversation shows it on
 * the left after 5 seconds. Text sent otherwise goes out as a yellow bubble.
 * The "+" button resets everything for another take.
 */
export function useKakaoChatSim() {
  const [feed, setFeed] = useState<KakaoMessage[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const textInputRef = useRef<HTMLDivElement>(null);
  const beatStartedRef = useRef(false);
  const beatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  // Keep the real keyboard up: focus on entering the room.
  useEffect(() => {
    textInputRef.current?.focus();
    return () => {
      if (beatTimerRef.current) clearTimeout(beatTimerRef.current);
    };
  }, []);

  const send = useCallback(() => {
    const el = textInputRef.current;
    const text = (el?.textContent ?? "").trim();
    if (!text) {
      el?.focus();
      return;
    }
    if (!mirrored && !beatStartedRef.current) {
      // First send in the normal view: whatever was typed, the beat goes out.
      beatStartedRef.current = true;
      setFeed((prev) => [...prev, ...BEAT]);
    } else {
      idRef.current += 1;
      const owner: Owner = mirrored ? "b" : "a";
      setFeed((prev) => [...prev, { id: `m${idRef.current}`, kind: "text", owner, text, time: nowLabel() }]);
    }
    if (el) {
      el.textContent = "";
      // Keep the real keyboard (and cursor) open across sends.
      el.focus();
    }
    setHasText(false);
  }, [mirrored]);

  /** Tap on the conversation: refocus the input, and in the mirrored view
   *  start the 5-second countdown to the scripted beat (once). */
  const onFeedTap = useCallback(() => {
    textInputRef.current?.focus();
    if (!mirrored || beatStartedRef.current) return;
    beatStartedRef.current = true;
    beatTimerRef.current = setTimeout(() => {
      beatTimerRef.current = null;
      setFeed((prev) => [...prev, ...BEAT]);
    }, BEAT_DELAY_MS);
  }, [mirrored]);

  const toggleMirrored = useCallback(() => {
    setMirrored((m) => !m);
    textInputRef.current?.focus();
  }, []);

  /** Back to the opening state (same view), ready for another take. */
  const reset = useCallback(() => {
    if (beatTimerRef.current) {
      clearTimeout(beatTimerRef.current);
      beatTimerRef.current = null;
    }
    beatStartedRef.current = false;
    setFeed(SCRIPT);
    setHasText(false);
    const el = textInputRef.current;
    if (el) {
      el.textContent = "";
      el.focus();
    }
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

  return { feed, hasText, mirrored, textInputRef, onInput, onKeyDown, send, onFeedTap, toggleMirrored, reset };
}
