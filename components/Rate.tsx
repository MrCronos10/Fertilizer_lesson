import type { ReactNode } from "react";
import type { UiStrings } from "@/lib/ui";

/**
 * The only sanctioned way to put a Rate on a page. PRD §7.6 requires every rate
 * to carry a soil-test note, so the note is part of the component and cannot be
 * left off by a caller. The sentence is the pamphlet's own p3 wording, which it
 * prints about diagnosing yellow leaves; applying it to rates is the site's
 * choice, not a claim the pamphlet makes (THAI-REVIEW U15).
 */
export function RateBlock({ ui, children }: { ui: UiStrings; children: ReactNode }) {
  return (
    <div className="rate-block">
      <div data-rate>{children}</div>
      <p className="note" role="note">
        {ui.soilTestNote}
      </p>
    </div>
  );
}
