"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  idbAddStickers,
  idbGetAllStickers,
  idbGetImage,
  idbGetMeta,
  idbSetImage,
  idbSetMeta,
  type ImageKey,
} from "@/lib/idbStore";
import type { ChatSlot, Mode, PickTarget, Sticker } from "@/lib/types";

const DEFAULT_ROOM_NAME = "PLERN";
const AUTO_ADVANCE_MS = 2000;

const PICK_TO_IMAGE_KEY: Record<PickTarget, ImageKey> = {
  background: "background",
  chatImage1: "chatImage1",
  chatImage2: "chatImage2",
  chatImage3: "chatImage3",
};

export function useChatSim() {
  const [hydrated, setHydrated] = useState(false);

  const [roomName, setRoomName] = useState(DEFAULT_ROOM_NAME);
  const [editingName, setEditingName] = useState(false);

  const [background, setBackground] = useState<string | null>(null);
  const [chatImage1, setChatImage1] = useState<string | null>(null);
  const [chatImage2, setChatImage2] = useState<string | null>(null);
  const [chatImage3, setChatImage3] = useState<string | null>(null);
  const [slot, setSlot] = useState<ChatSlot>(0);

  const [mode, setMode] = useState<Mode>("keyboard");
  const [text, setText] = useState("");

  const [stickers, setStickers] = useState<Sticker[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const pendingTargetRef = useRef<PickTarget>("background");
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tripleTapRef = useRef({ count: 0, timer: null as ReturnType<typeof setTimeout> | null });

  // ---- initial hydration from IndexedDB ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [savedRoomName, savedSlot, bgBlob, img1Blob, img2Blob, img3Blob, stickerRows] = await Promise.all([
        idbGetMeta<string>("roomName"),
        idbGetMeta<ChatSlot>("slot"),
        idbGetImage("background"),
        idbGetImage("chatImage1"),
        idbGetImage("chatImage2"),
        idbGetImage("chatImage3"),
        idbGetAllStickers(),
      ]);
      if (cancelled) return;

      if (savedRoomName) setRoomName(savedRoomName);
      if (savedSlot !== undefined) setSlot(savedSlot);
      if (bgBlob) setBackground(URL.createObjectURL(bgBlob));
      if (img1Blob) setChatImage1(URL.createObjectURL(img1Blob));
      if (img2Blob) setChatImage2(URL.createObjectURL(img2Blob));
      if (img3Blob) setChatImage3(URL.createObjectURL(img3Blob));
      if (stickerRows.length) {
        setStickers(stickerRows.map((row) => ({ id: row.id, url: URL.createObjectURL(row.blob) })));
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- auto-advance: slot 1 -> 2 once a third chat image exists ----
  useEffect(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (slot === 1 && chatImage3) {
      autoTimerRef.current = setTimeout(() => {
        setSlot((current) => (current === 1 ? 2 : current));
      }, AUTO_ADVANCE_MS);
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [slot, chatImage3]);

  // persist slot after hydration so a reload resumes on the same image
  useEffect(() => {
    if (!hydrated) return;
    idbSetMeta("slot", slot);
  }, [slot, hydrated]);

  const showFirst = useCallback(() => setSlot(0), []);

  const requestPick = useCallback((target: PickTarget) => {
    pendingTargetRef.current = target;
    const el = fileInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const target = pendingTargetRef.current;
    const url = URL.createObjectURL(file);

    await idbSetImage(PICK_TO_IMAGE_KEY[target], file);

    if (target === "background") setBackground(url);
    if (target === "chatImage1") {
      setChatImage1(url);
      setSlot(0);
    }
    if (target === "chatImage2") setChatImage2(url);
    if (target === "chatImage3") setChatImage3(url);
  }, []);

  const requestAddStickers = useCallback(() => {
    const el = stickerInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  }, []);

  const handleStickerFilesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    await idbAddStickers(files);
    const added = files.map((file, i) => ({ id: Date.now() + i, url: URL.createObjectURL(file) }));
    setStickers((prev) => prev.concat(added));
  }, []);

  const onStickerTap = useCallback(() => {
    setSlot(1);
  }, []);

  /** Triple-tap anywhere on the empty sticker-grid background (not a sticker cell) adds stickers. */
  const onPanelBackgroundTap = useCallback(() => {
    const t = tripleTapRef.current;
    t.count += 1;
    if (t.timer) clearTimeout(t.timer);
    if (t.count >= 3) {
      t.count = 0;
      requestAddStickers();
      return;
    }
    t.timer = setTimeout(() => {
      t.count = 0;
    }, 650);
  }, [requestAddStickers]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "keyboard" ? "sticker" : "keyboard"));
  }, []);

  const startEditName = useCallback(() => setEditingName(true), []);

  // Focus + select the name field once it mounts, rather than chaining off
  // the click handler — keeps this correct regardless of when React commits.
  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const commitName = useCallback(() => {
    setEditingName(false);
    idbSetMeta("roomName", roomName);
  }, [roomName]);

  const onNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName();
      }
    },
    [commitName]
  );

  const blockEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.preventDefault();
  }, []);

  const displayedChatSrc =
    slot === 2 ? chatImage3 ?? chatImage2 ?? chatImage1 : slot === 1 ? chatImage2 ?? chatImage1 : chatImage1 ?? chatImage2;

  return {
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName: commitName,
    onNameKeyDown,
    nameInputRef,

    background,
    displayedChatSrc,
    slot,
    showFirst,

    mode,
    toggleMode,

    text,
    setText,
    blockEnter,

    stickers,
    onStickerTap,
    onPanelBackgroundTap,

    fileInputRef,
    stickerInputRef,
    requestPick,
    handleFileChange,
    handleStickerFilesChange,
  };
}
