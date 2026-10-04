"use client";

import { useCallback, useRef, useState } from "react";

export type KakaoMessage =
  | { id: string; kind: "dateLabel"; text: string }
  | { id: string; kind: "mine"; text: string; time: string }
  | { id: string; kind: "theirs"; text: string; time: string }
  | { id: string; kind: "call"; variant: "voice" | "missed"; label: string; time: string };

const SCRIPT: KakaoMessage[] = [
  { id: "s1", kind: "mine", text: "야", time: "오후 06:10" },
  { id: "s2", kind: "mine", text: "그럼 소영 씨가 물어보면 어떡할 거야??", time: "오후 06:19" },
  { id: "s3", kind: "dateLabel", text: "2027년 9월 19일 일요일" },
  { id: "s4", kind: "call", variant: "voice", label: "보이스톡", time: "오전 11:56" },
  { id: "s5", kind: "call", variant: "missed", label: "부재중", time: "오전 11:57" },
];

// Whatever the operator types, the first send puts this message out on the
// right (their own side) instead, under a fresh date label.
const FIRST_SEND: KakaoMessage[] = [
  { id: "n1", kind: "dateLabel", text: "2027년 10월 1일 금요일" },
  { id: "n2", kind: "mine", text: "서둘러, 나도 더 이상 소영이를 말릴 수는 없을거 같아", time: "오전 7:30" },
];

function nowLabel() {
  const d = new Date();
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Backs room 1: a KakaoTalk-style chat with a pre-filled lead-in. The first
 * thing the operator sends (whatever they type) goes out as a scripted date
 * label plus a fixed yellow bubble on the right; anything sent after that
 * goes out as a yellow bubble with the typed text. Starts over on every
 * visit, and the "+" button resets it for another take.
 */
export function useKakaoChatSim() {
  const [feed, setFeed] = useState<KakaoMessage[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const textInputRef = useRef<HTMLDivElement>(null);
  const sentCountRef = useRef(0);

  const send = useCallback(() => {
    const el = textInputRef.current;
    const text = (el?.textContent ?? "").trim();
    if (!text) {
      el?.focus();
      return;
    }
    sentCountRef.current += 1;
    const n = sentCountRef.current;
    if (n === 1) {
      setFeed((prev) => [...prev, ...FIRST_SEND]);
    } else {
      setFeed((prev) => [...prev, { id: `m${n}`, kind: "mine", text, time: nowLabel() }]);
    }
    if (el) {
      el.textContent = "";
      // Keep the real keyboard (and cursor) open across sends.
      el.focus();
    }
    setHasText(false);
  }, []);

  /** Back to the opening state, ready for another take. */
  const reset = useCallback(() => {
    sentCountRef.current = 0;
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

  return { feed, hasText, textInputRef, onInput, onKeyDown, send, reset };
}
