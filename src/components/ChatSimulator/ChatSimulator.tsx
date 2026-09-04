"use client";

import { useChatSim } from "@/hooks/useChatSim";
import {
  BackArrowIcon,
  ChevronRightIcon,
  EditNameIcon,
  KeyboardGlyphIcon,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
  StickerGlyphIcon,
} from "@/components/icons/Icons";
import StickerCell from "./StickerCell";
import styles from "./ChatSimulator.module.css";

/**
 * LINE-style chat screenshot simulator. Not a real chat app: the user drops
 * in their own pre-made chat-bubble images, a background, and stickers, and
 * stage-manages which one is showing so they can screen-record a believable
 * fake chat. See README.md for the full behavior spec this recreates.
 */
export default function ChatSimulator() {
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
    onPanelBackgroundTap,

    fileInputRef,
    stickerInputRef,
    requestPick,
    handleFileChange,
    handleStickerFilesChange,
  } = useChatSim();

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
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={showFirst} title="กลับไปรูปแชทที่ 1">
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
            <div className={styles.roomNameText}>{roomName}</div>
          )}

          <div className={styles.headerIcons}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => requestPick("chatImage1")}
              title="ใส่รูปแชทที่ 1"
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => requestPick("chatImage2")}
              title="ใส่รูปแชทที่ 2"
            >
              <PhoneIcon />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => requestPick("background")}
              title="ใส่ภาพพื้นหลัง"
            >
              <MenuIcon />
              <span className={styles.badgeDot} />
            </button>
          </div>
        </div>

        {/* 2. Chat image zone (not tappable) */}
        <div className={styles.chatZone}>
          <div
            className={styles.chatImage}
            style={{ backgroundImage: displayedChatSrc ? `url("${displayedChatSrc}")` : "none" }}
          />
        </div>

        {/* 3. Message input bar */}
        <div className={styles.inputBar}>
          <button
            type="button"
            className={styles.chevronButton}
            onClick={() => requestPick("chatImage3")}
            title="ใส่รูปแชทที่ 3"
          >
            <ChevronRightIcon />
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

          <button type="button" className={styles.editNameButton} onClick={startEditName} title="แก้ไขชื่อห้องแชท">
            <EditNameIcon />
          </button>
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
        ref={fileInputRef}
        onChange={handleFileChange}
        className={styles.hiddenFileInput}
      />
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
