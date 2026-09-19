"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMultiImageChatSim } from "@/hooks/useMultiImageChatSim";
import {
  BackArrowIcon,
  ChevronRightIcon,
  CloseXIcon,
  EmojiIcon,
  MenuIcon,
  MicIcon,
  PhoneIcon,
  SearchIcon,
  SendArrowIcon,
} from "@/components/icons/Icons";
import styles from "./MultiImageChatSimulator.module.css";

type Props = {
  roomId: string;
  defaultRoomName: string;
  slotCount: number;
  /** See useMultiImageChatSim's own doc comment. */
  defaultImages?: string[];
  /** Where the "จัดการรูปภาพ" icon navigates — a dedicated page (see
   *  ManageImages) for uploading/replacing any of the slotCount images,
   *  since there's no way to fit that many per-slot picker icons in the
   *  header the way the fixed-4-image ChatSimulator does. */
  manageHref: string;
  /** A public/ asset path painted behind the header bar (room name row)
   *  instead of the default transparent header. */
  headerBackground?: string;
  /** See useMultiImageChatSim's own doc comment. */
  autoAdvance?: { from: number; to: number; delaysMs: number[] }[];
  /** Tapping the mic icon (input empty) opens a "tap to record a voice
   *  message" panel below the input bar instead of advancing the image —
   *  purely a UI simulation, no real recording happens. Off by default so
   *  existing rooms keep their current mic-advances-the-image behavior.
   *  Tapping that panel plays voiceRecordVideo in its place (simulating
   *  an active recording); tapping again while it plays advances the chat
   *  image and returns to the static panel, ready for another "recording". */
  enableVoiceRecord?: boolean;
  /** A public/ asset path (mp4) played while "recording" — see
   *  enableVoiceRecord. Required for that feature to do anything once the
   *  panel itself is tapped. */
  voiceRecordVideo?: string;
  /** A public/ asset path (image) shown for the static "tap to record"
   *  prompt instead of the built-in text + red-dot circle. */
  voiceRecordPanelImage?: string;
  /** White header text/icons (default, matches room 7's dark banner) or
   *  black (for a light wallpaper showing through a transparent header,
   *  like room 10's). */
  headerTint?: "light" | "dark";
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
  defaultImages,
  manageHref,
  headerBackground,
  autoAdvance,
  enableVoiceRecord,
  voiceRecordVideo,
  voiceRecordPanelImage,
  headerTint = "light",
}: Props) {
  const iconColor = headerTint === "dark" ? "#1c1c1e" : "#ffffff";
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
  } = useMultiImageChatSim({ roomId, defaultRoomName, slotCount, defaultImages, autoAdvance });

  const openManage = () => router.push(manageHref);
  const [hasText, setHasText] = useState(false);
  const [panelImageFailed, setPanelImageFailed] = useState(false);
  // "closed": normal texting mode. "panel": the static "tap to record"
  // prompt is showing. "recording": the stand-in video is playing in its
  // place, simulating an in-progress recording.
  const [voiceStage, setVoiceStage] = useState<"closed" | "panel" | "recording">("closed");
  const showRecordArea = voiceStage !== "closed";

  const advanceAndClear = () => {
    onChatImageTap();
    setText("");
    setHasText(false);
    if (textInputRef.current) {
      textInputRef.current.textContent = "";
      // Keep the real keyboard (and cursor) open across sends — without
      // this the button tap would steal focus and dismiss it.
      textInputRef.current.focus();
    }
  };

  const onMicButtonClick = () => {
    if (hasText) {
      advanceAndClear();
      return;
    }
    if (enableVoiceRecord) {
      if (voiceStage === "closed") {
        setVoiceStage("panel");
      } else {
        setVoiceStage("closed");
        // Closing back to texting mode (the "X") should drop the cursor
        // straight into the input, same as advanceAndClear does.
        textInputRef.current?.focus();
      }
      return;
    }
    advanceAndClear();
  };

  /** Tapping the record panel/video itself: start "recording" (play the
   *  video), or if already playing, finish it — advancing the chat image
   *  and returning to the static panel, ready to "record" again. */
  const onRecordAreaTap = () => {
    if (voiceStage === "panel") {
      setVoiceStage("recording");
    } else if (voiceStage === "recording") {
      onChatImageTap();
      setVoiceStage("panel");
    }
  };

  return (
    <div className={styles.appShell}>
      <div className={styles.backgroundLayer}>
        <div
          className={styles.backgroundImage}
          style={{ backgroundImage: background ? `url("${background}")` : "none" }}
        />
      </div>

      <div className={styles.contentColumn} data-panel-open={showRecordArea || undefined}>
        {/* 1. Header bar */}
        <div
          className={styles.header}
          style={{ backgroundImage: headerBackground ? `url("${headerBackground}")` : undefined }}
        >
          <button type="button" className={styles.backButton} onClick={showFirst} title="กลับไปรูปแรก">
            <BackArrowIcon color={iconColor} />
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
            <div className={styles.roomNameText} style={{ color: iconColor }} onClick={startEditName} title="แก้ไขชื่อห้องแชท">
              {roomName}
            </div>
          )}

          <div className={styles.headerIcons}>
            <button type="button" className={styles.iconButton} tabIndex={-1}>
              <SearchIcon color={iconColor} />
            </button>
            <button type="button" className={styles.iconButton} tabIndex={-1}>
              <PhoneIcon color={iconColor} />
            </button>
            <button type="button" className={styles.iconButton} onClick={openManage} title="จัดการรูปภาพ">
              <MenuIcon color={iconColor} />
              <span className={styles.badgeDot} />
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

          <button
            type="button"
            className={styles.sendButton}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onMicButtonClick}
            title={showRecordArea ? "กลับไปพิมพ์ข้อความ" : "รูปถัดไป"}
          >
            {hasText ? <SendArrowIcon /> : showRecordArea ? <CloseXIcon /> : <MicIcon />}
          </button>
        </div>

        {/* 4. Voice-record simulation panel — replaces the keyboard's
            reserved space below the input bar while open. Tapping it
            swaps the static prompt for a looping "recording" video;
            tapping again advances the chat image and swaps back. */}
        {voiceStage === "panel" && (
          <div className={styles.recordPanel} onClick={onRecordAreaTap}>
            {voiceRecordPanelImage && !panelImageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element -- static public/ asset, no next/image optimization needed
              <img
                src={voiceRecordPanelImage}
                className={styles.recordPanelImage}
                alt="แตะเพื่อบันทึกข้อความเสียง"
                onError={() => setPanelImageFailed(true)}
              />
            ) : (
              <>
                <div className={styles.recordHint}>แตะเพื่อบันทึกข้อความเสียง</div>
                <div className={styles.recordButton}>
                  <span className={styles.recordDot} />
                </div>
              </>
            )}
          </div>
        )}
        {voiceStage === "recording" && (
          <div className={styles.recordPanel} onClick={onRecordAreaTap}>
            {voiceRecordVideo && (
              <video className={styles.recordVideo} src={voiceRecordVideo} autoPlay loop muted playsInline />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
