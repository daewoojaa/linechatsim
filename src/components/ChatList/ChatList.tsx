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
  PlusIcon,
  TodayIcon,
  WalletIcon,
} from "@/components/icons/ChatListIcons";
import { INITIAL_ROOMS, type ChatRoom } from "./rooms";
import { loadRoomOverrides, saveRoomOverride } from "./storage";
import styles from "./ChatList.module.css";

type EditingField = { id: string; field: "name" | "message" } | null;

/**
 * LINE-style chat list ("แชท" tab) — the app's new home screen. Design
 * reference: a real LINE screenshot the user provided. Row data is
 * placeholder for now (rooms 2-9 keep their room-number names — the user
 * will fill in real content later); room 1 and room 10 are the two rows
 * with an actual destination wired up.
 *
 * Room name/message are editable in place, but only while unlocked — the
 * "หน้าหลัก" (Home) button doubles as the lock/unlock toggle for this
 * edit mode, since it doesn't have anywhere to actually navigate yet.
 */
export default function ChatList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_ROOMS);
  const [editing, setEditing] = useState<EditingField>(null);
  const [locked, setLocked] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load any saved name/message edits once on mount (client-only, so the
  // server-rendered markup still matches INITIAL_ROOMS and hydrates clean).
  // Deferred a tick so this doesn't count as a synchronous setState-in-effect
  // (which can cascade renders) — there's nothing to await, just a mount
  // hook reading a synchronous browser API once.
  useEffect(() => {
    queueMicrotask(() => {
      const overrides = loadRoomOverrides();
      if (Object.keys(overrides).length === 0) return;
      setRooms((prev) => prev.map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r)));
    });
  }, []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = (e: React.MouseEvent, id: string, field: "name" | "message") => {
    if (locked) return;
    e.stopPropagation();
    setEditing({ id, field });
  };

  const commitEditing = () => {
    if (!editing) return;
    const room = rooms.find((r) => r.id === editing.id);
    if (room) saveRoomOverride(room.id, { [editing.field]: room[editing.field] });
    setEditing(null);
  };

  const updateField = (id: string, field: "name" | "message", value: string) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const openRoom = (room: ChatRoom) => {
    if (editing?.id === room.id) return;
    if (room.href) router.push(room.href);
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
          <button type="button" className={styles.headerIconButton} title="เพิ่ม">
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* 2. Room list */}
      <div className={styles.list}>
        {rooms.map((room) => (
          <div key={room.id} className={styles.row} data-linked={Boolean(room.href)} onClick={() => openRoom(room)}>
            <div className={styles.avatar} style={{ backgroundColor: room.color }} />

            <div className={styles.rowMain}>
              {editing?.id === room.id && editing.field === "name" ? (
                <input
                  ref={inputRef}
                  className={styles.roomNameInput}
                  value={room.name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateField(room.id, "name", e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEditing();
                    }
                  }}
                />
              ) : (
                <div
                  className={styles.roomName}
                  data-editable={!locked}
                  onClick={(e) => startEditing(e, room.id, "name")}
                  title={locked ? undefined : "แตะเพื่อแก้ไขชื่อห้อง"}
                >
                  {room.name}
                </div>
              )}

              {editing?.id === room.id && editing.field === "message" ? (
                <input
                  ref={inputRef}
                  className={styles.messageInput}
                  value={room.message}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateField(room.id, "message", e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEditing();
                    }
                  }}
                />
              ) : (
                <div
                  className={styles.message}
                  data-editable={!locked}
                  onClick={(e) => startEditing(e, room.id, "message")}
                  title={locked ? undefined : "แตะเพื่อแก้ไขข้อความ"}
                >
                  {room.message}
                </div>
              )}
            </div>

            <div className={styles.rowEnd}>
              <div className={styles.time}>{room.time}</div>
              {room.unread !== undefined && <div className={styles.unreadBadge}>{room.unread}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom nav */}
      <div className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navItem}
          data-unlocked={!locked}
          onClick={() => setLocked((l) => !l)}
          title={locked ? "แตะเพื่อปลดล็อกการแก้ไขชื่อ/ข้อความ" : "แตะเพื่อล็อกการแก้ไข"}
        >
          <HomeIcon active={!locked} />
          <span className={styles.navLabel} data-active={!locked}>
            หน้าหลัก
          </span>
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
          <span className={styles.navLabel}>โอเพนแชท</span>
        </button>
        <button type="button" className={styles.navItem}>
          <TodayIcon />
          <span className={styles.navDot} />
          <span className={styles.navLabel}>TODAY</span>
        </button>
        <button type="button" className={styles.navItem}>
          <WalletIcon />
          <span className={styles.navDot} />
          <span className={styles.navLabel}>Wallet</span>
        </button>
      </div>
    </div>
  );
}
