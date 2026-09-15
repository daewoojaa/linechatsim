/**
 * One pre-authored message in a LineChatSimulator room's "script" — the
 * outgoing (right-side, blue) side of the conversation, revealed one at a
 * time by tapping the chat feed. Edited via the room's "จัดการข้อความ" page.
 * The incoming (left-side, white) side isn't scripted at all — it's typed
 * live on the real keyboard during a take (see useLineChatSim.sendLive).
 */
export type ScriptedMessage = {
  id: string;
  kind: "text" | "card";
  /** Plain outgoing bubble text — only for kind "text". */
  text?: string;
  /** Rich "shared link" card fields — only for kind "card" (e.g. a Spotify
   *  or GinTok share). appName is the small bold label at the top. */
  cardApp?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardUrl?: string;
  /** "อ่านแล้ว X>Y" read-receipt range shown beside the bubble — X and Y
   *  are member counts (how many had read it, growing as the scene cuts
   *  between phones), not required. */
  readFrom?: number;
  readTo?: number;
  /** Timestamp label shown under the read receipt, e.g. "9.30". */
  time?: string;
};

export function newScriptedMessage(): ScriptedMessage {
  return { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind: "text", text: "" };
}
