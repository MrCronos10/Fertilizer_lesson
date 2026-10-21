import type { ReactNode } from "react";
import type { UiStrings } from "@/lib/ui";
import { publishedGrades } from "@/lib/calculator-data";
import { Calculator as CalculatorIsland } from "./Calculator";
import { makeCite } from "./Citations";
import { makeNums } from "./Nums";
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

export function Quiz({ chapter }: { chapter: number }) {
  return <div data-quiz={chapter} hidden />;
}

export function mdxComponents(ui: UiStrings) {
  return {
    Cite: makeCite(ui),
    SourceTable: makeSourceTable(ui),
    Nums: makeNums(ui),
    // The one client island in the chapters; its grades are read here, on the server.
    Calculator: () => <CalculatorIsland ui={ui} grades={publishedGrades()} />,
    Callout,
    Quiz,
  };
}
