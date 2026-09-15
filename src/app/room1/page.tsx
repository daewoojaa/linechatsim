import LineChatSimulator from "@/components/LineChatSimulator/LineChatSimulator";

export default function Room1Page() {
  return (
    <LineChatSimulator
      roomId="room1"
      defaultRoomName="วงไข่มุกบารมี (87)"
      defaultBackground="/room1-image1.jpg"
      manageHref="/room1/manage"
    />
  );
}
