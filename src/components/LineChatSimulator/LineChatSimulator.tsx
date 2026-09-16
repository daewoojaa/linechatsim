"use client";

import { useEffect, useRef, useState } from "react";
import { useLineChatSim } from "@/hooks/useLineChatSim";
import { BackArrowIcon, ChevronRightIcon, EmojiIcon, MenuIcon, MicIcon, SendArrowIcon } from "@/components/icons/Icons";
import type { DisplayMessage } from "@/hooks/useLineChatSim";
import { computeReadReceipt, type ReadReceiptConfig } from "@/lib/scriptedMessage";
import styles from "./LineChatSimulator.module.css";

type Props = {
  roomId: string;
  defaultRoomName: string;
  defaultBackground?: string;
  /** Where the "จัดการข้อความ" icon navigates — the script-authoring page. */
  manageHref: string;
};

function AvatarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#c7c7cc">
      <circle cx={12} cy={8.5} r={4.5} />
      <path d="M4 20.5c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" />
    </svg>
  );
}

function MessageRow({ item, readConfig, now }: { item: DisplayMessage; readConfig: ReadReceiptConfig; now: number }) {
  if (item.kind === "live") {
    const receipt = computeReadReceipt(item.sentAt, now, readConfig);
    return (
      <div className={`${styles.row} ${styles.rowOut}`}>
        <div className={styles.meta}>
          {receipt !== null && <span>อ่านแล้ว {receipt}</span>}
          <span className={styles.metaTime}>{item.time}</span>
        </div>
        <div className={`${styles.bubble} ${styles.bubbleOut}`}>{item.text}</div>
      </div>
    );
  }

  const { msg } = item;

  return (
    <div className={`${styles.row} ${styles.rowIn}`}>
      <div className={styles.avatar}>
        <AvatarIcon />
      </div>

      {msg.kind === "card" ? (
        <div className={styles.card}>
          <div className={styles.cardBody}>
            {msg.cardApp && <div className={styles.cardApp}>{msg.cardApp}</div>}
            {msg.cardTitle && <div className={styles.cardTitle}>{msg.cardTitle}</div>}
            {msg.cardSubtitle && <div className={styles.cardSubtitle}>{msg.cardSubtitle}</div>}
            {msg.cardUrl && (
              <>
                <div className={styles.cardDivider} />
                <div className={styles.cardUrl}>{msg.cardUrl}</div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={`${styles.bubble} ${styles.bubbleIn}`}>{msg.text}</div>
      )}

      {msg.time && (
        <div className={`${styles.meta} ${styles.metaIn}`}>
          <span className={styles.metaTime}>{msg.time}</span>
        </div>
      )}
    </div>
  );
}

/**
 * A "real" functioning LINE-style chat: a persistent background wallpaper
 * (the movie poster for room 1) with a growing feed of message bubbles on
 * top, blue instead of LINE's green. Tapping the feed reveals the next
 * pre-authored incoming message (see the "จัดการข้อความ" page); the real
 * keyboard input actually sends — typed text becomes the operator's own
 * outgoing bubble on the right, for cueing a line live during a take.
 */
export default function LineChatSimulator({ roomId, defaultRoomName, defaultBackground, manageHref }: Props) {
  const {
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName,
    onNameKeyDown,
    nameInputRef,

    background,
    feed,
    readConfig,
    now,
    revealNext,
    resetConversation,

    setText,
    textInputRef,
    onInputKeyDown,
    sendLive,
  } = useLineChatSim({ roomId, defaultRoomName, defaultBackground });

  const feedRef = useRef<HTMLDivElement>(null);
  const [hasText, setHasText] = useState(false);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed]);

  return (
    <div className={styles.appShell}>
      <div className={styles.backgroundLayer}>
        <div
          className={styles.backgroundImage}
          style={{ backgroundImage: background ? `url("${background}")` : "none" }}
        />
      </div>

      <div className={styles.contentColumn}>
        {/* 1. Header — back arrow resets the feed for the next take */}
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={resetConversation} title="เริ่มบทสนทนาใหม่">
            <BackArrowIcon />
          </button>

          {editingName ? (
            <input
              className={styles.roomNameInput}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onBlur={stopEditName}
              onKeyDown={onNameKeyDown}
              ref={nameInputRef}
            />
          ) : (
            <div className={styles.roomNameText} onClick={startEditName} title="แก้ไขชื่อห้องแชท">
              {roomName}
            </div>
          )}

          <a href={manageHref} className={styles.iconButton} title="จัดการข้อความ">
            <MenuIcon />
          </a>
        </div>

        {/* 2. Message feed — tap anywhere to reveal the next scripted message */}
        <div className={styles.feed} ref={feedRef} onClick={revealNext}>
          {feed.map((item) => (
            <MessageRow key={item.key} item={item} readConfig={readConfig} now={now} />
          ))}
        </div>

        {/* 3. Input bar — a real, working send (unlike ChatSimulator's decoy) */}
        <div className={styles.inputBar}>
          <button type="button" className={styles.chevronButton} tabIndex={-1}>
            <ChevronRightIcon />
          </button>

          <div className={styles.inputPill}>
            <div
              ref={textInputRef}
              contentEditable
              suppressContentEditableWarning
              className={styles.textInput}
              role="textbox"
              aria-multiline="false"
              data-placeholder=""
              onInput={(e) => {
                const value = e.currentTarget.textContent ?? "";
                setText(value);
                setHasText(value.trim().length > 0);
              }}
              onKeyDown={onInputKeyDown}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              inputMode="text"
            />
            <button type="button" className={styles.emojiButton} tabIndex={-1}>
              <EmojiIcon />
            </button>
          </div>

          <button
            type="button"
            className={styles.sendButton}
            onClick={() => {
              sendLive();
              setHasText(false);
            }}
            title="ส่ง"
          >
            {hasText ? <SendArrowIcon /> : <MicIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
