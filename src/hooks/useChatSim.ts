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
import type { ChatSet, ChatSlot, Mode, PickTarget, Sticker } from "@/lib/types";

const DEFAULT_ROOM_NAME = "อ.ตวง";
const DEFAULT_BACKGROUND = "/default-bg2.png";
const DEFAULT_CHAT_IMAGE_1 = "/default-chat1.jpg";

// chatImage1 has no alternate — only 2/3/4 come in two pre-made storylines
// the user can flip between (see toggleChatSet). Whichever isn't active is
// only ever used as a *default*: an image the user has actually uploaded
// for a slot always wins over either set (see customImageRef).
const CHAT_SET_DEFAULTS: Record<ChatSet, { chatImage2: string; chatImage3: string; chatImage4: string }> = {
  A: {
    chatImage2: "/default-chat2.jpg",
    chatImage3: "/default-chat3.jpg",
    chatImage4: "/default-chat4.jpg",
  },
  B: {
    chatImage2: "/default-chatB2.jpg",
    chatImage3: "/default-chatB3.jpg",
    chatImage4: "/default-chatB4.jpg",
  },
};
// Negative id marks this as a placeholder, not a real saved sticker —
// idbAddStickers hands out non-negative autoIncrement ids, so this can
// never collide, and it's how handleStickerFilesChange knows to drop the
// placeholder once the user adds a sticker of their own.
const DEFAULT_STICKER: Sticker = { id: -1, url: "/default-stickers/1.png" };
const AUTO_ADVANCE_MS = 2000;

const PICK_TO_IMAGE_KEY: Record<PickTarget, ImageKey> = {
  background: "background",
  chatImage1: "chatImage1",
  chatImage2: "chatImage2",
  chatImage3: "chatImage3",
  chatImage4: "chatImage4",
};

export function useChatSim() {
  const [hydrated, setHydrated] = useState(false);

  const [roomName, setRoomName] = useState(DEFAULT_ROOM_NAME);
  const [editingName, setEditingName] = useState(false);

  const [chatSet, setChatSet] = useState<ChatSet>("A");
  const [background, setBackground] = useState<string | null>(DEFAULT_BACKGROUND);
  const [chatImage1, setChatImage1] = useState<string | null>(DEFAULT_CHAT_IMAGE_1);
  const [chatImage2, setChatImage2] = useState<string | null>(CHAT_SET_DEFAULTS.A.chatImage2);
  const [chatImage3, setChatImage3] = useState<string | null>(CHAT_SET_DEFAULTS.A.chatImage3);
  const [chatImage4, setChatImage4] = useState<string | null>(CHAT_SET_DEFAULTS.A.chatImage4);
  const [slot, setSlot] = useState<ChatSlot>(0);
  // Tracks which of chatImage2/3/4 hold a real user upload rather than a
  // set default — toggleChatSet must never clobber those. A ref (not
  // state) because it's only ever read inside event handlers, never
  // rendered.
  const customImageRef = useRef({ chatImage2: false, chatImage3: false, chatImage4: false });

  const [mode, setMode] = useState<Mode>("keyboard");
  const [text, setText] = useState("");

  const [stickers, setStickers] = useState<Sticker[]>([DEFAULT_STICKER]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  const pendingTargetRef = useRef<PickTarget>("background");
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tripleTapRef = useRef({ count: 0, timer: null as ReturnType<typeof setTimeout> | null });

  // ---- initial hydration from IndexedDB ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [savedRoomName, savedSlot, savedChatSet, bgBlob, img1Blob, img2Blob, img3Blob, img4Blob, stickerRows] =
        await Promise.all([
          idbGetMeta<string>("roomName"),
          idbGetMeta<ChatSlot>("slot"),
          idbGetMeta<ChatSet>("chatSet"),
          idbGetImage("background"),
          idbGetImage("chatImage1"),
          idbGetImage("chatImage2"),
          idbGetImage("chatImage3"),
          idbGetImage("chatImage4"),
          idbGetAllStickers(),
        ]);
      if (cancelled) return;

      if (savedRoomName) setRoomName(savedRoomName);
      if (savedSlot !== undefined) setSlot(savedSlot);
      if (bgBlob) setBackground(URL.createObjectURL(bgBlob));
      if (img1Blob) setChatImage1(URL.createObjectURL(img1Blob));

      const set = savedChatSet ?? "A";
      if (savedChatSet) setChatSet(savedChatSet);

      if (img2Blob) {
        setChatImage2(URL.createObjectURL(img2Blob));
        customImageRef.current.chatImage2 = true;
      } else if (set === "B") {
        setChatImage2(CHAT_SET_DEFAULTS.B.chatImage2);
      }
      if (img3Blob) {
        setChatImage3(URL.createObjectURL(img3Blob));
        customImageRef.current.chatImage3 = true;
      } else if (set === "B") {
        setChatImage3(CHAT_SET_DEFAULTS.B.chatImage3);
      }
      if (img4Blob) {
        setChatImage4(URL.createObjectURL(img4Blob));
        customImageRef.current.chatImage4 = true;
      } else if (set === "B") {
        setChatImage4(CHAT_SET_DEFAULTS.B.chatImage4);
      }

      if (stickerRows.length) {
        setStickers(stickerRows.map((row) => ({ id: row.id, url: URL.createObjectURL(row.blob) })));
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- auto-advance: slot 2 -> 3 once a fourth chat image exists ----
  useEffect(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (slot === 2 && chatImage4) {
      autoTimerRef.current = setTimeout(() => {
        setSlot((current) => (current === 2 ? 3 : current));
      }, AUTO_ADVANCE_MS);
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [slot, chatImage4]);

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
    if (target === "chatImage2") {
      setChatImage2(url);
      customImageRef.current.chatImage2 = true;
    }
    if (target === "chatImage3") {
      setChatImage3(url);
      customImageRef.current.chatImage3 = true;
    }
    if (target === "chatImage4") {
      setChatImage4(url);
      customImageRef.current.chatImage4 = true;
    }
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
    // Drop the placeholder default sticker (negative id) the first time the
    // user adds a real one — same "your upload replaces the default" rule
    // background/chatImage follow, just expressed as a filter since this is
    // a list instead of a single slot.
    setStickers((prev) => prev.filter((s) => s.id >= 0).concat(added));
  }, []);

  const onStickerTap = useCallback(() => {
    setSlot(1);
  }, []);

  /** Tapping the displayed chat image itself: on the "ข้อความ2" slot,
   *  advance to "ข้อความ3" — the other slots don't respond to this yet. */
  const onChatImageTap = useCallback(() => {
    setSlot((current) => (current === 1 ? 2 : current));
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
    const next = mode === "keyboard" ? "sticker" : "keyboard";
    setMode(next);
    // Focus right after setState (not in a useEffect) so this runs inside
    // the same click/tap gesture — switching back to keyboard mode re-opens
    // the OS keyboard immediately instead of requiring an extra tap.
    if (next === "keyboard") {
      textInputRef.current?.focus();
    }
  }, [mode]);

  /** Switches chatImage2/3/4 between the two pre-made storylines (Set A /
   *  Set B), skipping any slot the user has already uploaded their own
   *  image into. Persists so a reload comes back to the same set. */
  const toggleChatSet = useCallback(() => {
    const next: ChatSet = chatSet === "A" ? "B" : "A";
    const defaults = CHAT_SET_DEFAULTS[next];
    if (!customImageRef.current.chatImage2) setChatImage2(defaults.chatImage2);
    if (!customImageRef.current.chatImage3) setChatImage3(defaults.chatImage3);
    if (!customImageRef.current.chatImage4) setChatImage4(defaults.chatImage4);
    setChatSet(next);
    idbSetMeta("chatSet", next);
  }, [chatSet]);

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

  const blockEnter = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") e.preventDefault();
  }, []);

  const displayedChatSrc =
    slot === 3
      ? chatImage4 ?? chatImage3 ?? chatImage2 ?? chatImage1
      : slot === 2
        ? chatImage3 ?? chatImage2 ?? chatImage1
        : slot === 1
          ? chatImage2 ?? chatImage1
          : chatImage1 ?? chatImage2;

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
    chatSet,
    toggleChatSet,

    mode,
    toggleMode,

    text,
    setText,
    blockEnter,
    textInputRef,

    stickers,
    onStickerTap,
    onChatImageTap,
    onPanelBackgroundTap,

    fileInputRef,
    stickerInputRef,
    requestPick,
    handleFileChange,
    handleStickerFilesChange,
  };
}
