"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { idbGetMeta, idbSetMeta } from "@/lib/idbStore";
import { defaultReadReceiptConfig, isReadReceiptSettled, type ReadReceiptConfig, type ScriptedMessage } from "@/lib/scriptedMessage";

const DEFAULT_BACKGROUND = "/default-bg2.png";

export type DisplayMessage =
  | { kind: "scripted"; key: string; msg: ScriptedMessage }
  | { kind: "live"; key: string; text: string; time: string; sentAt: number };

export type LineChatConfig = {
  roomId: string;
  defaultRoomName: string;
  /** A public/ asset path used as the persistent chat wallpaper — for room
   *  1 this is the movie-prop poster, not the generic sky background. */
  defaultBackground?: string;
};

function nowLabel() {
  const d = new Date();
  return `${d.getHours()}.${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Backs a "real" functioning LINE-style chat room: a persistent background
 * wallpaper with a growing feed of message bubbles on top, instead of
 * swapping whole pre-made screenshot images. Two ways a bubble gets added:
 *  - revealNext() pulls the next message out of the pre-authored `script`
 *    (edited on a separate "จัดการข้อความ" page) and appends it as an
 *    incoming (left, with avatar) bubble — driven by tapping the feed.
 *  - sendLive() takes whatever's currently typed in the real keyboard
 *    input and appends it as an outgoing (right, blue) bubble — this is
 *    the operator's own line, cued live in time with a take rather than
 *    scripted in advance, and is what carries the room's read-receipt
 *    animation (see `readConfig`).
 * resetConversation() clears the feed and rewinds the script pointer back
 * to the start, for the next take, without touching the authored script.
 */
export function useLineChatSim({ roomId, defaultRoomName, defaultBackground }: LineChatConfig) {
  const [hydrated, setHydrated] = useState(false);

  const [roomName, setRoomName] = useState(defaultRoomName);
  const [editingName, setEditingName] = useState(false);
  const [background] = useState<string | null>(defaultBackground ?? DEFAULT_BACKGROUND);

  const [script, setScript] = useState<ScriptedMessage[]>([]);
  const [readConfig, setReadConfig] = useState<ReadReceiptConfig>(defaultReadReceiptConfig());
  const [scriptedIndex, setScriptedIndex] = useState(0);
  const [feed, setFeed] = useState<DisplayMessage[]>([]);

  const [text, setText] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);

  // ---- initial hydration from IndexedDB ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [savedRoomName, savedScript, savedReadConfig, savedFeed, savedIndex] = await Promise.all([
        idbGetMeta<string>(`${roomId}:roomName`),
        idbGetMeta<ScriptedMessage[]>(`${roomId}:script`),
        idbGetMeta<ReadReceiptConfig>(`${roomId}:readConfig`),
        idbGetMeta<DisplayMessage[]>(`${roomId}:feed`),
        idbGetMeta<number>(`${roomId}:scriptedIndex`),
      ]);
      if (cancelled) return;

      if (savedRoomName) setRoomName(savedRoomName);
      if (savedScript) setScript(savedScript);
      if (savedReadConfig) setReadConfig(savedReadConfig);
      if (savedFeed) setFeed(savedFeed);
      if (savedIndex !== undefined) setScriptedIndex(savedIndex);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // Re-read the script/read-config whenever the tab regains focus, so edits
  // made on the "จัดการข้อความ" page (a separate route/mount) show up here
  // without needing a full reload.
  useEffect(() => {
    const onFocus = () => {
      Promise.all([
        idbGetMeta<ScriptedMessage[]>(`${roomId}:script`),
        idbGetMeta<ReadReceiptConfig>(`${roomId}:readConfig`),
      ]).then(([savedScript, savedReadConfig]) => {
        if (savedScript) setScript(savedScript);
        if (savedReadConfig) setReadConfig(savedReadConfig);
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [roomId]);

  useEffect(() => {
    if (!hydrated) return;
    idbSetMeta(`${roomId}:feed`, feed);
  }, [feed, hydrated, roomId]);

  useEffect(() => {
    if (!hydrated) return;
    idbSetMeta(`${roomId}:scriptedIndex`, scriptedIndex);
  }, [scriptedIndex, hydrated, roomId]);

  // Ticks `now` forward while any live message's read-receipt animation is
  // still advancing, so the component's display stays current — stops
  // itself once everything has settled.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (readConfig.sequence.length === 0) return;
    const stillTicking = feed.some(
      (item) => item.kind === "live" && !isReadReceiptSettled(item.sentAt, now, readConfig)
    );
    if (!stillTicking) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [feed, readConfig, now]);

  /** Tapping the chat feed reveals the next scripted (incoming) message. */
  const revealNext = useCallback(() => {
    if (scriptedIndex >= script.length) return;
    const msg = script[scriptedIndex];
    setFeed((prev) => [...prev, { kind: "scripted", key: `s-${msg.id}-${scriptedIndex}`, msg }]);
    setScriptedIndex((i) => i + 1);
  }, [script, scriptedIndex]);

  /** Sends whatever's currently typed as a live outgoing bubble. */
  const sendLive = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed) {
      setFeed((prev) => [
        ...prev,
        { kind: "live", key: `l-${Date.now()}`, text: trimmed, time: nowLabel(), sentAt: Date.now() },
      ]);
    }
    setText("");
    // The input is an uncontrolled contentEditable (see ChatSimulator's
    // same pattern) — clearing React state alone doesn't clear the DOM.
    if (textInputRef.current) textInputRef.current.textContent = "";
  }, [text]);

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendLive();
      }
    },
    [sendLive]
  );

  /** Clears the feed and rewinds to the start of the script — for the next
   *  take. Doesn't touch the authored script itself. */
  const resetConversation = useCallback(() => {
    setFeed([]);
    setScriptedIndex(0);
  }, []);

  const startEditName = useCallback(() => setEditingName(true), []);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const commitName = useCallback(() => {
    setEditingName(false);
    idbSetMeta(`${roomId}:roomName`, roomName);
  }, [roomId, roomName]);

  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName();
      }
    },
    [commitName]
  );

  return {
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName: commitName,
    onNameKeyDown,
    nameInputRef,

    background,
    feed,
    readConfig,
    now,
    revealNext,
    hasMoreScript: scriptedIndex < script.length,
    resetConversation,

    text,
    setText,
    textInputRef,
    onInputKeyDown,
    sendLive,
  };
}
