"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlbumIcon,
  CalendarBadgeIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
  HomeIcon,
  OpenChatIcon,
  PinBadgeIcon,
  PlusIcon,
  TodayIcon,
  WalletIcon,
} from "@/components/icons/ChatListIcons";
import { idbGetImage, idbSetImage } from "@/lib/idbStore";
import { INITIAL_ROOMS, MAIN_ROOMS, type ChatRoom } from "./rooms";
import { loadRoomOverrides, saveRoomOverride } from "./storage";
import styles from "./ChatList.module.css";

type Field = "name" | "message" | "time" | "unread";
type EditingField = { id: string; field: Field } | null;

/**
 * The app has two chat-list pages with the same design: "main" (the home
 * page, an index by room code) and "second" (the original list, reached from
 * row 2 of the first). Each keeps its own edits and profile pictures; the
 * second page uses the storage keys the app always had, so nothing saved
 * before the split is lost.
 */
export type ListVariant = "main" | "second";

const LISTS = {
  main: {
    rooms: MAIN_ROOMS,
    storageKey: "linechatsim-chatlist-main-v1",
    avatarPrefix: "chatlist:main:avatar:",
  },
  second: {
    rooms: INITIAL_ROOMS,
    storageKey: "linechatsim-chatlist-overrides-v2",
    avatarPrefix: "chatlist:avatar:",
  },
} as const;

function hasBadge(unread: ChatRoom["unread"]) {
  const v = String(unread ?? "").trim();
  return v !== "" && v !== "0";
}

/**
 * LINE-style chat list ("แชท" tab) — the app's home screen. Design
 * reference: a real LINE screenshot the user provided.
 *
 * Everything on a row (name, last message, time, unread count, profile
 * picture) is editable in place, but only while unlocked — the "+" icon at
 * the top right toggles that edit mode. Each edit is saved the moment it is
 * committed, and locking saves every row again, so nothing is lost.
 */
export default function ChatList({ variant = "main" }: { variant?: ListVariant }) {
  const { rooms: initialRooms, storageKey, avatarPrefix } = LISTS[variant];
  const avatarKey = (id: string) => `${avatarPrefix}${id}`;
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<EditingField>(null);
  const [locked, setLocked] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const pendingAvatarId = useRef<string | null>(null);

  // Load any saved edits once on mount (client-only, so the server-rendered
  // markup still matches INITIAL_ROOMS and hydrates clean). Deferred a tick
  // so this doesn't count as a synchronous setState-in-effect.
  useEffect(() => {
    queueMicrotask(() => {
      const overrides = loadRoomOverrides(LISTS[variant].storageKey);
      if (Object.keys(overrides).length === 0) return;
      setRooms((prev) => prev.map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r)));
    });
  }, [variant]);

  useEffect(() => {
    let cancelled = false;
    const { rooms: listRooms, avatarPrefix: prefix } = LISTS[variant];
    Promise.all(listRooms.map((r) => idbGetImage(`${prefix}${r.id}`))).then((blobs) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      listRooms.forEach((r, i) => {
        const blob = blobs[i];
        if (blob) next[r.id] = URL.createObjectURL(blob);
      });
      setAvatars(next);
    });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = (e: React.MouseEvent, id: string, field: Field) => {
    if (locked) return;
    e.stopPropagation();
    setEditing({ id, field });
  };

  const commitEditing = () => {
    if (!editing) return;
    const room = rooms.find((r) => r.id === editing.id);
    if (room) saveRoomOverride(room.id, { [editing.field]: String(room[editing.field] ?? "") }, storageKey);
    setEditing(null);
  };

  const updateField = (id: string, field: Field, value: string) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleLock = () => {
    if (!locked) {
      // Locking: write every row out once more so the whole list is
      // remembered, including an edit still open in an input.
      rooms.forEach((r) =>
        saveRoomOverride(
          r.id,
          {
            name: r.name,
            message: r.message,
            time: r.time,
            unread: String(r.unread ?? ""),
          },
          storageKey
        )
      );
      setEditing(null);
    }
    setLocked((l) => !l);
  };

  const openRoom = (room: ChatRoom) => {
    if (editing?.id === room.id) return;
    if (room.href) router.push(room.href);
  };

  const pickAvatar = (e: React.MouseEvent, id: string) => {
    if (locked) return;
    e.stopPropagation();
    pendingAvatarId.current = id;
    const el = avatarInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pendingAvatarId.current;
    if (!file || !id) return;
    await idbSetImage(avatarKey(id), file);
    const url = URL.createObjectURL(file);
    setAvatars((prev) => ({ ...prev, [id]: url }));
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEditing();
    }
  };

  /** Text (or the input replacing it while it is being edited). */
  const editable = (room: ChatRoom, field: Field, textClass: string, inputClass: string, hint: string) => {
    if (editing?.id === room.id && editing.field === field) {
      return (
        <input
          ref={inputRef}
          className={inputClass}
          value={String(room[field] ?? "")}
          inputMode={field === "unread" ? "numeric" : undefined}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateField(room.id, field, e.target.value)}
          onBlur={commitEditing}
          onKeyDown={onInputKeyDown}
        />
      );
    }
    return (
      <div
        className={textClass}
        data-editable={!locked}
        onClick={(e) => startEditing(e, room.id, field)}
        title={locked ? undefined : hint}
      >
        {room[field]}
      </div>
    );
  };

  return (
    <div className={styles.appShell}>
      {/* 1. Header */}
      <div className={styles.header}>
        <button type="button" className={styles.chatDropdown}>
          แชท
          <ChevronDownIcon />
        </button>
        <div className={styles.friendsTab}>เพื่อน</div>
        <div className={styles.headerIcons}>
          <button type="button" className={styles.headerIconButton} title="อัลบั้ม">
            <AlbumIcon />
            <span className={styles.smallDot} />
          </button>
          <button type="button" className={styles.headerIconButton} title="ปฏิทิน">
            <CalendarBadgeIcon day={31} />
          </button>
          <button
            type="button"
            className={styles.headerIconButton}
            data-unlocked={!locked}
            onClick={toggleLock}
            title={locked ? "แตะเพื่อปลดล็อกการแก้ไข" : "แตะเพื่อล็อกการแก้ไข (บันทึกค่าไว้ให้)"}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* 2. Room list */}
      <div className={styles.list}>
        {rooms.map((room) => {
          const unreadEditing = editing?.id === room.id && editing.field === "unread";
          return (
            <div key={room.id} className={styles.row} data-linked={Boolean(room.href)} onClick={() => openRoom(room)}>
              <div
                className={styles.avatar}
                data-editable={!locked}
                style={{
                  backgroundColor: room.color,
                  backgroundImage: avatars[room.id] ? `url(${avatars[room.id]})` : undefined,
                }}
                onClick={(e) => pickAvatar(e, room.id)}
                title={locked ? undefined : "แตะเพื่อเปลี่ยนรูปโปรไฟล์"}
              >
                {room.pinned && (
                  <span className={styles.pinBadge}>
                    <PinBadgeIcon />
                  </span>
                )}
              </div>

              <div className={styles.rowMain}>
                {editable(room, "name", styles.roomName, styles.roomNameInput, "แตะเพื่อแก้ไขชื่อห้อง")}
                {editable(room, "message", styles.message, styles.messageInput, "แตะเพื่อแก้ไขข้อความ")}
              </div>

              <div className={styles.rowEnd}>
                {editable(room, "time", styles.time, styles.timeInput, "แตะเพื่อแก้ไขเวลา")}
                {unreadEditing ? (
                  editable(room, "unread", styles.unreadBadge, styles.unreadInput, "")
                ) : (
                  <div
                    className={hasBadge(room.unread) ? styles.unreadBadge : styles.unreadSlot}
                    data-editable={!locked}
                    onClick={(e) => startEditing(e, room.id, "unread")}
                    title={locked ? undefined : "แตะเพื่อใส่ตัวเลข"}
                  >
                    {hasBadge(room.unread) ? room.unread : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom nav */}
      <div className={styles.bottomNav}>
        <button type="button" className={styles.navItem} onClick={variant === "second" ? () => router.push("/") : undefined}>
          <HomeIcon />
          <span className={styles.navLabel}>หน้าหลัก</span>
        </button>
        <button type="button" className={styles.navItem}>
          <ChatBubbleIcon active />
          <span className={styles.navBadge}>999+</span>
          <span className={styles.navLabel} data-active="true">
            แชท
          </span>
        </button>
        <button type="button" className={styles.navItem}>
          <OpenChatIcon />
          <span className={styles.navDot} />
          <span className={styles.navLabel}>บริการ</span>
        </button>
        <button type="button" className={styles.navItem}>
          <TodayIcon />
          <span className={styles.navDot} />
          <span className={styles.navLabel}>ข่าวสาร</span>
        </button>
        <button type="button" className={styles.navItem}>
          <WalletIcon />
          <span className={styles.navDot} />
          <span className={styles.navLabel}>กระเป๋าเงิน</span>
        </button>
      </div>

      <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} hidden />
    </div>
  );
}
