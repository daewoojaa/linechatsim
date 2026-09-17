"use client";

import { useEffect, useRef } from "react";
import { useVideoCallSim } from "@/hooks/useVideoCallSim";
import { useFrontCamera } from "@/hooks/useFrontCamera";
import {
  ActivitiesIcon,
  CameraFlipIcon,
  CameraOffIcon,
  LayoutIcon,
  MuteMicIcon,
  PipSwapIcon,
  SparkleIcon,
  XIcon,
} from "@/components/icons/VideoCallIcons";
import styles from "./VideoCallSimulator.module.css";

type Props = {
  roomId: string;
};

/**
 * Video-call simulator (room 4) — a FaceTime/Instagram-call-style screen.
 * The big frame loops an MP4 standing in for the other person (picked via
 * "Activities"); the picture-in-picture box in the corner is the device's
 * own live front camera, so an actor can perform alongside the clip in
 * real time. Every other control (mute, camera effects, the top-right
 * icons) is decorative chrome for visual authenticity, not wired up.
 */
export default function VideoCallSimulator({ roomId }: Props) {
  const { clipSrc, fileInputRef, requestPickClip, handleClipFileChange } = useVideoCallSim(roomId);
  const { stream: cameraStream, error: cameraError, retry: retryCamera } = useFrontCamera();
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (pipVideoRef.current) pipVideoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  // Browsers only allow a script to close a tab/window it opened itself —
  // reassigning via window.open("", "_self") first is the standard
  // workaround that lets window.close() succeed for a regular tab too, on
  // browsers that permit it at all (notably not iOS Safari, which never
  // allows a page to close itself no matter what).
  const handleEndCall = () => {
    window.open("", "_self");
    window.close();
  };

  return (
    <div className={styles.appShell}>
      {/* Main frame — the other person's video clip */}
      <div className={styles.mainVideoWrap}>
        {clipSrc ? (
          <video className={styles.mainVideo} src={clipSrc} autoPlay loop muted playsInline />
        ) : (
          <div className={styles.mainVideoPlaceholder} />
        )}
      </div>

      {/* Picture-in-picture — the device's own live front camera */}
      <div className={styles.pip}>
        {cameraStream && !cameraError ? (
          <video ref={pipVideoRef} className={styles.pipVideo} autoPlay muted playsInline />
        ) : (
          <div className={styles.pipOff}>
            <CameraOffIcon />
          </div>
        )}
      </div>

      {/* Top-right chrome */}
      <div className={styles.topIcons}>
        <button type="button" className={styles.topIconButton} tabIndex={-1}>
          <PipSwapIcon />
        </button>
        <button type="button" className={styles.topIconButton} tabIndex={-1}>
          <CameraFlipIcon />
        </button>
        <button type="button" className={styles.topIconButton} tabIndex={-1}>
          <LayoutIcon />
        </button>
      </div>

      {/* Bottom control bar */}
      <div className={styles.bottomBar}>
        <button type="button" className={styles.controlButton} tabIndex={-1}>
          <MuteMicIcon />
          <span className={styles.controlLabel}>Mute mic</span>
        </button>
        <button type="button" className={styles.controlButton} onClick={retryCamera}>
          <CameraOffIcon />
          <span className={styles.controlLabel}>Turn on camera</span>
        </button>
        <button type="button" className={styles.endCallButton} onClick={handleEndCall} title="ออกจากแอป">
          <XIcon />
        </button>
        <button type="button" className={styles.controlButton} tabIndex={-1}>
          <SparkleIcon />
          <span className={styles.controlLabel}>Camera effects</span>
        </button>
        <button type="button" className={styles.controlButton} onClick={requestPickClip}>
          <ActivitiesIcon />
          <span className={styles.controlLabel}>Activities</span>
        </button>
      </div>

      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleClipFileChange}
        className={styles.hiddenFileInput}
      />
    </div>
  );
}
