import MultiImageChatSimulator from "@/components/MultiImageChatSimulator/MultiImageChatSimulator";

export default function Room7Page() {
  return (
    <MultiImageChatSimulator
      roomId="room7"
      defaultRoomName="วงไข่มุกบารมี (87)"
      slotCount={20}
      defaultImage0="/room7-image1.jpg"
      manageHref="/room7/manage"
      headerBackground="/room7-header-bg.jpg"
    />
  );
}
