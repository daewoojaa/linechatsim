import LiveChatSimulator from "@/components/LiveChatSimulator/LiveChatSimulator";
import type { LiveMessage } from "@/hooks/useLiveChatSim";

// What is already in the chat on entering: a line of text, then a picture.
const SCRIPT: LiveMessage[] = [
  { id: "s1", kind: "text", text: "มีคนเพิ่ง เจอ ไอ่แก่น ถ่าย สดๆร้อนๆ อันนี้ ของจริง", time: "18:00 น." },
  { id: "s2", kind: "image", src: "/room8-photo.jpg", time: "18:00 น." },
];

export default function Room8Page() {
  return <LiveChatSimulator roomId="room8" defaultRoomName="บุษบา" script={SCRIPT} timeSuffix=" น." />;
}
