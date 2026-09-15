/**
 * Icon set for the video feed's bottom tab bar (room 5 / "815 TikTok") —
 * hand-drawn approximations of TikTok's own bottom nav, not pixel-perfect
 * reproductions (no design file, matched from a small reference screenshot).
 */

export function HomeFilledIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="#000000" stroke="none">
      <path d="M12 2.8 2.5 10.6a1 1 0 0 0 .63 1.78H4.5V20a1 1 0 0 0 1 1H9.5v-6.2h5V21H18.5a1 1 0 0 0 1-1v-7.62h1.37a1 1 0 0 0 .63-1.78Z" />
    </svg>
  );
}

export function ShopBagIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth={1.8} strokeLinejoin="round">
      <path d="M6.2 8h11.6l1.1 12H5.1z" />
      <path d="M9 8V6.3a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth={1.8}>
      <rect x={3} y={3} width={18} height={18} rx={6} />
      <circle cx={12} cy={10} r={3.2} />
      <path d="M6 18.5c1.2-2.4 3.4-3.6 6-3.6s4.8 1.2 6 3.6" strokeLinecap="round" />
    </svg>
  );
}
