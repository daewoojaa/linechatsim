"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveCamera, type CameraFacing } from "@/hooks/useLiveCamera";
import { idbDeleteImage, idbGetImage, idbSetImage } from "@/lib/idbStore";
import styles from "./LiveStream.module.css";

const STORAGE_KEY = "linechatsim-room12-v1";
const AVATAR_PREFIX = "room12:avatar:";
const HOST_AVATAR_KEY = "room12:host";
/** The host's picture until another one is chosen: the same "ต้า" as room 5's LIVE. */
const DEFAULT_HOST_AVATAR = "/room5-live-avatar.jpg";

type Entry = { id: string; kind: "comment" | "join"; name: string; text: string };
type Settings = { viewers: number; viewersRate: number; hearts: number; heartsRate: number };

const DEFAULT_SETTINGS: Settings = { viewers: 12400, viewersRate: 6, hearts: 120, heartsRate: 4 };

const DEFAULT_ENTRIES: Entry[] = [
  { id: "e1", kind: "join", name: "พุดดี้", text: "" },
  { id: "e2", kind: "comment", name: "นุ่น บ้านนา", text: "ม่วนหลาย" },
  { id: "e3", kind: "comment", name: "ปลา อุดร", text: "ยายไข่มุก คัมแบค" },
  { id: "e4", kind: "join", name: "ชย", text: "" },
  { id: "e5", kind: "comment", name: "ฟ้า ขอนแก่น", text: "พี่เพลงชื่ออะไร" },
  { id: "e6", kind: "comment", name: "บอล หมอลำ", text: "หมอลำอินเตอร์ว่ะ" },
  { id: "e7", kind: "join", name: "puy", text: "" },
  { id: "e8", kind: "comment", name: "แพรว", text: "เสียงดีแท้ ฮักวงนี้หลาย" },
  { id: "e9", kind: "comment", name: "จ๊ะเอ๋", text: "รอดูมาตั้งนานแล้วเด้อ 🥰" },
  { id: "e10", kind: "join", name: "Madee", text: "" },
  { id: "e11", kind: "comment", name: "โอ๋", text: "พริ้วคักๆ 🔥" },
  { id: "e12", kind: "join", name: "โกมอย", text: "" },
];

const FLOATERS = ["❤️", "💖", "💗", "🎁", "🌹", "✨", "👏", "🔥", "😍", "💜"];
const FEED_VISIBLE = 6;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** 9,999 and below in full, then 12.4K / 1.2M. */
function formatCount(n: number) {
  if (n < 10000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

/** A number that starts at `start` and then climbs by about `rate` a second. */
function useGrowing(start: number, rate: number) {
  const [state, setState] = useState({ from: start, delta: 0 });
  useEffect(() => {
    const id = window.setInterval(() => {
      const whole = rate * rand(0.4, 1.6);
      const inc = Math.floor(whole) + (Math.random() < whole - Math.floor(whole) ? 1 : 0);
      setState((s) => ({ from: start, delta: (s.from === start ? s.delta : 0) + inc }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [start, rate]);
  return state.from === start ? start + state.delta : start;
}

const PALETTE: [string, string][] = [
  ["#f6a4b8", "#e86f93"],
  ["#9ad6c0", "#3f9d83"],
  ["#b9b1ee", "#7467d6"],
  ["#f5cd7a", "#e0993a"],
  ["#8fc6ee", "#4a8fd1"],
];

function Avatar({ name, src, size }: { name: string; src?: string; size: number }) {
  const [from, to] = PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: src ? `center / cover url(${src})` : `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {!src && ([...name.trim()][0] ?? "?")}
    </span>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function LockBadge() {
  return (
    <svg className={styles.lock} width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
      <rect x={5} y={10.500} width={14} height={10} rx={2.500} />
      <path d="M8 10.500V8a4 4 0 0 1 8 0v2.500" fill="none" stroke="#ffffff" strokeWidth={2.200} />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <circle cx={9} cy={12} r={4.500} />
      <circle cx={15} cy={12} r={4.500} />
    </svg>
  );
}
function GuestIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <circle cx={9} cy={8.500} r={3.300} />
      <path d="M2.800 19c.4-3.200 2.800-5 6.200-5s5.800 1.800 6.200 5Z" />
      <circle cx={17} cy={9.500} r={2.600} />
      <path d="M17.500 14.200c2.400.2 3.800 1.700 4.100 4" />
    </svg>
  );
}
function ChatBubbleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M5 4.500h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.500L8 21v-3.500H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <circle cx={9} cy={11} r={0.700} fill="currentColor" />
      <circle cx={12} cy={11} r={0.700} fill="currentColor" />
      <circle cx={15} cy={11} r={0.700} fill="currentColor" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="m14 4 7 7-7 7v-4.200c-5 0-8 1.500-10 5.200.4-5.800 3.600-9.200 10-9.800Z" />
    </svg>
  );
}
function FlipCameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M4 8.500h3l1.500-2.500h7L17 8.500h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.500a1 1 0 0 1 1-1Z" />
      <path d="M9.500 13a2.600 2.600 0 0 1 4.600-1.400M14.500 14.500a2.600 2.600 0 0 1-4.600 1.400" />
      <path d="M14.500 10.200v1.600h-1.600M9.500 16.600v-1.600h1.600" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <circle cx={5} cy={12} r={1.900} />
      <circle cx={12} cy={12} r={1.900} />
      <circle cx={19} cy={12} r={1.900} />
    </svg>
  );
}
function HeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 20.800s-8-4.900-9.300-10.100C1.700 6.900 4 4.200 7.100 4.200c1.900 0 3.600 1 4.900 2.800 1.300-1.800 3-2.800 4.900-2.800 3.100 0 5.400 2.700 4.400 6.500-1.300 5.200-9.300 10.100-9.300 10.100Z" />
    </svg>
  );
}
function BrokenHeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff8a3d">
      <path d="M12 20.800s-8-4.900-9.300-10.100C1.700 6.900 4 4.200 7.100 4.200c1.900 0 3.600 1 4.900 2.800l-1.800 3.600 3 2-1.700 3.600 1.500-4-3-2 1.600-3.200c1.300-1.800 3-2.800 4.900-2.800 3.100 0 5.400 2.700 4.400 6.500-1.300 5.200-9.300 10.100-9.300 10.100Z" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth={2.200}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

type Floater = { id: number; emoji: string; dx: number; dur: number; size: number };

/**
 * Room 12: a LIVE-stream screen. The device camera (front or back) fills the
 * whole screen, status bar included; viewers and hearts keep climbing, and
 * join notices and comments pop up one after another bottom left while
 * hearts and gifts float up bottom right. The ⋯ opens the edit screen: both
 * counters (start value and pace), every comment / join with its profile
 * picture, and the host's picture. Settings and entries are remembered.
 */
export default function LiveStream() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraFacing>("user");
  const { stream, error, retry } = useLiveCamera(facing);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<Entry[]>(DEFAULT_ENTRIES);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [hostAvatar, setHostAvatar] = useState(DEFAULT_HOST_AVATAR);
  const [editing, setEditing] = useState(false);
  const pendingAvatar = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const viewers = useGrowing(settings.viewers, settings.viewersRate);
  const hearts = useGrowing(settings.hearts, settings.heartsRate);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) v.play().catch(() => {});
  }, [stream]);

  // Saved settings, entries and pictures (client-only, so the server render stays on the defaults).
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { settings?: Partial<Settings>; entries?: Entry[] };
          if (saved.settings) setSettings((s) => ({ ...s, ...saved.settings }));
          if (saved.entries) setEntries(saved.entries);
        }
      } catch {
        // Persistence is best-effort.
      }
    });
    let cancelled = false;
    idbGetImage(HOST_AVATAR_KEY)
      .then((blob) => {
        if (blob && !cancelled) setHostAvatar(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all(entries.map((e) => idbGetImage(`${AVATAR_PREFIX}${e.id}`).catch(() => undefined))).then((blobs) => {
      if (cancelled) return;
      setAvatars((prev) => {
        const next = { ...prev };
        entries.forEach((e, i) => {
          if (!next[e.id] && blobs[i]) next[e.id] = URL.createObjectURL(blobs[i]!);
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // Only on first load: later picks are put into `avatars` directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (nextSettings: Settings, nextEntries: Entry[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: nextSettings, entries: nextEntries }));
    } catch {
      // Persistence is best-effort.
    }
  };
  const changeSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save(next, entries);
  };
  const changeEntries = (next: Entry[]) => {
    setEntries(next);
    save(settings, next);
  };
  const patchEntry = (id: string, patch: Partial<Entry>) =>
    changeEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const addEntry = (kind: Entry["kind"]) =>
    changeEntries([...entries, { id: `e${Date.now()}`, kind, name: kind === "join" ? "ชื่อ" : "ชื่อ", text: kind === "join" ? "" : "ข้อความ" }]);
  const removeEntry = (id: string) => {
    changeEntries(entries.filter((e) => e.id !== id));
    idbDeleteImage(`${AVATAR_PREFIX}${id}`).catch(() => {});
  };

  const pickAvatar = (id: string) => {
    pendingAvatar.current = id;
    fileRef.current?.click();
  };
  const onAvatarFile = (file: File | undefined) => {
    const id = pendingAvatar.current;
    pendingAvatar.current = null;
    if (!file || !id) return;
    const url = URL.createObjectURL(file);
    if (id === "host") {
      setHostAvatar(url);
      idbSetImage(HOST_AVATAR_KEY, file).catch(() => {});
    } else {
      setAvatars((a) => ({ ...a, [id]: url }));
      idbSetImage(`${AVATAR_PREFIX}${id}`, file).catch(() => {});
    }
  };

  // ---- the stream of join notices and comments ----
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  const [feed, setFeed] = useState<{ key: number; entry: Entry }[]>([]);
  useEffect(() => {
    let n = 0;
    let timer: number | undefined;
    const tick = () => {
      const list = entriesRef.current;
      if (list.length) {
        const entry = list[n % list.length];
        const key = n;
        n += 1;
        setFeed((prev) => [...prev.slice(-(FEED_VISIBLE - 1)), { key, entry }]);
      }
      timer = window.setTimeout(tick, rand(1300, 2600));
    };
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, []);

  // ---- hearts and gifts floating up the right side ----
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const floaterId = useRef(0);
  const spawn = (count = 1) => {
    const made = Array.from({ length: count }, () => {
      floaterId.current += 1;
      return {
        id: floaterId.current,
        emoji: FLOATERS[Math.floor(Math.random() * FLOATERS.length)],
        dx: rand(-34, 34),
        dur: rand(2.6, 4.2),
        size: rand(22, 34),
      };
    });
    setFloaters((f) => [...f.slice(-24), ...made]);
  };
  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      spawn(Math.random() < 0.25 ? 2 : 1);
      timer = window.setTimeout(tick, rand(280, 750));
    };
    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, []);

  const lastIndex = feed.length - 1;

  return (
    <div className={styles.screen}>
      <video
        ref={videoRef}
        className={styles.video}
        data-mirror={facing === "user"}
        autoPlay
        playsInline
        muted
        onClick={() => spawn(5)}
      />
      {!stream && (
        <div className={styles.noCamera} onClick={retry}>
          {error ? "เปิดกล้องไม่ได้ · แตะเพื่อลองใหม่" : "กำลังเปิดกล้อง…"}
        </div>
      )}
      <div className={styles.shadeTop} />
      <div className={styles.shadeBottom} />

      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.hostPill}>
            <button type="button" className={styles.hostAvatarButton} onClick={() => router.push("/")} aria-label="กลับไปหน้ารวมแชท">
              <Avatar name="ต้า" src={hostAvatar} size={42} />
            </button>
            <span className={styles.heartPill}>
              <HeartIcon size={17} />
              <span className={styles.heartCount}>{formatCount(hearts)}</span>
            </span>
          </div>
          <span className={styles.popular}>
            <BrokenHeartIcon />
            Popular LIVE
          </span>
        </div>
        <div className={styles.topRight}>
          <span className={styles.viewers}>
            <span className={styles.viewerFaces}>
              <Avatar name="พุดดี้" src={avatars[entries[0]?.id]} size={26} />
              <Avatar name="ชย" src={avatars[entries[1]?.id]} size={26} />
            </span>
            <span className={styles.viewerCount}>{formatCount(viewers)}</span>
          </span>
          <span className={styles.statusChip}>
            <i className={styles.greenDot} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4.500 19 12 5 19.500Z" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.feed}>
        {feed.map(({ key, entry }, i) => (
          <div key={key} className={styles.feedRow}>
            <span className={styles.feedItem}>
              <Avatar name={entry.name} src={avatars[entry.id]} size={36} />
              {entry.kind === "join" ? (
                <span className={styles.joinText}>
                  <span className={styles.feedName}>{entry.name}</span> เข้าร่วมแล้ว
                </span>
              ) : (
                <span className={styles.commentBody}>
                  <span className={styles.feedName}>{entry.name}</span>
                  <span className={styles.commentText}>{entry.text}</span>
                </span>
              )}
            </span>
            {i === lastIndex && entry.kind === "join" && <span className={styles.wave}>👋 ทักทาย</span>}
          </div>
        ))}
      </div>

      <div className={styles.floaters}>
        {floaters.map((f) => (
          <span
            key={f.id}
            className={styles.floater}
            style={{ fontSize: f.size, animationDuration: `${f.dur}s`, ["--dx" as string]: `${f.dx}px` }}
            onAnimationEnd={() => setFloaters((all) => all.filter((x) => x.id !== f.id))}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <span className={styles.roundIcon}>
            <LinkIcon />
            <LockBadge />
          </span>
          <span className={styles.roundIcon}>
            <GuestIcon />
            <LockBadge />
          </span>
        </div>
        <div className={styles.bottomRight}>
          <span className={styles.roundIcon}>
            <ChatBubbleIcon />
          </span>
          <span className={styles.roundIcon}>
            <ShareIcon />
          </span>
          <button
            type="button"
            className={styles.roundIcon}
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            aria-label="สลับกล้องหน้า/หลัง"
          >
            <FlipCameraIcon />
          </button>
          <button type="button" className={styles.roundIcon} onClick={() => setEditing(true)} aria-label="แก้ไข">
            <DotsIcon />
          </button>
        </div>
      </div>

      {editing && (
        <div className={styles.editor}>
          <div className={styles.editorHeader}>
            <button type="button" className={styles.editorBack} onClick={() => setEditing(false)} aria-label="กลับไปหน้าไลฟ์">
              <BackIcon />
            </button>
            <div className={styles.editorTitle}>แก้ไขหน้าไลฟ์</div>
          </div>
          <div className={styles.editorBody}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>ตัวเลข</div>
              <NumberField label="ยอดคนดู (เริ่มที่)" value={settings.viewers} onChange={(v) => changeSettings({ viewers: v })} />
              <NumberField label="คนดูเพิ่มต่อวินาที" value={settings.viewersRate} onChange={(v) => changeSettings({ viewersRate: v })} />
              <NumberField label="หัวใจบนซ้าย (เริ่มที่)" value={settings.hearts} onChange={(v) => changeSettings({ hearts: v })} />
              <NumberField label="หัวใจเพิ่มต่อวินาที" value={settings.heartsRate} onChange={(v) => changeSettings({ heartsRate: v })} />
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>รูปโปรไฟล์คนไลฟ์</div>
              <button type="button" className={styles.hostPick} onClick={() => pickAvatar("host")}>
                <Avatar name="ต้า" src={hostAvatar} size={56} />
                <span>แตะเพื่อเปลี่ยนรูป</span>
              </button>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>คอมเม้นและคนเข้าร่วม (วนไปเรื่อยๆ)</div>
              {entries.map((e) => (
                <div key={e.id} className={styles.entry}>
                  <button type="button" className={styles.entryAvatar} onClick={() => pickAvatar(e.id)} aria-label="เปลี่ยนรูปโปรไฟล์">
                    <Avatar name={e.name} src={avatars[e.id]} size={44} />
                  </button>
                  <div className={styles.entryFields}>
                    <input className={styles.input} value={e.name} onChange={(ev) => patchEntry(e.id, { name: ev.target.value })} placeholder="ชื่อ" />
                    {e.kind === "comment" ? (
                      <input
                        className={styles.input}
                        value={e.text}
                        onChange={(ev) => patchEntry(e.id, { text: ev.target.value })}
                        placeholder="ข้อความคอมเม้น"
                      />
                    ) : (
                      <div className={styles.joinHint}>เข้าร่วมแล้ว</div>
                    )}
                  </div>
                  <button type="button" className={styles.remove} onClick={() => removeEntry(e.id)} aria-label="ลบ">
                    −
                  </button>
                </div>
              ))}
              <div className={styles.addRow}>
                <button type="button" className={styles.addButton} onClick={() => addEntry("comment")}>
                  + คอมเม้น
                </button>
                <button type="button" className={styles.addButton} onClick={() => addEntry("join")}>
                  + คนเข้าร่วม
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onAvatarFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        className={styles.input}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}
