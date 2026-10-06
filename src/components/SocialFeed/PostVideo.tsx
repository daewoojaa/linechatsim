"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SocialFeed.module.css";

const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth={2}>
      <path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4Z" fill="currentColor" />
      {off ? <path d="m16 9.500 5 5M21 9.500l-5 5" /> : <path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11" />}
    </svg>
  );
}

/**
 * The clip of a shared post: starts on its own (muted, as phones require),
 * loops, tap to pause / play, and a button for the sound. If the browser
 * refuses to autoplay, a play button is shown instead of a frozen frame.
 */
export default function PostVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  // React renders `muted` as a property after the element exists, which some
  // phones treat as too late for autoplay; set it and start playback by hand.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => setPaused(true));
  }, [src]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setPaused(true));
    else v.pause();
  };

  return (
    <div className={styles.videoWrap}>
      <video
        ref={ref}
        src={src}
        className={styles.photo}
        autoPlay
        loop
        muted
        playsInline
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onClick={toggle}
      />
      {paused && (
        <button type="button" className={styles.playBadge} onClick={toggle} aria-label="재생">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.500v13l11-6.500Z" />
          </svg>
        </button>
      )}
      <button
        type="button"
        className={styles.soundButton}
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          v.muted = !v.muted;
          setMuted(v.muted);
        }}
        aria-label={muted ? "소리 켜기" : "소리 끄기"}
      >
        <SpeakerIcon off={muted} />
      </button>
    </div>
  );
}
