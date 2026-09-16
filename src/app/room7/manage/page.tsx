import ManageImages from "@/components/ManageImages/ManageImages";

export default function Room7ManagePage() {
  return (
    <ManageImages
      roomId="room7"
      slotCount={20}
      defaultImage0="/room7-image1.jpg"
      title="จัดการรูปภาพ — วงไข่มุกบารมี (87)"
      backHref="/room7"
    />
  );
}
