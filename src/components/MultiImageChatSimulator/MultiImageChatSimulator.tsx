"use client";

import { useRouter } from "next/navigation";
import { useMultiImageChatSim } from "@/hooks/useMultiImageChatSim";
import { BackArrowIcon, KeyboardGlyphIcon, MenuIcon, StickerGlyphIcon } from "@/components/icons/Icons";
import StickerCell from "@/components/ChatSimulator/StickerCell";
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
};

/**
 * Same overall chrome as ChatSimulator (header/room-name-edit, chat image
 * zone, input bar, keyboard/sticker toggle, sticker panel) but generalized
 * for a room with an arbitrary number of sequential chat-image screenshots
 * instead of a fixed 4 with a scripted reveal. Tapping the chat image or a
 * sticker just reveals the next uploaded image down the line.
 */
export default function MultiImageChatSimulator({ roomId, defaultRoomName, slotCount, defaultImage0, manageHref }: Props) {
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

    mode,
    toggleMode,

    setText,
    blockEnter,
    textInputRef,

    stickers,
    onStickerTap,
    onChatImageTap,
    onPanelBackgroundTap,

    stickerInputRef,
    handleStickerFilesChange,
  } = useMultiImageChatSim({ roomId, defaultRoomName, slotCount, defaultImage0 });

  const openManage = () => router.push(manageHref);

  return (
    <div className={styles.appShell}>
      <div className={styles.backgroundLayer}>
        <div
          className={styles.backgroundImage}
          style={{ backgroundImage: background ? `url("${background}")` : "none" }}
        />
      </div>

      <div className={styles.contentColumn} data-mode={mode}>
        {/* 1. Header bar */}
        <div className={styles.header}>
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

        {/* 3. Message input bar */}
        <div className={styles.inputBar}>
          <button type="button" className={styles.chevronButton} onClick={openManage} title="จัดการรูปภาพ">
            <MenuIcon />
          </button>

          <div className={styles.inputPill}>
            {/* contentEditable instead of <input> — Chrome only shows its
                key/card/location autofill accessory bar above the keyboard
                for real form fields, so a div here keeps that bar off. */}
            <div
              ref={textInputRef}
              contentEditable
              suppressContentEditableWarning
              className={styles.textInput}
              role="textbox"
              aria-multiline="false"
              data-placeholder=""
              onInput={(e) => setText(e.currentTarget.textContent ?? "")}
              onKeyDown={blockEnter}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              inputMode="text"
            />
            <button
              type="button"
              className={styles.modeButton}
              onClick={toggleMode}
              title="สลับคีย์บอร์ด / สติ๊กเกอร์"
            >
              {mode === "keyboard" ? <KeyboardGlyphIcon /> : <StickerGlyphIcon />}
            </button>
          </div>
        </div>

        {/* 4. Bottom zone: sticker panel (keyboard mode relies on the OS keyboard) */}
        {mode === "sticker" && (
          <div className={styles.stickerPanel} onClick={onPanelBackgroundTap}>
            <div className={styles.stickerGrid}>
              {stickers.map((sticker) => (
                <StickerCell key={sticker.id} sticker={sticker} onTap={onStickerTap} />
              ))}
            </div>
            <div className={styles.stickerPanelSpacer} />
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={stickerInputRef}
        onChange={handleStickerFilesChange}
        className={styles.hiddenFileInput}
      />
    </div>
  );
}
