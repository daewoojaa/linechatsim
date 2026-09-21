"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInstaChatSim, type InstaMessage } from "@/hooks/useInstaChatSim";
import styles from "./InstaChatSimulator.module.css";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function BackIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
      <path d="M15 4 7 12l8 8" />
    </svg>
  );
}
function PhoneGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 2.7c1.1 0 1.8.6 2.1 1.6l.9 2.5c.3.9.1 1.6-.6 2.1l-1.1.8c1 2.3 2.7 4 5 5l.8-1.1c.5-.7 1.2-1 2.1-.6l2.5.9c1 .3 1.6 1 1.6 2.1v2.2c0 1.3-.9 2.2-2.2 2.2C9.5 20.4 3.6 14.5 3.6 5.9c0-1.3.9-2.2 2.2-2.2Z" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx={5} cy={12} r={1.8} />
      <circle cx={12} cy={12} r={1.8} />
      <circle cx={19} cy={12} r={1.8} />
    </svg>
  );
}
function PhotoIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <rect x={3} y={4} width={18} height={16} rx={3} />
      <circle cx={9} cy={10} r={1.6} />
      <path d="m4 18 5.5-5 4 3.5 2.5-2.2L20 17" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 4 7.6 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.6L15 4H9Zm3 4.2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
    </svg>
  );
}
function SmileIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <circle cx={12} cy={12} r={9} />
      <circle cx={9} cy={10} r={1} fill="currentColor" stroke="none" />
      <circle cx={15} cy={10} r={1} fill="currentColor" stroke="none" />
      <path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
    </svg>
  );
}
function MicGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x={9} y={3} width={6} height={11} rx={3} />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0h-2a4.5 4.5 0 0 1-9 0h-2ZM11 18h2v3h-2z" />
    </svg>
  );
}
function ArrowGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 11.5 20.5 3l-5 17-5.2-6.3L3 11.5Z" />
    </svg>
  );
}

function Avatar({ src, className }: { src: string | null; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- IndexedDB blob URL, no next/image optimization applicable
    <img src={src} className={className} alt="" />
  ) : (
    <div className={`${className} ${styles.avatarDefault}`} />
  );
}

function MessageRow({
  msg,
  avatarSrc,
  photoSrc,
  onPickPhoto,
  onViewPhoto,
}: {
  msg: InstaMessage;
  avatarSrc: string | null;
  photoSrc: string | null;
  onPickPhoto: () => void;
  onViewPhoto: () => void;
}) {
  if (msg.side === "right") {
    return (
      <div className={`${styles.row} ${styles.rowRight}`}>
        <div className={styles.bubbleMine}>{msg.text}</div>
        <div className={styles.timeRight}>อ่านแล้ว {msg.time}</div>
      </div>
    );
  }
  return (
    <div className={`${styles.row} ${styles.rowLeft}`}>
      <Avatar src={avatarSrc} className={styles.rowAvatar} />
      <div className={styles.leftCol}>
        {msg.kind === "image" ? (
          <div className={styles.imageLine}>
            <div
              className={`${styles.imageCard} ${photoSrc ? styles.imageCardTappable : styles.imageCardEmpty}`}
              onClick={
                photoSrc
                  ? (e) => {
                      // Don't let the feed's tap-to-focus bring the keyboard back.
                      e.stopPropagation();
                      onViewPhoto();
                    }
                  : undefined
              }
            >
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- IndexedDB blob URL, no next/image optimization applicable
                <img src={photoSrc} className={styles.photo} alt="" />
              ) : (
                <>
                  <PhotoIcon size={30} />
                  <span>แตะเพื่อดูรูปภาพ</span>
                </>
              )}
            </div>
            <button
              type="button"
              className={styles.sendCircle}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onPickPhoto}
              title="ใส่รูปภาพ"
            >
              <ArrowGlyph />
            </button>
          </div>
        ) : (
          <div className={styles.bubbleTheirs}>{msg.text}</div>
        )}
        <div className={styles.timeLeft}>{msg.time}</div>
      </div>
    </div>
  );
}

/**
 * Instagram-style DM screen (room 3), adapted from ChatSimulator's shell.
 * A fixed script plays out on each visit (see useInstaChatSim); the input
 * always keeps focus so the device keyboard stays up between sends.
 */
export default function InstaChatSimulator({ roomId }: { roomId: string }) {
  const router = useRouter();
  const {
    name,
    setName,
    editingName,
    startEditName,
    commitName,
    onNameKeyDown,
    nameInputRef,
    avatarSrc,
    requestPickAvatar,
    avatarInputRef,
    handleAvatarChange,
    photoSrc,
    requestPickPhoto,
    photoInputRef,
    handlePhotoChange,
    feed,
    hasText,
    textInputRef,
    onInput,
    onKeyDown,
    send,
  } = useInstaChatSim(roomId);

  // Let env(keyboard-inset-height) report the real keyboard where supported.
  useEffect(() => {
    const vk = (navigator as Navigator & { virtualKeyboard?: { overlaysContent: boolean } }).virtualKeyboard;
    if (!vk) return;
    const prev = vk.overlaysContent;
    vk.overlaysContent = true;
    return () => {
      vk.overlaysContent = prev;
    };
  }, []);

  const [viewingPhoto, setViewingPhoto] = useState(false);
  const openViewer = () => {
    // Drop the keyboard while the picture is up; closeViewer brings it back.
    textInputRef.current?.blur();
    setViewingPhoto(true);
  };
  const closeViewer = () => {
    setViewingPhoto(false);
    textInputRef.current?.focus();
  };

  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed]);

  return (
    <div className={styles.appShell}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/")} title="กลับไปหน้ารวมแชท">
          <BackIcon />
        </button>
        <button type="button" className={styles.headerAvatarButton} onClick={requestPickAvatar} title="เปลี่ยนรูปโปรไฟล์">
          <Avatar src={avatarSrc} className={styles.headerAvatar} />
        </button>
        <div className={styles.titleBlock}>
          {editingName ? (
            <input
              className={styles.nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={onNameKeyDown}
              ref={nameInputRef}
            />
          ) : (
            <div className={styles.name} onClick={startEditName} title="แก้ไขชื่อ">
              {name}
            </div>
          )}
          <div className={styles.subtitle}>ใช้งานล่าสุดเมื่อวาน</div>
        </div>
        <div className={styles.headerCircle}>
          <PhoneGlyph />
        </div>
        <div className={styles.headerCircle}>
          <DotsIcon />
        </div>
      </div>

      <div className={styles.feed} ref={feedRef} onClick={() => textInputRef.current?.focus()}>
        {feed.map((m) => (
          <MessageRow
            key={m.id}
            msg={m}
            avatarSrc={avatarSrc}
            photoSrc={photoSrc} onPickPhoto={requestPickPhoto}
            onViewPhoto={openViewer}
          />
        ))}
      </div>

      <div className={styles.inputBar}>
        <div className={styles.cameraButton}>
          <CameraIcon />
        </div>
        <div className={styles.inputPill}>
          <div
            ref={textInputRef}
            contentEditable
            suppressContentEditableWarning
            className={styles.textInput}
            role="textbox"
            aria-multiline="false"
            data-placeholder="พิมพ์ข้อความ..."
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
          <span className={styles.pillIcon}>
            <SmileIcon />
          </span>
          <span className={styles.pillIcon}>
            <PhotoIcon />
          </span>
        </div>
        <button type="button" className={styles.sendButton} onMouseDown={(e) => e.preventDefault()} onClick={send}>
          {hasText ? <ArrowGlyph /> : <MicGlyph />}
        </button>
      </div>

      {viewingPhoto && photoSrc && (
        <div className={styles.viewer} onClick={closeViewer}>
          {/* eslint-disable-next-line @next/next/no-img-element -- IndexedDB blob URL, no next/image optimization applicable */}
          <img src={photoSrc} className={styles.viewerImage} alt="" />
          <button type="button" className={styles.viewerClose} onClick={closeViewer} aria-label="ปิด">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}

      <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className={styles.hidden} />
      <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} className={styles.hidden} />
    </div>
  );
}
