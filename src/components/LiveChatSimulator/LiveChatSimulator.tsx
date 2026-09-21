"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveChatSim, type LiveMessage } from "@/hooks/useLiveChatSim";
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
import styles from "./LiveChatSimulator.module.css";

const BG_PRESETS = [
  { name: "ขาว", color: "#ffffff" },
  { name: "ฟ้า LINE", color: "#94a7d1" },
  { name: "ชมพู", color: "#f6d5df" },
  { name: "เขียวมิ้นต์", color: "#d3ebd8" },
  { name: "ครีม", color: "#f3ead8" },
  { name: "ม่วงอ่อน", color: "#e3dcf3" },
  { name: "เทา", color: "#cfd4d8" },
  { name: "ดำ", color: "#1c1c1e" },
];

function isDarkColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.45;
}

// Fixed waveform so every voice bubble looks the same (heights in %).
const WAVE = [30, 55, 80, 45, 90, 60, 35, 70, 95, 50, 65, 85, 40, 75, 55, 90, 45, 70, 30, 60, 80, 50, 35, 65, 45];

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function CallIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#2b2b30">
      <path d="M6.6 2.7c1.1 0 1.8.6 2.1 1.6l.9 2.5c.3.9.1 1.6-.6 2.1l-1.1.8c1 2.3 2.7 4 5 5l.8-1.1c.5-.7 1.2-1 2.1-.6l2.5.9c1 .3 1.6 1 1.6 2.1v2.2c0 1.3-.9 2.2-2.2 2.2C9.5 20.4 3.6 14.5 3.6 5.9c0-1.3.9-2.2 2.2-2.2Z" />
    </svg>
  );
}
function MusicBadgeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="7" fill="#ffffff" />
      <path d="M15.5 6.5v7.2a2.4 2.4 0 1 1-1.5-2.2V8.6l-4 .9v5.6a2.4 2.4 0 1 1-1.5-2.2V8.3l7-1.8Z" fill="#4f86c6" transform="translate(0.5 1)" />
    </svg>
  );
}
function SmallChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f5f9e" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
function PlayGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#f0455a">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 9Zm4 2v8h1.5v-8H10Zm3.500 0v8H15v-8h-1.500Z" />
    </svg>
  );
}
function PlaneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#4f7cf0">
      <path d="M3 11.5 20.500 3l-5 17-5.200-6.300L3 11.500Z" />
    </svg>
  );
}

function MessageRow({ msg, dayLabel }: { msg: LiveMessage; dayLabel: string }) {
  if (msg.kind === "dateLabel") {
    return (
      <div className={styles.dateRow}>
        <span className={styles.datePill}>{dayLabel}</span>
      </div>
    );
  }
  return (
    <div className={styles.row}>
      <span className={styles.time}>{msg.time}</span>
      {msg.kind === "text" && <div className={styles.bubble}>{msg.text}</div>}
      {msg.kind === "missedCall" && (
        <div className={`${styles.bubble} ${styles.callCard}`}>
          <div className={styles.callTop}>
            <span className={styles.callCircle}>
              <CallIcon />
            </span>
            <span className={styles.callTitle}>ไม่ได้รับสาย</span>
          </div>
          <div className={styles.callFooter}>
            <MusicBadgeIcon />
            <span className={styles.callFooterText}>เสียงเรียกเข้า &amp; เสียงรอสาย</span>
            <SmallChevron />
          </div>
        </div>
      )}
      {msg.kind === "voice" && (
        <div className={`${styles.bubble} ${styles.voiceBubble}`}>
          <PlayGlyph color="#3f6aa3" />
          <span className={styles.wave}>
            {WAVE.map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </span>
          <span className={styles.voiceTime}>{formatClock(msg.seconds)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Room 6: a simulated LINE conversation on a white background, every bubble
 * on the right in blue. The voice-record panel below the input bar is a real
 * working interface (timer, stop, trash, send) instead of a stand-in video.
 */
export default function LiveChatSimulator({ roomId, defaultRoomName }: { roomId: string; defaultRoomName: string }) {
  const router = useRouter();
  const {
    bgColor,
    setBgColor,
    dayLabel,
    toggleDayLabel,
    roomName,
    setRoomName,
    editingName,
    startEditName,
    stopEditName,
    onNameKeyDown,
    nameInputRef,
    feed,
    hasText,
    textInputRef,
    onInput,
    onKeyDown,
    sendText,
    voiceStage,
    recordSeconds,
    toggleVoicePanel,
    startRecording,
    stopRecording,
    discardRecording,
    sendVoice,
  } = useLiveChatSim(roomId, defaultRoomName);

  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed, voiceStage]);

  const panelOpen = voiceStage !== "closed";
  const [pickerOpen, setPickerOpen] = useState(false);
  const dark = isDarkColor(bgColor);
  // Room-name bar text and icons; flips to white only on a dark background
  // colour, where the blue would vanish.
  const iconColor = dark ? "#ffffff" : "#2b5488";

  return (
    <div
      className={styles.appShell}
      style={{ background: bgColor, ["--time-color" as string]: dark ? "#d8d8de" : "#6f6f76" }}
    >
      <div className={styles.contentColumn} data-panel-open={panelOpen || undefined}>
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={() => router.push("/")} title="กลับไปหน้ารวมแชท">
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
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setPickerOpen((o) => !o)}
              title="เปลี่ยนสีพื้นหลัง"
            >
              <SearchIcon color={iconColor} />
            </button>
            <span className={styles.iconButton}>
              <PhoneIcon color={iconColor} />
            </span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleDayLabel}
              title={`สลับป้ายวันที่ (ตอนนี้: ${dayLabel})`}
            >
              <MenuIcon color={iconColor} />
              <span className={styles.badgeDot} />
            </button>
          </div>
        </div>

        {pickerOpen && (
          <>
            <div className={styles.pickerScrim} onClick={() => setPickerOpen(false)} />
            <div className={styles.picker}>
              <div className={styles.pickerTitle}>สีพื้นหลังห้องแชท</div>
              <div className={styles.swatches}>
                {BG_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p.color}
                    className={`${styles.swatch} ${bgColor.toLowerCase() === p.color ? styles.swatchActive : ""}`}
                    style={{ background: p.color }}
                    onClick={() => setBgColor(p.color)}
                    aria-label={p.name}
                    title={p.name}
                  />
                ))}
              </div>
              <label className={styles.customRow}>
                <span>เลือกสีเอง (ทุกเฉดสี)</span>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={/^#[0-9a-f]{6}$/i.test(bgColor) ? bgColor : "#ffffff"}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </label>
            </div>
          </>
        )}

        <div className={styles.feed} ref={feedRef} onClick={() => !panelOpen && textInputRef.current?.focus()}>
          <div className={styles.feedInner}>
            {feed.map((m) => (
              <MessageRow key={m.id} msg={m} dayLabel={dayLabel} />
            ))}
          </div>
        </div>

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
            <span className={styles.emojiButton}>
              <EmojiIcon />
            </span>
          </div>
          <button
            type="button"
            className={styles.sendButton}
            onMouseDown={(e) => e.preventDefault()}
            onClick={hasText ? sendText : toggleVoicePanel}
            title={hasText ? "ส่งข้อความ" : panelOpen ? "กลับไปพิมพ์ข้อความ" : "ข้อความเสียง"}
          >
            {hasText ? <SendArrowIcon /> : panelOpen ? <CloseXIcon /> : <MicIcon />}
          </button>
        </div>

        {voiceStage === "prompt" && (
          <div className={styles.recordPanel} onClick={startRecording}>
            <div className={styles.recordHint}>แตะเพื่อบันทึกข้อความเสียง</div>
            <div className={styles.recordRing}>
              <span className={styles.recordDot} />
            </div>
          </div>
        )}
        {(voiceStage === "recording" || voiceStage === "recorded") && (
          <div className={styles.recordPanel}>
            <div className={styles.recordClock}>{formatClock(recordSeconds)}</div>
            <div className={styles.recordControls}>
              <button type="button" className={styles.sideCircle} onClick={discardRecording} aria-label="ลบ">
                <TrashIcon />
              </button>
              <button
                type="button"
                className={`${styles.stopCircle} ${voiceStage === "recording" ? styles.pulsing : ""}`}
                onClick={voiceStage === "recording" ? stopRecording : undefined}
                aria-label={voiceStage === "recording" ? "หยุดบันทึก" : "เล่น"}
              >
                {voiceStage === "recording" ? <span className={styles.stopSquare} /> : <PlayGlyph color="#ffffff" size={40} />}
              </button>
              <button type="button" className={styles.sideCircle} onClick={sendVoice} aria-label="ส่ง">
                <PlaneIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
