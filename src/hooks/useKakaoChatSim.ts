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

// The scripted beats, in order: each is a new date label plus a line from
// side "a". Taps (mirrored view) bring them up one at a time.
const BEATS: KakaoMessage[][] = [
  [
    { id: "n1", kind: "dateLabel", text: "2027년 10월 1일 금요일" },
    { id: "n2", kind: "text", owner: "a", text: "서둘러, 나도 더 이상 소영이를 말릴 수는 없을거 같아", time: "오전 7:30" },
  ],
  [
    { id: "n3", kind: "dateLabel", text: "2027년 10월 3일 일요일" },
    { id: "n4", kind: "text", owner: "a", text: "소영이 동촌에 거의 다 왔어.", time: "오전 11:50" },
  ],
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
 * The scripted beats (a date label + a line each) show up one of two ways:
 * in the normal view, the first thing sent (whatever is typed) puts the
 * first beat out on the right; in the mirrored view, each tap on the
 * conversation shows the next beat on the left after 5 seconds. Text sent
 * otherwise goes out as a yellow bubble.
 * The "+" button resets everything for another take.
 */
export function useKakaoChatSim() {
  const [feed, setFeed] = useState<KakaoMessage[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const textInputRef = useRef<HTMLDivElement>(null);
  // How many beats have been shown or are counting down.
  const beatsStartedRef = useRef(0);
  const beatPendingRef = useRef(false);
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
    if (!mirrored && beatsStartedRef.current === 0) {
      // First send in the normal view: whatever was typed, beat 1 goes out.
      beatsStartedRef.current = 1;
      setFeed((prev) => [...prev, ...BEATS[0]]);
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
   *  start the 5-second countdown to the next scripted beat. */
  const onFeedTap = useCallback(() => {
    textInputRef.current?.focus();
    if (!mirrored || beatPendingRef.current || beatsStartedRef.current >= BEATS.length) return;
    const beat = BEATS[beatsStartedRef.current];
    beatsStartedRef.current += 1;
    beatPendingRef.current = true;
    beatTimerRef.current = setTimeout(() => {
      beatTimerRef.current = null;
      beatPendingRef.current = false;
      setFeed((prev) => [...prev, ...beat]);
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
    beatsStartedRef.current = 0;
    beatPendingRef.current = false;
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
