import MultiImageChatSimulator from "@/components/MultiImageChatSimulator/MultiImageChatSimulator";

// Bundled default images for room 6 — its own separate asset set, distinct
// from room 7's room7-imageN.jpg files. Only slot 0 has one so far.
const ROOM6_IMAGES = ["/room6-image1.jpg"];

export default function Room6Page() {
  return (
    <MultiImageChatSimulator
      roomId="room6"
      defaultRoomName="แก่น"
      slotCount={20}
      defaultImages={ROOM6_IMAGES}
      manageHref="/room6/manage"
      enableVoiceRecord
    />
  );
}
