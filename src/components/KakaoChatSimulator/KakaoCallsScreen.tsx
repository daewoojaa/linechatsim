"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./KakaoCallsScreen.module.css";

const STORAGE_KEY = "linechatsim-room1-calls-v1";

const DEFAULT_TEXT: Record<string, string> = {
  title: "최근 통화",
  r0: "어머니 (15)",
  r1: "아버지 (6)",
  r2: "어머니 (4)",
  r3: "소영",
  r4: "아버지",
  n0: "친구",
  n1: "채팅",
  n2: "통화",
  n3: "더보기",
};

// The two highlighted rows of the reference (selected / unseen calls).
const HIGHLIGHTED = new Set(["r1", "r2"]);
const ROWS = ["r0", "r1", "r2", "r3", "r4"];

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function SearchIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <circle cx={11} cy={11} r={6.5} />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
function PhonePlusIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 26 26" {...stroke} strokeWidth={1.8}>
      <path d="M6.500 4c1 0 1.600.5 1.900 1.400l.8 2.200c.3.800.1 1.400-.6 1.900l-1 .7c.9 2 2.400 3.500 4.400 4.400l.7-1c.5-.7 1.100-.9 1.900-.6l2.200.8c.9.3 1.400.9 1.400 1.900v2c0 1.200-.8 2-2 2C9.700 19.700 4.500 14.500 4.500 6c0-1.200.8-2 2-2Z" />
      <path d="M18 3v6M15 6h6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <circle cx={12} cy={12} r={3} />
      <path d="M12 3.500v2.200M12 18.300v2.200M3.500 12h2.200M18.300 12h2.200M6 6l1.600 1.600M16.400 16.400 18 18M18 6l-1.600 1.600M7.600 16.400 6 18" />
      <circle cx={12} cy={12} r={6.600} />
    </svg>
  );
}
function CallIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.600 2.700c1.100 0 1.800.6 2.100 1.600l.9 2.500c.3.900.1 1.600-.6 2.100l-1.100.8c1 2.300 2.700 4 5 5l.8-1.100c.5-.7 1.200-1 2.100-.6l2.500.9c1 .3 1.600 1 1.600 2.100v2.200c0 1.300-.9 2.200-2.200 2.200C9.500 20.400 3.600 14.500 3.600 5.900c0-1.300.9-2.200 2.200-2.200Z" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x={3} y={6.500} width={12} height={11} rx={2.500} />
      <path d="m16.500 10.500 4.200-2.500c.5-.3 1.100 0 1.100.6v6.800c0 .6-.6.900-1.100.6l-4.200-2.500Z" />
    </svg>
  );
}
function FriendsIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <circle cx={12} cy={8} r={4} />
      <path d="M4.500 20c.6-3.800 3.600-6 7.500-6s6.900 2.200 7.500 6Z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <path d="M12 4c-4.600 0-8 3-8 6.800 0 2 1 3.800 2.600 5-.1 1.200-.6 2.400-1.500 3.400 1.700-.1 3.200-.7 4.300-1.600.8.200 1.600.3 2.600.3 4.600 0 8-3 8-6.800S16.600 4 12 4Z" />
      <circle cx={8.500} cy={10.800} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={12} cy={10.800} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={15.500} cy={10.800} r={0.9} fill="currentColor" stroke="none" />
    </svg>
  );
}
function CallTabIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.600 2.700c1.100 0 1.800.6 2.100 1.600l.9 2.500c.3.900.1 1.600-.6 2.100l-1.100.8c1 2.300 2.700 4 5 5l.8-1.100c.5-.7 1.200-1 2.100-.6l2.500.9c1 .3 1.600 1 1.600 2.100v2.200c0 1.300-.9 2.200-2.200 2.200C9.500 20.400 3.600 14.500 3.600 5.900c0-1.300.9-2.200 2.200-2.200Z" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
      <circle cx={5} cy={12} r={2} />
      <circle cx={12} cy={12} r={2} />
      <circle cx={19} cy={12} r={2} />
    </svg>
  );
}

type Props = {
  /** The bottom "통화" tab (and "채팅") — back to the conversation. */
  onBackToChat: () => void;
  /** The bottom "더보기" (three dots) — out to the chat list. */
  onMore: () => void;
};

/**
 * Room 1's "recent calls" page (KakaoTalk 통화 tab), reached from the chat
 * header's phone icon. The gear icon unlocks / locks editing: while
 * unlocked, every text on the page (title, names, tab labels) can be tapped
 * and retyped, and edits are remembered.
 */
export default function KakaoCallsScreen({ onBackToChat, onMore }: Props) {
  const [text, setText] = useState<Record<string, string>>(DEFAULT_TEXT);
  const [unlocked, setUnlocked] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Saved edits (client-only, so the server render stays on the defaults).
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setText((prev) => ({ ...prev, ...(JSON.parse(raw) as Record<string, string>) }));
      } catch {
        // Persistence is best-effort.
      }
    });
  }, []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const change = (key: string, value: string) => {
    const next = { ...text, [key]: value };
    setText(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Persistence is best-effort.
    }
  };

  /** One piece of editable text: plain while locked, tappable when unlocked. */
  const editable = (key: string, className: string) => {
    if (editing === key) {
      return (
        <input
          ref={inputRef}
          className={`${className} ${styles.textInput}`}
          value={text[key]}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => change(key, e.target.value)}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setEditing(null);
            }
          }}
        />
      );
    }
    return (
      <span
        className={className}
        data-editable={unlocked}
        onClick={
          unlocked
            ? (e) => {
                e.stopPropagation();
                setEditing(key);
              }
            : undefined
        }
      >
        {text[key]}
      </span>
    );
  };

  const toggleLock = () => {
    setEditing(null);
    setUnlocked((u) => !u);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        {editable("title", styles.title)}
        <div className={styles.headerIcons}>
          <SearchIcon />
          <PhonePlusIcon />
          <button
            type="button"
            className={styles.gearButton}
            data-unlocked={unlocked}
            onClick={toggleLock}
            title={unlocked ? "แตะเพื่อล็อกการแก้ไข" : "แตะเพื่อปลดล็อกการแก้ไขข้อความ"}
          >
            <GearIcon />
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {ROWS.map((key) => (
          <div key={key} className={styles.row} data-highlight={HIGHLIGHTED.has(key)}>
            {editable(key, styles.name)}
            <div className={styles.actions}>
              <span className={styles.actionButton}>
                <CallIcon />
              </span>
              <span className={styles.actionButton}>
                <VideoIcon />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tabs}>
        <div className={styles.tab}>
          <FriendsIcon />
          {editable("n0", styles.tabLabel)}
        </div>
        {/* div+role (not <button>): the label inside can turn into an input.
            While unlocked, taps edit text instead of navigating. */}
        <div role="button" className={styles.tab} onClick={unlocked ? undefined : onBackToChat}>
          <ChatIcon />
          {editable("n1", styles.tabLabel)}
        </div>
        <div
          role="button"
          className={`${styles.tab} ${styles.tabActive}`}
          onClick={unlocked ? undefined : onBackToChat}
          title="กลับหน้าแชท"
        >
          <span className={styles.activePill}>
            <CallTabIcon />
          </span>
          {editable("n2", styles.tabLabel)}
        </div>
        <div role="button" className={styles.tab} onClick={unlocked ? undefined : onMore} title="กลับไปหน้ารวมแชท">
          <MoreIcon />
          {editable("n3", styles.tabLabel)}
        </div>
      </div>
    </div>
  );
}
