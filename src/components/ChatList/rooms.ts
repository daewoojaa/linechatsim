export type ChatRoom = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: number | string;
  color: string;
  /** Where tapping the row (outside the name) navigates. Omit for the
   *  still-placeholder rooms (2-9) that don't go anywhere yet. */
  href?: string;
};

export const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: "1",
    name: "611 วงไข่มุกบารมี (87)",
    message: "สมชาย ส่งสติกเกอร์",
    time: "18:42",
    unread: 3,
    color: "#f2a65a",
    href: "/room1",
  },
  { id: "2", name: "301 แก่น", message: "ส่งรูปภาพ", time: "เมื่อวาน", unread: 1, color: "#7fb3d5" },
  { id: "3", name: "309 TikTok ดอกรักคนเดิม", message: "ส่งสติกเกอร์", time: "20/8", unread: 12, color: "#a3d9a5" },
  {
    id: "4",
    name: "820 Ninja",
    message: "โอเคครับ เดี๋ยวจัดการให้",
    time: "18/8",
    color: "#f7b7a3",
    href: "/room4",
  },
  { id: "5", name: "815 TikTok", message: "ได้เลยครับ", time: "12/8", unread: 5, color: "#c39bd3", href: "/room5" },
  {
    id: "6",
    name: "237 แก่น",
    message: "ส่งเสียง",
    time: "23/6",
    color: "#f9e79f",
    href: "/room6",
  },
  {
    id: "7",
    name: "วงไข่มุกบารมี (87)",
    message: "แล้วเจอกันนะ",
    time: "20/6",
    unread: 2,
    color: "#85c1e9",
    href: "/room7",
  },
  { id: "8", name: "8", message: "ส่งสติกเกอร์", time: "22/3", color: "#f5b7b1" },
  { id: "9", name: "9", message: "ขอบคุณครับ", time: "14/2", unread: 8, color: "#aed6f1" },
  {
    id: "10",
    name: "อ.ตวง",
    message: "เดี๋ยวโทรกลับนะ",
    time: "17:01",
    unread: 1,
    color: "#8ea7d9",
    href: "/tuang",
  },
];
