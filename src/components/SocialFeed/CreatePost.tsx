"use client";

import { useRef, useState } from "react";
import styles from "./CreatePost.module.css";

export type PostMedia = { src: string; video: boolean };

/** Korean caption mock-up for the "Khai Muk Baramee" comeback performance. */
export const DEFAULT_CAPTION =
  "드디어 돌아왔습니다! 🔥 카이묵 바라미(ไข่มุกบารมี)의 풀 스케일 공연이 다시 시작됩니다.\n" +
  "압도적인 무대, 폭발하는 에너지, 몰람의 진짜 매력을 놓치지 마세요 🎶✨\n" +
  "#카이묵바라미 #몰람 #컴백공연 #라이브 #풀스케일";

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function CloseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function MediaIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" {...stroke} strokeWidth={1.4}>
      <rect x={3} y={4} width={18} height={16} rx={3} />
      <circle cx={9} cy={10} r={1.6} />
      <path d="m4 18 5-4.5 3.500 3 3-2.500L20 17.500" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

const OPTIONS = ["사람 태그하기", "위치 추가", "음악 추가", "다른 미디어에도 공유"];

type Props = {
  user: string;
  media: PostMedia | null;
  onPickFile: (file: File) => void;
  onClose: () => void;
  onShare: (caption: string) => void;
};

/**
 * "New post" screen of room 9, all in Korean: pick a picture or a video clip
 * (remembered for next time), edit the Korean caption, then 공유 (share) puts
 * the post at the top of the feed.
 */
export default function CreatePost({ user, media, onPickFile, onClose, onShare }: Props) {
  const [caption, setCaption] = useState(DEFAULT_CAPTION);
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = () => fileRef.current?.click();

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
        <div className={styles.title}>새 게시물</div>
        <button
          type="button"
          className={styles.share}
          data-ready={media !== null}
          onClick={() => (media ? onShare(caption.trim()) : pick())}
        >
          공유
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.mediaBox} onClick={pick}>
          {media === null ? (
            <div className={styles.placeholder}>
              <MediaIcon />
              <span>사진 또는 동영상을 선택하세요</span>
            </div>
          ) : media.video ? (
            <video src={media.src} className={styles.preview} autoPlay muted loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={media.src} className={styles.preview} alt="" />
          )}
          {media !== null && <span className={styles.change}>변경</span>}
        </div>

        <div className={styles.captionRow}>
          <span className={styles.user}>{user}</span>
          <textarea
            className={styles.caption}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="문구를 입력하세요..."
            rows={6}
            spellCheck={false}
          />
        </div>

        <div className={styles.options}>
          {OPTIONS.map((label) => (
            <div key={label} className={styles.option}>
              <span>{label}</span>
              <Chevron />
            </div>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPickFile(file);
        }}
      />
    </div>
  );
}
