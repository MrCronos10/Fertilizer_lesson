import type { CSSProperties } from "react";
import {
  compoundGradeRows,
  deficiencyRows,
  nutrientGroupRows,
  organicFertilizers,
  soilConditioners,
  straightFertilizers,
} from "@/lib/data";
import type { Npk, Row } from "@/lib/data/types";
import { makeCite, pageRanges } from "./Citations";
import type { UiStrings } from "@/lib/ui";

/**
 * Tables that render from the locale-neutral JSON (T-006). A table appears here
 * only in the ticket that owns it; any id not listed renders nothing, which is
 * also what keeps the Cambodian table (D11) off the page.
 */

/** The three macronutrients' own colours, shared by the chips and the role text (the artboard's N/P/K). */
const NPK_CLASS = { N: "npk-n", P: "npk-p", K: "npk-k" } as const;
/** Each group's coloured edge, as the token the stylesheet reads through `--edge`. */
const GROUP_EDGE: Record<string, string> = { macronutrients: "var(--n)", secondary: "var(--soil)", micronutrients: "var(--soil-light)" };

/** "N = <caption>; P = …": the words are the pamphlet's, only the symbol before each "=" is coloured. */
function Role({ role, coloured }: { role: string; coloured: boolean }) {
  if (!coloured) return <>{role}</>;
  return (
    <>
      {role.split("; ").map((part, i) => {
        const symbol = part.split(" = ")[0] as keyof typeof NPK_CLASS;
        const rest = NPK_CLASS[symbol] ? part.slice(symbol.length) : null;
        return (
          <span key={i}>
            {i > 0 ? "; " : ""}
            {rest === null ? part : (
              <>
                <strong className={NPK_CLASS[symbol]}>{symbol}</strong>
                {rest}
              </>
            )}
          </span>
        );
      })}
    </>
  );
}

function NutrientGroups({ ui }: { ui: UiStrings }) {
  const rows = nutrientGroupRows();
  const pages = [...new Set(rows.map((r) => r.sourcePage))].join(", ");
  return (
    <figure className="table-figure nutrient-groups" tabIndex={0} aria-label={ui.nutrientGroupsCaption}>
      <table className="source-table" data-cols={3}>
        <caption className="visually-hidden">{ui.nutrientGroupsCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{ui.colGroup}</th>
            <th scope="col">{ui.colElements}</th>
            <th scope="col">{ui.colRole}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const npk = row.id === "macronutrients";
            return (
              <tr key={row.id} data-row={row.id} data-source-page={row.sourcePage} style={{ "--edge": GROUP_EDGE[row.id] } as CSSProperties}>
                <th scope="row">{row.labels.th.group}</th>
                <td>
                  {npk ? (
                    <span className="npk-chips">
                      {row.elements.map((e, i) => (
                        <span key={e}>
                          {i > 0 ? <span className="visually-hidden">, </span> : null}
                          <span className={`npk-chip ${NPK_CLASS[e as keyof typeof NPK_CLASS]}`}>{e}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    row.elements.join(", ")
                  )}
                </td>
                <td>
                  <Role role={row.labels.th.role} coloured={npk} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="muted">
        {ui.pamphletPages}: {pages}
      </figcaption>
    </figure>
  );
}

/** The p3 symptom table, verbatim: the text equivalent of the 3D plant, with every one of the 10 rows. */
function DeficiencySymptoms({ ui }: { ui: UiStrings }) {
  const rows = deficiencyRows();
  const pages = [...new Set(rows.map((r) => r.sourcePage))].join(", ");
  return (
    <figure className="table-figure" tabIndex={0} aria-label={ui.defTableCaption}>
      <table className="source-table" data-cols={2}>
        <caption className="visually-hidden">{ui.defTableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{ui.colElements}</th>
            <th scope="col">{ui.colSymptom}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-row={row.id} data-source-page={row.sourcePage}>
              <th scope="row" lang="en">
                {row.elements.join(" / ")}
              </th>
              <td>{row.labels.th.symptom}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="muted">
        {ui.pamphletPages}: {pages}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------- the four fertilizer tables (T-019) */

const gradeText = (g: Npk) => `${g.n}-${g.p2o5}-${g.k2o}`;

/** The markers the pamphlet prints beside a row, as the same linked, tiered chips the prose uses. */
function RowCites({ row, ui }: { row: Row; ui: UiStrings }) {
  const Cite = makeCite(ui);
  const ids = row.citations ?? [];
  return (
    <>
      {ids.map((id, i) => (
        <Cite key={id} id={id} more={i === ids.length - 1 ? row.citationsMore : undefined} />
      ))}
    </>
  );
}

/**
 * One table, one shape: a caption read by screen readers, the pamphlet's own column
 * headings, a row header, and the page every row came from. Rows with no printed
 * marker show none; the page is still named, never an invented source.
 */
function TableFigure({
  ui,
  caption,
  headings,
  rows,
  gradeColumn,
}: {
  ui: UiStrings;
  caption: string;
  headings: readonly string[];
  /** Index (among the non-header cells) of a column holding a grade, which must never break mid-number. */
  gradeColumn?: number;
  rows: readonly { row: Row; header: string; cells: readonly string[] }[];
}) {
  return (
    <figure className="table-figure" tabIndex={0} aria-label={caption}>
      <table className="source-table" data-cols={headings.length}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {headings.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, header, cells }) => (
            <tr key={row.id} data-row={row.id} data-source-page={row.sourcePage}>
              <th scope="row">{header}</th>
              {cells.map((cell, i) => (
                <td key={i} className={i === gradeColumn ? "grade" : undefined}>
                  {cell}
                  {i === cells.length - 1 ? <RowCites row={row} ui={ui} /> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="muted">
        {ui.pamphletPages}: {pageRanges(rows.map((r) => r.row.sourcePage))}
      </figcaption>
    </figure>
  );
}

function OrganicFertilizers({ ui }: { ui: UiStrings }) {
  return (
    <TableFigure
      ui={ui}
      caption={ui.tableOrganicCaption}
      // The pamphlet's heading for this column is Latin ("N-P-K (%)"), so it is not a Thai UI string.
      gradeColumn={0}
      headings={[ui.colType, "N-P-K (%)", ui.colCharacterUse]}
      rows={organicFertilizers("th").map((row) => ({
        row,
        header: row.labels.th.name,
        cells: [row.labels.th.npkText, row.labels.th.note],
      }))}
    />
  );
}

function StraightFertilizers({ ui }: { ui: UiStrings }) {
  return (
    <TableFigure
      ui={ui}
      caption={ui.tableStraightCaption}
      gradeColumn={0}
      headings={[ui.colFertilizer, ui.colGrade, ui.colCharacter, ui.colUseFor]}
      rows={straightFertilizers().map((row) => ({
        row,
        header: row.labels.th.name,
        cells: [row.labels.th.grade, row.labels.th.character, row.labels.th.useFor],
      }))}
    />
  );
}

function CompoundGrades({ ui }: { ui: UiStrings }) {
  return (
    <TableFigure
      ui={ui}
      caption={ui.tableCompoundCaption}
      headings={[ui.colGrade, ui.colUseFor]}
      rows={compoundGradeRows().map((row) => ({
        row,
        header: row.grades.map(gradeText).join(" / "),
        cells: [row.labels.th.useFor],
      }))}
    />
  );
}

function SoilConditioners({ ui }: { ui: UiStrings }) {
  return (
    <TableFigure
      ui={ui}
      caption={ui.tableConditionersCaption}
      headings={[ui.colMaterial, ui.colPurpose, ui.colEquivalence]}
      rows={soilConditioners().map((row) => ({
        row,
        header: row.labels.th.name,
        cells: [row.labels.th.purpose, row.labels.th.equivalence],
      }))}
    />
  );
}

const RENDERED: Readonly<Record<string, (props: { ui: UiStrings }) => React.ReactElement>> = {
  "nutrient-groups": NutrientGroups,
  "deficiency-symptoms": DeficiencySymptoms,
  "organic-fertilizer-npk": OrganicFertilizers,
  "straight-fertilizers": StraightFertilizers,
  "compound-grades": CompoundGrades,
  "soil-conditioners": SoilConditioners,
};

export function makeSourceTable(ui: UiStrings) {
  return function SourceTable({ id }: { id: string }) {
    const Render = RENDERED[id];
    return Render ? <Render ui={ui} /> : <div data-source-table={id} hidden />;
  };
}

export const RENDERED_TABLE_IDS = Object.keys(RENDERED);
