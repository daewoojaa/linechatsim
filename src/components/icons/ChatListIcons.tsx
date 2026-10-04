/**
 * Icon set for the chat-list ("แชท") screen — hand-drawn approximations of
 * the LINE app's chrome, not pixel-perfect reproductions (no design file
 * for this screen, unlike ChatSimulator's Icons.tsx).
 */

export function ChevronDownIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function AlbumIcon() {
  return (
    <svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={1.8} strokeLinejoin="round">
      <path d="M6 3.5h9l4 4v13H6z" />
      <path d="M15 3.5v4h4" />
      <circle cx={10.5} cy={12.5} r={1.6} />
      <path d="m8 18 2.7-3 2 2 2.3-3 2 2.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarBadgeIcon({ day }: { day: number | string }) {
  return (
    <svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <rect x={3} y={4.5} width={18} height={16} rx={3} stroke="#1c1c1e" strokeWidth={1.8} />
      <path d="M3 9h18" stroke="#1c1c1e" strokeWidth={1.8} />
      <path d="M8 2.5v3.5M16 2.5v3.5" stroke="#1c1c1e" strokeWidth={1.8} strokeLinecap="round" />
      <text x={12} y={17} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1c1c1e">
        {day}
      </text>
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth={2.2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Small pushpin on a white disc — the "pinned chat" mark on a profile picture. */
export function PinBadgeIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={11} fill="#ffffff" />
      <g transform="rotate(35 12 12)" fill="#6b6b73">
        <path d="M9.2 5.5h5.6l-.7 4.1c1.4.8 2.2 2 2.2 3.4h-9.6c0-1.4.8-2.600 2.200-3.400z" />
        <rect x={11.300} y={13} width={1.400} height={5.500} rx={0.7} />
      </g>
    </svg>
  );
}

export function HomeIcon({ active }: { active?: boolean }) {
  const c = active ? "#1c1c1e" : "#8e8e93";
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-6h4v6" />
    </svg>
  );
}

export function ChatBubbleIcon({ active }: { active?: boolean }) {
  const c = active ? "#1c1c1e" : "#8e8e93";
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.9} strokeLinejoin="round">
      <path d="M4 5.5h16v11H10l-4 3.5v-3.5H4z" strokeLinecap="round" />
    </svg>
  );
}

export function OpenChatIcon({ active }: { active?: boolean }) {
  const c = active ? "#1c1c1e" : "#8e8e93";
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8}>
      <circle cx={12} cy={12} r={9.2} />
      <circle cx={12} cy={12} r={3.4} />
      <path d="M15.4 12v1.6c0 1.3 1 2.2 2 1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TodayIcon({ active }: { active?: boolean }) {
  const c = active ? "#1c1c1e" : "#8e8e93";
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8}>
      <circle cx={9.5} cy={12} r={6.2} />
      <circle cx={14.5} cy={12} r={6.2} />
    </svg>
  );
}

export function WalletIcon({ active }: { active?: boolean }) {
  const c = active ? "#1c1c1e" : "#8e8e93";
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round">
      <rect x={3} y={6} width={18} height={13} rx={2.2} />
      <path d="M3 10.5h18" />
      <circle cx={17} cy={14.5} r={1.1} fill={c} stroke="none" />
    </svg>
  );
}
