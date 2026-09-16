import ManageImages from "@/components/ManageImages/ManageImages";

const ROOM7_IMAGES = Array.from({ length: 17 }, (_, i) => `/room7-image${i + 1}.jpg`);

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
