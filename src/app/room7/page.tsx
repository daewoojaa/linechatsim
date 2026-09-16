import MultiImageChatSimulator from "@/components/MultiImageChatSimulator/MultiImageChatSimulator";

// Bundled default images for slots 0-5 (image 1-6) — module-level so array
// identity is stable across renders.
const ROOM7_IMAGES = [
  "/room7-image1.jpg",
  "/room7-image2.jpg",
  "/room7-image3.jpg",
  "/room7-image4.jpg",
  "/room7-image5.jpg",
  "/room7-image6.jpg",
];

// Images 2-6 (0-indexed slots 1-5) play on their own once reached: image
// 2->3 waits 4s, then 3->6 alternates 1s/2s — module-level so its identity
// is stable across renders (see useMultiImageChatSim's autoAdvance doc
// comment).
const AUTO_ADVANCE = { from: 1, to: 5, delaysMs: [4000, 1000, 2000, 1000] };

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
