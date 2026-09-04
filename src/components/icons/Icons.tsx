/**
 * Icon set reproduced pixel-for-pixel from the design prototype
 * (`Chat Simulator.dc.html`) — same viewBox, stroke color/width, and path data.
 */

export function BackArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4 7 12l8 8" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.9} strokeLinecap="round">
      <circle cx={11} cy={11} r={6.5} />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 3.8c1 0 1.6.5 1.9 1.4l.8 2.2c.3.8.1 1.4-.6 1.9l-1 .7c.9 2 2.4 3.5 4.4 4.4l.7-1c.5-.7 1.1-.9 1.9-.6l2.2.8c.9.3 1.4.9 1.4 1.9v2c0 1.2-.8 2-2 2C9.7 19.5 4.5 14.3 4.5 5.8c0-1.2.8-2 2-2Z" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={2} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3a3a3c" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 5 8 7-8 7" />
    </svg>
  );
}

export function KeyboardGlyphIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth={1.7}>
      <circle cx={12} cy={12} r={9} />
      <circle cx={9} cy={10} r={1.1} fill="#8e8e93" stroke="none" />
      <circle cx={15} cy={10} r={1.1} fill="#8e8e93" stroke="none" />
      <path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" strokeLinecap="round" />
    </svg>
  );
}

export function StickerGlyphIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth={1.6}>
      <rect x={3} y={6.5} width={18} height={11} rx={2.4} />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8.5 13.6h7" strokeLinecap="round" />
    </svg>
  );
}

export function EditNameIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a3a3c" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <rect x={9} y={2.5} width={6} height={11.5} rx={3} />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
    </svg>
  );
}
