"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetMeta, idbSetMeta } from "@/lib/idbStore";

export type LiveMessage =
  | { id: string; kind: "text"; text: string; time: string }
  | { id: string; kind: "missedCall"; time: string }
  | { id: string; kind: "voice"; seconds: number; time: string }
  | { id: string; kind: "dateLabel"; text: string };

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

function nowLabel() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Backs room 6: a simulated LINE conversation. Every bubble is on the
 * operator's side; the scripted lead-in is pre-filled and the operator adds
 * to it — typed text goes out as a bubble, and the voice-record panel sends
 * a voice bubble. The first thing sent is preceded by a "วันนี้" date label.
 */
export function useLiveChatSim(roomId: string, defaultRoomName: string) {
  const [roomName, setRoomName] = useState(defaultRoomName);
  const [editingName, setEditingName] = useState(false);
  const [feed, setFeed] = useState<LiveMessage[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("closed");
  const [recordSeconds, setRecordSeconds] = useState(0);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  const hasSentRef = useRef(false);
  const idRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    idbGetMeta<string>(`${roomId}:roomName`).then((saved) => {
      if (!cancelled && saved) setRoomName(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

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
      items.push({ id: "today", kind: "dateLabel", text: "วันนี้" });
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
    append({ kind: "text", text, time: nowLabel() });
    if (el) {
      el.textContent = "";
      // Keep the real keyboard (and cursor) open across sends.
      el.focus();
    }
    setHasText(false);
  }, [append]);

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
    append({ kind: "voice", seconds: Math.max(recordSeconds, 1), time: nowLabel() });
    setRecordSeconds(0);
    setVoiceStage("prompt");
  }, [append, recordSeconds]);

  return {
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
