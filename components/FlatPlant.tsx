import type { LeafGroupId } from "@/lib/deficiency";

/**
 * The Chapter-01 artboards' flat plant (T-032): old leaves low, young leaves and the tip high, the chosen
 * group ringed and the other dimmed. It is the 3D plant's stand-in when WebGL cannot run, so the lesson
 * keeps its picture. Its colours are scene art, copied from the artboard. No text is drawn in it (D3).
 */
export function FlatPlant({ selected, label }: { selected: LeafGroupId; label: string }) {
  return (
    <svg className="flat-plant" data-leaf={selected} viewBox="0 0 236 248" role="img" aria-label={label}>
      <rect x="0" y="0" width="236" height="200" fill="#DCE7D6" />
      <rect x="0" y="200" width="236" height="48" fill="#5A3D27" />
      <rect x="0" y="198" width="236" height="4" fill="#3E2A1A" opacity="0.4" />
      <path d="M118 202 L118 34" stroke="#2F6F3E" strokeWidth="7" strokeLinecap="round" fill="none" />
      <g className="fp-young">
        <circle className="fp-ring" cx="118" cy="68" r="52" fill="#8456B0" />
        <path d="M118 96 C 92 90, 74 74, 68 52 C 94 48, 112 70, 118 96 Z" fill="#6FB169" />
        <path d="M118 84 C 144 78, 162 62, 168 40 C 142 36, 124 58, 118 84 Z" fill="#6FB169" />
        <path d="M118 56 C 106 44, 102 28, 106 14 C 120 22, 126 42, 118 56 Z" fill="#8FC98A" />
      </g>
      <g className="fp-old">
        <circle className="fp-ring" cx="118" cy="156" r="56" fill="#B5541E" />
        <path d="M118 186 C 86 180, 62 158, 54 128 C 88 124, 110 150, 118 186 Z" fill="#3F7B46" />
        <path d="M118 170 C 150 164, 174 142, 182 112 C 148 108, 126 134, 118 170 Z" fill="#3F7B46" />
      </g>
    </svg>
  );
}
