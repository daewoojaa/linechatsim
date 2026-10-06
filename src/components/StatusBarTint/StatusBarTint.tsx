"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  currentStatusBarOverride,
  onStatusBarOverrideChange,
  sampleTopEdgeColor,
  setImageReadyCallback,
} from "@/lib/statusBarTint";

/**
 * Keeps the browser's status-bar tint (<meta name="theme-color">) matching
 * whatever is painted along the top edge of the current screen: its
 * background colour, picture or video. Mounted once in the root layout, so
 * every route (and every picture / clip the user swaps in) is covered
 * without each screen doing anything. A screen that wants one fixed colour
 * can still ask for it with useThemeColor.
 *
 * Next re-renders its own theme-color tag while navigating (swapping the
 * element or resetting its content), so the tag is watched and put back
 * whenever it drifts from the computed colour.
 */
export default function StatusBarTint() {
  const pathname = usePathname();

  useEffect(() => {
    let applied: string | null = null;

    const metaTag = () => {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      return meta;
    };

    const write = (color: string) => {
      applied = color;
      const meta = metaTag();
      if (meta.getAttribute("content") !== color) meta.setAttribute("content", color);
    };

    const refresh = () => {
      if (document.hidden) return;
      let color: string;
      try {
        color = currentStatusBarOverride() ?? sampleTopEdgeColor();
      } catch {
        return;
      }
      write(color);
    };

    let debounce: number | undefined;
    const refreshSoon = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(refresh, 150);
    };

    // Put the tag back if Next (or anything else) changes it behind our back.
    const headObserver = new MutationObserver(() => {
      if (applied && metaTag().getAttribute("content") !== applied) write(applied);
    });
    headObserver.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });

    // The page changing underneath: new screens, swapped pictures, style tweaks.
    const bodyObserver = new MutationObserver(refreshSoon);
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "src"],
    });

    const offOverride = onStatusBarOverrideChange(refresh);
    setImageReadyCallback(refreshSoon);
    document.addEventListener("load", refreshSoon, true);
    document.addEventListener("loadeddata", refreshSoon, true);
    document.addEventListener("visibilitychange", refreshSoon);
    window.addEventListener("resize", refreshSoon);

    refresh();
    // A playing clip changes colour over time, and pictures decode late.
    const timers = [250, 1000].map((ms) => window.setTimeout(refresh, ms));
    const interval = window.setInterval(refresh, 1500);

    return () => {
      window.clearTimeout(debounce);
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(interval);
      headObserver.disconnect();
      bodyObserver.disconnect();
      offOverride();
      setImageReadyCallback(null);
      document.removeEventListener("load", refreshSoon, true);
      document.removeEventListener("loadeddata", refreshSoon, true);
      document.removeEventListener("visibilitychange", refreshSoon);
      window.removeEventListener("resize", refreshSoon);
    };
    // Re-arm on every route change so the first sample follows the new screen.
  }, [pathname]);

  return null;
}
