import type { ReactNode } from "react";
import type { UiStrings } from "@/lib/ui";
import { publishedGrades } from "@/lib/calculator-data";
import { BAG, bagTiles } from "@/lib/bag-reader";
import { cropChoices } from "@/lib/crop-matcher";
import { deficiencyGroups } from "@/lib/deficiency";
import { BagReader as BagReaderIsland } from "./BagReader";
import { Calculator as CalculatorIsland } from "./Calculator";
import { readChapters } from "@/lib/content";
import { makeCite } from "./Citations";
import { CropMatcher } from "./CropMatcher";
import { DeficiencyExplorer } from "./DeficiencyExplorer";
import { makeNums } from "./Nums";
import { TimingDiagram } from "./TimingDiagram";
import { Quiz as QuizIsland } from "./Quiz";
import { makeSourceTable } from "./SourceTables";

/**
 * Slots the chapter MDX uses. Each is a placeholder until the ticket that owns
 * it: citations and tier badges arrive in T-011, and the nine tables render
 * from JSON in T-012 and T-019. They render no invented copy meanwhile.
 */

export function Callout({ type, children }: { type?: string; children: ReactNode }) {
  return (
    <aside className={type === "warn" ? "note" : "panel"} data-callout={type}>
      {children}
    </aside>
  );
}

export function mdxComponents(ui: UiStrings) {
  return {
    Cite: makeCite(ui),
    SourceTable: makeSourceTable(ui),
    Nums: makeNums(ui),
    // The one client island in the chapters; its grades are read here, on the server.
    BagReader: () => <BagReaderIsland ui={ui} tiles={bagTiles()} weightKg={BAG.weightKg} />,
    CropMatcher: () => <CropMatcher ui={ui} crops={cropChoices("th")} />,
    DeficiencyExplorer: () => <DeficiencyExplorer ui={ui} groups={deficiencyGroups()} />,
    Calculator: () => <CalculatorIsland ui={ui} grades={publishedGrades()} />,
    TimingDiagram: () => <TimingDiagram ui={ui} />,
    Callout,
    // The questions are chapter 7's own frontmatter, passed through untouched.
    Quiz: ({ chapter }: { chapter: number }) => {
      const items = readChapters("th").find((c) => c.frontmatter.chapter === chapter)?.frontmatter.quiz ?? [];
      return <QuizIsland ui={ui} items={items} />;
    },
  };
}
