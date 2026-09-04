"use client";

import { useState } from "react";
import styles from "./ChatSimulator.module.css";
import type { Sticker } from "@/lib/types";

const SHEET_MIN_WIDTH = 400;

/**
 * One cell in the sticker grid. Normal stickers render as a square
 * (`aspect-ratio: 1`, `background-size: contain`); a wide "sticker sheet"
 * (natural width >= 400px) spans the full grid width at its true aspect
 * ratio instead — mirrors the prototype's `measure()` behavior.
 */
export default function StickerCell({ sticker, onTap }: { sticker: Sticker; onTap: () => void }) {
  const [meta, setMeta] = useState<{ ratio: number; isSheet: boolean }>({ ratio: 1, isSheet: false });

  return (
    <>
      {/* Hidden probe image just to read natural dimensions once, off-DOM-visually.
          Plain <img>, not next/image: it never renders on screen and the source
          is an ephemeral blob: URL that next/image's optimizer can't handle. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sticker.url}
        alt=""
        aria-hidden
        style={{ display: "none" }}
        onLoad={(e) => {
          const img = e.currentTarget;
          setMeta({
            ratio: img.naturalWidth / (img.naturalHeight || 1),
            isSheet: img.naturalWidth >= SHEET_MIN_WIDTH,
          });
        }}
      />
      <button
        type="button"
        className={styles.stickerCell}
        style={{
          gridColumn: meta.isSheet ? "1 / -1" : "auto",
          aspectRatio: meta.isSheet ? meta.ratio : 1,
          backgroundImage: `url("${sticker.url}")`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onTap();
        }}
      />
    </>
  );
}
