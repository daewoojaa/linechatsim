import MultiImageChatSimulator from "@/components/MultiImageChatSimulator/MultiImageChatSimulator";

// Bundled default images for slots 0-16 (image 1-17) — module-level so
// array identity is stable across renders.
const ROOM7_IMAGES = Array.from({ length: 17 }, (_, i) => `/room7-image${i + 1}.jpg`);

// Four independent auto-advance ranges (0-indexed slots): images 2-7,
// 8-12, 13-15, 16-17 each cycle on their own once reached, alternating a
// 1s/2s delay between steps; crossing from one range into the next (7->8,
// 12->13, 15->16) still needs a tap. Module-level so identity is stable
// across renders (see useMultiImageChatSim's autoAdvance doc comment).
const AUTO_ADVANCE = [
  { from: 1, to: 6, delaysMs: [1000, 2000] }, // images 2-7
  { from: 7, to: 11, delaysMs: [1000, 2000] }, // images 8-12
  { from: 12, to: 14, delaysMs: [1000, 2000] }, // images 13-15
  { from: 15, to: 16, delaysMs: [1000, 2000] }, // images 16-17
];

export default function Room7Page() {
  return (
    <MultiImageChatSimulator
      roomId="room7"
      defaultRoomName="วงไข่มุกบารมี (87)"
      slotCount={20}
      defaultImages={ROOM7_IMAGES}
      manageHref="/room7/manage"
      headerBackground="/room7-header-bg.jpg"
      autoAdvance={AUTO_ADVANCE}
    />
  );
}
