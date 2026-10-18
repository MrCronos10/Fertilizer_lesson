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
  // Declared before CSS parses, so a dark-mode device does not flash white.
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* Only the Thai subsets are preloaded: every page is Thai, so these are
            always needed, while the Latin files often are not. The 600 weight is
            included because it carries the soil-test note and the primary call to
            action — iPad's Thai fallback (Thonburi) has very different metrics, so
            leaving it to `swap` causes visible reflow on exactly the elements that
            matter most. */}
        {["sarabun-400-thai", "sarabun-600-thai", "noto-sans-thai-700-thai"].map((face) => (
          <link
            key={face}
            rel="preload"
            href={`/fonts/${face}.woff2`}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
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
