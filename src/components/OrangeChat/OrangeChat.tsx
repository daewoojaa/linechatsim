"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardReserve } from "@/hooks/useKeyboardReserve";
import styles from "./OrangeChat.module.css";

type Message =
  | { id: string; side: "left" | "right"; kind: "text"; text: string; time: string }
  | { id: string; side: "left" | "right"; kind: "image"; src: string; time: string };

const CONTACT = "미연";

// Received on entering: a reporter from Korea introducing herself, then a picture.
const SCRIPT: Message[] = [
  {
    id: "m1",
    side: "left",
    kind: "text",
    text: "My name is Miyeon and I’m a reporter from Undercover Press in Korea. ",
    time: "16:20",
  },
  { id: "m2", side: "left", kind: "text", text: "I need a video to confirm that this is the real Jihoon.", time: "16:20" },
  { id: "m3", side: "left", kind: "image", src: "/room10-photo.jpg", time: "16:21" },
];

const FALLBACK_KEYBOARD_RESERVE = "43.8dvh";

function nowLabel() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={2.3}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.600 2.700c1.100 0 1.800.6 2.100 1.600l.9 2.500c.3.900.1 1.600-.6 2.100l-1.100.8c1 2.300 2.700 4 5 5l.8-1.100c.5-.7 1.200-1 2.100-.6l2.500.9c1 .3 1.600 1 1.600 2.100v2.200c0 1.300-.9 2.200-2.200 2.200C9.500 20.400 3.600 14.500 3.600 5.900c0-1.300.9-2.200 2.200-2.200Z" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor">
      <rect x={2.500} y={6} width={13} height={12} rx={3} />
      <path d="m17 10.200 4-2.500c.5-.3 1.100 0 1.100.6v7.400c0 .6-.6.900-1.100.6l-4-2.500Z" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx={5} cy={12} r={1.900} />
      <circle cx={12} cy={12} r={1.900} />
      <circle cx={19} cy={12} r={1.900} />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2.600}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function SmileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <circle cx={12} cy={12} r={9} />
      <circle cx={9} cy={10} r={1} fill="currentColor" stroke="none" />
      <circle cx={15} cy={10} r={1} fill="currentColor" stroke="none" />
      <path d="M8.300 14.300c1 1.500 2.200 2.200 3.700 2.200s2.700-.7 3.700-2.200" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x={9} y={3} width={6} height={11} rx={3} />
      <path d="M5.500 11.500a6.500 6.500 0 0 0 13 0h-2a4.500 4.500 0 0 1-9 0h-2ZM11 18h2v3h-2z" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 11.500 20.500 3l-5 17-5.200-6.300L3 11.500Z" />
    </svg>
  );
}
function DoubleCheck() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} strokeWidth={2.400}>
      <path d="m1.500 13 4.500 4.500L14.500 8M10 17.500l1 1L21 8" />
    </svg>
  );
}

/**
 * Room 10: a warm orange chat. "미연" (Miyeon), a reporter from Korea, has
 * already sent two lines and a picture; what is typed goes out as orange
 * bubbles on the right. Tapping a picture opens it full screen.
 */
export default function OrangeChat() {
  const router = useRouter();
  const [feed, setFeed] = useState<Message[]>(SCRIPT);
  const [hasText, setHasText] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const textInputRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const keyboardReserve = useKeyboardReserve(textInputRef, FALLBACK_KEYBOARD_RESERVE);

  // Cursor in the input on entering, so the device keyboard is up.
  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  // Keep the newest message pinned above the input bar as the chat or the
  // space under it changes size (new messages, keyboard up / down).
  useEffect(() => {
    const scroller = feedRef.current;
    const inner = scroller?.firstElementChild;
    if (!scroller || !inner) return;
    const toBottom = () => {
      scroller.scrollTop = scroller.scrollHeight;
    };
    const observer = new ResizeObserver(toBottom);
    observer.observe(inner);
    observer.observe(scroller);
    toBottom();
    return () => observer.disconnect();
  }, []);

  const send = useCallback(() => {
    const el = textInputRef.current;
    const text = (el?.textContent ?? "").trim();
    if (!text) {
      el?.focus();
      return;
    }
    idRef.current += 1;
    setFeed((prev) => [...prev, { id: `r${idRef.current}`, side: "right", kind: "text", text, time: nowLabel() }]);
    if (el) {
      el.textContent = "";
      // Keep the keyboard (and cursor) up across sends.
      el.focus();
    }
    setHasText(false);
  }, []);

  const openViewer = (src: string) => {
    textInputRef.current?.blur();
    setViewing(src);
  };
  const closeViewer = () => {
    setViewing(null);
    textInputRef.current?.focus();
  };

  return (
    <div className={styles.shell} style={{ paddingBottom: keyboardReserve }}>
      <div className={styles.header}>
        <button type="button" className={styles.back} onClick={() => router.push("/")} aria-label="กลับไปหน้ารวมแชท">
          <BackIcon />
        </button>
        <span className={styles.headerAvatar} />
        <div className={styles.headerText}>
          <div className={styles.name}>{CONTACT}</div>
          <div className={styles.status}>ออนไลน์</div>
        </div>
        <div className={styles.headerIcons}>
          <PhoneIcon />
          <VideoIcon />
          <DotsIcon />
        </div>
      </div>

      <div className={styles.feed} ref={feedRef} onClick={() => textInputRef.current?.focus()}>
        <div className={styles.feedInner}>
          {feed.map((m) => {
            const mine = m.side === "right";
            if (m.kind === "image") {
              return (
                <div key={m.id} className={mine ? styles.rowRight : styles.rowLeft}>
                  <div className={styles.imageFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset */}
                    <img
                      src={m.src}
                      className={styles.image}
                      alt=""
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewer(m.src);
                      }}
                    />
                    <span className={styles.imageTime}>{m.time}</span>
                  </div>
                </div>
              );
            }
            return mine ? (
              <div key={m.id} className={styles.rowRight}>
                <div className={styles.bubbleMine}>
                  <span>{m.text}</span>
                  <span className={styles.metaMine}>
                    {m.time}
                    <DoubleCheck />
                  </span>
                </div>
              </div>
            ) : (
              <div key={m.id} className={styles.rowLeft}>
                <div className={styles.bubbleTheirs}>{m.text}</div>
                <span className={styles.timeTheirs}>{m.time}</span>
              </div>
            );
          })}
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
            data-placeholder="พิมพ์ข้อความ..."
            onInput={(e) => setHasText((e.currentTarget.textContent ?? "").trim().length > 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            inputMode="text"
          />
          <span className={styles.smile}>
            <SmileIcon />
          </span>
        </div>
        <button
          type="button"
          className={styles.micButton}
          onMouseDown={(e) => e.preventDefault()}
          onClick={hasText ? send : undefined}
          aria-label={hasText ? "ส่งข้อความ" : "ข้อความเสียง"}
        >
          {hasText ? <SendIcon /> : <MicIcon />}
        </button>
      </div>

      {viewing && (
        <div className={styles.viewer} onClick={closeViewer}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset */}
          <img src={viewing} className={styles.viewerImage} alt="" />
          <button type="button" className={styles.viewerClose} onClick={closeViewer} aria-label="ปิด">
            <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
