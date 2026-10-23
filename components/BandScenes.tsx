import type { ReactNode } from "react";

/**
 * The pictures in the redesigned chapters' header bands (T-044), one per chapter. Their colours are scene art copied
 * from (or drawn to match) the artboards, so they stay literals rather than tokens. Each is decorative: hidden from
 * assistive technology, with no text in it (D3). Gradient and pattern ids carry the chapter so two never clash.
 *
 * Where an artboard draws a landscape and a portrait picture, both are kept and CSS shows one ("art-landscape",
 * "art-portrait", as in the chapter 1 hero). A scene drawn for the site is one wide picture, cropped from the left,
 * so its subject (at the right) stays in view at every width.
 */
const svgProps = { "aria-hidden": true, focusable: false } as const;

/** Chapter 3, Bag-Calculator-Landscape.dc.html and Bag-Calculator-Portrait.dc.html: fertilizer sacks on a field. */
function Chapter3() {
  return (
    <>
      <svg className="chapter-band-scene art-landscape" viewBox="0 0 1366 160" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
        <defs>
          <linearGradient id="band3-sky-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A8C7CF" />
            <stop offset="1" stopColor="#F6DAA8" />
          </linearGradient>
          <pattern id="band3-weave-l" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#E2D6B6" />
            <path d="M0 4h8M4 0v8" stroke="#CBB98F" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1366" height="160" fill="url(#band3-sky-l)" />
        <path d="M0 102 C 340 88, 760 108, 1366 94 L1366 160 L0 160 Z" fill="#7FA463" />
        <path d="M0 132 C 340 122, 760 138, 1366 122 L1366 160 L0 160 Z" fill="#5A8A50" />
        <g>
          <rect x="1052" y="40" width="88" height="106" rx="8" fill="url(#band3-weave-l)" stroke="#9A8356" strokeWidth="2" />
          <path d="M1060 50 h72" stroke="#9A8356" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="1062" y="74" width="68" height="26" rx="4" fill="#1F5E45" />
          <rect x="1150" y="56" width="88" height="90" rx="8" fill="url(#band3-weave-l)" stroke="#9A8356" strokeWidth="2" />
          <path d="M1158 66 h72" stroke="#9A8356" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="1160" y="86" width="68" height="24" rx="4" fill="#1F5E45" />
          <rect x="1248" y="68" width="88" height="78" rx="8" fill="url(#band3-weave-l)" stroke="#9A8356" strokeWidth="2" />
          <path d="M1256 78 h72" stroke="#9A8356" strokeWidth="2" strokeDasharray="5 5" />
        </g>
      </svg>
      <svg className="chapter-band-scene art-portrait" viewBox="0 0 834 180" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
        <defs>
          <linearGradient id="band3-sky-p" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A8C7CF" />
            <stop offset="1" stopColor="#F6DAA8" />
          </linearGradient>
          <pattern id="band3-weave-p" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#E2D6B6" />
            <path d="M0 4h8M4 0v8" stroke="#CBB98F" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="834" height="180" fill="url(#band3-sky-p)" />
        <path d="M0 118 C 200 104, 460 124, 834 110 L834 180 L0 180 Z" fill="#7FA463" />
        <path d="M0 150 C 200 140, 460 156, 834 140 L834 180 L0 180 Z" fill="#5A8A50" />
        <g>
          <rect x="604" y="52" width="86" height="106" rx="8" fill="url(#band3-weave-p)" stroke="#9A8356" strokeWidth="2" />
          <path d="M612 62 h70" stroke="#9A8356" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="614" y="86" width="66" height="26" rx="4" fill="#1F5E45" />
          <rect x="700" y="68" width="86" height="90" rx="8" fill="url(#band3-weave-p)" stroke="#9A8356" strokeWidth="2" />
          <path d="M708 78 h70" stroke="#9A8356" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="710" y="98" width="66" height="24" rx="4" fill="#1F5E45" />
        </g>
      </svg>
    </>
  );
}

const SCENES: Readonly<Record<number, () => ReactNode>> = {
  3: Chapter3,
};

/** The band's picture for a chapter; every redesigned chapter after the first has one (lib/band.test.ts). */
export function bandScene(chapter: number): ReactNode {
  const Scene = SCENES[chapter];
  return Scene ? <Scene /> : null;
}

/** The chapters that have a scene, for the test that every redesigned chapter does. */
export const BAND_SCENE_CHAPTERS: readonly number[] = Object.keys(SCENES).map(Number);
