import { readChapters } from "@/lib/content";
import { SECTION_PAGE, STAGES, riceRates, type RateLine, type Stage } from "@/lib/timing";
import type { UiStrings } from "@/lib/ui";
import { pageRanges } from "./Citations";
import { RateBlock } from "./Rate";
import { TierBadge } from "./TierBadge";

const W = 360;
const PAD = 14;
const LINE = 22;

type Row = { text: string; size: number; weight: 400 | 700; gap?: number };

/** One panel's text rows, top to bottom: term, the pamphlet's lines, then the data's rate rows. */
function rowsFor(stage: Stage, rates: readonly RateLine[], ui: UiStrings): Row[] {
  const rows: Row[] = [{ text: stage.term, size: 22, weight: 700 }];
  stage.lines.forEach((text, i) => rows.push({ text, size: 16, weight: 400, gap: i === 0 ? 6 : 0 }));
  rates.forEach((r, i) => {
    rows.push({ text: r.label, size: 15, weight: 700, gap: i === 0 ? 14 : 10 });
    rows.push({ text: `${ui.colGrade} ${r.grades}`, size: 14, weight: 400 });
    rows.push({ text: `${ui.cropRate} ${r.rate} ${r.unit}`, size: 14, weight: 400 });
  });
  return rows;
}

function layout(rows: readonly Row[], top: number) {
  let y = top + PAD;
  const placed = rows.map((row) => {
    y += (row.gap ?? 0) + (row.size >= 22 ? 26 : row.size >= 16 ? LINE : 20);
    return { ...row, y };
  });
  return { placed, bottom: y + PAD };
}

/** Where a chip links: only to a source chapter 2's own list has. Named-only sources have no entry. */
function chipLabel(rates: readonly RateLine[]) {
  const seen = new Map<string, RateLine["sources"][number]>();
  for (const r of rates) for (const s of r.sources) seen.set(s.id, s);
  return [...seen.values()];
}

/**
 * A static, labelled picture of the pamphlet's §2.7 (T-022): two stacked panels and an
 * arrow, nothing that moves. All words are real SVG text, so they are selectable,
 * scale with the figure and follow the theme; the whole figure is also one named image
 * whose description carries every word, which is what VoiceOver reads. The rates sit in
 * their panels and the soil-test note follows (RateBlock).
 */
export function TimingDiagram({ ui }: { ui: UiStrings }) {
  const rates = riceRates("th");
  const listed = new Set(readChapters("th").find((c) => c.frontmatter.chapter === 2)?.frontmatter.citations ?? []);
  const panels: { stage: Stage; rows: Row[]; top: number; bottom: number; placed: ReturnType<typeof layout>["placed"] }[] = [];
  let top = 10;
  for (const stage of STAGES) {
    const rows = rowsFor(stage, rates[stage.id], ui);
    const { placed, bottom } = layout(rows, top);
    panels.push({ stage, rows, top, bottom, placed });
    top = bottom + 56; // room for the arrow between panels
  }
  const height = top - 56 + 10;
  const description = panels.map((p) => p.rows.map((r) => r.text).join(". ")).join(". ");
  const title = `${STAGES[0]!.term} / ${STAGES[1]!.term}`;
  const sources = chipLabel([...rates.basal, ...rates.topDressing]);

  return (
    <RateBlock ui={ui}>
      <figure className="timing">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          
          aria-labelledby="timing-title timing-desc"
          className="timing-svg"
          data-timing
        >
          <title id="timing-title">{title}</title>
          <desc id="timing-desc">{description}</desc>
          <defs>
            <marker id="timing-head" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" className="timing-arrow" />
            </marker>
          </defs>
          {panels.map((p, i) => (
            <g key={p.stage.id} data-stage={p.stage.id}>
              <rect x={10} y={p.top} width={W - 20} height={p.bottom - p.top} rx={12} className="timing-box" />
              {p.placed.map((r, j) => (
                <text key={j} x={W / 2} y={r.y} textAnchor="middle" fontSize={r.size} fontWeight={r.weight} className={j === 0 ? "timing-term" : "timing-text"}>
                  {r.text}
                </text>
              ))}
              {i < panels.length - 1 ? (
                <line x1={W / 2} y1={p.bottom + 6} x2={W / 2} y2={p.bottom + 46} className="timing-line" markerEnd="url(#timing-head)" />
              ) : null}
            </g>
          ))}
        </svg>
        <figcaption className="muted">
          {ui.pamphletPages}: {pageRanges([SECTION_PAGE, ...rates.basal.map((r) => r.page), ...rates.topDressing.map((r) => r.page)])}
          {sources.length > 0 ? (
            <span className="timing-sources">
              {" · "}
              {sources.map((s) => (
                <span key={s.id} className="crop-source" data-source={s.id}>
                  {s.linked && listed.has(s.id) ? (
                    <a href={`#src-${s.id}`} data-cite={s.id}>
                      <span lang="en">{s.name}</span> <TierBadge tier={s.tier} ui={ui} />
                    </a>
                  ) : (
                    <>
                      <span lang="en">{s.name}</span> <TierBadge tier={s.tier} ui={ui} />
                    </>
                  )}
                </span>
              ))}
            </span>
          ) : null}
        </figcaption>
      </figure>
    </RateBlock>
  );
}
