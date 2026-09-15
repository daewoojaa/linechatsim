"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatBubbleIcon } from "@/components/icons/ChatListIcons";
import { HomeFilledIcon, ProfileIcon, ShopBagIcon } from "@/components/icons/TikTokNavIcons";
import styles from "./VideoFeed.module.css";

const CLIPS = ["/videos/TT-demo1.mp4", "/videos/TT-demo2.mp4", "/videos/TT-demo3.mp4", "/videos/TT-demo4.mp4"];

// A duplicate of clip 1 appended after the real last clip. Swiping past
// clip 4 slides up onto this phantom slide (looks identical to clip 1),
// then a transition-less snap back to the real index 0 happens right
// after — that avoids the alternative of animating index 3 -> 0 directly,
// which would visibly rewind backward through every clip instead of
// looping forward.
const SLIDES = [...CLIPS, CLIPS[0]];

const TRANSITION_MS = 350;
const SWIPE_THRESHOLD_PX = 50;
const WHEEL_THRESHOLD_PX = 30;

/**
 * TikTok-style vertical video feed (room 5 / "815 TikTok"). Swipe up to
 * advance to the next clip, swipe down to go back — a CSS slide-up
 * transform on .track, one clip per screen. Swiping up past the last clip
 * loops seamlessly back to clip 1. The UI chrome (LIVE badge, search
 * icon, ...) is a plain PNG rendered as a sibling of .track so it stays
 * locked in place through every transition, per the user's spec. Below
 * the video stage sits a plain (non-transitioning) bottom tab bar.
 */
export default function VideoFeed() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef<number | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay can still be blocked in some browsers even when muted
          // (e.g. low-power mode) — not worth surfacing an error for.
        });
      } else {
        video.pause();
      }
    });
  }, [index]);

  const goTo = (next: number) => {
    if (lockedRef.current || next < 0 || next >= SLIDES.length || next === index) return;
    lockedRef.current = true;
    setIndex(next);

    if (next === SLIDES.length - 1) {
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
          {SLIDES.map((src, i) => (
            <div className={styles.slide} key={i}>
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className={styles.video}
                src={src}
                muted
                loop
                playsInline
                autoPlay={i === 0}
                preload={i === 0 || i === SLIDES.length - 1 ? "auto" : "metadata"}
              />
            </div>
          ))}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- static PWA asset, no next/image optimization needed */}
        <img src="/videofeed-ui-overlay.png" className={styles.uiOverlay} alt="" />
      </div>

      {/* Bottom tab bar — outside .stage, so it never moves or fades with
          the video transition; a plain static strip like the reference. */}
      <div className={styles.bottomNav}>
        <button type="button" className={styles.navItem} onClick={() => router.push("/")}>
          <HomeFilledIcon />
          <span className={styles.navLabel}>หน้าหลัก</span>
        </button>
        <button type="button" className={styles.navItem}>
          <ShopBagIcon />
          <span className={styles.navDot} />
          <span className={styles.navLabel}>ร้านค้า</span>
        </button>
        <button type="button" className={styles.createButton} aria-label="สร้าง" />
        <button type="button" className={styles.navItem}>
          <ChatBubbleIcon />
          <span className={styles.navBadge}>99+</span>
          <span className={styles.navLabel}>กล่องข้อความ</span>
        </button>
        <button type="button" className={styles.navItem}>
          <ProfileIcon />
          <span className={styles.navLabel}>โปรไฟล์</span>
        </button>
      </div>
    </div>
  );
}
