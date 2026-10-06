"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SocialFeed.module.css";

const STORAGE_KEY = "linechatsim-room9-counts-v1";

type CountKey = "likes" | "comments" | "shares";

// Mock numbers - every one can be tapped and retyped (kept on the device).
const DEFAULT_COUNTS: Record<CountKey, string> = {
  likes: "3.8K",
  comments: "124",
  shares: "215",
};

const COMMENTS = [
  { user: "kaen.life", text: "ลาบแซ่บๆ แบบนี้ต้องเติมข้าวเหนียวอีกสามกระติบ 😋" },
  { user: "nong_mai", text: "เห็นแล้วน้ำลายไหล พิกัดร้านไหนคะ 🤤" },
  { user: "baan_na_88", text: "แจ่วบองข้างๆ ก็น่ากินมาก 🌶️🔥" },
];

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

/* Icons are drawn here from scratch: close in spirit to the reference, not copies. */
function SearchIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <circle cx={10.5} cy={10.5} r={6.6} />
      <path d="m15.6 15.6 5 5" />
    </svg>
  );
}
function HeartOutlineIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <path d="M12 20.4s-7.6-4.7-8.9-9.7C2.2 7.2 4.3 4.6 7.2 4.6c1.9 0 3.5 1 4.8 2.9 1.3-1.9 2.9-2.9 4.8-2.9 2.9 0 5 2.6 4.1 6.1-1.3 5-8.9 9.7-8.9 9.7Z" />
    </svg>
  );
}
function HeartFilledIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#ff2d4f">
      <path d="M12 20.8s-8-4.9-9.3-10.1C1.7 6.9 4 4.2 7.1 4.2c1.9 0 3.6 1 4.9 2.8 1.3-1.8 3-2.8 4.9-2.8 3.1 0 5.4 2.7 4.4 6.5-1.3 5.2-9.3 10.1-9.3 10.1Z" />
    </svg>
  );
}
function PlaneIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <path d="M21 3.5 3.4 10.2c-.8.3-.8 1.4 0 1.7l6.2 2.3 2.3 6.2c.3.8 1.4.8 1.7 0L21 3.5Z" />
      <path d="m9.7 14.1 5.6-5.6" />
    </svg>
  );
}
function BubbleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <path d="M12 3.6c-4.7 0-8.4 3.2-8.4 7.3 0 2.2 1.1 4.2 2.9 5.5-.1 1.4-.7 2.6-1.7 3.6 1.9-.1 3.6-.8 4.8-1.8.8.2 1.5.3 2.4.3 4.7 0 8.4-3.2 8.4-7.3S16.700 3.600 12 3.600Z" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9}>
      <path d="M6.500 3.600h11v16.800L12 16.300l-5.500 4.100Z" />
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
function HomeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.800 2.600 10.700c-.4.300-.6.800-.6 1.300V20a1.800 1.800 0 0 0 1.800 1.800h4.700v-6.400h6.200v6.400h4.700A1.800 1.800 0 0 0 22 20v-8c0-.5-.2-1-.6-1.300L12 2.800Z" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <rect x={3.500} y={3.500} width={17} height={17} rx={4.500} />
      <path d="M3.800 9h16.400M9 3.600l2.500 5.400M14.200 3.600 16.700 9" />
      <path d="M10.200 12.600v4.600l4-2.300-4-2.300Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

function Avatar({ size, ring = true, plain = false }: { size: number; ring?: boolean; plain?: boolean }) {
  return (
    <span
      className={ring ? styles.ring : styles.noRing}
      style={{ width: size, height: size }}
    >
      <span className={`${styles.avatarImg} ${plain ? styles.avatarPlain : ""}`} />
    </span>
  );
}

/**
 * Room 9: an Instagram-style feed (mock-up). The first post is Gan_phin's
 * plate of Isan larb; the like / comment / share counts are placeholders that
 * can be tapped and retyped (and are remembered). The icons are original
 * drawings in the spirit of the reference rather than copies.
 */
export default function SocialFeed() {
  const router = useRouter();
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [editing, setEditing] = useState<CountKey | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setCounts((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<typeof DEFAULT_COUNTS>) }));
      } catch {
        // Persistence is best-effort.
      }
    });
  }, []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const change = (key: CountKey, value: string) => {
    const next = { ...counts, [key]: value };
    setCounts(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Persistence is best-effort.
    }
  };

  /** A tappable number: shows the value, becomes an input while editing. */
  const count = (key: CountKey, className: string) =>
    editing === key ? (
      <input
        ref={inputRef}
        className={`${className} ${styles.countInput}`}
        value={counts[key]}
        onChange={(e) => change(key, e.target.value)}
        onBlur={() => setEditing(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setEditing(null);
          }
        }}
      />
    ) : (
      <span className={`${className} ${styles.editable}`} onClick={() => setEditing(key)}>
        {counts[key]}
      </span>
    );

  return (
    <div className={styles.shell}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/")} aria-label="กลับไปหน้ารวมแชท">
          <BackIcon />
        </button>
        <div className={styles.topIcons}>
          <SearchIcon size={26} />
          <span className={styles.heartWrap}>
            <HeartOutlineIcon />
            <i className={styles.redDot} />
          </span>
          <PlaneIcon size={26} />
        </div>
      </div>

      <div className={styles.feed}>
        <article className={styles.post}>
          <header className={styles.postHeader}>
            <Avatar size={44} />
            <div className={styles.who}>
              <div className={styles.username}>Gan_phin</div>
              <div className={styles.place}>บ้านนาดี · ขอนแก่น</div>
            </div>
            <span className={styles.dots}>
              <DotsIcon />
            </span>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset */}
          <img src="/room9-post.webp" className={styles.photo} alt="" />

          <div className={styles.actions}>
            <span className={styles.action}>
              <HeartFilledIcon />
              {count("likes", styles.actionNumber)}
            </span>
            <span className={styles.action}>
              <BubbleIcon />
              {count("comments", styles.actionNumber)}
            </span>
            <span className={styles.action}>
              <PlaneIcon size={28} />
              {count("shares", styles.actionNumber)}
            </span>
            <span className={styles.bookmark}>
              <BookmarkIcon />
            </span>
          </div>

          <div className={styles.text}>
            <div className={styles.likedBy}>
              ถูกใจโดย <b>kaen.life</b> และคนอื่นๆ
            </div>
            <div>
              <b>Gan_phin</b> ลาบหมูน้ำตกแซ่บถึงใจ ข้าวเหนียวร้อนๆ ผักสดกรอบๆ มื้อนี้ไม่มีพลาด 🌿🔥
            </div>
            {COMMENTS.map((c) => (
              <div key={c.user}>
                <b>{c.user}</b> {c.text}
              </div>
            ))}
            <div className={styles.viewAll}>ดูความคิดเห็นทั้งหมด {counts.comments} รายการ</div>
            <div className={styles.time}>2 ชั่วโมงที่แล้ว</div>
          </div>
        </article>

        {/* A second post, just a taste of what scrolls in below. */}
        <article className={styles.post}>
          <header className={styles.postHeader}>
            <Avatar size={44} plain />
            <div className={styles.who}>
              <div className={styles.username}>kaen.life</div>
              <div className={styles.place}>ทุ่งนา · ขอนแก่น</div>
            </div>
            <span className={styles.dots}>
              <DotsIcon />
            </span>
          </header>
          <div className={styles.photoPlaceholder} />
        </article>
      </div>

      <nav className={styles.tabs}>
        <span className={styles.tab}>
          <HomeIcon />
          <span className={styles.tabLabelActive}>หน้าแรก</span>
        </span>
        <span className={styles.tab}>
          <SearchIcon size={28} />
          <span className={styles.tabLabel}>ค้นหา</span>
        </span>
        <span className={styles.tab}>
          <span className={styles.createCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.6}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className={styles.tabLabel}>สร้างโพสต์</span>
        </span>
        <span className={styles.tab}>
          <VideoIcon />
          <span className={styles.tabLabel}>วีดีโอ</span>
        </span>
        <span className={styles.tab}>
          <Avatar size={30} />
          <span className={styles.tabLabel}>โปรไฟล์</span>
        </span>
      </nav>
    </div>
  );
}
