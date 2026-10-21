import { deficiencyRows, nutrientGroupRows } from "@/lib/data";
import type { UiStrings } from "@/lib/ui";

/**
 * Tables that render from the locale-neutral JSON (T-006). A table appears here
 * only in the ticket that owns it; any id not listed renders nothing, which is
 * also what keeps the Cambodian table (D11) off the page.
 */

function NutrientGroups({ ui }: { ui: UiStrings }) {
  const rows = nutrientGroupRows();
  const pages = [...new Set(rows.map((r) => r.sourcePage))].join(", ");
  return (
    <figure className="table-figure">
      <table className="source-table">
        <caption className="visually-hidden">{ui.nutrientGroupsCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{ui.colGroup}</th>
            <th scope="col">{ui.colElements}</th>
            <th scope="col">{ui.colRole}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-row={row.id} data-source-page={row.sourcePage}>
              <th scope="row">{row.labels.th.group}</th>
              <td>{row.elements.join(", ")}</td>
              <td>{row.labels.th.role}</td>
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

/** The p3 symptom table, verbatim: the text equivalent of the 3D plant, with every one of the 10 rows. */
function DeficiencySymptoms({ ui }: { ui: UiStrings }) {
  const rows = deficiencyRows();
  const pages = [...new Set(rows.map((r) => r.sourcePage))].join(", ");
  return (
    <figure className="table-figure">
      <table className="source-table">
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

const RENDERED: Readonly<Record<string, (props: { ui: UiStrings }) => React.ReactElement>> = {
  "nutrient-groups": NutrientGroups,
  "deficiency-symptoms": DeficiencySymptoms,
};

export function makeSourceTable(ui: UiStrings) {
  return function SourceTable({ id }: { id: string }) {
    const Render = RENDERED[id];
    return Render ? <Render ui={ui} /> : <div data-source-table={id} hidden />;
  };
}

export const RENDERED_TABLE_IDS = Object.keys(RENDERED);
