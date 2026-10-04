"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
const NAME_MAX_PX = 21;
const NAME_MIN_PX = 9;
// The device's own UI font (Thai falls back to whatever the system provides).
const SYSTEM_FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Thai', sans-serif";

/**
 * Room 2: a LINE group chat on a picture background, built from room 6's
 * design. The ">" at the left of the input bar picks a picture to send; the
 * phone icon at the top right sets how high the "อ่านแล้ว" count runs; the ☰
 * icon flips the scripted messages to the other side (see useGroupChatSim).
 * Tapping any picture in the chat opens it full screen.
 */
export default function GroupChatSimulator() {
  const router = useRouter();
  const {
    feed,
    hasText,
    readCount,
    maxRead,
    setMaxRead,
    mirrored,
    toggleMirrored,
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
  const [viewing, setViewing] = useState<string | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);

  // Room name: shrink the text just enough to show all of it on one line,
  // whatever the device's font or screen width (re-fit on resize and once
  // fonts have loaded).
  const nameRef = useRef<HTMLDivElement>(null);
  const nameTextRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = nameRef.current;
    const text = nameTextRef.current;
    if (!el || !text) return;
    const fit = () => {
      let size = NAME_MAX_PX;
      el.style.fontSize = `${size}px`;
      // The inline span keeps the text's natural width even when it overflows
      // the (clipped) box, unlike scrollWidth which is integer-rounded and
      // can't tell "fits exactly" from "fits with room".
      while (text.getBoundingClientRect().width > el.clientWidth - 1 && size > NAME_MIN_PX) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);
  const showingRead = readCount !== null;
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed, showingRead]);

  // Pictures load after their message is added, which makes the chat taller
  // than the scroll that followed the add: keep it pinned to the bottom for
  // any size change so the newest message (timestamp included) stays in view.
  useEffect(() => {
    const inner = feedRef.current?.firstElementChild;
    if (!inner) return;
    const observer = new ResizeObserver(() => {
      const el = feedRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

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

  // Full-screen picture: the keyboard comes down while it is up and returns
  // when it closes.
  const openViewer = (src: string) => {
    textInputRef.current?.blur();
    setViewing(src);
  };
  const closeViewer = () => {
    setViewing(null);
    textInputRef.current?.focus();
  };

  const picture = (src: string, className: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- static public/ asset or blob URL of a picked picture
    <img
      src={src}
      className={`${extra.bubbleImage} ${className}`}
      alt=""
      onClick={(e) => {
        e.stopPropagation();
        openViewer(src);
      }}
    />
  );

  const row = (m: GroupMessage) => {
    if (m.side === "left") {
      return (
        <div key={m.id} className={extra.leftRow}>
          <div
            className={extra.avatar}
            // The logo avatar (a PNG) is shown whole; photos fill the circle.
            style={{ backgroundImage: `url(${m.avatar})`, backgroundSize: m.avatar.endsWith(".png") ? "contain" : "cover" }}
          />
          <div className={extra.leftCol}>
            <div className={extra.sender}>{m.sender}</div>
            <div className={`${base.row} ${extra.leftBubbleRow}`}>
              {m.kind === "image" ? (
                picture(m.src, extra.leftImage)
              ) : (
                <div className={`${base.bubble} ${extra.leftBubble}`}>{m.text}</div>
              )}
              <span className={base.time}>{m.time}</span>
            </div>
          </div>
        </div>
      );
    }
    const meta = (
      <div className={extra.meta}>
        {m.readable && readCount !== null && <span className={base.time}>อ่านแล้ว {readCount}</span>}
        <span className={base.time}>{m.time}</span>
      </div>
    );
    return (
      <div key={m.id} className={base.row}>
        {meta}
        {m.kind === "text" ? <div className={base.bubble}>{m.text}</div> : picture(m.src, extra.rightImage)}
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
          <div
            ref={nameRef}
            className={base.roomNameText}
            style={{ color: HEADER_COLOR, textShadow: "0 1px 4px rgba(0,0,0,0.5)", fontFamily: SYSTEM_FONT, textOverflow: "clip" }}
          >
            <span ref={nameTextRef}>{ROOM_NAME}</span>
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
            <button
              type="button"
              className={base.iconButton}
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleMirrored}
              title={mirrored ? "กลับมุมมองเดิม" : "สลับข้อความอัตโนมัติไปฝั่งซ้าย"}
            >
              <MenuIcon color={HEADER_COLOR} />
              <span className={base.badgeDot} />
            </button>
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
            <div className={extra.dialogHint}>ตัวเลขจะวิ่งจาก 1 ถึงค่านี้ ภายใน 15 วินาที (1–10 ใช้ราว 5 วินาที)</div>
            <button type="button" className={extra.dialogOk} onClick={saveDialog}>
              ตกลง
            </button>
          </div>
        </div>
      )}

      {viewing && (
        <div className={extra.viewer} onClick={closeViewer}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset or blob URL */}
          <img src={viewing} className={extra.viewerImage} alt="" />
          <button type="button" className={extra.viewerClose} onClick={closeViewer} aria-label="ปิด">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}

      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} hidden />
    </div>
  );
}
