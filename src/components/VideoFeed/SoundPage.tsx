"use client";

import { useSoundGrid } from "@/hooks/useSoundGrid";
import styles from "./SoundPage.module.css";

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

type Props = {
  /** Same account picture as the LIVE clip (tap to change it). */
  avatar: string;
  onPickAvatar: () => void;
  onBack: () => void;
};

/**
 * Room 5's sound page (reached by tapping the spinning record on the LIVE
 * clip): sound title and artist, a save button, and nine tiles that each
 * take a picture or a video from the device. The buttons other than back,
 * the account picture and the tiles are decorative.
 */
export default function SoundPage({ avatar, onPickAvatar, onBack }: Props) {
  const { slots, pick, inputRef, handleChange } = useSoundGrid();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={`${styles.glass} ${styles.circle}`} onClick={onBack} aria-label="กลับ">
          <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}>
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <div className={`${styles.glass} ${styles.search}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
            <circle cx={11} cy={11} r={6.5} />
            <path d="m16 16 4.5 4.5" />
          </svg>
        </div>
        <span className={`${styles.glass} ${styles.circle}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
            <path d="M14 5l7 6.500-7 6.500v-4c-5 0-8 1.500-10 5 .5-5.500 4-9.500 10-10V5Z" />
          </svg>
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.profile}>
          <button type="button" className={styles.avatarRing} onClick={onPickAvatar} aria-label="เปลี่ยนรูปโปรไฟล์">
            <span className={styles.avatar} style={{ backgroundImage: `url(${avatar})` }} />
          </button>
          <div className={styles.titles}>
            <div className={styles.title}>ดงชน รีมิกซ์ 3.1</div>
            <div className={styles.artist}>วงไข่มุกบารมี เศรษฐีพันล้าน</div>
            <div className={styles.count}>465.9K โพสต์</div>
          </div>
          <span className={`${styles.glass} ${styles.circle} ${styles.playCircle}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4.500v15a1 1 0 0 0 1.500.9l12-7.500a1 1 0 0 0 0-1.800l-12-7.500A1 1 0 0 0 7 4.500Z" />
            </svg>
          </span>
        </div>

        <div className={`${styles.glass} ${styles.saveButton}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
            <path d="M6 3.500h12v17l-6-4.200-6 4.200Z" />
          </svg>
          <span>บันทึก</span>
        </div>

        <div className={styles.grid}>
          {slots.map((slot, i) => (
            <button type="button" key={i} className={styles.tile} onClick={() => pick(i)} aria-label={`ช่องที่ ${i + 1}`}>
              {slot ? (
                slot.kind === "video" ? (
                  // #t=0.1 shows a still of the first frame without playing it.
                  <video className={styles.media} src={`${slot.url}#t=0.1`} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- IndexedDB blob URL, no next/image optimization applicable
                  <img className={styles.media} src={slot.url} alt="" />
                )
              ) : (
                <span className={styles.tileHint}>
                  แตะเพื่อใส่
                  <br />
                  รูป หรือ คลิป
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <span className={`${styles.glass} ${styles.action}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={3}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>สตอรี่ใหม่</span>
        </span>
        <span className={`${styles.glass} ${styles.action} ${styles.actionMuted}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <rect x={3} y={6.500} width={12} height={11} rx={2.500} />
            <path d="m16.500 10.500 4.200-2.500c.5-.3 1.100 0 1.100.6v6.800c0 .6-.6.900-1.100.6l-4.200-2.500Z" />
          </svg>
          <span>ใช้เสียง</span>
        </span>
      </div>

      <input type="file" accept="image/*,video/*" ref={inputRef} onChange={handleChange} hidden />
    </div>
  );
}
