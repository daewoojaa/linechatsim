"use client";

import { useEffect } from "react";

/**
 * Temporarily overrides the PWA's status-bar tint (the <meta
 * name="theme-color"> browsers paint the Android status bar / iOS bar
 * with) for as long as the calling component is mounted, restoring
 * whatever it was before on unmount. Without this, a dark screen (like
 * room 4's call UI or its "app closed" still) still shows the app's
 * fixed light-blue status bar on top, which reads as a mismatched bar
 * instead of the dark background extending underneath it.
 */
export function useThemeColor(color: string) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const previous = meta.getAttribute("content");
    meta.setAttribute("content", color);
    return () => {
      if (previous !== null) meta.setAttribute("content", previous);
    };
  }, [color]);
}
