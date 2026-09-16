"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useManageImages } from "@/hooks/useManageImages";
import { BackArrowIcon } from "@/components/icons/Icons";
import styles from "./ManageImages.module.css";

type Props = {
  roomId: string;
  slotCount: number;
  defaultImages?: string[];
  title: string;
  backHref: string;
};

/**
 * Grid of every chat-image slot for a MultiImageChatSimulator room — tap an
 * empty slot to upload into it, tap a filled one to replace it, or hit the
 * × to clear it back to empty (or back to its bundled default, for slots
 * that have one). Writes go straight to the same IndexedDB keys the chat
 * room itself reads on mount, so there's nothing else to wire up for
 * changes to show there.
 */
export default function ManageImages({ roomId, slotCount, defaultImages, title, backHref }: Props) {
  const router = useRouter();
  const defaults = defaultImages ?? [];
  const { images, upload, clear } = useManageImages(roomId, slotCount, defaults);

  const pendingIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPicker = (index: number) => {
    pendingIndexRef.current = index;
    const el = fileInputRef.current;
    if (el) {
      el.value = "";
      el.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = pendingIndexRef.current;
    if (file && index !== null) upload(index, file);
  };

  return (
    <div className={styles.appShell}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.push(backHref)} title="กลับไปห้องแชท">
          <BackArrowIcon />
        </button>
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.hint}>แตะรูปเพื่ออัปโหลด/เปลี่ยน — แตะ × เพื่อลบ</div>

      <div className={styles.grid}>
        {images.map((src, i) => (
          <div className={styles.cell} key={i}>
            <button
              type="button"
              className={styles.cellButton}
              style={src ? { backgroundImage: `url("${src}")` } : undefined}
              onClick={() => openPicker(i)}
              title={`รูปที่ ${i + 1}`}
            >
              {!src && <span className={styles.cellNumber}>+</span>}
            </button>
            <span className={styles.slotLabel}>{i + 1}</span>
            {src && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => clear(i)}
                aria-label={`ลบรูปที่ ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className={styles.hiddenFileInput}
      />
    </div>
  );
}
