"use client";

import { useEffect } from "react";
import { pushStatusBarOverride } from "@/lib/statusBarTint";

/**
 * Pins the status-bar tint to one fixed colour for as long as the calling
 * component is mounted (room 4's dark call UI, the incoming-call alert).
 * Every other screen needs nothing: <StatusBarTint /> in the root layout
 * follows whatever is painted along the top edge on its own.
 */
export function useThemeColor(color: string) {
  useEffect(() => pushStatusBarOverride(color), [color]);
}
