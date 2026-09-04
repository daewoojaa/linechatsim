import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LINE Chat Simulator",
    short_name: "Chat Sim",
    description:
      "Stage-manage fake LINE-style chat screenshots from your own chat bubble images, background, and stickers.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#aab6d8",
    theme_color: "#aab6d8",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
