"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGrowingCounts } from "@/hooks/useGrowingCounts";
import { idbGetImage, idbSetImage } from "@/lib/idbStore";
import CreatePost, { type PostMedia } from "./CreatePost";
import PostVideo from "./PostVideo";
import styles from "./SocialFeed.module.css";

const CREATE_MEDIA_KEY = "room9:create-media";
/** Account name shown on the create screen and on the post it shares. */
const NEW_POST_USER = "real_jihoon";

type NewPost = { id: number; media: PostMedia; caption: string; filter: string };

const PROFILE_IMAGE = "/room9-profile.webp";

const STORAGE_KEY = "linechatsim-room9-text-v2";
// Texts whose defaults were changed later: saved copies of them are dropped
// once, so the new defaults show up instead of an older edit.
const MIGRATION_KEY = "linechatsim-room9-migrated";
const MIGRATIONS: { version: number; keys: string[] }[] = [
  { version: 3, keys: ["p1.caption", "p1.likes", "p1.time"] },
  { version: 4, keys: ["p1.time", "p1.likedBy", "p1.c1u"] },
];
const MIGRATION_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Every piece of text in the mock feed, by key (p1 = first post, p2 = second). */
const DEFAULT_TEXT: Record<string, string> = {
  "p1.user": "Gan_phin",
  "p1.likes": "19K",
  "p1.comments": "124",
  "p1.shares": "215",
  "p1.caption": "ลาบปลาดุกแซ่บหลาย ข้าวเหนียวฮ้อน ๆ ผักสดกรอบ ๆ คัก ๆ",
  "p1.c1u": "gan.life",
  "p1.c1t": "ลาบแซ่บๆ แบบนี้ต้องเติมข้าวเหนียวอีกสามกระติบ 😋",
  "p1.c2u": "nong_mai",
  "p1.c2t": "เห็นแล้วน้ำลายไหล พิกัดร้านไหนคะ 🤤",
  "p1.time": "8월 19일",

  "p2.user": "bus.for.cash",
  "p2.likes": "12.6K",
  "p2.comments": "482",
  "p2.shares": "1.1K",
  "p2.likedBy": "nong_mai",
  "p2.caption": "เงินๆ ทองๆ มาแล้ว 💰✨ เก็บไว้ให้เฮง ให้รวย ตลอดปีเลยนะ",
  "p2.c1u": "ping_ping",
  "p2.c1t": "ขอให้รวยๆ เฮงๆ ค่ะ 🙏",
  "p2.c2u": "thong.sai",
  "p2.c2t": "ทองสวยมาก เห็นแล้วใจฟู ✨",
  "p2.c3u": "ae_songkran",
  "p2.c3t": "อยากได้บ้างจัง 😍💸",
  "p2.time": "5 ชั่วโมงที่แล้ว",
};

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
function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.9} fill={filled ? "currentColor" : "none"}>
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

function Avatar({ size, ring = true, plain = false, image }: { size: number; ring?: boolean; plain?: boolean; image?: string }) {
  return (
    <span
      className={ring ? styles.ring : styles.noRing}
      style={{ width: size, height: size }}
    >
      <span
        className={`${styles.avatarImg} ${plain ? styles.avatarPlain : ""}`}
        style={image ? { backgroundImage: `url(${image})`, backgroundPosition: "center 18%" } : undefined}
      />
    </span>
  );
}

const formatCount = (n: number) => n.toLocaleString("en-US");

/**
 * A post shared from the "new post" screen, in the Korean version of the app:
 * its counters start at zero and then grow by themselves (see
 * useGrowingCounts). Only the number of comments is shown, never their text.
 */
function NewPostCard({ user, post, speedLevel }: { user: string; post: NewPost; speedLevel: number }) {
  const counts = useGrowingCounts(speedLevel);
  return (
    <article className={`${styles.post} ${styles.fillPost}`}>
      <header className={styles.postHeader}>
        <Avatar size={44} image={PROFILE_IMAGE} />
        <div className={styles.who}>
          <div className={styles.username}>{user}</div>
        </div>
        <span className={styles.dots}>
          <DotsIcon />
        </span>
      </header>

      {/* Like the food post: exactly one screen tall, the picture / clip cropped to fit. */}
      <div className={styles.photoFill}>
        {post.media.video ? (
          <PostVideo src={post.media.src} fill filter={post.filter} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local blob
          <img src={post.media.src} className={styles.photoCover} style={{ filter: post.filter }} alt="" />
        )}
      </div>

      <div className={styles.actions}>
        <span className={styles.action}>
          <HeartFilledIcon />
          <span className={styles.actionNumber}>{formatCount(counts.likes)}</span>
        </span>
        <span className={styles.action}>
          <BubbleIcon />
          <span className={styles.actionNumber}>{formatCount(counts.comments)}</span>
        </span>
        <span className={styles.action}>
          <PlaneIcon size={28} />
          <span className={styles.actionNumber}>{formatCount(counts.shares)}</span>
        </span>
        <span className={styles.bookmark}>
          <BookmarkIcon />
        </span>
      </div>

      <div className={`${styles.text} ${styles.korean}`}>
        <div className={styles.newCaption}>
          <b>{user}</b> {post.caption}
        </div>
        {counts.comments > 0 && <div className={styles.viewAll}>댓글 {formatCount(counts.comments)}개 모두 보기</div>}
        <div className={styles.time}>방금 전</div>
      </div>
    </article>
  );
}

/**
 * Room 9: an Instagram-style feed (mock-up) with two posts: Gan_phin's plate
 * of Isan larb and a gold-and-money one. The bookmark icon unlocks / locks
 * editing: while unlocked every piece of text (names, captions,
 * comments, counts, times) can be tapped and retyped, and is remembered. The
 * icons are original drawings in the spirit of the reference, not copies.
 */
export default function SocialFeed() {
  const router = useRouter();
  const [text, setText] = useState(DEFAULT_TEXT);
  const textRef = useRef(text);
  const [unlocked, setUnlocked] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [createMedia, setCreateMedia] = useState<PostMedia | null>(null);
  const [newPost, setNewPost] = useState<NewPost | null>(null);
  const [speedLevel, setSpeedLevel] = useState(0);
  const postCountRef = useRef(0);

  // The picture / clip picked last time is offered again on the new-post screen.
  useEffect(() => {
    let cancelled = false;
    idbGetImage(CREATE_MEDIA_KEY)
      .then((blob) => {
        if (blob && !cancelled) setCreateMedia({ src: URL.createObjectURL(blob), video: blob.type.startsWith("video/") });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pickCreateMedia = (file: File) => {
    // Not revoked: a post already shared may still be showing the previous one.
    setCreateMedia({ src: URL.createObjectURL(file), video: file.type.startsWith("video/") });
    idbSetImage(CREATE_MEDIA_KEY, file).catch(() => {});
  };

  const share = (caption: string, filter: string) => {
    if (!createMedia) return;
    postCountRef.current += 1;
    setNewPost({ id: postCountRef.current, media: createMedia, caption, filter });
    setSpeedLevel(0);
    setCreating(false);
    feedRef.current?.scrollTo({ top: 0 });
  };

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Record<string, string>;
          const done = parseInt(window.localStorage.getItem(MIGRATION_KEY) ?? "0", 10) || 0;
          if (done < MIGRATION_VERSION) {
            MIGRATIONS.filter((m) => m.version > done).forEach((m) => m.keys.forEach((k) => delete saved[k]));
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
          }
          textRef.current = { ...textRef.current, ...saved };
          setText(textRef.current);
        }
        window.localStorage.setItem(MIGRATION_KEY, String(MIGRATION_VERSION));
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

  const change = (key: string, value: string) => {
    const next = { ...textRef.current, [key]: value };
    textRef.current = next;
    setText(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Persistence is best-effort.
    }
  };

  /** One piece of text: plain while locked; tappable (dashed underline) when
   *  unlocked, turning into an input while it is being edited. */
  const t = (key: string, className = "", wide = false) =>
    editing === key ? (
      <input
        ref={inputRef}
        className={`${className} ${styles.textInput} ${wide ? styles.textInputWide : styles.textInputNarrow}`}
        value={text[key]}
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
      <span
        className={className}
        data-editable={unlocked}
        onClick={unlocked ? () => setEditing(key) : undefined}
      >
        {text[key]}
      </span>
    );

  const toggleLock = () => {
    setEditing(null);
    setUnlocked((u) => !u);
  };

  const post = (id: "p1" | "p2", photo: string, photoAlt: string, plainAvatar: boolean) => (
    <article className={id === "p1" ? `${styles.post} ${styles.fillPost}` : styles.post} key={id}>
      <header className={styles.postHeader}>
        <Avatar size={44} plain={plainAvatar} />
        <div className={styles.who}>
          <div>{t(`${id}.user`, styles.username)}</div>
        </div>
        <span className={styles.dots}>
          <DotsIcon />
        </span>
      </header>

      {id === "p1" ? (
        // The first post always fills the screen: its picture takes whatever
        // height is left and is cropped (not stretched) to it.
        <div className={styles.photoFill}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static public/ asset */}
          <img src={photo} className={styles.photoCover} alt={photoAlt} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- static public/ asset
        <img src={photo} className={styles.photo} alt={photoAlt} />
      )}

      <div className={styles.actions}>
        <span className={styles.action}>
          <HeartFilledIcon />
          {t(`${id}.likes`, styles.actionNumber)}
        </span>
        <span className={styles.action}>
          <BubbleIcon />
          {t(`${id}.comments`, styles.actionNumber)}
        </span>
        <span className={styles.action}>
          <PlaneIcon size={28} />
          {t(`${id}.shares`, styles.actionNumber)}
        </span>
        <button
          type="button"
          className={styles.bookmark}
          data-unlocked={unlocked}
          onClick={toggleLock}
          aria-label={unlocked ? "ล็อกการแก้ไขข้อความ" : "ปลดล็อกการแก้ไขข้อความ"}
        >
          <BookmarkIcon filled={unlocked} />
        </button>
      </div>

      <div className={styles.text}>
        {id !== "p1" && (
          <div className={styles.likedBy}>
            ถูกใจโดย <b>{t(`${id}.likedBy`)}</b> และคนอื่นๆ
          </div>
        )}
        <div>
          <b>{t(`${id}.user`)}</b> {t(`${id}.caption`, "", true)}
        </div>
        {(id === "p1" ? [1, 2] : [1, 2, 3]).map((n) => (
          <div key={n}>
            <b>{t(`${id}.c${n}u`)}</b> {t(`${id}.c${n}t`, "", true)}
          </div>
        ))}
        <div className={styles.viewAll}>
          {id === "p1" ? (
            <span className={styles.korean}>댓글 {text[`${id}.comments`]}개 모두 보기</span>
          ) : (
            <>ดูความคิดเห็นทั้งหมด {text[`${id}.comments`]} รายการ</>
          )}
        </div>
        <div className={styles.time}>{t(`${id}.time`)}</div>
      </div>
    </article>
  );

  return (
    <div className={styles.shell}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/")} aria-label="กลับไปหน้ารวมแชท">
          <BackIcon />
        </button>
        <div className={styles.topIcons}>
          <SearchIcon size={26} />
          {/* Secret control: tap once / twice and the new post's numbers speed up. */}
          <button
            type="button"
            className={styles.heartWrap}
            onClick={() => setSpeedLevel((l) => Math.min(l + 1, 2))}
            aria-label="활동"
          >
            <HeartOutlineIcon />
            <i className={styles.redDot} />
          </button>
          <PlaneIcon size={26} />
        </div>
      </div>

      <div className={styles.feed} ref={feedRef}>
        {newPost && <NewPostCard key={newPost.id} user={NEW_POST_USER} post={newPost} speedLevel={speedLevel} />}
        {post("p1", "/room9-post1.webp", "", false)}
        {post("p2", "/room9-post2.png", "", true)}
      </div>

      <nav className={styles.tabs}>
        <span className={styles.tab}>
          <HomeIcon />
          <span className={styles.tabLabelActive}>홈</span>
        </span>
        <span className={styles.tab}>
          <SearchIcon size={28} />
          <span className={styles.tabLabel}>검색</span>
        </span>
        <button type="button" className={`${styles.tab} ${styles.tabButton}`} onClick={() => setCreating(true)}>
          <span className={styles.createCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.6}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className={styles.tabLabel}>게시물 작성</span>
        </button>
        <span className={styles.tab}>
          <VideoIcon />
          <span className={styles.tabLabel}>릴스</span>
        </span>
        <span className={styles.tab}>
          <Avatar size={30} image={PROFILE_IMAGE} />
          <span className={styles.tabLabel}>프로필</span>
        </span>
      </nav>

      {creating && (
        <CreatePost
          media={createMedia}
          onPickFile={pickCreateMedia}
          onClose={() => setCreating(false)}
          onShare={share}
        />
      )}
    </div>
  );
}
