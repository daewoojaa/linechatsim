import MultiImageChatSimulator from "@/components/MultiImageChatSimulator/MultiImageChatSimulator";

export default function Room1Page() {
  return (
    <MultiImageChatSimulator
      roomId="room1"
      defaultRoomName="วงไข่มุกบารมี (87)"
      slotCount={14}
      defaultImage0="/room1-image1.jpg"
      manageHref="/room1/manage"
    />
  );
}
