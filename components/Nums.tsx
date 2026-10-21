import { numsFor } from "@/lib/nums";
import type { UiStrings } from "@/lib/ui";
import { makeCite } from "./Citations";

/** The chapter's figures with their citations (D12a). Renders nothing for a chapter with none. */
export function makeNums(ui: UiStrings) {
  const Cite = makeCite(ui);
  return function Nums({ chapter }: { chapter: number }) {
    const items = numsFor(chapter);
    if (items.length === 0) return null;
    return (
      <aside className="nums panel" aria-labelledby={`nums-${chapter}`}>
        <h2 id={`nums-${chapter}`} className="as-h3">
          {ui.numsHeading}
        </h2>
        <ul>
          {items.map((item) => (
            <li key={item.text}>
              {item.text} <Cite id={item.cite} {...(item.more ? { more: item.more } : {})} />
            </li>
          ))}
        </ul>
      </aside>
    );
  };
}
