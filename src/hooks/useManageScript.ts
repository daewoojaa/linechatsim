"use client";

import { useCallback, useEffect, useState } from "react";
import { idbGetMeta, idbSetMeta } from "@/lib/idbStore";
import { defaultReadReceiptConfig, newScriptedMessage, type ReadReceiptConfig, type ScriptedMessage } from "@/lib/scriptedMessage";

/**
 * Backs the "จัดการข้อความ" page — authors the pre-scripted incoming
 * message list a LineChatSimulator room reveals one at a time, plus the
 * room-wide read-receipt behavior for outgoing (live-typed) messages.
 * Writes go straight to the same `${roomId}:script` / `${roomId}:readConfig`
 * IndexedDB keys the chat room reads (and re-reads on window focus), so
 * edits show up there without any other syncing.
 */
export function useManageScript(roomId: string) {
  const [script, setScript] = useState<ScriptedMessage[]>([]);
  const [readConfig, setReadConfig] = useState<ReadReceiptConfig>(defaultReadReceiptConfig());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedScript, savedReadConfig] = await Promise.all([
        idbGetMeta<ScriptedMessage[]>(`${roomId}:script`),
        idbGetMeta<ReadReceiptConfig>(`${roomId}:readConfig`),
      ]);
      if (cancelled) return;
      if (savedScript) setScript(savedScript);
      if (savedReadConfig) setReadConfig(savedReadConfig);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const persist = useCallback(
    (next: ScriptedMessage[]) => {
      setScript(next);
      idbSetMeta(`${roomId}:script`, next);
    },
    [roomId]
  );

  const persistReadConfig = useCallback(
    (next: ReadReceiptConfig) => {
      setReadConfig(next);
      idbSetMeta(`${roomId}:readConfig`, next);
    },
    [roomId]
  );

  const updateReadConfig = useCallback(
    (patch: Partial<ReadReceiptConfig>) => {
      persistReadConfig({ ...readConfig, ...patch });
    },
    [readConfig, persistReadConfig]
  );

  const addMessage = useCallback(() => {
    persist([...script, newScriptedMessage()]);
  }, [script, persist]);

  const updateMessage = useCallback(
    (id: string, patch: Partial<ScriptedMessage>) => {
      persist(script.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    [script, persist]
  );

  const removeMessage = useCallback(
    (id: string) => {
      persist(script.filter((m) => m.id !== id));
    },
    [script, persist]
  );

  const moveMessage = useCallback(
    (id: string, direction: -1 | 1) => {
      const idx = script.findIndex((m) => m.id === id);
      if (idx < 0) return;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= script.length) return;
      const next = [...script];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      persist(next);
    },
    [script, persist]
  );

  return { script, readConfig, loaded, addMessage, updateMessage, removeMessage, moveMessage, updateReadConfig };
}
