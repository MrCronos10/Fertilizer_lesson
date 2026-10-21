import type { Tier } from "@/lib/sources";
import type { UiStrings } from "@/lib/ui";

/** Its own file so a client island can show a tier without pulling the whole bibliography into its chunk. */
const TIER_KEY = {
  official: "tierOfficial",
  research: "tierResearch",
  commercial: "tierCommercial",
} as const satisfies Record<Tier, keyof UiStrings>;

/** Shape as well as text, so the tier never rests on colour alone (WCAG 1.4.1). */
const TIER_SHAPE: Record<Tier, string> = { official: "◆", research: "●", commercial: "▲" };

export function TierBadge({ tier, ui }: { tier: Tier; ui: UiStrings }) {
  return (
    <span className={`tier tier-${tier}`} data-tier={tier}>
      <span aria-hidden="true">{TIER_SHAPE[tier]} </span>
      <span className="visually-hidden">{ui.tierLabel}: </span>
      {ui[TIER_KEY[tier]]}
    </span>
  );
}
