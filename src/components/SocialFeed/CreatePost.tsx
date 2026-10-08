"use client";

import { useRef, useState } from "react";
import styles from "./CreatePost.module.css";

export type PostMedia = { src: string; video: boolean };

/** Korean caption mock-up for the "Khai Muk Baramee" comeback performance. */
export const DEFAULT_CAPTION =
  "드디어 돌아왔습니다! 🔥 카이묵 바라미(ไข่มุกบารมี)의 풀 스케일 공연이 다시 시작됩니다.\n" +
  "압도적인 무대, 폭발하는 에너지, 몰람의 진짜 매력을 놓치지 마세요 🎶✨\n" +
  "#카이묵바라미 #몰람 #컴백공연 #라이브 #풀스케일";

/** The four pretend filters (names as in the reference screen); `css` is applied to the picture / clip. */
export const FILTERS = [
  { label: "일반", css: "none" },
  { label: "클래랜든", css: "contrast(1.18) saturate(1.4) brightness(1.04)" },
  { label: "긴햄", css: "brightness(1.07) contrast(0.88) saturate(0.85) sepia(0.14) hue-rotate(-8deg)" },
  { label: "문", css: "grayscale(1) contrast(1.1) brightness(1.08)" },
] as const;

const LOCATION_CHIPS = ["메카완", "치앙마이", "태국", "라벨 추가"];

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
      <path d="M15 5 8 12l7 7" />
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
function CropIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M7 3v14h14M3 7h14v14" />
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M20 11a8 8 0 0 0-14-4.500L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.500L20 15M20 20v-5h-5" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <circle cx={12} cy={8} r={4} />
      <path d="M4.500 20.500c.8-4 3.800-6 7.500-6s6.700 2 7.500 6" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <path d="M12 21.500s7-6.200 7-12a7 7 0 0 0-14 0c0 5.800 7 12 7 12Z" />
      <circle cx={12} cy={9.500} r={2.600} />
    </svg>
  );
}
function Chevron() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

/** A picture or a (paused) first frame of a clip, with a filter on it. */
function Thumb({ media, filter, className }: { media: PostMedia; filter: string; className: string }) {
  return media.video ? (
    <video
      src={`${media.src}#t=0.1`}
      className={className}
      style={{ filter }}
      muted
      playsInline
      preload="metadata"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- local blob preview
    <img src={media.src} className={className} style={{ filter }} alt="" />
  );
}

type Props = {
  media: PostMedia | null;
  onPickFile: (file: File) => void;
  onClose: () => void;
  onShare: (caption: string, filter: string) => void;
};

/**
 * "New post" flow of room 9, all in Korean, in two pages like the reference:
 * 1) pick a picture or video clip (remembered for next time) and one of four
 * pretend filters, then 다음 (next) top right; 2) a caption, a few decorative
 * rows and 공유 (share), which puts the post at the top of the feed.
 */
export default function CreatePost({ media, onPickFile, onClose, onShare }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [filterIndex, setFilterIndex] = useState(0);
  const [caption, setCaption] = useState(DEFAULT_CAPTION);
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = () => fileRef.current?.click();
  const filter = FILTERS[filterIndex].css;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={step === 1 ? onClose : () => setStep(1)}
          aria-label="뒤로"
        >
          <BackIcon />
        </button>
        <div className={styles.title}>새 게시물</div>
        {step === 1 ? (
          <button type="button" className={styles.next} onClick={() => (media ? setStep(2) : pick())}>
            다음
          </button>
        ) : (
          <span className={styles.headerSpacer} />
        )}
      </div>

      {step === 1 ? (
        <>
          <div className={styles.previewArea}>
            <div className={styles.previewBox} onClick={pick}>
              {media === null ? (
                <div className={styles.placeholder}>
                  <MediaIcon />
                  <span>사진 또는 동영상을 선택하세요</span>
                </div>
              ) : media.video ? (
                <video
                  src={media.src}
                  className={styles.preview}
                  style={{ filter }}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={media.src} className={styles.preview} style={{ filter }} alt="" />
              )}
              <span className={styles.roundButton} data-side="left">
                <CropIcon />
              </span>
              <button
                type="button"
                className={styles.roundButton}
                data-side="right"
                onClick={(e) => {
                  e.stopPropagation();
                  pick();
                }}
                aria-label="사진 또는 동영상 변경"
              >
                <SwapIcon />
              </button>
            </div>
          </div>

          <div className={styles.filters}>
            {FILTERS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                className={styles.filter}
                data-active={i === filterIndex}
                onClick={() => setFilterIndex(i)}
              >
                <span className={styles.filterLabel}>{f.label}</span>
                <span className={styles.filterThumb}>
                  {media ? <Thumb media={media} filter={f.css} className={styles.filterImage} /> : null}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.editTabs}>
            <span data-active="true">필터</span>
            <span>편집</span>
            <span>자르기</span>
          </div>
        </>
      ) : (
        <div className={styles.page2}>
          <div className={styles.captionRow}>
            <span className={styles.captionThumb}>
              {media && <Thumb media={media} filter={filter} className={styles.captionThumbImage} />}
            </span>
            <textarea
              className={styles.caption}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="문구를 입력하세요..."
              rows={5}
              spellCheck={false}
            />
          </div>

          <div className={styles.option}>
            <PersonIcon />
            <span className={styles.optionLabel}>사람 태그하기</span>
            <Chevron />
          </div>
          <div className={styles.option}>
            <PinIcon />
            <span className={styles.optionLabel}>위치 추가</span>
            <Chevron />
          </div>
          <div className={styles.chips}>
            {LOCATION_CHIPS.map((c) => (
              <span key={c} className={styles.chip}>
                {c}
              </span>
            ))}
          </div>

          <div className={styles.shareBar}>
            <button type="button" className={styles.shareButton} onClick={() => onShare(caption.trim(), filter)}>
              공유
            </button>
          </div>
        </div>
      )}

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
