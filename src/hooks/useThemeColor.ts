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
 *
 * Next re-renders its own theme-color tag while navigating between pages
 * (it can swap the element or reset its content after this effect has
 * run), so the override is watched and re-applied while mounted instead of
 * being set once.
 */
export function useThemeColor(color: string) {
  useEffect(() => {
    const previous = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? null;

    const apply = () => {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      if (meta.getAttribute("content") !== color) meta.setAttribute("content", color);
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    // Belt and braces for browsers that only re-read the tag after the page has settled.
    const timers = [200, 1000].map((ms) => window.setTimeout(apply, ms));

    return () => {
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      if (previous !== null) {
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", previous);
      }
    };
  }, [color]);
}
