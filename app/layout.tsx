import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "เรียนรู้เรื่องปุ๋ย",
  description: "เว็บไซต์สอนพื้นฐานเรื่องปุ๋ยสำหรับผู้เริ่มต้น",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* Only the Thai subsets are preloaded: every page is Thai, so these two
            are always needed, while the Latin files often are not. */}
        <link
          rel="preload"
          href="/fonts/sarabun-400-thai.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/noto-sans-thai-700-thai.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        {/* Only on Vercel: /_vercel/insights/script.js exists solely on Vercel's
            edge, so mounting this in a local production build requests a path
            that 404s. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
