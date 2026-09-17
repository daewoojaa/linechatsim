/**
 * Icon set for the video-call simulator (room 4) — a FaceTime/Instagram-
 * call-style UI. All decorative except ActivitiesIcon (opens the clip
 * picker) and XIcon (ends the call).
 */

export function MuteMicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <rect x={9} y={2.5} width={6} height={11.5} rx={3} />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
    </svg>
  );
}

export function PipSwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x={3} y={4} width={18} height={14} rx={2} />
      <rect x={12.5} y={11} width={7} height={5.5} rx={1.2} fill="#ffffff" stroke="none" />
    </svg>
  );
}

export function CameraFlipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2.5} y={6.5} width={19} height={13} rx={2.5} />
      <path d="M8.5 6.5 10 4.2h4L15.5 6.5" />
      <path d="M9.2 13a3.3 3.3 0 0 1 5.9-2M14.8 11a3.3 3.3 0 0 1-5.9 2" />
      <path d="m14.5 9.3 1 1.7-1.9.3M9.5 14.7l-1-1.7 1.9-.3" />
    </svg>
  );
}

export function LayoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.7} strokeLinejoin="round">
      <rect x={3} y={4} width={18} height={16} rx={2} />
      <path d="M3 12h18" />
    </svg>
  );
}

export function CameraOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 8h1.5a2 2 0 0 1 2 2v.3l2.3-1.5a.6.6 0 0 1 .95.5v5.4a.6.6 0 0 1-.95.5L18.5 14" />
      <path d="M17 16.2a2 2 0 0 1-1.9 1.3H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2h2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
      <path d="M12 2.5c.6 3.9 1.8 5.9 5.9 6.5-4.1.6-5.3 2.6-5.9 6.5-.6-3.9-1.8-5.9-5.9-6.5 4.1-.6 5.3-2.6 5.9-6.5Z" />
      <path d="M18.5 15.5c.3 2 .9 2.9 2.9 3.2-2 .3-2.6 1.2-2.9 3.2-.3-2-.9-2.9-2.9-3.2 2-.3 2.6-1.2 2.9-3.2Z" />
    </svg>
  );
}

export function ActivitiesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.7} strokeLinejoin="round">
      <rect x={3} y={5} width={18} height={15} rx={3} />
      <path d="m10.5 9.5 5 3-5 3v-6Z" fill="#ffffff" stroke="none" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
      <path d="M6.6 2.7c1.1 0 1.8.6 2.1 1.6l.9 2.5c.3.9.1 1.6-.6 2.1l-1.1.8c1 2.3 2.7 4 5 5l.8-1.1c.5-.7 1.2-1 2.1-.6l2.5.9c1 .3 1.6 1 1.6 2.1v2.2c0 1.3-.9 2.2-2.2 2.2C9.5 20.4 3.6 14.5 3.6 5.9c0-1.3.9-2.2 2.2-2.2Z" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
