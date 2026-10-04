"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useKakaoChatSim, type KakaoMessage } from "@/hooks/useKakaoChatSim";
import styles from "./KakaoChatSimulator.module.css";

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.6}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <circle cx={11} cy={11} r={6.5} />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <path d="M6.5 3.8c1 0 1.6.5 1.9 1.4l.8 2.2c.3.8.1 1.4-.6 1.9l-1 .7c.9 2 2.4 3.5 4.4 4.4l.7-1c.5-.7 1.1-.9 1.9-.6l2.2.8c.9.3 1.4.9 1.4 1.9v2c0 1.2-.8 2-2 2C9.7 19.5 4.5 14.3 4.5 5.800c0-1.200.8-2 2-2Z" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function SmileIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <circle cx={12} cy={12} r={9} />
      <circle cx={9} cy={10} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={15} cy={10} r={1.1} fill="currentColor" stroke="none" />
      <path d="M8.2 14.2c1 1.500 2.300 2.200 3.800 2.200s2.800-.7 3.800-2.200" />
    </svg>
  );
}
function GalleryIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <rect x={3} y={4} width={18} height={16} rx={3} />
      <circle cx={9} cy={10} r={1.7} />
      <path d="m4 18 5.500-5 4 3.500 2.500-2.200L20 17" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <rect x={9} y={3} width={6} height={11} rx={3} />
      <path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.6}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
function VoiceCallIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#2fa55a">
      <path d="M6.600 2.700c1.100 0 1.800.6 2.100 1.600l.9 2.500c.3.9.1 1.600-.6 2.100l-1.100.8c1 2.300 2.700 4 5 5l.8-1.100c.5-.7 1.200-1 2.100-.6l2.500.9c1 .3 1.600 1 1.600 2.100v2.200c0 1.300-.9 2.200-2.200 2.200C9.500 20.400 3.600 14.500 3.600 5.900c0-1.300.9-2.200 2.200-2.200Z" />
    </svg>
  );
}
function MissedCallIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#e8663a">
      <path d="M12 8.300c-3.300 0-6.400 1.200-8.100 3.100-.6.700-.6 1.700 0 2.400l1 1c.6.600 1.500.6 2.100.1l1.500-1.300c.4-.4.600-.9.500-1.400l-.1-.8c.9-.3 1.900-.4 3.100-.4s2.200.1 3.100.4l-.1.800c-.1.500.1 1 .5 1.400l1.500 1.300c.6.500 1.500.5 2.100-.1l1-1c.6-.7.600-1.700 0-2.400-1.700-1.900-4.800-3.100-8.100-3.100Z" />
    </svg>
  );
}

function MessageRow({ msg }: { msg: KakaoMessage }) {
  if (msg.kind === "dateLabel") {
    return (
      <div className={styles.dateRow}>
        <span className={styles.datePill}>
          {msg.text}
          <ChevronIcon />
        </span>
      </div>
    );
  }
  if (msg.kind === "mine") {
    return (
      <div className={`${styles.row} ${styles.rowMine}`}>
        <span className={styles.time}>{msg.time}</span>
        <div className={`${styles.bubble} ${styles.bubbleMine}`}>{msg.text}</div>
      </div>
    );
  }
  return (
    <div className={styles.theirs}>
      <div className={styles.avatar} />
      <div className={styles.theirsCol}>
        <div className={styles.sender}>지훈</div>
        <div className={styles.row}>
          {msg.kind === "theirs" ? (
            <div className={`${styles.bubble} ${styles.bubbleTheirs}`}>{msg.text}</div>
          ) : (
            <div className={`${styles.bubble} ${styles.bubbleTheirs} ${styles.callCard}`}>
              {msg.variant === "voice" ? <VoiceCallIcon /> : <MissedCallIcon />}
              <span className={styles.callLabel}>{msg.label}</span>
            </div>
          )}
          <span className={styles.time}>{msg.time}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Room 1: a KakaoTalk-style chat (yellow / grey bubbles on white). The
 * input bar works like room 6's — a contentEditable that keeps focus so the
 * device keyboard stays up, with the message area lifted clear of it.
 */
export default function KakaoChatSimulator() {
  const router = useRouter();
  const { feed, hasText, textInputRef, onInput, onKeyDown, send } = useKakaoChatSim();

  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed]);

  return (
    <div className={styles.appShell}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/")} title="กลับไปหน้ารวมแชท">
          <BackIcon />
        </button>
        <div className={styles.title}>지훈</div>
        <div className={styles.headerIcons}>
          <SearchIcon />
          <PhoneIcon />
          <MenuIcon />
        </div>
      </div>

      <div className={styles.feed} ref={feedRef} onClick={() => textInputRef.current?.focus()}>
        <div className={styles.feedInner}>
          {feed.map((m) => (
            <MessageRow key={m.id} msg={m} />
          ))}
        </div>
      </div>

      <div className={styles.inputBar}>
        <span className={styles.plusButton}>
          <PlusIcon />
        </span>
        <div className={styles.inputPill}>
          <div
            ref={textInputRef}
            contentEditable
            suppressContentEditableWarning
            className={styles.textInput}
            role="textbox"
            aria-multiline="false"
            data-placeholder="메시지 입력..."
            onInput={onInput}
            onKeyDown={onKeyDown}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            inputMode="text"
          />
          <span className={styles.pillIcon}>
            <SmileIcon />
          </span>
          <span className={styles.pillIcon}>
            <GalleryIcon />
          </span>
          {hasText ? (
            <button type="button" className={styles.sendButton} onMouseDown={(e) => e.preventDefault()} onClick={send} title="ส่งข้อความ">
              <SendIcon />
            </button>
          ) : (
            <span className={styles.pillIcon}>
              <MicIcon />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
