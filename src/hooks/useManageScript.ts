"use client";

import { useCallback, useEffect, useState } from "react";
import { idbGetMeta, idbSetMeta } from "@/lib/idbStore";
import { newScriptedMessage, type ScriptedMessage } from "@/lib/scriptedMessage";

/**
 * Backs the "จัดการข้อความ" page — authors the pre-scripted outgoing
 * message list a LineChatSimulator room reveals one at a time. Writes go
 * straight to the same `${roomId}:script` IndexedDB key the chat room
 * reads (and re-reads on window focus), so edits show up there without
 * any other syncing.
 */
export function useManageScript(roomId: string) {
  const [script, setScript] = useState<ScriptedMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await idbGetMeta<ScriptedMessage[]>(`${roomId}:script`);
      if (cancelled) return;
      if (saved) setScript(saved);
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

  return { script, loaded, addMessage, updateMessage, removeMessage, moveMessage };
}
