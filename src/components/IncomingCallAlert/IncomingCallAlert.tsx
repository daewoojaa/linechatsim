"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFrontCamera } from "@/hooks/useFrontCamera";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { CameraOffIcon, LayoutIcon, PhoneIcon, PipSwapIcon, SparkleIcon } from "@/components/icons/VideoCallIcons";
import styles from "./IncomingCallAlert.module.css";

type Props = {
  roomId: string;
  /** Called when the green slide is tapped — the caller moves on to the
   *  active video-call screen. */
  onAccept: () => void;
};

/**
 * Incoming-call "ringing" screen shown before room 4's video call actually
 * starts — tap the green circle to answer (-> onAccept) or the red circle
 * to decline back to the chat list, like a real incoming call. The
 * full-screen background is the device's own live front camera, same
 * source as VideoCallSimulator's picture-in-picture (see useFrontCamera).
 */
export default function IncomingCallAlert({ roomId, onAccept }: Props) {
  const router = useRouter();
  const { stream: cameraStream, error: cameraError } = useFrontCamera();
  const videoRef = useRef<HTMLVideoElement>(null);

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
        <span className={styles.hintGreen}>&gt;&gt;</span>
        <span className={styles.hintRed}>&lt;&lt;</span>
        <button type="button" className={styles.declineButton} onClick={() => router.push("/")} title="วางสาย">
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
    </div>
  );
}
