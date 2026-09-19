import ManageImages from "@/components/ManageImages/ManageImages";

const ROOM6_IMAGES = ["/room6-image1.jpg", "/room6-image2.jpg", "/room6-image3.jpg", "/room6-image4.jpg"];

export default function Room6ManagePage() {
  return (
    <ManageImages
      roomId="room6"
      slotCount={20}
      defaultImages={ROOM6_IMAGES}
      title="จัดการรูปภาพ — แก่น"
      backHref="/room6"
    />
  );
}
