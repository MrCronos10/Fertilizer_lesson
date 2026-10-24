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

/** The one chapter with the tall hero (ChapterHero) instead of a band: the first. */
export const HERO_CHAPTER = 1;

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

/** Chapter 2, drawn for the site in the bands' style (no artboard): a compost heap beside a chemical-fertilizer sack and granules, organic and chemical side by side. */
function Chapter2() {
  return (
    <svg className="chapter-band-scene" viewBox="0 0 1366 160" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
      <Field id="band2-sky" />
      <defs>
        <pattern id="band2-weave" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#E2D6B6" />
          <path d="M0 4h8M4 0v8" stroke="#CBB98F" strokeWidth="1.4" />
        </pattern>
      </defs>
      {/* the compost heap: soil browns in layers, a few leaves and straws on top */}
      <path d="M1000 146 C 1012 104, 1048 74, 1092 70 C 1138 74, 1172 104, 1184 146 Z" fill="#6B4A2F" />
      <path d="M1018 146 C 1030 116, 1058 96, 1092 94 C 1126 96, 1156 116, 1166 146 Z" fill="#8B6239" />
      <path d="M1040 146 C 1050 128, 1070 118, 1092 117 C 1114 118, 1134 128, 1144 146 Z" fill="#A98563" />
      <g stroke="#C9A24A" strokeWidth="2.4" strokeLinecap="round">
        <path d="M1060 84 l18 -10" />
        <path d="M1096 76 l14 6" />
        <path d="M1122 92 l16 -8" />
      </g>
      <path d="M1074 72 C 1082 60, 1096 58, 1104 64 C 1094 72, 1084 74, 1074 72 Z" fill="#4C8A50" />
      <path d="M1108 80 C 1118 70, 1130 70, 1136 76 C 1126 84, 1116 84, 1108 80 Z" fill="#6FB169" />
      {/* the sack, and a little heap of granules in the lesson's N, P and K colours */}
      <rect x="1214" y="58" width="88" height="88" rx="8" fill="url(#band2-weave)" stroke="#9A8356" strokeWidth="2" />
      <path d="M1222 68 h72" stroke="#9A8356" strokeWidth="2" strokeDasharray="5 5" />
      <rect x="1224" y="86" width="68" height="24" rx="4" fill="#1F5E45" />
      <g>
        <circle cx="1318" cy="142" r="5" fill="#2F6F3E" />
        <circle cx="1330" cy="143" r="5" fill="#8456B0" />
        <circle cx="1342" cy="142" r="5" fill="#B5541E" />
        <circle cx="1324" cy="134" r="5" fill="#B5541E" />
        <circle cx="1336" cy="134" r="5" fill="#2F6F3E" />
        <circle cx="1330" cy="126" r="5" fill="#8456B0" />
      </g>
    </svg>
  );
}

/**
 * Chapter 7, Quiz-Landscape.dc.html and Quiz-Portrait.dc.html: a rice harvest, the sun over golden hills and rows of
 * stalks. Copied from the artboards: two pictures, as for chapter 3.
 */
function Chapter7() {
  const rows = {
    landscape: { xs: [900, 980, 1060, 1140, 1220, 1300], ys: [142, 148, 138, 148, 140, 148], ellipses: [[892, 114], [972, 120], [1052, 110], [1132, 120], [1212, 112], [1292, 120]], lean: [8, 24, 30, 23] },
    portrait: { xs: [596, 646, 696, 746, 796], ys: [190, 196, 186, 196, 188], ellipses: [[588, 158], [638, 164], [688, 154], [738, 164], [788, 156]], lean: [8, 26, 32, 25] },
  } as const;
  const stalks = (k: "landscape" | "portrait") => {
    const { xs, ys, lean } = rows[k];
    const [dx, left, mid, right] = lean;
    return (
      <>
        <g stroke="#8A6A22" strokeWidth="2.6" strokeLinecap="round" fill="none">
          {xs.map((x, i) => (
            <path key={x} d={`M${x} ${ys[i]} l-${dx} -${left} M${x} ${ys[i]} l0 -${mid} M${x} ${ys[i]} l${dx} -${right}`} />
          ))}
        </g>
        <g fill="#E8C96A">
          {rows[k].ellipses.map(([cx, cy]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx="5" ry="9" />
          ))}
        </g>
      </>
    );
  };
  return (
    <>
      <svg className="chapter-band-scene art-landscape" viewBox="0 0 1366 150" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
        <defs>
          <linearGradient id="band7-sky-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A8C7CF" />
            <stop offset="1" stopColor="#F7CE8C" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1366" height="150" fill="url(#band7-sky-l)" />
        <circle cx="1128" cy="46" r="52" fill="#F2B632" opacity="0.2" />
        <circle cx="1128" cy="46" r="32" fill="#F2B632" />
        <path d="M0 90 C 340 76, 760 96, 1366 82 L1366 150 L0 150 Z" fill="#C9A24A" />
        <path d="M0 116 C 340 106, 760 122, 1366 106 L1366 150 L0 150 Z" fill="#A8812F" />
        {stalks("landscape")}
      </svg>
      <svg className="chapter-band-scene art-portrait" viewBox="0 0 834 200" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
        <defs>
          <linearGradient id="band7-sky-p" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A8C7CF" />
            <stop offset="1" stopColor="#F7CE8C" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="834" height="200" fill="url(#band7-sky-p)" />
        <circle cx="716" cy="56" r="56" fill="#F2B632" opacity="0.2" />
        <circle cx="716" cy="56" r="34" fill="#F2B632" />
        <path d="M0 122 C 200 108, 460 128, 834 114 L834 200 L0 200 Z" fill="#C9A24A" />
        <path d="M0 152 C 200 142, 460 158, 834 142 L834 200 L0 200 Z" fill="#A8812F" />
        {stalks("portrait")}
      </svg>
    </>
  );
}

/** Field and sky shared by the drawn scenes: the chapter 3 band's colours and curves. */
function Field({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A8C7CF" />
          <stop offset="1" stopColor="#F6DAA8" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1366" height="160" fill={`url(#${id})`} />
      <path d="M0 102 C 340 88, 760 108, 1366 94 L1366 160 L0 160 Z" fill="#7FA463" />
      <path d="M0 132 C 340 122, 760 138, 1366 122 L1366 160 L0 160 Z" fill="#5A8A50" />
    </>
  );
}

/** Chapter 4, drawn for the site (no artboard): a scoop scattering granules along a row of young plants. */
function Chapter4() {
  const seedlings = [1010, 1066, 1122, 1178, 1234, 1290];
  return (
    <svg className="chapter-band-scene" viewBox="0 0 1366 160" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
      <Field id="band4-sky" />
      <path d="M980 140 C 1100 132, 1220 134, 1340 128" stroke="#6B4A2F" strokeWidth="10" strokeLinecap="round" fill="none" />
      {seedlings.map((x) => (
        <g key={x}>
          <path d={`M${x} 136 L${x} 112`} stroke="#2F6F3E" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${x} 120 C ${x - 14} 116, ${x - 20} 106, ${x - 18} 98 C ${x - 6} 102, ${x} 110, ${x} 120 Z`} fill="#4C8A50" />
          <path d={`M${x} 116 C ${x + 14} 112, ${x + 20} 102, ${x + 18} 94 C ${x + 6} 98, ${x} 106, ${x} 116 Z`} fill="#6FB169" />
        </g>
      ))}
      {/* the scoop, tipped, with granules falling between two plants */}
      <path d="M1128 30 L1196 22 L1188 52 C 1170 60, 1146 58, 1134 50 Z" fill="#E2D6B6" stroke="#9A8356" strokeWidth="2" />
      <path d="M1196 22 L1236 14" stroke="#9A8356" strokeWidth="6" strokeLinecap="round" />
      <g>
        <circle cx="1140" cy="66" r="4" fill="#2F6F3E" />
        <circle cx="1146" cy="80" r="4" fill="#8456B0" />
        <circle cx="1138" cy="94" r="4" fill="#B5541E" />
        <circle cx="1148" cy="108" r="4" fill="#2F6F3E" />
        <circle cx="1154" cy="92" r="4" fill="#B5541E" />
      </g>
    </svg>
  );
}

/** Chapter 5, drawn for the site (no artboard): a flooded paddy with rows of rice. */
function Chapter5() {
  const tufts = [960, 1020, 1080, 1140, 1200, 1260, 1320];
  return (
    <svg className="chapter-band-scene" viewBox="0 0 1366 160" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
      <Field id="band5-sky" />
      <path d="M900 122 C 1040 116, 1200 118, 1366 112 L1366 150 C 1200 154, 1040 152, 900 150 Z" fill="#8FB6C4" opacity="0.85" />
      <path d="M940 134 h60 M1060 130 h80 M1200 136 h70" stroke="#FFFFFC" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {tufts.map((x, i) => (
        <g key={x} stroke={i % 2 ? "#4C8A50" : "#2F6F3E"} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d={`M${x} 132 C ${x - 4} 112, ${x - 12} 96, ${x - 20} 86`} />
          <path d={`M${x} 132 C ${x} 110, ${x + 2} 94, ${x + 4} 80`} />
          <path d={`M${x} 132 C ${x + 6} 112, ${x + 14} 98, ${x + 22} 90`} />
        </g>
      ))}
    </svg>
  );
}

/** Chapter 6, drawn for the site (no artboard): an open book with a leaf on it, for the glossary. */
function Chapter6() {
  return (
    <svg className="chapter-band-scene" viewBox="0 0 1366 160" preserveAspectRatio="xMaxYMax slice" {...svgProps}>
      <Field id="band6-sky" />
      <path d="M1076 138 C 1120 128, 1168 128, 1206 140 L1206 58 C 1168 46, 1120 46, 1076 56 Z" fill="#FFFFFC" stroke="#9A8356" strokeWidth="2" />
      <path d="M1336 138 C 1292 128, 1244 128, 1206 140 L1206 58 C 1244 46, 1292 46, 1336 56 Z" fill="#FFFFFC" stroke="#9A8356" strokeWidth="2" />
      <g stroke="#CBB98F" strokeWidth="3" strokeLinecap="round">
        <path d="M1096 76 h86 M1096 92 h86 M1096 108 h66" />
        <path d="M1230 76 h86 M1230 92 h66" />
      </g>
      <path d="M1252 118 C 1262 100, 1284 94, 1304 96 C 1298 114, 1278 124, 1252 118 Z" fill="#4C8A50" />
      <path d="M1252 118 C 1268 110, 1284 104, 1300 100" stroke="#2F6F3E" strokeWidth="2" fill="none" />
    </svg>
  );
}

const SCENES: Readonly<Record<number, () => ReactNode>> = {
  2: Chapter2,
  3: Chapter3,
  4: Chapter4,
  5: Chapter5,
  6: Chapter6,
  7: Chapter7,
};

/** The band's picture for a chapter; every redesigned chapter after the first has one (lib/band.test.ts). */
export function bandScene(chapter: number): ReactNode {
  const Scene = SCENES[chapter];
  return Scene ? <Scene /> : null;
}

/** The chapters that have a scene, for the test that every redesigned chapter does. */
export const BAND_SCENE_CHAPTERS: readonly number[] = Object.keys(SCENES).map(Number);
