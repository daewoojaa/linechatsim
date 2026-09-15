"use client";

import { useEffect, useRef } from "react";
import { useLineChatSim } from "@/hooks/useLineChatSim";
import { BackArrowIcon, MenuIcon } from "@/components/icons/Icons";
import type { DisplayMessage } from "@/hooks/useLineChatSim";
import styles from "./LineChatSimulator.module.css";

type Props = {
  roomId: string;
  defaultRoomName: string;
  defaultBackground?: string;
  /** Where the "จัดการข้อความ" icon navigates — the script-authoring page. */
  manageHref: string;
};

function SendIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 11.5 20.5 3l-5 17-5.2-6.3L3 11.5Z" />
    </svg>
  );
}

function MessageRow({ item }: { item: DisplayMessage }) {
  if (item.kind === "live") {
    return (
      <div className={`${styles.row} ${styles.rowIn}`}>
        <div className={styles.bubble + " " + styles.bubbleIn}>{item.text}</div>
        <div className={`${styles.meta} ${styles.metaIn}`}>
          <span>{item.time}</span>
        </div>
      </div>
    );
  }

  const { msg } = item;
  const hasReceipt = msg.readFrom !== undefined && msg.readTo !== undefined;

  return (
    <div className={`${styles.row} ${styles.rowOut}`}>
      {(hasReceipt || msg.time) && (
        <div className={styles.meta}>
          {hasReceipt && (
            <span>
              อ่านแล้ว {msg.readFrom}&gt;{msg.readTo}
            </span>
          )}
          {msg.time && <span>{msg.time}</span>}
        </div>
      )}

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
        <div className={`${styles.bubble} ${styles.bubbleOut}`}>{msg.text}</div>
      )}
    </div>
  );
}

/**
 * A "real" functioning LINE-style chat: a persistent background wallpaper
 * (the movie poster for room 1) with a growing feed of message bubbles on
 * top, blue instead of LINE's green. Tapping the feed reveals the next
 * pre-authored outgoing message (see the "จัดการข้อความ" page); the real
 * keyboard input actually sends — typed text becomes an incoming-style
 * bubble on the left, for cueing a reply live during a take.
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
    revealNext,
    resetConversation,

    setText,
    textInputRef,
    onInputKeyDown,
    sendLive,
  } = useLineChatSim({ roomId, defaultRoomName, defaultBackground });

  const feedRef = useRef<HTMLDivElement>(null);

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
            <MessageRow key={item.key} item={item} />
          ))}
        </div>

        {/* 3. Input bar — a real, working send (unlike ChatSimulator's decoy) */}
        <div className={styles.inputBar}>
          <div className={styles.inputPill}>
            <div
              ref={textInputRef}
              contentEditable
              suppressContentEditableWarning
              className={styles.textInput}
              role="textbox"
              aria-multiline="false"
              data-placeholder="พิมพ์ข้อความ"
              onInput={(e) => setText(e.currentTarget.textContent ?? "")}
              onKeyDown={onInputKeyDown}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              inputMode="text"
            />
          </div>
          <button type="button" className={styles.sendButton} onClick={sendLive} title="ส่ง">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
