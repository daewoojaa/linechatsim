"use client";

import { useEffect, useState, type RefObject } from "react";

type VirtualKeyboardApi = EventTarget & { overlaysContent: boolean; boundingRect: DOMRect };

const SILENT_AFTER_MS = 600;

/**
 * How much room the chat must leave below its input bar. With the keyboard
 * hidden that is nothing (the bar rests at the very bottom of the screen);
 * when the input is tapped the bar rides up on top of the keyboard.
 *
 * The keyboard's height comes from the VirtualKeyboard API where there is one
 * (Chrome/Android), else from the visual viewport (iOS Safari). If the input
 * has focus but no height is ever reported (a browser that gives no hint), it
 * falls back to `fallback`, a fixed share of the screen, so the bar still
 * clears the keyboard.
 */
export function useKeyboardReserve(inputRef: RefObject<HTMLElement | null>, fallback: string): string {
  const [keyboard, setKeyboard] = useState(0);
  const [focused, setFocused] = useState(false);
  const [silent, setSilent] = useState(false);

  // Keyboard height.
  useEffect(() => {
    const vk = (navigator as Navigator & { virtualKeyboard?: VirtualKeyboardApi }).virtualKeyboard;
    const apply = (height: number) => {
      const h = Math.max(0, Math.round(height));
      setKeyboard(h);
      if (h > 0) setSilent(false);
    };
    if (vk) {
      const previous = vk.overlaysContent;
      vk.overlaysContent = true;
      const update = () => apply(vk.boundingRect.height);
      vk.addEventListener("geometrychange", update);
      queueMicrotask(update);
      return () => {
        vk.removeEventListener("geometrychange", update);
        vk.overlaysContent = previous;
      };
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => apply(window.innerHeight - vv.height - vv.offsetTop);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    queueMicrotask(update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // Whether the input has the cursor.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onFocus = () => setFocused(true);
    const onBlur = () => {
      setFocused(false);
      setSilent(false);
    };
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    // The input may already have focus (entering the room focuses it).
    queueMicrotask(() => {
      if (document.activeElement === el) setFocused(true);
    });
    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
    };
  }, [inputRef]);

  // Focused but nothing reported for a while: stop trusting the reports.
  useEffect(() => {
    if (!focused || keyboard > 0) return;
    const timer = setTimeout(() => setSilent(true), SILENT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [focused, keyboard]);

  if (keyboard > 0) return `${keyboard}px`;
  if (focused && silent) return fallback;
  return "env(safe-area-inset-bottom, 0px)";
}
