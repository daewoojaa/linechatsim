"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_CLIP, useVideoFeedClips, type ClipField, type ClipInfo } from "@/hooks/useVideoFeedClips";
import styles from "./VideoFeed.module.css";

// The slide list is the clips followed by a duplicate of clip 1. Swiping past
// the last clip slides up onto this phantom slide (looks identical to
// clip 1), then a transition-less snap back to the real index 0 happens
// right after - that avoids the alternative of animating the last index -> 0
// directly, which would visibly rewind backward through every clip instead
// of looping forward.

const TRANSITION_MS = 350;
const SWIPE_THRESHOLD_PX = 50;
const WHEEL_THRESHOLD_PX = 30;

const FORM_FIELDS: ClipField[] = ["name", "caption", "tags", "song", "likes", "comments", "shares", "saves"];

const FIELD_LABELS: Record<ClipField, string> = {
  name: "ชื่อแอคเค้าท์",
  caption: "แคปชั่น",
  tags: "แฮชแท็ก",
  song: "ชื่อเพลง",
  likes: "ยอดไลค์",
  comments: "ยอดคอมเม้นท์",
  shares: "ยอดแชร์",
  saves: "ยอดบุ๊คมาร์ค",
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function HeartIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#ff5c8a">
      <path d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 2.6 4.8 6.1 4.8c2.1 0 3.6 1.2 5.9 3.4 2.3-2.2 3.8-3.4 5.9-3.4 3.5 0 5.1 3.6 3.7 6.9C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#8ec9f7">
      <path d="M12 3C6.8 3 3 6.4 3 10.6c0 2.3 1.1 4.3 2.9 5.7-.1 1.3-.6 2.6-1.6 3.7 1.9-.1 3.6-.8 4.8-1.8.9.3 1.8.4 2.9.4 5.2 0 9-3.4 9-7.6S17.2 3 12 3Z" />
      <circle cx={8.5} cy={10.6} r={1.2} fill="#ffffff" />
      <circle cx={12} cy={10.6} r={1.2} fill="#ffffff" />
      <circle cx={15.5} cy={10.6} r={1.2} fill="#ffffff" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#6db3f2">
      <path d="M21.5 3.2 2.9 10.1c-.8.3-.8 1.4 0 1.7l5.3 1.8 2 6.1c.3.8 1.3.9 1.7.2l2.6-3.8 4.6 3.4c.6.4 1.4.1 1.6-.6L22.9 4.4c.2-.8-.6-1.5-1.4-1.2Z" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#f7cf6a">
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.6L5 21V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function NoteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3v11.6A3.5 3.5 0 1 1 15 11.4V6.3l-6 1.4v9A3.5 3.5 0 1 1 7 13.5V5.5L17 3Z" />
    </svg>
  );
}
function LiveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
      <circle cx={12} cy={12} r={2} fill="currentColor" stroke="none" />
      <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.4 5.4a9.4 9.4 0 0 0 0 13.2M18.6 5.4a9.4 9.4 0 0 1 0 13.2" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <circle cx={11} cy={11} r={6.5} />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
function HomeNavIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3.2 3 10.6V20a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1v-9.4L12 3.2Z" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <circle cx={12} cy={12} r={9} />
      <path d="m15.6 8.4-2 5.2-5.2 2 2-5.2 5.2-2Z" />
    </svg>
  );
}
function MessageNavIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <path d="M12 4c-4.6 0-8 3-8 6.8 0 2 1 3.800 2.600 5-.1 1.200-.6 2.400-1.500 3.400 1.700-.1 3.200-.7 4.300-1.600.8.2 1.600.3 2.600.3 4.600 0 8-3 8-6.800S16.600 4 12 4Z" />
      <path d="M9 11.500c.8 1 1.800 1.500 3 1.500s2.200-.5 3-1.500" />
    </svg>
  );
}
function SmileNavIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={1.7}>
      <circle cx={12} cy={12} r={9} />
      <circle cx={9} cy={10} r={1} fill="currentColor" stroke="none" />
      <circle cx={15} cy={10} r={1} fill="currentColor" stroke="none" />
      <path d="M8.500 14.500c1 1.200 2.100 1.800 3.500 1.800s2.500-.6 3.500-1.800" />
    </svg>
  );
}

type EditTarget = { clip: number; field: ClipField };

type OverlayProps = {
  info: ClipInfo;
  avatar: string | null;
  onEdit: (field: ClipField) => void;
  onPickAvatar: () => void;
};

/** The parts of the interface that ride along with each clip. */
function ClipOverlay({ info, avatar, onEdit, onPickAvatar }: OverlayProps) {
  const avatarStyle = avatar ? { backgroundImage: `url(${avatar})` } : undefined;
  const counters: [ClipField, React.ReactNode][] = [
    ["likes", <HeartIcon key="h" />],
    ["comments", <CommentIcon key="c" />],
    ["shares", <ShareIcon key="s" />],
    ["saves", <BookmarkIcon key="b" />],
  ];
  return (
    <>
      <div className={styles.rail}>
        <div className={styles.railCard}>
          <button type="button" className={styles.avatarButton} onClick={onPickAvatar} aria-label="เปลี่ยนรูปแอคเค้าท์">
            <span className={`${styles.avatar} ${avatar ? "" : styles.avatarDefault}`} style={avatarStyle} />
            <span className={styles.followBadge}>+</span>
          </button>
          {counters.map(([field, icon]) => (
            <button type="button" key={field} className={styles.counter} onClick={() => onEdit(field)}>
              {icon}
              <span>{info[field]}</span>
            </button>
          ))}
        </div>
        <div className={styles.disc}>
          <span className={`${styles.discSpin} ${avatar ? "" : styles.avatarDefault}`} style={avatarStyle} />
          <span className={styles.discNote}>
            <NoteIcon size={13} />
          </span>
        </div>
      </div>

      <div className={styles.info}>
        <button type="button" className={styles.infoName} onClick={() => onEdit("name")}>
          {info.name}
        </button>
        <button type="button" className={styles.infoCaption} onClick={() => onEdit("caption")}>
          {info.caption}
        </button>
        <button type="button" className={styles.infoCaption} onClick={() => onEdit("tags")}>
          {info.tags || " "}
        </button>
        <button type="button" className={styles.songChip} onClick={() => onEdit("song")}>
          <NoteIcon />
          <span className={styles.songText}>{info.song}</span>
          <span className={styles.songArrow}>›</span>
        </button>
      </div>
    </>
  );
}

/**
 * TikTok-style vertical video feed (room 5 / "815 TikTok"). The clips loop
 * with a CSS slide-up transform on .track, one clip per screen; swipe to
 * advance. The search item in the bottom bar uploads a video that replaces
 * the clip on screen, and "+" adds a brand-new clip after asking for its
 * details on an input page (both kept in IndexedDB, so they are
 * remembered). Clips play with their own sound. The top and bottom bars are
 * siblings of .track so they stay locked in place through every transition,
 * while the side rail and caption block live inside each slide and slide
 * away with the clip. Every piece of text (and the account picture) is
 * editable by tapping it; edits persist per clip.
 */
export default function VideoFeed() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [draft, setDraft] = useState("");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const {
    clips,
    avatars,
    videoSrcs,
    addClip,
    requestPickVideo,
    videoInputRef,
    handleVideoChange,
    setField,
    requestPickAvatar,
    avatarInputRef,
    handleAvatarChange,
  } = useVideoFeedClips();
  const slides = [...videoSrcs, videoSrcs[0]];
  const clipCount = clips.length;

  // "+" flow: pick a video, then fill in its details on the input page.
  const addInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [form, setForm] = useState<ClipInfo>(EMPTY_CLIP);
  const [saving, setSaving] = useState(false);
  // Set when the browser refuses to autoplay with sound: playback falls
  // back to muted and the sound comes on at the next touch.
  const soundBlocked = useRef(false);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index) {
        video.currentTime = 0;
        video.muted = false;
        video.play().catch(() => {
          // Sound autoplay needs a prior tap; play silently for now.
          soundBlocked.current = true;
          video.muted = true;
          video.play().catch(() => {
            // Still blocked (e.g. low-power mode) - nothing more to do.
          });
        });
      } else {
        video.pause();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- videoSrcs is re-created every render; its joined value is the real dependency
  }, [index, videoSrcs.join("|")]);

  useEffect(() => {
    const unmute = () => {
      if (!soundBlocked.current) return;
      soundBlocked.current = false;
      videoRefs.current.forEach((v) => {
        if (v) v.muted = false;
      });
    };
    window.addEventListener("pointerdown", unmute);
    return () => window.removeEventListener("pointerdown", unmute);
  }, []);

  const goTo = (next: number) => {
    if (lockedRef.current || next < 0 || next >= slides.length || next === index) return;
    lockedRef.current = true;
    setIndex(next);

    if (next === slides.length - 1) {
      // Landed on the phantom clip-1 duplicate: let the slide-up
      // animation finish, then snap to the real clip 1 with the CSS
      // transition disabled for one frame so it's an invisible cut.
      setTimeout(() => {
        setSuppressTransition(true);
        setIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setSuppressTransition(false));
        });
        lockedRef.current = false;
      }, TRANSITION_MS);
    } else {
      setTimeout(() => {
        lockedRef.current = false;
      }, TRANSITION_MS);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (delta < -SWIPE_THRESHOLD_PX) goTo(index + 1);
    else if (delta > SWIPE_THRESHOLD_PX) goTo(index - 1);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.deltaY > WHEEL_THRESHOLD_PX) goTo(index + 1);
    else if (e.deltaY < -WHEEL_THRESHOLD_PX) goTo(index - 1);
  };

  const startEdit = (clip: number, field: ClipField) => {
    setDraft(clips[clip][field]);
    setEditing({ clip, field });
  };
  const commitEdit = () => {
    if (editing) setField(editing.clip, editing.field, draft.trim());
    setEditing(null);
  };

  const saveNewClip = async () => {
    if (!pendingFile || saving) return;
    setSaving(true);
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as ClipInfo;
    const newIndex = await addClip(pendingFile, trimmed);
    setPendingFile(null);
    setSaving(false);
    // Slide to the new clip (same tick as the clip list update, so the
    // track already has its slide).
    lockedRef.current = true;
    setIndex(newIndex);
    setTimeout(() => {
      lockedRef.current = false;
    }, TRANSITION_MS);
  };

  return (
    <div className={styles.appShell}>
      <div className={styles.stage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onWheel={onWheel}>
        <div
          className={styles.track}
          style={{
            transform: `translateY(-${index * 100}%)`,
            transition: suppressTransition ? "none" : undefined,
          }}
        >
          {slides.map((src, i) => {
            const clip = i % clipCount;
            return (
              <div className={styles.slide} key={i}>
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  className={styles.video}
                  src={src}
                  loop
                  playsInline
                  preload={i === 0 || i === slides.length - 1 ? "auto" : "metadata"}
                />
                <ClipOverlay
                  info={clips[clip]}
                  avatar={avatars[clip]}
                  onEdit={(field) => startEdit(clip, field)}
                  onPickAvatar={() => requestPickAvatar(clip)}
                />
              </div>
            );
          })}
        </div>

        {/* Locked top bar. */}
        <div className={styles.topBar}>
          <div className={styles.liveBadge}>
            <LiveIcon />
            <span>LIVE</span>
            <i className={styles.liveDot} />
          </div>
          <div className={styles.tabPill}>
            <span className={`${styles.tab} ${styles.tabActive}`}>แนะนำ</span>
            <span className={styles.tab}>เพื่อน</span>
            <span className={styles.tab}>สำรวจ</span>
          </div>
          <div className={styles.searchCircle}>
            <SearchIcon />
          </div>
        </div>

        {/* Locked bottom bar. */}
        <div className={styles.bottomNav}>
          <button type="button" className={styles.navItem} onClick={() => router.push("/")}>
            <HomeNavIcon />
            <i className={styles.navDot} />
            <span className={styles.navLabel}>หน้าหลัก</span>
          </button>
          <button
            type="button"
            className={styles.navItem}
            onClick={() => requestPickVideo(index % clipCount)}
            aria-label="เปลี่ยนคลิปนี้ (อัพโหลดคลิปแทน)"
          >
            <CompassIcon />
            <span className={styles.navLabel}>ค้นหา</span>
          </button>
          <button type="button" className={styles.navItem} onClick={() => addInputRef.current?.click()} aria-label="เพิ่มคลิปใหม่">
            <span className={styles.plusPill}>
              <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth={2.6}>
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className={styles.navLabel}>โพสต์</span>
          </button>
          <div className={styles.navItem}>
            <MessageNavIcon />
            <span className={styles.navLabel}>ข้อความ</span>
          </div>
          <div className={styles.navItem}>
            <SmileNavIcon />
            <span className={styles.navLabel}>ฉัน</span>
          </div>
        </div>
      </div>

      {editing && (
        <div className={styles.editorBackdrop} onClick={commitEdit}>
          <div className={styles.editorCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editorLabel}>{FIELD_LABELS[editing.field]}</div>
            <input
              className={styles.editorInput}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                else if (e.key === "Escape") setEditing(null);
              }}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button type="button" className={styles.editorOk} onClick={commitEdit}>
              ตกลง
            </button>
          </div>
        </div>
      )}

      {pendingFile && (
        <div className={styles.formPage}>
          <div className={styles.formHeader}>เพิ่มคลิปใหม่</div>
          <div className={styles.formFile}>{pendingFile.name}</div>
          <div className={styles.formBody}>
            {FORM_FIELDS.map((field) => (
              <label key={field} className={styles.formField}>
                <span>{FIELD_LABELS[field]}</span>
                <input
                  className={styles.editorInput}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </label>
            ))}
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.formCancel} onClick={() => setPendingFile(null)} disabled={saving}>
              ยกเลิก
            </button>
            <button type="button" className={styles.editorOk} onClick={saveNewClip} disabled={saving}>
              เพิ่มคลิป
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="video/*"
        ref={addInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setForm(EMPTY_CLIP);
          setPendingFile(file);
        }}
        className={styles.hidden}
      />
      <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoChange} className={styles.hidden} />
      <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className={styles.hidden} />
    </div>
  );
}
