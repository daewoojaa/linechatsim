# Handoff: LINE Chat Simulator (PWA)

## Overview
A mobile-first "chat screenshot simulator" for LINE-style conversations. It is not a real chat app — it lets the user drop in their own pre-made chat-bubble images, a background, and stickers, and stage-manage which one is showing, so they can screen-record/photograph a believable fake chat. Target: Next.js + TypeScript PWA, deployed to Vercel via GitHub `main`.

## About the Design Files
The bundled file (`Chat Simulator.dc.html`) is a **design reference built in HTML** (a live interactive prototype), not production code to copy verbatim. The task is to **recreate this design in Next.js + TypeScript**, using standard React patterns (hooks, component structure, CSS modules or styled-components/Tailwind — developer's choice) rather than the prototype's inline-style/templating approach. Add PWA support (manifest + service worker) since none exists in the prototype.

## Fidelity
**High-fidelity.** Layout, spacing, colors, icon shapes, and interaction behavior below should be reproduced closely. Exact hex/px values are given where they matter.

## Screens / Views
Single screen, four stacked zones, `100dvh` tall, `overflow:hidden`, no page scroll except the sticker grid.

### 1. Header bar (room name bar) — fixed at top, non-scrolling
- Height: 56px. Padding: `0 12px 0 6px`. `display:flex; align-items:center; gap:10px`. Sits above the background/chat image layer (z-index above it), background transparent (shows page background through).
- Left: back-arrow icon (`<`, 18×18, stroke `#1c1c1e`, stroke-width 2.2) — tapping it always resets to "chat image 1" (see State).
- Center: room name, `font: 700 21px/1.2 system-ui, -apple-system, sans-serif`, color `#141414`, single line with ellipsis overflow. Tapping the send button (see input bar) switches this into an editable `<input>` with the same styling, editing box `background: rgba(255,255,255,.9)`, `border-radius:8px`, `padding:6px 10px`, `outline:2px solid rgba(0,0,0,.25)`. Enter or blur commits the edit.
- Right, in a row with `gap:14px`, three tap icons (32×32 each, stroke `#1c1c1e`):
  - Magnifying-glass icon → opens file picker to set **chat image 1**.
  - Phone/handset icon → opens file picker to set **chat image 2**.
  - Three horizontal lines ("hamburger"/menu look, 24×24) with a small green dot badge (6px circle, `#2fbf5e`, top-right corner) → opens file picker to set the **background image**.

### 2. Chat image zone — flexible middle area
- `flex:1`, `overflow:hidden`, content aligned to bottom-center (`align-items:flex-end; justify-content:center`).
- Background layer: an absolutely-positioned full-bleed image on the base container (top+bottom fit, `background-size:cover`, `object-position:center`) — the user-supplied background PNG. If none set: plain color `#aab6d8`.
- Foreground: the currently-active chat screenshot PNG (transparent PNG), displayed as `background-size:100% auto` (full width, height auto), `background-position:bottom center` — i.e. pinned to the bottom edge, full device width, height determined by aspect ratio. No border radius, no shadow.
- **This zone is NOT tappable** — `pointer-events:none` / no click handler. All interaction happens via the header icons, the send-icon-turned-name-edit, the mode toggle, and the sticker panel below.

### 3. Message input bar — fixed height row above the keyboard/sticker zone
- Background `#ffffff`, padding `8px 10px`, `display:flex; align-items:center; gap:8px`.
- Left icon (36×36): a right-chevron (`>`, stroke `#3a3a3c`, stroke-width 2.2) — tapping it opens a file picker to set **chat image 3** (see State/auto-advance below).
- Center: a pill-shaped text field, `background:#f1f1f3`, `border-radius:999px`, `height:44px`, `padding:0 8px 0 16px`. Real, typeable `<input type="text">` — user can type but pressing Enter/Return does nothing (message can never be "sent"; this is cosmetic only). Disable autofill/autocorrect/spellcheck/1Password/LastPass hints on this field (`autoComplete="off"`, `autoCorrect="off"`, `autoCapitalize="off"`, `spellCheck={false}`, plus `data-lpignore`, `data-1p-ignore`, `data-bwignore`, a rotating `name` attribute) — mobile keyboards (esp. Gboard) still may show their own autofill suggestion strip above the OS keyboard; that strip is owned by the OS/IME and cannot be fully suppressed from the web layer.
  - Inside the pill, right-aligned: a mode-toggle icon button (32×32) that swaps between a "keyboard" glyph (circle with two dot "eyes" and a smile arc) and a "sticker panel" glyph (rounded rect with dots + a line, like a grid/apps icon). Tapping it toggles `mode` between `'keyboard'` and `'sticker'`.
- Right icon (38×38): a capsule/microphone-like glyph (rounded rect + arc) — this is actually the "edit room name" trigger. Tapping it switches the header's room name into edit mode and focuses/selects it.
- **Important: there is no real send button.** The rightmost control in this bar edits the room name, not sends a message.

### 4. Bottom zone — keyboard OR sticker panel, mutually exclusive
- **Keyboard mode** (`mode === 'keyboard'`, default): show nothing custom here — rely entirely on the OS/device's native on-screen keyboard triggered by focusing the text input. Do not build a fake on-screen keyboard.
- **Sticker mode** (`mode === 'sticker'`): a white panel, `max-height:46vh` (auto height up to that cap, content-hugged from the top, not force-stretched), containing a 4-column image grid (`gap:10px`, `padding:12px`, `align-content:start`), scrollable vertically with touch/drag (`overflow-y:auto`, momentum scrolling) but with the scrollbar hidden (`scrollbar-width:none`, `::-webkit-scrollbar{display:none}`).
  - Each grid cell shows one user-added sticker PNG (`background-size:contain`, `aspect-ratio:1` normally). If a sticker image is a wide "sticker sheet" (natural width ≥ 400px), it instead spans the full grid width (`grid-column:1/-1`) at its true aspect ratio.
  - Tapping a sticker sets the visible chat image to **chat image 2** (does nothing on repeat taps — it's a one-way trigger, not a toggle; going back to image 1 is only possible via the header's back-arrow icon).
  - **Triple-tap anywhere in the empty grid background** (not on an existing sticker) within ~650ms opens a (multi-select) file picker to add one or more new sticker PNGs to the grid.
  - No help text, labels, or instructional copy is shown anywhere in this panel — it's a blank/functional surface.

## Interactions & Behavior (state machine)
- `chatSlot`: `0 | 1 | 2` — which chat image is currently shown. `0` → image 1, `1` → image 2, `2` → image 3.
  - Header back-arrow (`<`) → always sets slot to `0`.
  - Tapping any sticker in the sticker grid → sets slot to `1` (no-op if already `1`; never toggles back).
  - **Auto-advance:** whenever slot becomes `1` AND a chat-image-3 has been set, start a 2-second timer; if the slot is still `1` when it fires, advance to slot `2`. Clear/restart this timer on every slot change.
- Image sources: `chatImage1`, `chatImage2`, `chatImage3`, `background` — each set via its own file picker (see header/input-bar icons above), accepting image files, stored as object URLs / base64 and persisted (see Persistence).
- Stickers: an array of image URLs, appended to (never reordered/removed in the prototype — add delete/reorder if the real product needs it).
- Room name: free-text, editable via the input bar's rightmost icon.
- No message is ever actually sendable — this is entirely a staging/prop tool for screenshots, not a messaging backend.

## State Management
Suggested shape:
```ts
type ChatSimState = {
  roomName: string;
  background: string | null;
  chatImage1: string | null;
  chatImage2: string | null;
  chatImage3: string | null;
  chatSlot: 0 | 1 | 2;
  mode: 'keyboard' | 'sticker';
  stickers: string[];
  draftText: string; // never submitted anywhere
};
```
No backend/API needed. All data is local to the device.

## Persistence
The prototype persists `roomName`, `background`, `chatImage1/2/3`, `chatSlot`, and `stickers` to `localStorage` (images as base64 data URLs) so the staged scene survives a reload. For the PWA, consider `IndexedDB` instead of `localStorage` for the image blobs (data URLs in `localStorage` are size-limited and slow to serialize) — same persistence intent either way.

## PWA Requirements (not in the prototype — new for this build)
- `manifest.json`: name "LINE Chat Simulator", standalone display, portrait orientation, theme/background colors matching the header (`#aab6d8`-ish), icons (need real icon assets — ask the user or generate placeholders).
- Service worker: cache-first app shell so it opens instantly / works offline (no network dependency exists in the design already).
- `viewport-fit=cover` + safe-area padding for notch devices (the prototype already assumes `100dvh` full-bleed).

## Design Tokens
- Colors: header/background fallback `#aab6d8`; header text `#141414`; icon stroke `#1c1c1e` / `#3a3a3c` / `#8e8e93`; input pill `#f1f1f3`; input bar background `#ffffff`; green "has-image" badge dot `#2fbf5e`.
- Typography: room name `700 21px/1.2 system-ui`; input text `400 17px` (Thai support needed — pair with a Thai-capable system font stack or Noto Sans Thai as fallback, per user's original ask).
- Radii: input pill `999px` (full pill); sticker cells `10px`; name-edit box `8px`.
- Header height `56px`; input bar `~60px` total; sticker panel cap `46vh`.

## Assets
No brand/icon assets were supplied — all "chat images," the background, and stickers are user-uploaded PNGs at runtime (transparent PNGs for the chat bubbles, expected to butt against the bottom edge full-width). The prototype ships with 3 sample placeholder images (`uploads/LINE-Chat1.png`, `uploads/LINE-Chat2.png`, `uploads/LINE-Stickr.png`) purely as first-run defaults — replace with the developer's own defaults or leave the app empty on first load.

## Files
- `Chat Simulator.dc.html` — the full interactive HTML/JS prototype (source of truth for exact layout, icon paths as inline SVG, and behavior). Read it directly for the precise SVG `path`/`viewBox` data for every icon rather than re-drawing icons from this description.

## Deploy Target
Next.js + TypeScript, pushed to GitHub `main`, auto-deployed on Vercel (connect the GitHub repo's `main` branch to a Vercel project; every push to `main` redeploys).
