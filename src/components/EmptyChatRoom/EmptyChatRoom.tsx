"use client";

import Link from "next/link";
import { BackArrowIcon } from "@/components/icons/Icons";
import styles from "./EmptyChatRoom.module.css";

/**
 * Stub landing page for a chat room that doesn't have its own simulator
 * built yet (currently just "วงไข่มุกบารมี" / room 1 in the chat list).
 * Just a header + back button for now — the actual room comes later.
 */
export default function EmptyChatRoom({ roomName }: { roomName: string }) {
  return (
    <div className={styles.appShell}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton} aria-label="กลับไปหน้ารวมแชท">
          <BackArrowIcon />
        </Link>
        <div className={styles.roomName}>{roomName}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.placeholder}>ห้องแชทนี้ยังไม่ได้ทำ — เดี๋ยวทำต่อ</div>
      </div>
    </div>
  );
}
