import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { THEME_SCRIPT } from "@/lib/theme";
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
    // suppressHydrationWarning: THEME_SCRIPT and the home page's HERO_MODE_SCRIPT set data-theme and
    // data-hero on <html> before React hydrates, on purpose.
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* First in <head>, so a remembered theme applies before anything paints. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* All six faces are preloaded. The Thai subsets were preloaded alone at first, on the
            thought that the Latin ones are rarely needed; Lighthouse (T-024) showed they are
            fetched on every page (digits, N, P, K, kg) but only once the stylesheet had been read,
            so the text re-rendered when they arrived: LCP 2.5 s and a layout shift of 0.23 on
            chapter 4 under the slow-4G profile. Fetched in parallel with the Thai ones, the swap
            happens with the first paint. The 600 weight is included because it carries the
            soil-test note and the primary call to action: iPad's Thai fallback (Thonburi) has very
            different metrics, so leaving it to `swap` reflows exactly the elements that matter. */}
        {[
          "sarabun-400-thai",
          "sarabun-600-thai",
          "noto-sans-thai-700-thai",
          "sarabun-400-latin",
          "sarabun-600-latin",
          "noto-sans-thai-700-latin",
        ].map((face) => (
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
        {/* One Thai and one Latin letter in each preloaded face, so every font file is first used
            by the first layout. WebKit otherwise stalls `load` when a page first needs a face after
            its preload has finished (T-027: 11 of 60 chapter walks stalled without this, 0 of 120
            with it). Removing the preloads also cures it but costs chapter 4 its score (T-024). */}
        <span className="font-warm visually-hidden" aria-hidden="true">
          <span>{"\u0e01A"}</span>
          <span>{"\u0e01A"}</span>
          <span>{"\u0e01A"}</span>
        </span>
        {children}
        {/* Only on Vercel: /_vercel/insights/script.js exists solely on Vercel's
            edge, so mounting this in a local production build requests a path
            that 404s. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
