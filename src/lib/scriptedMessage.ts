/**
 * One pre-authored message in a LineChatSimulator room's "script" — the
 * incoming (left-side, avatar) side of the conversation, revealed one at a
 * time by tapping the chat feed. Edited via the room's "จัดการข้อความ" page.
 * The outgoing (right-side, blue) side isn't scripted at all — it's typed
 * live on the real keyboard during a take (see useLineChatSim.sendLive).
 */
export type ScriptedMessage = {
  id: string;
  kind: "text" | "card";
  /** Plain bubble text — only for kind "text". */
  text?: string;
  /** Rich "shared link" card fields — only for kind "card" (e.g. a Spotify
   *  or GinTok share). appName is the small bold label at the top. */
  cardApp?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardUrl?: string;
  /** Timestamp label shown beside the bubble, e.g. "9.30". */
  time?: string;
};

export function newScriptedMessage(): ScriptedMessage {
  return { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind: "text", text: "" };
}

/**
 * Room-wide read-receipt behavior for outgoing (right-side, live-typed)
 * messages — shared by every live message rather than authored per-message,
 * since live lines are ad-libbed and can't be scripted in advance.
 * `sequence` ticks forward one step every 2 seconds once `delaySeconds` has
 * elapsed since a message was sent (see useLineChatSim's tick effect).
 */
export type ReadReceiptConfig = {
  sequence: number[];
  delaySeconds: number;
};

export function defaultReadReceiptConfig(): ReadReceiptConfig {
  return { sequence: [], delaySeconds: 2 };
}

const STEP_SECONDS = 2;

/** Current read-count for a live message sent at `sentAt`, or null if the
 *  feature is unconfigured or the initial delay hasn't elapsed yet. */
export function computeReadReceipt(sentAt: number, now: number, config: ReadReceiptConfig): number | null {
  if (config.sequence.length === 0) return null;
  const elapsedSec = (now - sentAt) / 1000;
  if (elapsedSec < config.delaySeconds) return null;
  const stepIndex = Math.min(Math.floor((elapsedSec - config.delaySeconds) / STEP_SECONDS), config.sequence.length - 1);
  return config.sequence[stepIndex];
}

/** Whether a live message's read-receipt has reached its final value —
 *  once every message in the feed is settled, the ticking timer can stop. */
export function isReadReceiptSettled(sentAt: number, now: number, config: ReadReceiptConfig): boolean {
  if (config.sequence.length === 0) return true;
  const elapsedSec = (now - sentAt) / 1000;
  const settledAtSec = config.delaySeconds + STEP_SECONDS * (config.sequence.length - 1);
  return elapsedSec >= settledAtSec;
}
