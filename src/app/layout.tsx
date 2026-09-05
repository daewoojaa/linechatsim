import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import RegisterServiceWorker from "./register-sw";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "LINE Chat Simulator",
  description:
    "Stage a believable LINE-style chat screenshot from your own chat bubble images, background, and stickers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chat Sim",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Without this, the OS keyboard opening resizes the visual viewport,
  // which is what was still dragging the fixed header along with it on
  // real devices no matter how much CSS pinned things in place —
  // position:fixed can't out-fight a viewport that's actually resizing
  // underneath it. "overlays-content" tells the browser to draw the
  // keyboard on top of the page instead of resizing anything, so the
  // layout (header included) never has a reason to move at all.
  interactiveWidget: "overlays-content",
  themeColor: "#aab6d8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
