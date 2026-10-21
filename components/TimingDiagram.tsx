import { useId } from "react";
import { readChapters } from "@/lib/content";
import { SECTION_PAGE, STAGES, riceRates, type RateLine, type Stage } from "@/lib/timing";
import type { UiStrings } from "@/lib/ui";
import { RateBlock } from "./Rate";
import { TierBadge } from "./TierBadge";

const W = 360;
const PAD = 14;

type Row = { text: string; size: number; weight: 400 | 700; gap?: number };

/** One panel's text rows, top to bottom: term, the pamphlet's lines, then the data's rate rows. */
function rowsFor(stage: Stage, rates: readonly RateLine[], ui: UiStrings): Row[] {
  const rows: Row[] = [{ text: stage.term, size: 24, weight: 700 }];
  stage.lines.forEach((text, i) => rows.push({ text, size: 17, weight: 400, gap: i === 0 ? 6 : 0 }));
  rates.forEach((r, i) => {
    rows.push({ text: r.label, size: 16, weight: 700, gap: i === 0 ? 14 : 10 });
    rows.push({ text: `${ui.colGrade} ${r.grades}`, size: 16, weight: 400 });
    rows.push({ text: `${ui.cropRate} ${r.rate} ${r.unit}`, size: 16, weight: 400 });
  });
  return rows;
}

function layout(rows: readonly Row[], top: number) {
  let y = top + PAD;
  const placed = rows.map((row) => {
    y += (row.gap ?? 0) + (row.size >= 22 ? 28 : 23);
    return { ...row, y };
  });
  return { placed, bottom: y + PAD };
}

/** Each rate row's own sources, once: the clay and sandy rows are backed by different sources, so they are never merged. */
function perRowSources(rates: readonly RateLine[]) {
  const seen = new Map<string, RateLine>();
  for (const r of rates) if (!seen.has(r.label)) seen.set(r.label, r);
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
  // Unique per diagram, so two on one page cannot name each other's title.
  const uid = useId().replace(/:/g, "");
  const titleId = `timing-title-${uid}`;
  const descId = `timing-desc-${uid}`;
  const rates = riceRates("th");
  const listed = new Set(readChapters("th").find((c) => c.frontmatter.chapter === 2)?.frontmatter.citations ?? []);
  const panels: { stage: Stage; rows: Row[]; top: number; bottom: number; placed: ReturnType<typeof layout>["placed"] }[] = [];
  let top = 10;
  for (const stage of STAGES) {
    const rows = rowsFor(stage, rates[stage.id], ui);
    const { placed, bottom } = layout(rows, top);
    panels.push({ stage, rows, top, bottom, placed });
    top = bottom + 14;
  }
  const height = top - 14 + 10;
  // One sentence per panel: the pamphlet's own phrases run together, then each rate line, so a
  // screen reader does not stop between "for example" and the example itself.
  const description = panels
    .map((p) => {
      const rateText = p.rows.slice(1 + p.stage.lines.length);
      const groups: string[] = [];
      for (let k = 0; k < rateText.length; k += 3) groups.push(rateText.slice(k, k + 3).map((r) => r.text).join(", "));
      return [`${p.stage.term}: ${p.stage.lines.join(" ")}`, ...groups].join(". ");
    })
    .join(". ");
  const title = `${STAGES[0]!.term} / ${STAGES[1]!.term}`;
  const perRow = perRowSources([...rates.basal, ...rates.topDressing]);

  return (
    <RateBlock ui={ui}>
      <figure className="timing">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          className="timing-svg"
          data-timing
        >
          <title id={titleId}>{title}</title>
          <desc id={descId}>{description}</desc>
          {panels.map((p) => (
            <g key={p.stage.id} data-stage={p.stage.id}>
              <rect x={10} y={p.top} width={W - 20} height={p.bottom - p.top} rx={12} className="timing-box" />
              {p.placed.map((r, j) => (
                <text key={j} x={W / 2} y={r.y} textAnchor="middle" fontSize={r.size} fontWeight={r.weight} className={j === 0 ? "timing-term" : "timing-text"}>
                  {r.text}
                </text>
              ))}
            </g>
          ))}
        </svg>
        <figcaption className="muted timing-caption">
          <p>
            {title}: {ui.pamphletPages}: {SECTION_PAGE}
          </p>
          {perRow.length > 0 ? (
            <ul className="timing-sources">
              {perRow.map((r) => (
                <li key={r.label} data-row-label={r.label}>
                  {r.label}: {ui.pamphletPages}: {r.page}
                  {" · "}
                  {r.sources.map((s) => (
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
                </li>
              ))}
            </ul>
          ) : null}
        </figcaption>
      </figure>
    </RateBlock>
  );
}
