"use client";

import { useEffect, useRef } from "react";
import { useFrontCamera } from "@/hooks/useFrontCamera";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { useThemeColor } from "@/hooks/useThemeColor";
import { idbSetImage } from "@/lib/idbStore";
import { CameraOffIcon, LayoutIcon, PhoneIcon, PipSwapIcon, SparkleIcon } from "@/components/icons/VideoCallIcons";
import styles from "./IncomingCallAlert.module.css";

type Props = {
  roomId: string;
  /** Called when the green slide is tapped — the caller moves on to the
   *  active video-call screen. */
  onAccept: () => void;
};

/**
 * Three chevrons that light up back-to-front in a loop, like a pulse of
 * energy chasing forward in the direction they point — the hint animation
 * next to the answer/decline buttons. `flip` mirrors it to point left.
 */
function ChevronTrail({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg
      width="46"
      height="22"
      viewBox="0 0 54 22"
      fill="none"
      className={styles.chevronTrail}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path className={styles.chevronBack} d="M3 3l8 8-8 8" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <path className={styles.chevronMid} d="M21 3l8 8-8 8" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <path className={styles.chevronFront} d="M39 3l8 8-8 8" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Incoming-call "ringing" screen shown before room 4's video call actually
 * starts — tap the green circle to answer (-> onAccept); the red circle
 * doesn't decline the call, it sets the "app closed" still that
 * VideoCallSimulator's own red X shows full-screen once the call ends
 * (a real app can't be closed from a web page in any browser, so this
 * fakes the visual instead). The full-screen background is the device's
 * own live front camera, same source as VideoCallSimulator's picture-in-
 * picture (see useFrontCamera).
 */
export default function IncomingCallAlert({ roomId, onAccept }: Props) {
  const { stream: cameraStream, error: cameraError } = useFrontCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const exitImageInputRef = useRef<HTMLInputElement>(null);
  // Same status-bar tint fix as VideoCallSimulator — this screen is black too.
  useThemeColor("#000000");

  const {
    callerName,
    setCallerName,
    editingName,
    startEditName,
    stopEditName,
    onNameKeyDown,
    nameInputRef,
    photoSrc,
    requestPickPhoto,
    photoInputRef,
    handlePhotoChange,
  } = useIncomingCall(roomId);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  const requestPickExitImage = () => {
    const el = exitImageInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  };

  const handleExitImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await idbSetImage(`${roomId}:exitImage`, file);
  };

  return (
    <div className={styles.appShell}>
      <div className={styles.backgroundLayer}>
        {cameraStream && !cameraError ? (
          <video ref={videoRef} className={styles.bgVideo} autoPlay muted playsInline />
        ) : (
          <div className={styles.bgPlaceholder} />
        )}
      </div>

      {/* Top-right chrome */}
      <div className={styles.topIcons}>
        <button type="button" className={styles.topIconButton} tabIndex={-1}>
          <PipSwapIcon />
        </button>
        <button type="button" className={styles.topIconButton} tabIndex={-1}>
          <LayoutIcon />
        </button>
      </div>

      {/* Caller info */}
      <div className={styles.callerInfo}>
        <button type="button" className={styles.avatarButton} onClick={requestPickPhoto} title="ใส่รูปโปรไฟล์">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- IndexedDB blob URL, no next/image optimization applicable
            <img src={photoSrc} className={styles.avatarImg} alt="" />
          ) : (
            <div className={styles.avatarPlaceholder} />
          )}
        </button>

        {editingName ? (
          <input
            className={styles.nameInput}
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            onBlur={stopEditName}
            onKeyDown={onNameKeyDown}
            ref={nameInputRef}
          />
        ) : (
          <div className={styles.nameText} onClick={startEditName} title="แก้ไขชื่อผู้โทร">
            {callerName}
          </div>
        )}

        <div className={styles.statusDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={`${styles.dot} ${styles.dotActive}`} />
        </div>
      </div>

      {/* Quick-action row */}
      <div className={styles.quickRow}>
        <div className={styles.quickButton}>
          <CameraOffIcon />
          <span className={styles.quickLabel}>ปิดกล้อง</span>
        </div>
        <div className={styles.quickButton}>
          <SparkleIcon />
          <span className={styles.quickLabel}>เอฟเฟกต์</span>
        </div>
      </div>

      {/* Slide-to-answer / decline row */}
      <div className={styles.answerRow}>
        <button type="button" className={styles.answerButton} onClick={onAccept} title="รับสาย">
          <PhoneIcon />
        </button>
        <ChevronTrail color="#34c759" />
        <ChevronTrail color="#fe3b30" flip />
        <button type="button" className={styles.declineButton} onClick={requestPickExitImage} title="ตั้งรูปจำลองปิดแอป">
          <PhoneIcon />
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={photoInputRef}
        onChange={handlePhotoChange}
        className={styles.hiddenFileInput}
      />
      <input
        type="file"
        accept="image/*"
        ref={exitImageInputRef}
        onChange={handleExitImageChange}
        className={styles.hiddenFileInput}
      />
    </div>
  );
}
