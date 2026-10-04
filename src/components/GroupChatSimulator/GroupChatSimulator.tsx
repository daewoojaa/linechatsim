"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupChatSim, type GroupMessage } from "@/hooks/useGroupChatSim";
import {
  BackArrowIcon,
  ChevronRightIcon,
  EmojiIcon,
  MenuIcon,
  MicIcon,
  PhoneIcon,
  SearchIcon,
  SendArrowIcon,
} from "@/components/icons/Icons";
// Same look as room 6 (header, bubbles, input bar): its stylesheet is reused
// as-is, with only the group-specific bits in this component's own sheet.
import base from "../LiveChatSimulator/LiveChatSimulator.module.css";
import extra from "./GroupChatSimulator.module.css";

const ROOM_NAME = "ลูกหนี้ไม่หนีไปไหน (10,975)";
const HEADER_COLOR = "#ffffff";

/**
 * Room 2: a LINE group chat on a picture background, built from room 6's
 * design. The ">" at the left of the input bar picks a picture to send; the
 * phone icon at the top right sets how high the "อ่านแล้ว" count runs.
 */
export default function GroupChatSimulator() {
  const router = useRouter();
  const {
    feed,
    hasText,
    readCount,
    maxRead,
    setMaxRead,
    textInputRef,
    imageInputRef,
    onInput,
    onKeyDown,
    send,
    requestPickImage,
    handleImageChange,
  } = useGroupChatSim();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState(maxRead);

  const feedRef = useRef<HTMLDivElement>(null);
  const showingRead = readCount !== null;
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed, showingRead]);

  const openDialog = () => {
    setDraft(maxRead);
    textInputRef.current?.blur();
    setDialogOpen(true);
  };
  const saveDialog = () => {
    const n = parseInt(draft, 10);
    if (n >= 1) setMaxRead(String(n));
    setDialogOpen(false);
    textInputRef.current?.focus();
  };

  const row = (m: GroupMessage) => {
    if (m.side === "left") {
      return (
        <div key={m.id} className={extra.leftRow}>
          <div className={extra.avatar} />
          <div className={extra.leftCol}>
            <div className={extra.sender}>{m.sender}</div>
            <div className={base.row}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset */}
              <img src={m.src} className={`${extra.bubbleImage} ${extra.leftImage}`} alt="" />
              <span className={base.time}>{m.time}</span>
            </div>
          </div>
        </div>
      );
    }
    const meta = (
      <div className={extra.meta}>
        {m.kind === "text" && m.readable && readCount !== null && <span className={base.time}>อ่านแล้ว {readCount}</span>}
        <span className={base.time}>{m.time}</span>
      </div>
    );
    return (
      <div key={m.id} className={base.row}>
        {meta}
        {m.kind === "text" ? (
          <div className={base.bubble}>{m.text}</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL of the picked picture
          <img src={m.src} className={`${extra.bubbleImage} ${extra.rightImage}`} alt="" />
        )}
      </div>
    );
  };

  return (
    <div
      className={base.appShell}
      style={{
        background: "#2a1d10 url(/room2-bg.webp) center / cover no-repeat",
        ["--time-color" as string]: "#f6ecd2",
      }}
    >
      <div className={base.contentColumn}>
        <div className={base.header}>
          <button type="button" className={base.backButton} onClick={() => router.push("/")} title="กลับไปหน้ารวมแชท">
            <BackArrowIcon color={HEADER_COLOR} />
          </button>
          <div className={base.roomNameText} style={{ color: HEADER_COLOR, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {ROOM_NAME}
          </div>
          <div className={base.headerIcons}>
            <span className={base.iconButton}>
              <SearchIcon color={HEADER_COLOR} />
            </span>
            <button
              type="button"
              className={base.iconButton}
              onMouseDown={(e) => e.preventDefault()}
              onClick={openDialog}
              title={`ตั้งจำนวนคนอ่านสูงสุด (ตอนนี้ ${maxRead})`}
            >
              <PhoneIcon color={HEADER_COLOR} />
            </button>
            <span className={base.iconButton}>
              <MenuIcon color={HEADER_COLOR} />
              <span className={base.badgeDot} />
            </span>
          </div>
        </div>

        <div className={base.feed} ref={feedRef} onClick={() => textInputRef.current?.focus()}>
          <div className={base.feedInner}>{feed.map(row)}</div>
        </div>

        <div className={base.inputBar}>
          <button
            type="button"
            className={base.chevronButton}
            onMouseDown={(e) => e.preventDefault()}
            onClick={requestPickImage}
            title="เลือกรูปภาพเพื่อส่ง"
          >
            <ChevronRightIcon />
          </button>
          <div className={base.inputPill}>
            <div
              ref={textInputRef}
              contentEditable
              suppressContentEditableWarning
              className={base.textInput}
              role="textbox"
              aria-multiline="false"
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
            <span className={base.emojiButton}>
              <EmojiIcon />
            </span>
          </div>
          {hasText ? (
            <button type="button" className={base.sendButton} onMouseDown={(e) => e.preventDefault()} onClick={send} title="ส่งข้อความ">
              <SendArrowIcon />
            </button>
          ) : (
            <span className={base.sendButton}>
              <MicIcon />
            </span>
          )}
        </div>
      </div>

      {dialogOpen && (
        <div className={extra.dialogBackdrop} onClick={saveDialog}>
          <div className={extra.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={extra.dialogTitle}>จำนวนคนอ่านสูงสุด</div>
            <input
              className={extra.dialogInput}
              value={draft}
              inputMode="numeric"
              autoFocus
              onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDialog();
              }}
            />
            <div className={extra.dialogHint}>ตัวเลขจะวิ่งจาก 1 ถึงค่านี้ ภายใน 10 วินาที</div>
            <button type="button" className={extra.dialogOk} onClick={saveDialog}>
              ตกลง
            </button>
          </div>
        </div>
      )}

      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} hidden />
    </div>
  );
}
