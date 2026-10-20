"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { idbDeleteImage, idbGetImage, idbSetImage } from "@/lib/idbStore";
import { useKeyboardReserve } from "@/hooks/useKeyboardReserve";
import PostVideo from "@/components/SocialFeed/PostVideo";
import styles from "./SocialPostApp.module.css";

type Media = { src: string; video: boolean };

const POSTER = "ปูเป้ ซาลอน";
const DEFAULT_MEDIA: Media = { src: "/room10-photo.jpg", video: false };
const MEDIA_KEY = "room11:media";
const DEFAULT_TEXT = "ไม่คิดไม่ฝันว่าจะเจอซอจีฮุน รักแรกของชั้น ที่งานเต่างอย #ห่างแค่เพียงเอื้อมมือแต่มันคือแสนไกล";
const POST_TIME = "21.00 น.";
const FALLBACK_KEYBOARD_RESERVE = "43.8dvh";

type Comment = { id: string; name: string; text: string; time: string; avatar: "miyeon" | { letter: string; from: string; to: string } };

// Miyeon (picture and name as in room 10) comes first; the others are made-up
// accounts with plain coloured profile circles.
const COMMENTS: Comment[] = [
  { id: "c1", name: "미연", text: "are you sure? is this real Jihoon?", time: "21.04", avatar: "miyeon" },
  { id: "c2", name: "ปีกแพร ปีกใจ", text: "หล่อแท้ลูก คนนี้แม่นพระเอกเกาหลีบ่", time: "21.07", avatar: { letter: "ป", from: "#f6a4b8", to: "#e86f93" } },
  { id: "c3", name: "จิน เสริมสวย", text: "วาสนาสูงคักแท้สู 555555", time: "21.09", avatar: { letter: "จ", from: "#9ad6c0", to: "#3f9d83" } },
  { id: "c4", name: "มินท์", text: "กรี๊ดดดดดดด คนที่มึงเปิดรูปให้กูเบิ่งทุกมื้อแม่นบ่!!!", time: "21.12", avatar: { letter: "ม", from: "#b9b1ee", to: "#7467d6" } },
  { id: "c5", name: "ตุ๊ก บ้านโนน", text: "ตัวจริงมั้ย", time: "21.15", avatar: { letter: "ต", from: "#f5cd7a", to: "#e0993a" } },
];

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

/* ---- icons (drawn here, in the spirit of the reference) ---- */

function XIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function PhotoBadgeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x={2.500} y={3.500} width={19} height={17} rx={3} fill="#ffffff" />
      <circle cx={8.500} cy={9} r={1.800} fill="#e8621c" />
      <path d="M3.500 18.500 9 13l3.500 3.500 3-3 5 5V19a1.500 1.500 0 0 1-1.500 1.500H5A1.500 1.500 0 0 1 3.500 19Z" fill="#e8621c" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M8.500 5.500 9.600 4h4.800l1.100 1.500H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.500a2 2 0 0 1 2-2Z" fill="#f0642a" />
      <circle cx={12} cy={12.500} r={3.800} fill="#ffffff" />
      <circle cx={12} cy={12.500} r={2} fill="#f0642a" />
    </svg>
  );
}
function PlayBoxIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x={2.500} y={4.500} width={19} height={15} rx={3.500} fill="#e8344f" />
      <path d="M10 9v6l5-3Z" fill="#ffffff" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 21.500s7-6.300 7-12a7 7 0 0 0-14 0c0 5.700 7 12 7 12Z" fill="#2fa05a" />
      <circle cx={12} cy={9.500} r={2.600} fill="#ffffff" />
    </svg>
  );
}
function SmileIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx={12} cy={12} r={9.500} fill="#f6bf2d" />
      <circle cx={9} cy={10} r={1.200} fill="#5a3b00" />
      <circle cx={15} cy={10} r={1.200} fill="#5a3b00" />
      <path d="M8 14c1 1.800 2.400 2.600 4 2.600s3-.8 4-2.600" stroke="#5a3b00" strokeWidth={1.600} strokeLinecap="round" />
    </svg>
  );
}
function DotsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx={5.500} cy={12} r={1.900} />
      <circle cx={12} cy={12} r={1.900} />
      <circle cx={18.500} cy={12} r={1.900} />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10V8a5 5 0 0 1 10 0v2h.500A2.500 2.500 0 0 1 20 12.500v6A2.500 2.500 0 0 1 17.500 21h-11A2.500 2.500 0 0 1 4 18.500v-6A2.500 2.500 0 0 1 6.500 10Zm2 0h6V8a3 3 0 0 0-6 0Z" />
    </svg>
  );
}
function Caret() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 9h14l-7 8Z" />
    </svg>
  );
}
function PlusSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth={2.600}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <rect x={3.500} y={3.500} width={17} height={17} rx={5} />
      <circle cx={12} cy={12} r={4} />
      <circle cx={17} cy={7} r={0.600} fill="currentColor" />
    </svg>
  );
}
function AtIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth={2.200}>
      <circle cx={12} cy={12} r={3.600} />
      <path d="M15.600 8.500V13a2.600 2.600 0 0 0 5.200 0v-1a8.800 8.800 0 1 0-3.400 6.900" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <circle cx={10.500} cy={10.500} r={6.600} />
      <path d="m15.600 15.600 5 5" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.800a6 6 0 0 0-6 6v3.300c0 .9-.3 1.700-.9 2.400L3.800 16.100c-.6.700-.1 1.800.9 1.800h14.600c1 0 1.500-1.100.9-1.800l-1.300-1.600a3.800 3.800 0 0 1-.9-2.400V8.800a6 6 0 0 0-6-6ZM9.600 19.200a2.500 2.500 0 0 0 4.800 0Z" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={1.800}>
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18M12 3c2.500 2.700 3.700 5.700 3.700 9S14.500 18.300 12 21c-2.500-2.700-3.700-5.700-3.700-9S9.500 5.700 12 3Z" />
    </svg>
  );
}
function ThumbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.800}>
      <path d="M7.500 11v9.500H4.500V11ZM7.500 11l3.400-6.200a1.700 1.700 0 0 1 3.200 1L13.300 9.500h5a2 2 0 0 1 1.900 2.500l-1.700 6.800a2 2 0 0 1-1.900 1.500H7.500" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.800}>
      <path d="M12 3.800c-4.700 0-8.400 3.100-8.400 7 0 2.200 1.100 4.100 2.900 5.400-.1 1.400-.7 2.500-1.700 3.500 1.900-.1 3.600-.8 4.800-1.800.8.200 1.500.3 2.400.3 4.700 0 8.400-3.100 8.400-7s-3.700-7.400-8.400-7.400Z" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.800}>
      <path d="M21 3.500 3.400 10.200c-.8.300-.8 1.400 0 1.700l6.200 2.300 2.300 6.200c.3.800 1.400.8 1.700 0L21 3.500Z" />
      <path d="m9.700 14.100 5.600-5.600" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.800}>
      <path d="M6.500 3.600h11v16.800L12 16.300l-5.500 4.100Z" />
    </svg>
  );
}
function HomeFilledIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.600 2.400 10.500c-.4.300-.6.800-.6 1.300v8.200a1.800 1.800 0 0 0 1.800 1.800h4.700v-6.200h7.400v6.200h4.700a1.800 1.800 0 0 0 1.800-1.800v-8.200c0-.5-.2-1-.6-1.300L12 2.600Z" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.900}>
      <circle cx={12} cy={12} r={9.500} />
      <path d="m15.800 8.200-2.200 5.400-5.400 2.200 2.200-5.400Z" fill="currentColor" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.900}>
      <path d="m12 3 9 5-9 5-9-5Z" />
      <path d="m3 12.500 9 5 9-5M3 16.500l9 5 9-5" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" {...stroke} strokeWidth={1.900}>
      <circle cx={12} cy={8} r={4} />
      <path d="M4.500 20.500c.8-4 3.800-6 7.500-6s6.700 2 7.500 6" />
    </svg>
  );
}
function ThumbSmall({ down = false, active = false }: { down?: boolean; active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={1.800} style={down ? { transform: "scaleY(-1)" } : undefined} fill={active ? "currentColor" : "none"}>
      <path d="M7.500 11v9.500H4.500V11ZM7.500 11l3.400-6.200a1.700 1.700 0 0 1 3.200 1L13.300 9.500h5a2 2 0 0 1 1.900 2.500l-1.700 6.800a2 2 0 0 1-1.900 1.500H7.500" />
    </svg>
  );
}
function ReactionBadges() {
  return (
    <span className={styles.reactionBadges}>
      <i style={{ background: "#ef3b5c" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 20.800s-8-4.900-9.300-10.100C1.700 6.900 4 4.200 7.100 4.200c1.900 0 3.600 1 4.900 2.800 1.300-1.800 3-2.800 4.900-2.800 3.100 0 5.400 2.700 4.400 6.500-1.300 5.200-9.300 10.100-9.300 10.100Z" />
        </svg>
      </i>
      <i style={{ background: "#3b82f6" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
          <path d="M7.500 11v9.500H4.500V11ZM8.500 11l3.400-6.200a1.700 1.700 0 0 1 3.200 1L14.300 9.500h4a2 2 0 0 1 1.900 2.500l-1.700 6.800a2 2 0 0 1-1.900 1.500H8.500Z" />
        </svg>
      </i>
      <i style={{ background: "#f6b928" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
          <path d="m12 3.500 2.600 5.300 5.800.8-4.200 4.100 1 5.800L12 16.800l-5.200 2.700 1-5.800L3.600 9.600l5.800-.8Z" />
        </svg>
      </i>
    </span>
  );
}

/* ---- small pieces ---- */

function Avatar({ size, letter }: { size: number; letter?: string }) {
  // The poster's profile circle: no photo was given, so a soft pink one.
  return (
    <span className={styles.posterAvatar} style={{ width: size, height: size, fontSize: size * 0.46 }}>
      {letter ?? "ป"}
    </span>
  );
}

function CommentAvatar({ avatar }: { avatar: Comment["avatar"] }) {
  if (avatar === "miyeon") return <span className={styles.miyeonAvatar} />;
  return (
    <span className={styles.commentAvatar} style={{ background: `linear-gradient(140deg, ${avatar.from}, ${avatar.to})` }}>
      {avatar.letter}
    </span>
  );
}

/** The post's text with each #hashtag in blue. */
function PostText({ text }: { text: string }) {
  const parts = text.split(/(#[^\s#]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className={styles.hashtag}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function BottomNav({ screen, onHome, onCreate }: { screen: "create" | "feed"; onHome: () => void; onCreate: () => void }) {
  const item = (label: string, icon: ReactNode, active: boolean, onClick?: () => void) => (
    <button type="button" className={styles.navItem} data-active={active} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
  return (
    <nav className={styles.nav}>
      {item("สำรวจ", <HomeFilledIcon />, true, onHome)}
      {item("ค้นหา", <CompassIcon />, false)}
      <button type="button" className={styles.navItem} data-active={screen === "create"} onClick={onCreate}>
        <span className={styles.navCreate}>
          <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2.800}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span>สร้าง</span>
      </button>
      {item("ชุมชน", <LayersIcon />, false)}
      {item("โปรไฟล์", <PersonIcon />, false)}
    </nav>
  );
}

function PostMediaView({ media }: { media: Media }) {
  return media.video ? (
    <div className={styles.feedMedia}>
      <PostVideo src={media.src} />
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- static asset or local blob
    <img src={media.src} className={`${styles.feedMedia} ${styles.feedImage}`} alt="" />
  );
}

/**
 * Room 11 (324 ปูเป้ ซาลอน): a Thai social-network "create a post" screen
 * (pick a picture or a clip, edit the text, โพสต์) that, once posted, turns
 * into the feed with that post on top and a few comments under it - Miyeon's
 * first. The picture / clip is remembered on the device; the default one is
 * room 10's grey picture.
 */
export default function SocialPostApp() {
  const router = useRouter();
  const [screen, setScreen] = useState<"create" | "feed">("create");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [media, setMedia] = useState<Media>(DEFAULT_MEDIA);
  const [posted, setPosted] = useState<{ text: string; media: Media } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const keyboardReserve = useKeyboardReserve(textRef, FALLBACK_KEYBOARD_RESERVE);

  // The picture / clip chosen last time.
  useEffect(() => {
    let cancelled = false;
    idbGetImage(MEDIA_KEY)
      .then((blob) => {
        if (blob && !cancelled) setMedia({ src: URL.createObjectURL(blob), video: blob.type.startsWith("video/") });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pickFile = (accept: string) => {
    const el = fileRef.current;
    if (!el) return;
    el.accept = accept;
    el.value = "";
    el.click();
  };

  const onFile = (file: File) => {
    // Not revoked: a post already shared may still be showing the previous one.
    setMedia({ src: URL.createObjectURL(file), video: file.type.startsWith("video/") });
    idbSetImage(MEDIA_KEY, file).catch(() => {});
  };

  const resetMedia = () => {
    setMedia(DEFAULT_MEDIA);
    idbDeleteImage(MEDIA_KEY).catch(() => {});
  };

  const publish = () => {
    setPosted({ text: text.trim(), media });
    setScreen("feed");
  };

  const append = (ch: string) => {
    setText((t) => (t && !t.endsWith(" ") ? `${t} ${ch}` : `${t}${ch}`));
    textRef.current?.focus();
  };

  const actionRow = (
    <div className={styles.actionRow}>
      <button type="button" className={styles.actionChip} onClick={() => pickFile("image/*")}>
        <CameraIcon />
        <span>รูปภาพ</span>
      </button>
      <button type="button" className={styles.actionChip} onClick={() => pickFile("video/*")}>
        <PlayBoxIcon />
        <span>วิดีโอ</span>
      </button>
      <span className={styles.actionChip}>
        <PinIcon />
        <span>เช็กอิน</span>
      </span>
      <span className={styles.actionChip}>
        <SmileIcon />
        <span>ความรู้สึก</span>
      </span>
      <span className={`${styles.actionChip} ${styles.actionMore}`}>
        <DotsIcon />
      </span>
    </div>
  );

  return (
    <div className={styles.shell} style={{ paddingBottom: keyboardReserve }}>
      {screen === "create" ? (
        <div className={styles.screen}>
          <div className={styles.createHeader}>
            <button type="button" className={styles.closeButton} onClick={() => router.push("/")} aria-label="ปิด">
              <XIcon />
            </button>
            <div className={styles.createTitle}>สร้างโพสต์</div>
            <button type="button" className={styles.postButton} onClick={publish}>
              โพสต์
            </button>
          </div>

          <div className={styles.profileRow}>
            <Avatar size={54} />
            <div className={styles.profileMain}>
              <div className={styles.profileName}>{POSTER}</div>
              <div className={styles.chips}>
                <span className={styles.chip}>
                  <LockIcon />
                  เฉพาะฉัน
                  <Caret />
                </span>
                <span className={styles.chip}>
                  <PlusSmall />
                  อัลบั้ม
                  <Caret />
                </span>
                <span className={styles.chip}>
                  <InstagramIcon />
                  ปิด
                  <Caret />
                </span>
                <span className={styles.chip}>
                  <AtIcon />
                  ปิด
                  <Caret />
                </span>
                <span className={styles.chip}>
                  <PlusSmall />
                  <span>
                    ป้ายกำกับ <u>AI</u> ปิด
                  </span>
                  <Caret />
                </span>
              </div>
            </div>
          </div>

          <div className={styles.textRow}>
            <textarea
              ref={textRef}
              className={styles.textArea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="คุณกำลังคิดอะไรอยู่?"
              rows={3}
              spellCheck={false}
            />
            <button type="button" className={styles.photoBadge} onClick={() => pickFile("image/*,video/*")} aria-label="เลือกรูปภาพหรือวิดีโอ">
              <PhotoBadgeIcon />
            </button>
          </div>

          <div className={styles.mediaBox} onClick={() => pickFile("image/*,video/*")}>
            {media.video ? (
              <video src={media.src} className={styles.mediaFill} autoPlay muted loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- static asset or local blob
              <img src={media.src} className={styles.mediaFill} alt="" />
            )}
            <span className={styles.editPill} onClick={(e) => e.stopPropagation()}>
              <b>Aa</b> แก้ไข
            </span>
            <button
              type="button"
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                resetMedia();
              }}
              aria-label="ใช้รูปเริ่มต้น"
            >
              <XIcon size={24} />
            </button>
            <span className={styles.tagButtons} onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => append("#")}>
                #
              </button>
              <button type="button" onClick={() => append("@")}>
                @
              </button>
            </span>
          </div>

          {actionRow}
        </div>
      ) : (
        <div className={styles.screen}>
          <div className={styles.feedTop}>
            <div className={styles.searchPill}>
              <SearchIcon />
              <span>ค้นหาเพื่อน เรื่องราว หรือสิ่งที่คุณสนใจ...</span>
            </div>
            <span className={styles.bell}>
              <BellIcon />
              <i>3</i>
            </span>
            <Avatar size={46} />
          </div>

          <div className={styles.feedScroll}>
            <div className={styles.composer}>
              <div className={styles.composerTop}>
                <Avatar size={52} />
                <button type="button" className={styles.composerInput} onClick={() => setScreen("create")}>
                  <span>คุณกำลังคิดอะไรอยู่?</span>
                  <PhotoBadgeInline />
                </button>
              </div>
              <div className={styles.composerDivider} />
              {actionRow}
            </div>

            {posted && (
              <article className={styles.postCard}>
                <header className={styles.postHeader}>
                  <Avatar size={54} />
                  <div className={styles.postWho}>
                    <div className={styles.postName}>{POSTER}</div>
                    <div className={styles.postMeta}>
                      {POST_TIME} · <GlobeIcon />
                    </div>
                  </div>
                  <span className={styles.postDots}>
                    <DotsIcon size={24} />
                  </span>
                </header>
                <div className={styles.postText}>
                  <PostText text={posted.text} />
                </div>
                <PostMediaView media={posted.media} />
                <div className={styles.counts}>
                  <span className={styles.reactions}>
                    <ReactionBadges />
                    1.2 พัน คนชอบ
                  </span>
                  <span>ความคิดเห็น 128 รายการ</span>
                  <span>แชร์ 24 ครั้ง</span>
                </div>
                <div className={styles.postActions}>
                  <span>
                    <ThumbIcon />
                    ถูกใจ
                  </span>
                  <span>
                    <CommentIcon />
                    คอมเมนต์
                  </span>
                  <span>
                    <SendIcon />
                    ส่งต่อ
                  </span>
                  <span>
                    <BookmarkIcon />
                    บันทึก
                  </span>
                </div>
              </article>
            )}

            {posted && (
              <section className={styles.comments}>
                <div className={styles.commentsHeader}>
                  ความคิดเห็นที่เกี่ยวข้องที่สุด <Caret />
                </div>
                {COMMENTS.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    <CommentAvatar avatar={c.avatar} />
                    <div className={styles.commentMain}>
                      <div className={styles.commentBubble}>
                        <div className={styles.commentHead}>
                          <b>{c.name}</b>
                          <span> · {c.time}</span>
                        </div>
                        <div className={styles.commentText}>{c.text}</div>
                      </div>
                      <div className={styles.commentActions}>
                        <b>ตอบกลับ</b>
                        <span className={styles.commentThumbs}>
                          <ThumbSmall />
                          <ThumbSmall down />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      )}

      <BottomNav screen={screen} onHome={() => setScreen("feed")} onCreate={() => setScreen("create")} />

      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

/** The small orange picture icon inside the "what are you thinking" pill. */
function PhotoBadgeInline() {
  return (
    <span className={styles.pillBadge}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x={2.500} y={3.500} width={19} height={17} rx={3} fill="#e8621c" />
        <circle cx={8.500} cy={9} r={1.800} fill="#ffffff" />
        <path d="M3.500 18.500 9 13l3.500 3.500 3-3 5 5V19a1.500 1.500 0 0 1-1.500 1.500H5A1.500 1.500 0 0 1 3.500 19Z" fill="#ffffff" />
      </svg>
    </span>
  );
}
