/*
 * The home page's drawn scenery (T-027): the field behind the hero, the flat soil plate the
 * no-WebGL hero shows, and the chapter path. Path data and colours are the artboards' own
 * (Main, Home-Portrait, Home-Phone, Home-Hero-Fallback, Home-Night). Every shape carries a role
 * class; app/[locale]/home.css gives each role its day and night colour, so the night palette
 * lives with the scene and not in globals.css. All of it is decoration (aria-hidden).
 */

type Band = readonly [d: string, role: string];

const TUFT = (x: number, y: number, a = 7, b = 20, c = 24, e = 19) => `M${x} ${y} l-${a} -${b} M${x} ${y} l0 -${c} M${x} ${y} l${a} -${e}`;

/** Main.dc.html's field, landscape with the live block (1366 × 500). */
const LANDSCAPE: readonly Band[] = [
  ["M0 268 C 180 232, 330 250, 470 266 C 600 280, 700 256, 860 240 C 1030 224, 1180 248, 1366 236 L1366 300 L0 300 Z", "hill-far"],
  ["M0 286 C 220 262, 420 290, 640 282 C 880 274, 1120 294, 1366 282 L1366 320 L0 320 Z", "hill-near"],
  ["M0 304 C 340 294, 980 312, 1366 298 L1366 338 L0 346 Z", "band1"],
  ["M0 346 C 340 336, 980 352, 1366 338 L1366 384 L0 394 Z", "band2"],
  ["M0 394 C 340 384, 980 398, 1366 384 L1366 436 L0 448 Z", "band3"],
  ["M0 448 C 340 438, 980 450, 1366 436 L1366 500 L0 500 Z", "band4"],
  ["M0 340 C 340 330, 980 346, 1366 332", "furrow f1"],
  ["M0 390 C 340 380, 980 394, 1366 380", "furrow f2"],
  ["M0 443 C 340 433, 980 445, 1366 431", "furrow f3"],
];
const LANDSCAPE_TUFTS = [[70, 470], [196, 476], [322, 466], [448, 478], [574, 468], [1086, 474], [1212, 464], [1316, 478]] as const;

/** Home-Portrait.dc.html's field (834 × 600). */
const PORTRAIT: readonly Band[] = [
  ["M0 258 C 140 230, 260 248, 380 262 C 500 276, 600 252, 720 240 C 790 232, 810 244, 834 238 L834 292 L0 292 Z", "hill-far"],
  ["M0 274 C 180 252, 340 278, 520 272 C 680 266, 760 282, 834 274 L834 306 L0 306 Z", "hill-near"],
  ["M0 300 C 240 292, 600 308, 834 296 L834 338 L0 346 Z", "band1"],
  ["M0 346 C 240 338, 600 352, 834 338 L834 392 L0 402 Z", "band2"],
  ["M0 402 C 240 394, 600 406, 834 392 L834 462 L0 474 Z", "band3"],
  ["M0 474 C 240 466, 600 478, 834 462 L834 600 L0 600 Z", "band4"],
  ["M0 342 C 240 334, 600 348, 834 334", "furrow f1p"],
  ["M0 398 C 240 390, 600 402, 834 388", "furrow f2p"],
  ["M0 470 C 240 462, 600 474, 834 458", "furrow f3p"],
];
const PORTRAIT_TUFTS = [[58, 584], [168, 592], [278, 580], [388, 594], [806, 586]] as const;

/** Home-Phone.dc.html's band (390 × 208). */
const PHONE: readonly Band[] = [
  ["M0 108 C 70 94, 150 110, 230 104 C 300 99, 340 108, 390 102 L390 128 L0 128 Z", "hill-far"],
  ["M0 122 C 90 112, 220 128, 390 118 L390 142 L0 148 Z", "band1"],
  ["M0 148 C 90 140, 220 152, 390 142 L390 172 L0 180 Z", "band2"],
  ["M0 180 C 90 172, 220 182, 390 172 L390 208 L0 208 Z", "band4-phone"],
  ["M0 146 C 90 138, 220 150, 390 140", "furrow f-phone"],
];
const PHONE_TUFTS = [[30, 204], [110, 200], [378, 202]] as const;

/** Home-Night.dc.html's stars and fireflies, in Main's coordinates; other frames scale them. */
const STARS = [[140, 54, 1.6, 0.8], [268, 112, 1.2, 0.6], [402, 46, 1.8, 0.85], [520, 130, 1.2, 0.5], [640, 68, 1.5, 0.7], [760, 38, 1.2, 0.6], [892, 96, 1.7, 0.8], [1010, 52, 1.2, 0.5], [1290, 76, 1.6, 0.75], [332, 176, 1.2, 0.45], [68, 140, 1.4, 0.6], [1120, 166, 1.2, 0.45]] as const;
const FIREFLIES = [[236, 404, 2.6, 0.9], [398, 438, 2.2, 0.7], [520, 396, 2.6, 0.85], [1256, 418, 2.4, 0.8], [1152, 452, 2.2, 0.65], [118, 446, 2.4, 0.75]] as const;

function Sky({ id, w, h, mid, sun }: { id: string; w: number; h: number; mid: number; sun: { x: number; y: number; r: number; halo: number } }) {
  const sx = w / 1366;
  const sy = h / 500;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="sky0" />
          <stop offset={mid} className="sky1" />
          <stop offset="1" className="sky2" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id})`} />
      <g className="day">
        <circle cx={sun.x} cy={sun.y} r={sun.halo} className="sun-halo" />
        <circle cx={sun.x} cy={sun.y} r={sun.r} className="sun" />
      </g>
      <g className="night stars">
        {STARS.map(([x, y, r, o]) => (
          <circle key={`${x}-${y}`} cx={x * sx} cy={y * sy} r={r} opacity={o} />
        ))}
      </g>
      <g className="night">
        <circle cx={sun.x} cy={sun.y} r={sun.halo * (88 / 84)} className="moon-halo" />
        <circle cx={sun.x} cy={sun.y} r={sun.r * (50 / 52)} className="moon" />
        <circle cx={sun.x + sun.r * (18 / 52)} cy={sun.y - sun.r * (12 / 52)} r={sun.r * (42 / 52)} className="moon-shade" />
      </g>
    </>
  );
}

function Field({ bands, tufts, tuftSize, w, fireflyBand }: { bands: readonly Band[]; tufts: readonly (readonly [number, number])[]; tuftSize?: readonly [number, number, number, number]; w: number; fireflyBand: readonly [number, number] }) {
  const sx = w / 1366;
  const [top, bottom] = fireflyBand;
  return (
    <>
      {bands.map(([d, role]) => (
        <path key={d} d={d} className={role} />
      ))}
      <g className="tufts">
        {tufts.map(([x, y]) => (
          <path key={`${x}-${y}`} d={TUFT(x, y, ...(tuftSize ?? []))} />
        ))}
      </g>
      <g className="night fireflies">
        {FIREFLIES.map(([x, y, r, o]) => (
          <circle key={`${x}-${y}`} cx={x * sx} cy={top + ((y - 396) / (452 - 396)) * (bottom - top)} r={r} opacity={o} />
        ))}
      </g>
    </>
  );
}

/** The hero's background, one drawing per layout; the stylesheet shows the one that fits. */
export function HeroField() {
  return (
    <>
      <svg className="art art-landscape" viewBox="0 0 1366 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <Sky id="hero-sky-l" w={1366} h={500} mid={0.5} sun={{ x: 1188, y: 112, r: 52, halo: 84 }} />
        <Field bands={LANDSCAPE} tufts={LANDSCAPE_TUFTS} w={1366} fireflyBand={[396, 452]} />
      </svg>
      <FlatField />
      <svg className="art art-portrait" viewBox="0 0 834 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <Sky id="hero-sky-p" w={834} h={600} mid={0.52} sun={{ x: 716, y: 84, r: 44, halo: 70 }} />
        <Field bands={PORTRAIT} tufts={PORTRAIT_TUFTS} w={834} fireflyBand={[420, 500]} />
      </svg>
      <svg className="art art-phone" viewBox="0 0 390 208" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <Sky id="hero-sky-s" w={390} h={208} mid={0.5} sun={{ x: 58, y: 42, r: 24, halo: 38 }} />
        <Field bands={PHONE} tufts={PHONE_TUFTS} tuftSize={[5, 14, 17, 13]} w={390} fireflyBand={[150, 196]} />
      </svg>
    </>
  );
}

/**
 * Home-Hero-Fallback.dc.html: six flat planes, each lifted by its own shadow, so depth reads
 * without WebGL. Only the landscape flat hero uses it.
 */
function FlatField() {
  const plane = (n: number, children: React.ReactNode) => (
    <svg className={`art art-flat plane plane-${n}`} viewBox="0 0 1366 556" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {children}
    </svg>
  );
  return (
    <>
      {plane(1, <Sky id="hero-sky-f" w={1366} h={556} mid={0.55} sun={{ x: 1204, y: 96, r: 50, halo: 84 }} />)}
      {plane(
        2,
        <>
          <path className="f-hill" d="M0 262 C 180 226, 330 244, 470 260 C 600 274, 700 250, 860 234 C 1030 218, 1180 242, 1366 230 L1366 300 L0 300 Z" />
          <path className="f-hill-ridge" d="M0 262 C 180 226, 330 244, 470 260 C 600 274, 700 250, 860 234 C 1030 218, 1180 242, 1366 230" />
        </>,
      )}
      {plane(
        3,
        <>
          <path className="f-mid" d="M0 302 C 340 290, 980 310, 1366 294 L1366 404 L0 412 Z" />
          <path className="f-mid-ridge" d="M0 302 C 340 290, 980 310, 1366 294" />
          <path className="furrow f-mid-furrow" d="M0 352 C 340 342, 980 356, 1366 340" />
        </>,
      )}
      {plane(
        4,
        <>
          <path className="f-near" d="M0 404 C 340 392, 980 408, 1366 390 L1366 486 L0 498 Z" />
          <path className="f-near-ridge" d="M0 404 C 340 392, 980 408, 1366 390" />
          <path className="furrow f-near-furrow" d="M0 446 C 340 436, 980 450, 1366 432" />
        </>,
      )}
      {plane(
        6,
        <>
          <path className="f-fringe" d="M0 486 C 340 474, 980 490, 1366 470 L1366 556 L0 556 Z" />
          <path className="f-fringe-ridge" d="M0 486 C 340 474, 980 490, 1366 470" />
          <g className="f-fringe-tufts">
            {[[84, 540], [248, 548], [412, 536], [576, 550], [1072, 544], [1236, 534], [1340, 550]].map(([x, y]) => (
              <path key={x} d={TUFT(x!, y!, 8, 24, 29, 23)} />
            ))}
          </g>
        </>,
      )}
    </>
  );
}

/**
 * Plane 5 of Home-Hero-Fallback.dc.html: the cut-out soil plate. It is what a reader without
 * WebGL (or with reduced motion) sees in place of the live block, at every width.
 */
export function SoilCard() {
  return (
    <div className="soil-card">
      <svg viewBox="0 0 366 356" aria-hidden="true">
        <defs>
          <linearGradient id="card-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="soil0" />
            <stop offset="0.5" className="soil1" />
            <stop offset="1" className="soil2" />
          </linearGradient>
        </defs>
        <rect width="366" height="148" className="card-air" />
        <rect y="148" width="366" height="208" fill="url(#card-soil)" />
        <path className="strata s1" d="M0 176 C 100 170, 230 184, 366 176" />
        <path className="strata s2" d="M0 232 C 110 226, 240 240, 366 230" />
        <path className="strata s3" d="M0 292 C 110 288, 240 300, 366 290" />
        <g className="pebbles">
          <circle cx="48" cy="206" r="4" />
          <circle cx="124" cy="258" r="3" />
          <circle cx="254" cy="210" r="3.5" />
          <circle cx="306" cy="276" r="4" />
          <circle cx="70" cy="318" r="3" />
          <circle cx="208" cy="326" r="3.5" />
        </g>
        <g className="roots">
          <path d="M184 148 C 184 196, 182 240, 180 316" strokeWidth="5" />
          <path d="M184 174 C 148 196, 112 226, 94 286" strokeWidth="3.5" />
          <path d="M184 190 C 228 210, 260 242, 280 300" strokeWidth="3.5" />
          <path d="M182 230 C 154 252, 136 276, 130 314" strokeWidth="2.4" />
          <path d="M182 242 C 214 262, 232 284, 238 316" strokeWidth="2.4" />
        </g>
        <g>
          <circle cx="180" cy="286" r="7" className="p-n" />
          <circle cx="176" cy="230" r="6" className="p-n" />
          <circle cx="181" cy="190" r="5" className="p-n" opacity="0.8" />
          <circle cx="110" cy="264" r="7" className="p-p" />
          <circle cx="130" cy="218" r="6" className="p-p" />
          <circle cx="154" cy="182" r="5" className="p-p" opacity="0.8" />
          <circle cx="264" cy="280" r="7" className="p-k" />
          <circle cx="240" cy="228" r="6" className="p-k" />
          <circle cx="214" cy="184" r="5" className="p-k" opacity="0.8" />
        </g>
        <path className="stem" d="M184 150 L184 36" />
        <path className="leaf-old" d="M184 126 C 146 122, 116 102, 106 76 C 144 72, 174 94, 184 126 Z" />
        <path className="leaf-old" d="M184 112 C 222 108, 252 88, 262 62 C 224 58, 194 80, 184 112 Z" />
        <path className="leaf-young" d="M184 76 C 156 72, 138 56, 132 36 C 160 34, 178 52, 184 76 Z" />
        <path className="leaf-young" d="M184 66 C 212 62, 230 46, 236 26 C 208 24, 190 42, 184 66 Z" />
        <path className="leaf-tip" d="M184 40 C 174 32, 170 20, 172 10 C 184 14, 190 26, 184 40 Z" />
        <rect y="146" width="366" height="4" className="seam" />
      </svg>
    </div>
  );
}

const PATH_D = {
  landscape:
    "M60 240 C 160 220, 220 165, 295 175 C 370 185, 400 218, 470 210 C 545 202, 590 152, 660 160 C 735 168, 782 210, 850 202 C 920 194, 968 148, 1035 156 C 1100 164, 1162 190, 1225 192 L1310 188",
  portrait:
    "M24 164 C 56 138, 86 128, 118 130 C 180 134, 250 120, 312 130 C 372 140, 448 122, 508 132 C 566 142, 648 126, 700 142 C 752 158, 784 188, 782 218 C 780 248, 748 268, 700 272 C 640 277, 560 262, 504 272 C 448 282, 372 266, 312 274 C 272 280, 244 288, 218 300",
} as const;

/** The trail the chapter markers sit on (Main and Home-Portrait). Stroke widths stay in screen pixels as the band stretches. */
export function ChapterTrail() {
  return (
    <>
      <svg className="trail trail-landscape" viewBox="0 0 1366 376" preserveAspectRatio="none" aria-hidden="true">
        <path className="trail-ground g1" d="M0 300 C 300 288, 700 306, 1366 292 L1366 376 L0 376 Z" />
        <path className="trail-ground g2" d="M0 338 C 300 330, 700 344, 1366 330 L1366 376 L0 376 Z" />
        <path className="trail-edge" d={PATH_D.landscape} vectorEffect="non-scaling-stroke" />
        <path className="trail-bed" d={PATH_D.landscape} vectorEffect="non-scaling-stroke" />
        <path className="trail-dash" d={PATH_D.landscape} vectorEffect="non-scaling-stroke" />
        <g className="trail-tufts">
          {[[150, 290], [560, 300], [960, 294], [1290, 302]].map(([x, y]) => (
            <path key={x} d={TUFT(x!, y!, 6, 16, 20, 15)} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
      <svg className="trail trail-portrait" viewBox="0 0 834 364" preserveAspectRatio="none" aria-hidden="true">
        <path className="trail-ground g1" d="M0 326 C 200 318, 560 332, 834 320 L834 364 L0 364 Z" />
        <path className="trail-edge" d={PATH_D.portrait} vectorEffect="non-scaling-stroke" />
        <path className="trail-bed" d={PATH_D.portrait} vectorEffect="non-scaling-stroke" />
        <path className="trail-dash" d={PATH_D.portrait} vectorEffect="non-scaling-stroke" />
        <g className="trail-tufts">
          {[[92, 336], [430, 344], [770, 338]].map(([x, y]) => (
            <path key={x} d={TUFT(x!, y!, 6, 16, 20, 15)} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
    </>
  );
}
