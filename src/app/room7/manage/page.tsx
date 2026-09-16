import ManageImages from "@/components/ManageImages/ManageImages";

const ROOM7_IMAGES = [
  "/room7-image1.jpg",
  "/room7-image2.jpg",
  "/room7-image3.jpg",
  "/room7-image4.jpg",
  "/room7-image5.jpg",
  "/room7-image6.jpg",
];

export default function Room7ManagePage() {
  return (
    <ManageImages
      roomId="room7"
      slotCount={20}
      defaultImages={ROOM7_IMAGES}
      title="จัดการรูปภาพ — วงไข่มุกบารมี (87)"
      backHref="/room7"
    />
  );
}
