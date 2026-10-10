"use client";

import { useRouter } from "next/navigation";
import styles from "./VoiceRecorder.module.css";

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function MenuIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <circle cx={10.5} cy={10.5} r={6.4} />
      <path d="m15.4 15.4 5 5" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
      <circle cx={12} cy={5.5} r={1.7} />
      <circle cx={12} cy={12} r={1.7} />
      <circle cx={12} cy={18.5} r={1.7} />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
      <rect x={9} y={3} width={6} height={11.500} rx={3} />
      <path d="M5.500 11.500a6.500 6.500 0 0 0 13 0h-1.800a4.700 4.700 0 0 1-9.400 0H5.500ZM11.100 18h1.800v3h-1.800z" />
    </svg>
  );
}

/**
 * The "all recordings" screen of a voice-recorder app (opened from the album
 * icon on the main chat list): one memo, "วันนี้", a red record button. Set in
 * the device's own default font on purpose. The ☰ icon goes back to the list.
 */
export default function VoiceRecorder() {
  const router = useRouter();
  return (
    <div className={styles.shell}>
      <div className={styles.titleBlock}>
        <div className={styles.title}>การบันทึกทั้งหมด</div>
        <div className={styles.subtitle}>การบันทึก 1 รายการ</div>
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.toolButton} onClick={() => router.push("/")} aria-label="กลับไปหน้ารวมแชท">
          <MenuIcon />
          <i className={styles.dot} />
        </button>
        <div className={styles.toolRight}>
          <span className={styles.toolButton}>
            <SearchIcon />
          </span>
          <span className={styles.toolButton}>
            <MoreIcon />
          </span>
        </div>
      </div>

      <div className={styles.section}>วันนี้</div>

      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.cardTime}>20:21</span>
          <span className={styles.playPill}>
            <span className={styles.playCircle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 3.500v17l15-8.500Z" />
              </svg>
            </span>
            <span className={styles.playLength}>12:45</span>
          </span>
        </div>
        <div className={styles.cardName}>memo 1</div>
      </div>

      <button type="button" className={styles.record} aria-label="บันทึก">
        <MicIcon />
      </button>
    </div>
  );
}
