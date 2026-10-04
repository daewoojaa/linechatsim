"use client";

import { useEffect, useRef, useState } from "react";
import { useSoundGrid } from "@/hooks/useSoundGrid";
import styles from "./SoundPage.module.css";

const STORAGE_KEY = "linechatsim-room5-sound-v1";
const RUN_KEY = "linechatsim-room5-sound-run-v1";

const DEFAULT_RUN = { start: "465.9K", end: "470K", seconds: "20" };
const POSTS_SUFFIX = " โพสต์";
const TICK_MS = 100;

/** "465.9K" / "1.2M" / "465,900" -> 465900 etc. null when it isn't a number. */
function parseCount(input: string): number | null {
  const m = /^\s*([\d,]*\.?\d+)\s*([kKmM])?\s*$/.exec(input);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(n)) return null;
  return n * (m[2] ? (m[2].toLowerCase() === "m" ? 1_000_000 : 1_000) : 1);
}

/** 465912 -> "465.9K", 1_250_000 -> "1.25M", 950 -> "950". */
function formatCount(n: number): string {
  const trim = (x: number, digits: number) => x.toFixed(digits).replace(/\.?0+$/, "");
  if (n >= 1_000_000) return `${trim(n / 1_000_000, 2)}M`;
  if (n >= 1_000) return `${trim(n / 1_000, 1)}K`;
  return String(Math.round(n));
}

const DEFAULT_TEXT: Record<string, string> = {
  title: "ดงชน รีมิกซ์ 3.1",
  artist: "วงไข่มุกบารมี เศรษฐีพันล้าน",
  count: "465.9K โพสต์",
  story: "สตอรี่ใหม่",
  useSound: "ใช้เสียง",
};

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
 * take a picture or a video from the device (videos autoplay, muted, on a loop). "บันทึก" doubles as the edit
 * lock: while unlocked, the title, artist, post count and the two bottom
 * labels can be tapped and retyped (edits are remembered). The play button
 * next to the title opens a dialog (start value, end value, seconds) whose
 * Start button counts the post number up from one to the other. The other
 * buttons are decorative.
 */
export default function SoundPage({ avatar, onPickAvatar, onBack }: Props) {
  const { slots, pick, inputRef, handleChange } = useSoundGrid();
  const [text, setText] = useState<Record<string, string>>(DEFAULT_TEXT);
  // Latest text for `change`, which a running counter calls long after the
  // render that created it.
  const textRef = useRef(text);
  const [unlocked, setUnlocked] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Post-count runner (the play button): a dialog collects start value, end
  // value and duration; Start counts the number up from one to the other.
  const [runOpen, setRunOpen] = useState(false);
  const [run, setRun] = useState(DEFAULT_RUN);
  const [shownCount, setShownCount] = useState<string | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Saved edits (client-only, so the server render stays on the defaults).
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          textRef.current = { ...textRef.current, ...(JSON.parse(raw) as Record<string, string>) };
          setText(textRef.current);
        }
      } catch {
        // Persistence is best-effort.
      }
    });
  }, []);

  useEffect(() => {
    if (editing) {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }
  }, [editing]);

  // Last-used run values.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(RUN_KEY);
        if (raw) setRun((prev) => ({ ...prev, ...(JSON.parse(raw) as typeof DEFAULT_RUN) }));
      } catch {
        // Persistence is best-effort.
      }
    });
    return () => {
      if (runTimerRef.current) clearInterval(runTimerRef.current);
    };
  }, []);

  const startRun = () => {
    const from = parseCount(run.start);
    const to = parseCount(run.end);
    const seconds = Math.max(parseFloat(run.seconds) || 0, 0);
    if (from === null || to === null) return;
    try {
      window.localStorage.setItem(RUN_KEY, JSON.stringify(run));
    } catch {
      // Persistence is best-effort.
    }
    setRunOpen(false);
    setEditing(null);
    if (runTimerRef.current) clearInterval(runTimerRef.current);
    let ticks = 0;
    const show = (value: number) => setShownCount(`${formatCount(value)}${POSTS_SUFFIX}`);
    show(from);
    runTimerRef.current = setInterval(() => {
      ticks += 1;
      const progress = seconds === 0 ? 1 : Math.min((ticks * TICK_MS) / (seconds * 1000), 1);
      show(from + (to - from) * progress);
      if (progress >= 1) {
        if (runTimerRef.current) clearInterval(runTimerRef.current);
        runTimerRef.current = null;
        // Rest on the final number and keep it as the page's post count.
        setShownCount(null);
        change("count", `${formatCount(to)}${POSTS_SUFFIX}`);
      }
    }, TICK_MS);
  };

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

  /** One piece of editable text: plain while locked, tappable when unlocked. */
  const editable = (key: string, className: string) => {
    if (editing === key) {
      return (
        <input
          ref={textInputRef}
          className={`${className} ${styles.textInput}`}
          value={text[key]}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => change(key, e.target.value)}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setEditing(null);
            }
          }}
        />
      );
    }
    return (
      <span
        className={className}
        data-editable={unlocked && !(key === "count" && shownCount !== null)}
        onClick={unlocked && !(key === "count" && shownCount !== null) ? () => setEditing(key) : undefined}
      >
        {key === "count" && shownCount !== null ? shownCount : text[key]}
      </span>
    );
  };

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
            <div className={styles.titleRow}>
              {editable("title", styles.title)}
              <button
                type="button"
                className={`${styles.glass} ${styles.circle} ${styles.playCircle}`}
                onClick={() => setRunOpen(true)}
                aria-label="ตั้งค่าการรันเลขโพสต์"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4.500v15a1 1 0 0 0 1.500.9l12-7.500a1 1 0 0 0 0-1.800l-12-7.500A1 1 0 0 0 7 4.500Z" />
                </svg>
              </button>
            </div>
            {editable("artist", styles.artist)}
            {editable("count", styles.count)}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.glass} ${styles.saveButton}`}
          data-unlocked={unlocked}
          onClick={() => {
            setEditing(null);
            setUnlocked((u) => !u);
          }}
          title={unlocked ? "แตะเพื่อล็อกการแก้ไข" : "แตะเพื่อปลดล็อกการแก้ไขข้อความ"}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2} fill={unlocked ? "currentColor" : "none"}>
            <path d="M6 3.500h12v17l-6-4.200-6 4.200Z" />
          </svg>
          <span>บันทึก</span>
        </button>

        <div className={styles.grid}>
          {slots.map((slot, i) => (
            <button type="button" key={i} className={styles.tile} onClick={() => pick(i)} aria-label={`ช่องที่ ${i + 1}`}>
              {slot ? (
                slot.kind === "video" ? (
                  // Muted so the browser allows autoplay; loops like a thumbnail preview.
                  <video className={styles.media} src={slot.url} autoPlay muted loop playsInline />
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
          {editable("story", styles.actionLabel)}
        </span>
        <span className={`${styles.glass} ${styles.action} ${styles.actionMuted}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <rect x={3} y={6.500} width={12} height={11} rx={2.500} />
            <path d="m16.500 10.500 4.200-2.500c.5-.3 1.100 0 1.100.6v6.800c0 .6-.6.900-1.100.6l-4.200-2.500Z" />
          </svg>
          {editable("useSound", styles.actionLabel)}
        </span>
      </div>

      {runOpen && (
        <div className={styles.dialogBackdrop} onClick={() => setRunOpen(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>รันตัวเลขจำนวนโพสต์</div>
            <label className={styles.dialogField}>
              <span>ค่าเริ่มต้น</span>
              <input
                className={styles.dialogInput}
                value={run.start}
                onChange={(e) => setRun((r) => ({ ...r, start: e.target.value }))}
                placeholder="เช่น 465.9K"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </label>
            <label className={styles.dialogField}>
              <span>ค่าสุดท้าย</span>
              <input
                className={styles.dialogInput}
                value={run.end}
                onChange={(e) => setRun((r) => ({ ...r, end: e.target.value }))}
                placeholder="เช่น 470K"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </label>
            <label className={styles.dialogField}>
              <span>ระยะเวลา (วินาที)</span>
              <input
                className={styles.dialogInput}
                value={run.seconds}
                inputMode="decimal"
                onChange={(e) => setRun((r) => ({ ...r, seconds: e.target.value }))}
                placeholder="เช่น 20"
              />
            </label>
            <div className={styles.dialogHint}>ใส่ได้ทั้ง 465900 หรือ 465.9K / 1.2M</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogCancel} onClick={() => setRunOpen(false)}>
                ยกเลิก
              </button>
              <button
                type="button"
                className={styles.dialogStart}
                onClick={startRun}
                disabled={parseCount(run.start) === null || parseCount(run.end) === null}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      <input type="file" accept="image/*,video/*" ref={inputRef} onChange={handleChange} hidden />
    </div>
  );
}
