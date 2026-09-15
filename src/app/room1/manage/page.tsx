import ManageImages from "@/components/ManageImages/ManageImages";

export default function Room1ManagePage() {
  return (
    <ManageImages
      roomId="room1"
      slotCount={14}
      defaultImage0="/room1-image1.jpg"
      title="จัดการรูปภาพ — วงไข่มุกบารมี"
      backHref="/room1"
    />
  );
}
