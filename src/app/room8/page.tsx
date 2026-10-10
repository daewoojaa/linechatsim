import LiveChatSimulator from "@/components/LiveChatSimulator/LiveChatSimulator";
import type { LiveMessage } from "@/hooks/useLiveChatSim";

// What is already in the chat on entering: the "วันนี้" date label (the ☰
// icon still flips it to เมื่อวาน etc.), then two messages received from
// บุษบา (left side, with her tap-to-change avatar): a line of text and a picture (tap it
// for full screen). Only the text shows at first; the picture follows 5 seconds
// later, and the ☰ icon starts that sequence over.
const SCRIPT: LiveMessage[] = [
  { id: "s0", kind: "dateLabel" },
  { id: "s1", kind: "text", text: "มีคนเพิ่ง เจอ ไอ่แก่น ถ่าย สดๆร้อนๆ อันนี้ ของจริง", time: "18:00 น.", side: "left" },
  { id: "s2", kind: "image", src: "/room8-photo.jpg", time: "18:00 น.", side: "left" },
];

export default function Room8Page() {
  return (
    <LiveChatSimulator
      roomId="room8"
      defaultRoomName="บุษบา"
      script={SCRIPT}
      timeSuffix=" น."
      focusOnEnter
      defaultAvatar="/busaba-avatar.jpg"
      delayedImageMs={5000}
    />
  );
}
