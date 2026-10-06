export type ChatRoom = {
  id: string;
  name: string;
  message: string;
  time: string;
  /** Blue badge number. Empty / 0 / undefined show nothing (the spot stays
   *  tappable while the list is unlocked, to type a number in). */
  unread?: number | string;
  color: string;
  /** Shows the little pin badge on the profile picture (rooms 1-4). */
  pinned?: boolean;
  /** Where tapping the row (outside the editable parts) navigates. Omit for
   *  the still-placeholder room (9) that doesn't go anywhere yet. */
  href?: string;
};

/**
 * The second chat-list page ("/home2", reached by tapping row 2 of the first
 * page): the original list, whose rows open the actual chat rooms.
 */
export const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: "1",
    name: "บอสลูกรัก",
    message: "คุณได้ส่งสติกเกอร์",
    time: "18:42",
    unread: 3,
    color: "#f2a65a",
    pinned: true,
    href: "/room1",
  },
  {
    id: "2",
    name: "ลูกหนี้ไม่หนีไปไหน (10,975)",
    message: "พรชัย ได้ส่งรูปภาพ",
    time: "เมื่อวาน",
    unread: 1,
    color: "#7fb3d5",
    pinned: true,
    href: "/room2",
  },
  {
    id: "3",
    name: "บุษฟอร์แคช ทีม (943)",
    message: "บุษ ได้ส่งสติกเกอร์",
    time: "20/8",
    unread: 12,
    color: "#a3d9a5",
    pinned: true,
    href: "/room3",
  },
  {
    id: "4",
    name: "Ninja",
    message: "สิ้นสุดการโทรแบบวิดีโอ",
    time: "18/8",
    color: "#f7b7a3",
    pinned: true,
    href: "/room4",
  },
  { id: "5", name: "ช่างเอก", message: "ได้เลยครับ", time: "12/8", unread: 5, color: "#c39bd3", href: "/room5" },
  {
    id: "6",
    name: "งานกฐินปี 70 (236)",
    message: "ค่ะ",
    time: "23/6",
    color: "#f9e79f",
    href: "/room6",
  },
  {
    id: "7",
    name: "วงไข่มุกบารมี (87)",
    message: "รับทราบบบบ",
    time: "20/6",
    unread: 2,
    color: "#85c1e9",
    href: "/room7",
  },
  {
    id: "8",
    name: "บุษบา",
    message: "บุษบา ได้ส่งรูปภาพ",
    time: "22/3",
    color: "#f5b7b1",
    href: "/room8",
  },
  { id: "9", name: "ห้องที่9(+เพื่อแก้ไข)", message: "+เพื่อแก้ไข", time: "14/2", unread: 8, color: "#aed6f1" },
  {
    id: "10",
    name: "ห้องที่10(+เพื่อแก้ไข)",
    message: "+เพื่อแก้ไข",
    time: "17:01",
    unread: 1,
    color: "#8ea7d9",
    href: "/tuang",
  },
];

/**
 * The first chat-list page ("/"): an index of the rooms by code. Same rows
 * (previews, badges, pins) as the second page, with these names; row 2 opens
 * the second chat-list page instead of a chat.
 */
const MAIN_NAMES = [
  "520-522-617 Harry-JH",
  "321 ลูกหนี้ไม่หนีไปไหน",
  "309 ดอกรัก",
  "820 Ninja Video Call",
  "815 TikTok",
  "237-301 Voice Record",
  "611 วงไข่มุกบารมี",
  "338 บุษบา",
  "ว่าง",
  "อ.ตวง",
];

export const MAIN_ROOMS: ChatRoom[] = INITIAL_ROOMS.map((room, i) => ({
  ...room,
  name: MAIN_NAMES[i],
  href: room.id === "2" ? "/home2" : room.href,
}));
