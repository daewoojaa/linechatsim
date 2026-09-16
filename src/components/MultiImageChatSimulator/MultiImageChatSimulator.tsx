"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMultiImageChatSim } from "@/hooks/useMultiImageChatSim";
import { BackArrowIcon, ChevronRightIcon, EmojiIcon, MenuIcon, MicIcon, SendArrowIcon } from "@/components/icons/Icons";
import styles from "./MultiImageChatSimulator.module.css";

type Props = {
  roomId: string;
  defaultRoomName: string;
  slotCount: number;
  defaultImage0?: string;
  /** Where the "จัดการรูปภาพ" icon navigates — a dedicated page (see
   *  ManageImages) for uploading/replacing any of the slotCount images,
   *  since there's no way to fit that many per-slot picker icons in the
   *  header the way the fixed-4-image ChatSimulator does. */
  manageHref: string;
  /** A public/ asset path painted behind the header bar (room name row)
   *  instead of the default transparent header. */
  headerBackground?: string;
};

/**
 * Same overall chrome as ChatSimulator (header/room-name-edit, chat image
 * zone) but generalized for a room with an arbitrary number of sequential
 * chat-image screenshots instead of a fixed 4 with a scripted reveal, and
 * using LineChatSimulator's input bar (chevron / pill / emoji / mic-or-send)
 * instead of ChatSimulator's own — the blue send arrow advances to the next
 * uploaded image rather than sending a live message, same as tapping the
 * chat image itself.
 */
export default function MultiImageChatSimulator({
  roomId,
  defaultRoomName,
  slotCount,
  defaultImage0,
  manageHref,
  headerBackground,
}: Props) {
  const router = useRouter();
  const {
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName,
    onNameKeyDown,
    nameInputRef,

    background,
    displayedChatSrc,
    showFirst,

    setText,
    blockEnter,
    textInputRef,

    onChatImageTap,
  } = useMultiImageChatSim({ roomId, defaultRoomName, slotCount, defaultImage0 });

  const openManage = () => router.push(manageHref);
  const [hasText, setHasText] = useState(false);

  const advanceAndClear = () => {
    onChatImageTap();
    setText("");
    setHasText(false);
    if (textInputRef.current) textInputRef.current.textContent = "";
  };

  return (
    <div className={styles.appShell}>
      <div className={styles.backgroundLayer}>
        <div
          className={styles.backgroundImage}
          style={{ backgroundImage: background ? `url("${background}")` : "none" }}
        />
      </div>

      <div className={styles.contentColumn}>
        {/* 1. Header bar */}
        <div
          className={styles.header}
          style={{ backgroundImage: headerBackground ? `url("${headerBackground}")` : undefined }}
        >
          <button type="button" className={styles.backButton} onClick={showFirst} title="กลับไปรูปแรก">
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

          <div className={styles.headerIcons}>
            <button type="button" className={styles.iconButton} onClick={openManage} title="จัดการรูปภาพ">
              <MenuIcon />
            </button>
          </div>
        </div>

        {/* 2. Chat image zone — tapping it reveals the next uploaded image */}
        <div className={styles.chatZone} onClick={onChatImageTap}>
          <div
            className={styles.chatImage}
            style={{ backgroundImage: displayedChatSrc ? `url("${displayedChatSrc}")` : "none" }}
          />
        </div>

        {/* 3. Input bar (LineChatSimulator's design) — the blue arrow
            advances to the next image instead of sending a live message. */}
        <div className={styles.inputBar}>
          <button type="button" className={styles.chevronButton} onClick={() => router.push("/")} title="กลับไปหน้ารวมแชท">
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
              onKeyDown={blockEnter}
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

          <button type="button" className={styles.sendButton} onClick={advanceAndClear} title="รูปถัดไป">
            {hasText ? <SendArrowIcon /> : <MicIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
