import MultiImageChatSimulator from "@/components/MultiImageChatSimulator/MultiImageChatSimulator";

// Images 3-6 (0-indexed slots 2-5) play on their own once reached, delay
// alternating 1s/2s between each — module-level so its identity is stable
// across renders (see useMultiImageChatSim's autoAdvance doc comment).
const AUTO_ADVANCE = { from: 2, to: 5, delaysMs: [1000, 2000] };

export default function Room7Page() {
  return (
    <MultiImageChatSimulator
      roomId="room7"
      defaultRoomName="วงไข่มุกบารมี (87)"
      slotCount={20}
      defaultImage0="/room7-image1.jpg"
      manageHref="/room7/manage"
      headerBackground="/room7-header-bg.jpg"
      autoAdvance={AUTO_ADVANCE}
    />
  );
}
