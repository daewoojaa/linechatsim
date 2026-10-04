import LiveChatSimulator from "@/components/LiveChatSimulator/LiveChatSimulator";
import type { LiveMessage } from "@/hooks/useLiveChatSim";

// What is already in the chat on entering: the "วันนี้" date label (the ☰
// icon still flips it to เมื่อวาน etc.), then two messages received from
// บุษบา (left side, with her avatar): a line of text and a picture.
const AVATAR = "/room2-busaba.png";

const SCRIPT: LiveMessage[] = [
  { id: "s0", kind: "dateLabel" },
  { id: "s1", kind: "text", text: "มีคนเพิ่ง เจอ ไอ่แก่น ถ่าย สดๆร้อนๆ อันนี้ ของจริง", time: "18:00 น.", side: "left", avatar: AVATAR },
  { id: "s2", kind: "image", src: "/room8-photo.jpg", time: "18:00 น.", side: "left", avatar: AVATAR },
];

export default function Room8Page() {
  return <LiveChatSimulator roomId="room8" defaultRoomName="บุษบา" script={SCRIPT} timeSuffix=" น." />;
}
