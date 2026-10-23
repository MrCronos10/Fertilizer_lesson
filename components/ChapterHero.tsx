import Link from "next/link";
import type { UiStrings } from "@/lib/ui";

/**
 * Chapter 1's hero (T-028): the sky-and-soil picture, the back pill, the chapter badge, the title and the
 * seven-step progress, from Chapter-01-Landscape.dc.html. The picture is decorative and has no text in it (D3).
 * Its colours are scene art, copied from the artboard, so they stay literals here rather than becoming tokens.
 */
export function ChapterHero({
  locale,
  ui,
  chapter,
  total,
  heading,
}: {
  locale: string;
  ui: UiStrings;
  chapter: number;
  total: number;
  heading: string;
}) {
  return (
    <header className="chapter-hero">
      <svg className="chapter-hero-art" viewBox="0 0 1366 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="cl-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9CC0CB" />
            <stop offset="0.55" stopColor="#D3E0C9" />
            <stop offset="1" stopColor="#F6DAA8" />
          </linearGradient>
          <linearGradient id="cl-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7A563A" />
            <stop offset="1" stopColor="#3E2A1A" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1366" height="420" fill="url(#cl-sky)" />
        <circle cx="366" cy="74" r="66" fill="#F2B632" opacity="0.16" />
        <circle cx="366" cy="74" r="40" fill="#F2B632" />
        <path d="M0 212 C 260 188, 520 206, 780 216 C 1000 224, 1180 206, 1366 198 L1366 250 L0 250 Z" fill="#6E8C72" opacity="0.6" />
        <path d="M0 236 C 320 218, 680 244, 1040 236 C 1200 232, 1290 240, 1366 234 L1366 276 L0 284 Z" fill="#9FB87E" />
        <path d="M0 284 C 320 274, 680 292, 1040 282 C 1200 277, 1290 286, 1366 278 L1366 330 L0 340 Z" fill="#7FA463" />
        <path d="M0 340 C 320 330, 680 346, 1366 330 L1366 420 L0 420 Z" fill="#5A8A50" />
        <path d="M0 280 C 320 270, 680 288, 1366 274" stroke="#C9A87C" strokeWidth="2.5" fill="none" opacity="0.6" />
        <path d="M0 336 C 320 326, 680 342, 1366 326" stroke="#C9A87C" strokeWidth="3" fill="none" opacity="0.55" />
        <g stroke="#2F6F3E" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M120 398 l-7 -20 M120 398 l0 -24 M120 398 l7 -19" />
          <path d="M268 410 l-7 -20 M268 410 l0 -24 M268 410 l7 -19" />
          <path d="M1330 404 l-7 -20 M1330 404 l0 -24 M1330 404 l7 -19" />
        </g>
        <path d="M840 330 C 980 322, 1200 336, 1366 320 L1366 420 L840 420 Z" fill="url(#cl-soil)" />
        <path d="M840 330 C 980 322, 1200 336, 1366 320" stroke="#A98563" strokeWidth="3" fill="none" />
        <g stroke="#C9A87C" fill="none" strokeLinecap="round">
          <path d="M1062 330 C 1062 356, 1060 380, 1058 414" strokeWidth="5" />
          <path d="M1062 342 C 1030 356, 1006 374, 994 408" strokeWidth="3.2" />
          <path d="M1062 350 C 1096 364, 1118 382, 1128 412" strokeWidth="3.2" />
        </g>
        <g>
          <circle cx="1058" cy="396" r="7" fill="#2F6F3E" />
          <circle cx="1060" cy="364" r="6" fill="#2F6F3E" />
          <circle cx="1061" cy="340" r="5" fill="#2F6F3E" opacity="0.85" />
          <circle cx="1004" cy="388" r="7" fill="#8456B0" />
          <circle cx="1024" cy="362" r="6" fill="#8456B0" />
          <circle cx="1044" cy="340" r="5" fill="#8456B0" opacity="0.85" />
          <circle cx="1122" cy="392" r="7" fill="#B5541E" />
          <circle cx="1102" cy="364" r="6" fill="#B5541E" />
          <circle cx="1082" cy="340" r="5" fill="#B5541E" opacity="0.85" />
        </g>
        <path d="M1062 332 L1062 150" stroke="#2F6F3E" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M1062 300 C 1008 294, 966 266, 952 230 C 1006 224, 1048 254, 1062 300 Z" fill="#3F7B46" />
        <path d="M1062 282 C 1116 276, 1158 248, 1172 212 C 1118 206, 1076 236, 1062 282 Z" fill="#3F7B46" />
        <path d="M1062 236 C 1022 230, 996 208, 988 180 C 1026 176, 1052 200, 1062 236 Z" fill="#4C8A50" />
        <path d="M1062 222 C 1102 216, 1128 194, 1136 166 C 1098 162, 1072 186, 1062 222 Z" fill="#4C8A50" />
        <path d="M1062 182 C 1038 176, 1022 158, 1018 136 C 1044 134, 1058 156, 1062 182 Z" fill="#6FB169" />
        <path d="M1062 170 C 1086 164, 1102 146, 1106 124 C 1080 122, 1066 144, 1062 170 Z" fill="#6FB169" />
        <path d="M1062 144 C 1050 132, 1046 116, 1050 102 C 1064 110, 1070 130, 1062 144 Z" fill="#8FC98A" />
      </svg>
      <Link className="chapter-back" href={`/${locale}`}>
        <span className="chapter-icon chapter-icon-back" aria-hidden="true" />
        {ui.chapterBack}
      </Link>
      <div className="chapter-title-card">
        <p className="chapter-where">
          <span className="chapter-badge">
            {ui.chapterWord} {chapter}
          </span>
          <span className="muted">
            {ui.chapterWord} {chapter} {ui.chapterFrom} {total}
          </span>
        </p>
        <h1>{heading}</h1>
        <div className="chapter-steps" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} data-done={i < chapter ? "" : undefined} />
          ))}
        </div>
      </div>
    </header>
  );
}
