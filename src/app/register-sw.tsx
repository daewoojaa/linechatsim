"use client";

import { useEffect } from "react";

/** Registers the app-shell service worker. Skipped in dev to avoid stale HMR caching. */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline-first is a nice-to-have, not a hard requirement — ignore failures.
    });
  }, []);

  return null;
}
